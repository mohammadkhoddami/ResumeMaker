import cliLogger from "../logger/index.js";
import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProcessInfo {
  constructor(name = "backend", port = 8000) {
    this.process = null;
    this.command = [];
    this.args = [];
    this.port = port;
    this.name = name;
  }
}

export class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.backend = new ProcessInfo("backend", 8000);
    this.frontend = new ProcessInfo("frontend", 5173);
    this.isShuttingDown = false;
  }

  async startBackend() {
    if (this.backend.process) {
      cliLogger.warn("Backend is already running");
      return;
    }

    cliLogger.info(`Backend starting on port ${this.backend.port}...`);

    const pythonExecutable = this.getPythonExecutable();
    const backendDir = path.join(__dirname, "..", "..", "..", "backend");

    this.backend.process = spawn(pythonExecutable, ["main.py", "--host", "0.0.0.0", "--port", "8000"], {
      cwd: backendDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONPATH: backendDir,
      },
    });

    this.setupProcessListeners(this.backend);

    await this.waitForProcessReady(this.backend.process, this.backend.port, 60);
  }

  async startFrontend(port = 5173) {
    if (this.frontend.process) {
      cliLogger.warn("Frontend is already running");
      return;
    }

    cliLogger.info(`Frontend starting on port ${port}...`);

    const frontendDir = path.join(__dirname, "..", "..", "..", "src");

    // Use npx vite directly (not via node)
    const isWindows = process.platform === "win32";
    const viteCommand = isWindows ? "npx.cmd" : "npx";
    const viteArgs = ["vite", "--host", "127.0.0.1", "--port", port.toString()];

    this.frontend.process = spawn(viteCommand, viteArgs, {
      cwd: frontendDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
      shell: isWindows,
    });

    this.setupProcessListeners(this.frontend);

    await this.waitForProcessReady(this.frontend.process, port, 30, "tcp");
  }

  buildFrontend() {
    cliLogger.info("Building frontend with Vite...");

    return new Promise((resolve, reject) => {
      const buildDir = path.join(__dirname, "..", "..", "..", "build");
      const frontendDir = path.join(__dirname, "..", "..", "..", "src");

      const buildCommand = this.getNodeExecutable();
      const buildArgs = ["node_modules/vite/bin/vite.js", "build"];

      const buildProcess = spawn(buildCommand, buildArgs, {
        cwd: frontendDir,
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      });

      let buildOutput = [];

      buildProcess.stdout?.on("data", (data) => {
        const output = data.toString().trim();
        buildOutput.push(output);
        cliLogger.log(output);
      });

      buildProcess.stderr?.on("data", (data) => {
        const output = data.toString().trim();
        buildOutput.push(output);
        cliLogger.log(output);
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          cliLogger.success("Frontend build complete");
          resolve();
        } else {
          cliLogger.error(`Frontend build failed with code ${code}`);
          reject(new Error("Build failed"));
        }
      });

      buildProcess.on("error", (error) => {
        cliLogger.error("Failed to start build process:", error);
        reject(error);
      });

      this.frontend.buildProcess = buildProcess;
    });
  }

  copyBackendAssets() {
    return new Promise((resolve) => {
      const backendDir = path.join(__dirname, "..", "..", "..", "backend");
      const buildDir = path.join(__dirname, "..", "..", "..", "build");

      Promise.all([
        this.copyDirectory(path.join(backendDir, "static"), path.join(buildDir, "static")),
        this.copyDirectory(path.join(backendDir, "templates"), path.join(buildDir, "templates")),
      ])
        .then(resolve)
        .catch((error) => {
          cliLogger.error("Failed to copy assets:", error);
          reject(error);
        });
    });
  }

  async validateBuild() {
    const buildDir = path.join(__dirname, "..", "..", "build");

    const requiredFrontendFiles = [
      "index.html",
      "assets/**/*.js",
      "assets/**/*.css",
    ];

    for (const pattern of requiredFrontendFiles) {
      const files = await this.glob(path.join(buildDir, pattern));
      if (files.length === 0) {
        throw new Error(`Missing required build files: ${pattern}`);
      }
    }

    const backendDir = path.join(buildDir, "backend");
    if (!await this.exists(backendDir)) {
      throw new Error("Backend directory not found in build output");
    }

    cliLogger.success("Build validation passed");
  }

  async cleanup() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    try {
      cliLogger.info("Cleaning up processes...");

      await this.killProcess(this.backend.process);
      this.backend.process = null;

      if (this.frontend.buildProcess) {
        await this.killProcess(this.frontend.buildProcess);
        this.frontend.buildProcess = null;
      }

      await this.killProcess(this.frontend.process);
      this.frontend.process = null;

      cliLogger.success("Cleanup complete");
    } catch (error) {
      cliLogger.error("Error during cleanup:", error);
    }
  }

  setupProcessListeners(processInfo) {
    if (!processInfo.process) return;

    processInfo.process.stdout?.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        cliLogger.log(`[${processInfo.name}] ${output}`);
      }
    });

    processInfo.process.stderr?.on("data", (data) => {
      const output = data.toString().trim();
      if (output) {
        cliLogger.log(`[${processInfo.name} ERROR] ${output}`);
      }
    });

    processInfo.process.on("error", (error) => {
      cliLogger.error(`[${processInfo.name}] Process error:`, error);
      this.emit("exit");
    });

    processInfo.process.on("exit", (code) => {
      if (code !== 0 && !this.isShuttingDown) {
        cliLogger.error(`[${processInfo.name}] Process exited with code ${code}`);
        this.emit("exit");
      }
    });
  }

  async waitForProcessReady(process, port, maxAttempts = 60, healthPath = "/health") {
    const interval = 500;
    let attempts = 0;

    return new Promise((resolve, reject) => {
      if (!process) {
        reject(new Error("Process not started"));
        return;
      }

      const checkInterval = setInterval(() => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error(`Process failed to start within ${attempts} attempts`));
          return;
        }

        if (healthPath === "tcp") {
          // Just check if TCP port is open
          import("net").then((net) => {
            const socket = new net.Socket();
            socket.setTimeout(100);
            socket.on("connect", () => {
              socket.destroy();
              clearInterval(checkInterval);
              cliLogger.debug(`Process ready on port ${port}`);
              resolve();
            });
            socket.on("timeout", () => {
              socket.destroy();
              cliLogger.debug(`[${port}] Waiting for process to be ready... (${attempts}/${maxAttempts})`);
            });
            socket.on("error", () => {
              socket.destroy();
              cliLogger.debug(`[${port}] Waiting for process to be ready... (${attempts}/${maxAttempts})`);
            });
            socket.connect(port, "127.0.0.1");
          });
        } else {
          fetch(`http://127.0.0.1:${port}${healthPath}`)
            .then(async (response) => {
              if (response.ok) {
                clearInterval(checkInterval);
                const status = await response.json();
                cliLogger.debug(`Process ready: ${status.status}`);
                resolve();
              } else {
                throw new Error(`Process responding on wrong status: ${response.status}`);
              }
            })
            .catch(() => {
              cliLogger.debug(`[${port}] Waiting for process to be ready... (${attempts}/${maxAttempts})`);
            });
        }
      }, interval);
    });
  }

  killProcess(process) {
    if (!process) return Promise.resolve();

    return new Promise((resolve) => {
      process.on("exit", resolve);
      process.kill("SIGTERM");
    });
  }

