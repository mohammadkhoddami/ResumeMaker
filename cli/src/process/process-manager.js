import net from "node:net";
import { EventEmitter } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import cliLogger from "../logger/index.js";
import { runtimeBackendDir, runtimeFrontendDir } from "../paths/index.js";

const MAX_TAIL_LINES = 200;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

export async function findAvailablePort(preferredPort, { maxSteps = 25 } = {}) {
  let port = preferredPort;
  for (let attempt = 0; attempt < maxSteps; attempt += 1) {
    if (await isPortAvailable(port)) {
      return { port, preferredBusy: port !== preferredPort };
    }
    port += 1;
  }
  const error = new Error(
    `Could not find a free port between ${preferredPort} and ${port - 1}.`
  );
  error.kind = "no-free-port";
  throw error;
}

export class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
    this.shuttingDown = false;
  }

  register(name, proc) {
    const entry = { name, proc, tail: [] };
    this.services.set(name, entry);

    const forward = (chunk) => {
      for (const rawLine of chunk.toString().split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        entry.tail.push(line);
        if (entry.tail.length > MAX_TAIL_LINES) entry.tail.shift();
        cliLogger.muted(`[${name}] ${line}`);
      }
    };

    proc.stdout?.on("data", forward);
    proc.stderr?.on("data", forward);

    proc.on("error", (error) => {
      if (!this.shuttingDown) {
        this.emit("serviceError", { name, error });
      }
    });

    proc.on("close", (code) => {
      if (!this.shuttingDown && code !== 0 && code !== null) {
        this.emit("serviceExited", { name, code, tail: entry.tail.slice(-15) });
      }
    });

    return entry;
  }

  startBackend({ venvPython, port }) {
    const proc = spawn(
      venvPython,
      ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", String(port)],
      {
        cwd: runtimeBackendDir,
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        detached: true,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    this.register("backend", proc);
    return this.waitForHttp(proc, port, "/health", 120000, "backend");
  }

  startFrontend({ port, apiPort }) {
    const viteEntry = path.join(runtimeFrontendDir, "node_modules", "vite", "bin", "vite.js");

    const proc = spawn(
      process.execPath,
      [viteEntry, "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
      {
        cwd: runtimeFrontendDir,
        env: {
          ...process.env,
          VITE_API_BASE_URL: `http://localhost:${apiPort}`,
        },
        detached: true,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    this.register("frontend", proc);
    return this.waitForTcp(proc, port, 90000, "frontend");
  }

  async waitForHttp(proc, port, healthPath, timeoutMs, name) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (proc.exitCode !== null || proc.signalCode !== null) {
        throw new Error(
          `${name} exited before becoming ready (exit code ${proc.exitCode}).`
        );
      }

      try {
        const response = await fetch(`http://127.0.0.1:${port}${healthPath}`, {
          signal: AbortSignal.timeout(1500),
        });
        if (response.ok) return;
      } catch {
        /* not ready yet */
      }

      await delay(500);
    }

    throw new Error(`${name} did not become ready within ${Math.round(timeoutMs / 1000)}s.`);
  }

  async waitForTcp(proc, port, timeoutMs, name) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      if (proc.exitCode !== null || proc.signalCode !== null) {
        throw new Error(
          `${name} exited before becoming ready (exit code ${proc.exitCode}).`
        );
      }

      const open = await new Promise((resolve) => {
        const socket = net.connect({ port, host: "127.0.0.1" });
        socket.setTimeout(1200);
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("timeout", () => {
          socket.destroy();
          resolve(false);
        });
        socket.on("error", () => {
          socket.destroy();
          resolve(false);
        });
      });

      if (open) return;
      await delay(500);
    }

    throw new Error(`${name} did not become ready within ${Math.round(timeoutMs / 1000)}s.`);
  }

  tailOf(name) {
    return this.services.get(name)?.tail.slice(-15) ?? [];
  }

  async stopAll() {
    this.shuttingDown = true;
    const stopped = [];

    for (const name of ["frontend", "backend"]) {
      const entry = this.services.get(name);
      if (!entry) continue;
      const killed = await this.killTree(entry.proc);
      if (killed || entry.proc.exitCode !== null || entry.proc.signalCode !== null) {
        stopped.push(name);
      }
      this.services.delete(name);
    }

    return stopped;
  }

  killTree(proc) {
    return new Promise((resolve) => {
      if (!proc || proc.exitCode !== null || proc.signalCode !== null) {
        resolve(true);
        return;
      }

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        resolve(value);
      };

      proc.once("close", () => finish(true));

      const pid = proc.pid;

      if (process.platform === "win32") {
        try {
          spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { windowsHide: true });
        } catch {
          try {
            proc.kill("SIGKILL");
          } catch {
            /* already dead */
          }
        }
      } else {
        try {
          process.kill(-pid, "SIGTERM");
        } catch {
          try {
            process.kill(pid, "SIGTERM");
          } catch {
            /* already dead */
          }
        }

        setTimeout(() => {
          try {
            process.kill(-pid, "SIGKILL");
          } catch {
            try {
              process.kill(pid, "SIGKILL");
            } catch {
              /* already dead */
            }
          }
        }, 4000).unref?.();
      }

      const guard = setTimeout(() => finish(true), 8000);
      guard.unref?.();
    });
  }
}
