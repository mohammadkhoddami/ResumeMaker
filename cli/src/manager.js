import cliLogger from "./logger/index.js";
import { ProcessManager, findAvailablePort } from "./process/process-manager.js";
import {
  ensureApplicationSynced,
  ensureBackendDependencies,
  ensureFrontendDependencies,
  ensurePlaywrightChromium,
  frontendDepsInstalled,
} from "./runtime/setup.js";
import {
  DEFAULT_BACKEND_PORT,
  DEFAULT_FRONTEND_PORT,
  readPackageInfo,
  runtimeFrontendDir,
} from "./paths/index.js";
import path from "node:path";
import { spawn } from "node:child_process";

export class CLIManager {
  constructor() {
    this.processManager = new ProcessManager();
    this.stopping = false;
    this.keepAliveTimer = null;
    const pkg = readPackageInfo();
    this.version = pkg.version ?? "0.0.0";
  }

  async start({ check = true } = {}) {
    try {
      cliLogger.info("Starting Resume Builder...");

      if (check) {
        cliLogger.info("Checking environment...");
        const failed = await this.runCriticalChecks();
        if (failed) process.exit(1);
      }

      await this.registerLifecycleHandlers();

      await this.prepareRuntime();

      const backendTarget = await this.selectPort(DEFAULT_BACKEND_PORT, "backend");
      const frontendTarget = await this.selectPort(DEFAULT_FRONTEND_PORT, "frontend");

      cliLogger.info("Starting backend...");
      await this.processManager.startBackend({
        venvPython: this.venvPython,
        port: backendTarget.port,
      });
      cliLogger.success(`Backend ready at http://localhost:${backendTarget.port}`);

      cliLogger.info("Starting frontend...");
      await this.processManager.startFrontend({
        port: frontendTarget.port,
        apiPort: backendTarget.port,
      });
      cliLogger.success(`Frontend ready at http://localhost:${frontendTarget.port}`);

      console.log("");
      cliLogger.success("Application is ready!");
      console.log("");
      console.log(`  UI:  http://localhost:${frontendTarget.port}`);
      console.log(`  API: http://localhost:${backendTarget.port}`);
      console.log("");

      cliLogger.info("Opening browser...");
      this.openBrowser(`http://localhost:${frontendTarget.port}`);

      console.log("");
      cliLogger.info("Press Ctrl+C to stop.");

      this.startKeepAlive();
    } catch (error) {
      this.reportFatalError(error);
    }
  }

  async runCriticalChecks() {
    return new Promise((resolve) => {
      import("./environment/index.js").then(async ({ EnvironmentChecker }) => {
        const checker = new EnvironmentChecker();
        const results = await checker.runCritical();
        let blocking = false;

        for (const result of results) {
          if (result.ok) {
            cliLogger.success(`${result.name}${result.details ? `: ${result.details}` : ""}`);
          } else {
            cliLogger.error(result.message);
            if (result.hint) cliLogger.muted(result.hint);
            blocking = true;
          }
        }

        resolve(blocking);
      });
    });
  }

  async prepareRuntime() {
    cliLogger.info("Preparing application...");

    await ensureApplicationSynced(this.version, {
      force: process.env.RESUME_BUILDER_FORCE_SYNC === "1",
    });

    if (await frontendDepsInstalled()) {
      cliLogger.debug("Frontend dependencies already installed");
    } else {
      await ensureFrontendDependencies();
    }
    cliLogger.success("Frontend ready");

    const { EnvironmentChecker } = await import("./environment/index.js");
    const python = await new EnvironmentChecker().requirePython();

    const { venvPython } = await ensureBackendDependencies({ python });
    cliLogger.success("Backend ready");
    this.venvPython = venvPython;

    await ensurePlaywrightChromium(venvPython);
  }

  async selectPort(preferred, label) {
    const { port, preferredBusy } = await findAvailablePort(preferred);
    if (preferredBusy) {
      cliLogger.info(`${label === "backend" ? "Backend" : "Frontend"} port ${preferred} is in use. Using ${port}.`);
    }
    return { port };
  }

