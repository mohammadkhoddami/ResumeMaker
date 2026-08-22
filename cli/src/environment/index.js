import cliLogger from "../logger/index.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import http from "http";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CheckResult {
  constructor(name, success, message, details) {
    this.name = name;
    this.success = success;
    this.message = message;
    this.details = details;
  }
}

export class EnvironmentChecker {
  async run() {
    const checks = [];

    checks.push(...await this.checkNode());
    checks.push(...await this.checkPython());
    checks.push(...await this.checkNodeModules());
    checks.push(...await this.checkPythonPackages());
    checks.push(...await this.checkPorts(8000));
    checks.push(...await this.checkPorts(5173));
    checks.push(...await this.checkBackendDirectory());
    checks.push(...await this.checkFrontendDirectory());
    checks.push(...await this.checkRequiredFiles());

    return checks;
  }

  async checkNode() {
    const result = new CheckResult("Node.js", false);

    try {
      const version = await this.spawn("node", ["--version"]);

      result.success = true;
      result.message = "Node.js installed";
      result.details = version.stdout.trim();
    } catch (error) {
      result.message = "Node.js not found";
      result.details = error.message || "Unknown error";
    }

    return [result];
  }

  async checkPython() {
    const result = new CheckResult("Python", false);

    const pyCommand = [
      process.platform === "win32" ? "py" : "python3",
      "--version"
    ];

    try {
      const { stdout } = await this.spawn(pyCommand[0], pyCommand.slice(1));

      const versionLine = stdout.trim();

      if (!versionLine.match(/^Python\s+(\d+\.\d+\.\d+)/)) {
        const match = versionLine.match(/Python\s+(\d+)\.(\d+)\.(\d+)/);
        if (match) {
          const major = parseInt(match[1], 10);
          const minor = parseInt(match[2], 10);

          if (major === 3 && minor >= 12) {
            result.success = true;
            result.message = "Python 3.12+ installed";
            result.details = versionLine;
          } else {
            result.message = "Python version too old";
            result.details = versionLine;
          }
        } else {
          result.success = true;
          result.message = "Python installed";
          result.details = versionLine;
        }
      } else {
        result.success = true;
        result.message = "Python installed";
        result.details = versionLine;
      }
    } catch (error) {
      result.message = "Python not found";
      result.details = error.message || "Unknown error";
    }

    return [result];
  }

  async checkNodeModules() {
    const result = new CheckResult("Node Dependencies", false);

    const frontendDir = path.join(__dirname, "..", "..", "..", "src");
    const nodeModulesPath = path.join(frontendDir, "node_modules/.vite");

    try {
      await fs.access(nodeModulesPath);
      result.success = true;
      result.message = "Frontend dependencies installed";
      result.details = "node_modules/.vite exists";
    } catch {
      result.message = "Frontend dependencies not installed";
      result.details = "Run the CLI to install dependencies";
    }

    return [result];
  }

  async checkPythonPackages() {
    const result = new CheckResult("Python Packages", false);

    const backendDir = path.join(__dirname, "..", "..", "..", "backend");
    const venvPath = path.join(backendDir, "venv");

    try {
      await fs.access(venvPath);
      const pyExecutable = process.platform === "win32" ? "py" : "python3";
      const { stdout } = await this.spawn(pyExecutable, ["-m", "pip", "list", "--format=json"]);

      const packages = stdout.trim().slice(0, 100);
      result.success = true;
      result.message = "Python packages available";
      result.details = "virtual environment found";
    } catch (error) {
      result.message = "Python packages not ready";
      result.details = "Backend may need dependency installation";
    }

    return [result];
  }

  async checkPorts(...ports) {
    const results = [];

    for (const port of ports) {
      const result = new CheckResult(`Port ${port}`, false);

      await new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
          res.resume();
          // Any response means port is in use
          result.success = false;
          result.message = `Port ${port} is in use`;
          resolve();
        });

        req.on("error", (error) => {
          if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
            result.success = true;
            result.message = `Port ${port} is available`;
            result.details = "Server not running";
          } else {
            result.success = false;
            result.message = `Port ${port} check failed`;
            result.details = error.message;
          }
          resolve();
        });

        req.setTimeout(100, () => {
          req.destroy();
          result.success = true;
          result.message = `Port ${port} is available`;
          result.details = "Connection timeout (likely available)";
          resolve();
        });
      });

      results.push(result);
    }

    return results;
  }

  async checkBackendDirectory() {
    const result = new CheckResult("Backend Directory", false);

    const backendDir = path.join(__dirname, "..", "..", "..", "backend");

    try {
      await fs.access(backendDir);
      await fs.access(path.join(backendDir, "main.py"));
      result.success = true;
      result.message = "Backend directory found";
      result.details = "main.py exists";
    } catch (error) {
      result.message = "Backend directory missing";
      result.details = error.message || "Unknown error";
    }

    return [result];
  }

  async checkFrontendDirectory() {
    const result = new CheckResult("Frontend Directory", false);

    const projectRoot = path.join(__dirname, "..", "..", "..");
    const frontendDir = path.join(projectRoot, "src");

    try {
      await fs.access(frontendDir);
      await fs.access(path.join(projectRoot, "package.json"));
      result.success = true;
      result.message = "Frontend directory found";
      result.details = "package.json exists in project root";
    } catch (error) {
      result.message = "Frontend directory missing";
      result.details = error.message || "Unknown error";
    }

    return [result];
  }

  async checkRequiredFiles() {
    const results = [];

    const fontFiles = [
      "Vazirmatn-Regular.woff2",
      "Vazirmatn-Bold.woff2",
    ];

    const backendDir = path.join(__dirname, "..", "..", "..", "backend");
    const fontsDir = path.join(backendDir, "static", "fonts");

    for (const fontFile of fontFiles) {
      const result = new CheckResult(`Font: ${fontFile}`, false);

      try {
        await fs.access(path.join(fontsDir, fontFile));
        result.success = true;
        result.message = "Font file found";
      } catch (error) {
        result.message = "Font file missing";
        result.details = "Will use system fonts";
      }

      results.push(result);
    }

    return results;
  }

  async spawn(executable, args) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(executable, args);

      let stdout = "";
      let stderr = "";

      childProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      childProcess.on("error", (error) => {
        reject(error);
      });
    });
  }
}