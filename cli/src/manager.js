import cliLogger from "./logger/index.js";
import { ProcessManager } from "./process/process-manager.js";
import { EnvironmentChecker } from "./environment/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CLIManager {
  constructor() {
    this.processManager = new ProcessManager();
  }

  async start(options) {
    try {
      cliLogger.info("Starting Resume Builder...");

      // Auto-setup: install dependencies if needed
      await this.autoSetup();

      cliLogger.info("Preparing application...");
      cliLogger.info("Starting backend...");

      await this.processManager.startBackend();

      cliLogger.info("Starting frontend...");

      const frontendPort = 5173;
      await this.processManager.startFrontend(frontendPort);

      // Auto-open browser
      await this.openBrowser(frontendPort);

      this.processManager.on("exit", () => {
        cliLogger.info("\nApplication shutting down...");
        this.processManager.cleanup();
      });

      // Handle graceful shutdown
      const shutdown = () => {
        cliLogger.info("\nShutting down...");
        this.processManager.cleanup();
        process.exit(0);
      };
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      cliLogger.info("\n\nApplication is ready!");
      cliLogger.info(`  UI: http://localhost:${frontendPort}`);
      cliLogger.info("");
      cliLogger.info("Press Ctrl+C to stop");
    } catch (error) {
      cliLogger.error("Failed to start application:", error);
      this.processManager.cleanup();
      process.exit(1);
    }
  }

  async autoSetup() {
    cliLogger.info("Setting up environment...");

    // Check and install Node.js dependencies
    await this.ensureNodeDependencies();

    // Check and install Python dependencies
    await this.ensurePythonDependencies();

    // Install Playwright browsers
    await this.ensurePlaywrightBrowsers();
  }

  async ensureNodeDependencies() {
    const projectRoot = path.join(__dirname, "..", "..");
    const frontendDir = path.join(projectRoot, "src");
    const nodeModulesPath = path.join(frontendDir, "node_modules/.vite");

    try {
      await fs.access(nodeModulesPath);
      cliLogger.success("Frontend dependencies already installed");
    } catch {
      cliLogger.info("Installing frontend dependencies...");
      await this.runCommand("npm", ["install"], frontendDir);
      cliLogger.success("Frontend dependencies installed");
    }
  }

  async ensurePythonDependencies() {
    const projectRoot = path.join(__dirname, "..", "..");
    const backendDir = path.join(projectRoot, "backend");
    const requirementsPath = path.join(backendDir, "requirements.txt");

    cliLogger.info("Installing Python dependencies...");

    // Try to use the venv python, fallback to system python
    const pythonExecutable = this.getPythonExecutable();
    const pipArgs = [pythonExecutable, "-m", "pip", "install", "-r", requirementsPath];

    await this.runCommand(pipArgs[0], pipArgs.slice(1), backendDir);
    cliLogger.success("Python dependencies installed");
  }

  async ensurePlaywrightBrowsers() {
    const projectRoot = path.join(__dirname, "..", "..");
    const backendDir = path.join(projectRoot, "backend");
    const pythonExecutable = this.getPythonExecutable();

    cliLogger.info("Installing Playwright browsers...");

    try {
      await this.runCommand(pythonExecutable, ["-m", "playwright", "install", "chromium"], backendDir);
      cliLogger.success("Playwright browsers installed");
    } catch (error) {
      cliLogger.warn("Playwright browser installation may have failed, but continuing...");
    }
  }

  async openBrowser(port) {
    const url = `http://localhost:${port}`;

    cliLogger.info("Opening browser...");

    try {
      if (process.platform === "win32") {
        // Use shell: true for start command on Windows
        await this.runCommand("cmd", ["/c", "start", "" , url], process.cwd());
      } else if (process.platform === "darwin") {
        await this.runCommand("open", [url], process.cwd());
      } else {
        await this.runCommand("xdg-open", [url], process.cwd());
      }
      cliLogger.success("Browser opened");
    } catch (error) {
      cliLogger.warn("Could not open browser automatically. Please open manually.");
    }
  }

  getPythonExecutable() {
    const platform = process.platform;

    if (platform === "win32") {
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

      for (const candidate of candidates) {
        if (candidate !== undefined && candidate !== null && candidate !== "") {
          return candidate;
        }
      }

      return "python";
    }

    return process.env.PYTHON || "python3";
  }

  async runCommand(command, args, cwd) {
    // On Windows, npm might need shell: true
    const isWindows = process.platform === "win32";
    let resolvedCommand = command;
    let resolvedArgs = args;
    let useShell = false;

    if (isWindows) {
      if (command === "npm") {
        resolvedCommand = "npm.cmd";
        useShell = true;
      } else if (command === "cmd") {
        useShell = true;
      } else if (command === "py" || command === "python" || command === "python3") {
        useShell = true;
      }
    }

    return new Promise((resolve, reject) => {
      const childProcess = spawn(resolvedCommand, resolvedArgs, {
        cwd,
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
        shell: useShell,
      });

      let stdout = "";
      let stderr = "";

      childProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });

      childProcess.on("error", (error) => {
        reject(error);
      });
    });
  }

  async build() {
    try {
      cliLogger.info("Building frontend...");

      await this.processManager.buildFrontend();

      cliLogger.info("Copying backend assets...");

      await this.processManager.copyBackendAssets();

      cliLogger.info("Checking built files...");

      await this.processManager.validateBuild();

      cliLogger.success("Build complete!");
    } catch (error) {
      cliLogger.error("Build failed:", error);
      process.exit(1);
    }
  }
}