  openBrowser(url) {
    try {
      if (process.platform === "win32") {
        spawn("cmd", ["/c", "start", "", url], {
          detached: true,
          windowsHide: true,
          stdio: "ignore",
        }).unref?.();
      } else if (process.platform === "darwin") {
        spawn("open", [url], { detached: true, stdio: "ignore" }).unref?.();
      } else {
        spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref?.();
      }
    } catch {
      cliLogger.warn(`Could not open the browser automatically. Open ${url} manually.`);
    }
  }

  startKeepAlive() {
    if (!this.keepAliveTimer) {
      this.keepAliveTimer = setInterval(() => {}, 30000);
    }
  }

  async registerLifecycleHandlers() {
    this.processManager.on("serviceExited", ({ name, code, tail }) => {
      if (this.stopping) return;
      cliLogger.error(`[${name}] exited unexpectedly (exit code ${code}).`);
      for (const line of tail) cliLogger.muted(`  │ ${line}`);
      this.shutdown(1);
    });

    this.processManager.on("serviceError", ({ name, error }) => {
      cliLogger.error(`[${name}] failed to start: ${error.message}`);
    });

    const shutdown = () => {
      void this.shutdown(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("SIGHUP", shutdown);

    process.on("exit", () => {
      for (const [, entry] of this.processManager.services) {
        try {
          if (process.platform === "win32") {
            spawnSync("taskkill", ["/pid", String(entry.proc.pid), "/T", "/F"], {
              windowsHide: true,
            });
          } else {
            try {
              process.kill(-entry.proc.pid, "SIGKILL");
            } catch {
              /* already dead */
            }
          }
        } catch {
          /* already dead */
        }
      }
    });
  }

  async shutdown(exitCode = 0) {
    if (this.stopping) return;
    this.stopping = true;

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    cliLogger.info("Stopping Resume Builder...");
    const stopped = await this.processManager.stopAll();

    if (stopped.includes("frontend")) cliLogger.success("Frontend stopped");
    if (stopped.includes("backend")) cliLogger.success("Backend stopped");

    cliLogger.success("Resume Builder stopped");
    process.exit(exitCode);
  }

  reportFatalError(error) {
    console.log("");
    cliLogger.error(error.message || "An unexpected error occurred.");

    if (error.kind === "python-missing") {
      cliLogger.muted(
        "\nResume Builder requires Python 3.12 or newer.\nPlease install Python and make sure it is available in PATH,\nthen run the CLI again."
      );
    }

    if (error.tail?.length) {
      cliLogger.muted("\nLast output:");
      for (const line of error.tail) cliLogger.muted(`  │ ${line}`);
    }

    if (error.suggestion) {
      cliLogger.muted(`\nSuggestion: ${error.suggestion}`);
    }

    if (!error.kind && !error.tail && !error.suggestion && error.stack) {
      cliLogger.muted(error.stack.split("\n").slice(1, 3).join("\n"));
    }

    void this.processManager.stopAll().finally(() => process.exit(1));
  }

  async build() {
    try {
      await this.prepareRuntime();

      const viteEntry = path.join(runtimeFrontendDir, "node_modules", "vite", "bin", "vite.js");

      cliLogger.info("Building production frontend...");
      const { runProcess } = await import("./runtime/setup.js");
      const result = await runProcess(process.execPath, [viteEntry, "build"], {
        cwd: runtimeFrontendDir,
        timeoutMs: 15 * 60 * 1000,
      });

      if (result.code !== 0) {
        const error = new Error("Frontend build failed.");
        error.tail = result.lines.slice(-15);
        throw error;
      }

      cliLogger.success(`Build complete! Output: ${path.join(runtimeFrontendDir, "dist")}`);
    } catch (error) {
      this.reportFatalError(error);
    }
  }
}