getPythonExecutable() {
    const platform = process.platform;

    if (platform === "win32") {
      // Try multiple candidates for Python on Windows - prioritize known paths
      const candidates = [
        process.env.PYTHON,
        "python",
        "py",
        "python3",
        "C:/Users/Niklaus/AppData/Local/Programs/Python/Python314/python.exe",
        "C:/Users/Niklaus/AppData/Local/Programs/Python/Python313/python.exe",
        "C:/Users/Niklaus/AppData/Local/Programs/Python/Python312/python.exe",
        "C:/Python314/python.exe",
        "C:/Python313/python.exe",
        "C:/Python312/python.exe",
        "C:/Python39/python.exe",
      ];
      
      // Find the first one that is defined and not empty
      for (const candidate of candidates) {
        if (candidate !== undefined && candidate !== null && candidate !== "") {
          return candidate;
        }
      }
      
      return "python"; // fallback
    }

    // On Unix-like systems, use python3 or python
    return process.env.PYTHON || "python3";
  }

  getNodeExecutable() {
    const platform = process.platform;
    const fallback = "node";

    if (platform === "win32") {
      return process.env.NODE || fallback;
    }

    return process.env.NODE || fallback;
  }

  exists(path) {
    return fs.access(path).then(() => true).catch(() => false);
  }

  glob(pattern) {
    try {
      return fs.glob(pattern, { cwd: path.dirname(pattern) });
    } catch (error) {
      return Promise.resolve([]);
    }
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      })
    );
  }
}