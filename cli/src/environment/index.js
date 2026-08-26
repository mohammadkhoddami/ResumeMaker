import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  packagedBackendDir,
  packagedFrontendDir,
  DEFAULT_BACKEND_PORT,
  DEFAULT_FRONTEND_PORT,
  runtimeRoot,
  runtimeVenvDir,
  pathExists,
} from "../paths/index.js";
import { findPython } from "./python.js";
import {
  backendPackagesInstalled,
  frontendDepsInstalled,
  getVenvPythonPath,
  playwrightChromiumReady,
} from "../runtime/setup.js";

class CheckResult {
  constructor({ name, ok = false, kind = "error", message, details, hint }) {
    this.name = name;
    this.ok = ok;
    this.kind = kind;
    this.message = message;
    this.details = details;
    this.hint = hint;
  }
}

function spawnCapture(command, args, { shell = false, timeoutMs = 20000 } = {}) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    let child;
    try {
      child = spawn(command, args, { shell, windowsHide: true });
    } catch {
      finish(null);
      return;
    }

    child.stdout?.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", () => finish(null));
    child.on("close", (code) =>
      finish(code === 0 ? { stdout: stdout.trim(), stderr: stderr.trim() } : null)
    );
  });
}

async function isPortBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.setTimeout(700);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    const giveUp = () => {
      socket.destroy();
      resolve(false);
    };
    socket.on("timeout", giveUp);
    socket.on("error", giveUp);
  });
}

const BACKEND_REQUIRED_FILES = ["main.py", "config.py", "logging_config.py", "requirements.txt"];
const BACKEND_REQUIRED_DIRS = ["models", "services", "templates", "static"];
const FRONTEND_REQUIRED_FILES = [
  "package.json",
  "index.html",
  "vite.config.ts",
  "tailwind.config.ts",
  "postcss.config.js",
  "tsconfig.json",
];
const FRONTEND_REQUIRED_DIRS = ["src"];
const REQUIRED_FONTS = ["Vazirmatn-Regular.woff2", "Vazirmatn-Bold.woff2"];

export class EnvironmentChecker {
  async runCritical() {
    return Promise.all([
      this.checkNode(),
      this.checkNpm(),
      this.checkPython(),
      this.checkBackendFiles(),
      this.checkFrontendFiles(),
    ]);
  }

  async run() {
    const results = await Promise.all([
      this.checkNode(),
      this.checkNpm(),
      this.checkPython(),
      this.checkBackendFiles(),
      this.checkFrontendFiles(),
      this.checkFonts(),
      this.checkFrontendDependencies(),
      this.checkBackendDependencies(),
      this.checkPlaywright(),
      this.checkPort(DEFAULT_BACKEND_PORT),
      this.checkPort(DEFAULT_FRONTEND_PORT),
    ]);
    return results.flat();
  }

  async checkNode() {
    const [major] = process.versions.node.split(".").map(Number);
    if (major >= 18) {
      return new CheckResult({
        name: "Node.js",
        ok: true,
        kind: "ok",
        details: `v${process.versions.node}`,
        message: "Node.js is installed",
      });
    }
    return new CheckResult({
      name: "Node.js",
      ok: false,
      kind: "error",
      message: `Node.js v${process.versions.node} is too old`,
      hint: "Resume Builder requires Node.js 18 or newer.",
    });
  }

  async checkNpm() {
    const result = await spawnCapture("npm", ["--version"], {
      shell: process.platform === "win32",
    });
    if (result) {
      return new CheckResult({
        name: "npm",
        ok: true,
        kind: "ok",
        details: result.stdout,
        message: "npm is installed",
      });
    }
    return new CheckResult({
      name: "npm",
      ok: false,
      kind: "error",
      message: "npm was not found",
      hint: "Please install Node.js 18+ (npm ships with it).",
    });
  }

  async checkPython() {
    try {
      const python = await findPython();
      return new CheckResult({
        name: "Python",
        ok: true,
        kind: "ok",
        message: "Python is installed",
        details: python.version,
      });
    } catch {
      return new CheckResult({
        name: "Python",
        ok: false,
        kind: "error",
        message: "Python 3.12+ was not found",
        hint:
          "Resume Builder requires Python 3.12 or newer.\nPlease install Python and make sure it is available in PATH.",
      });
    }
  }

  async requirePython() {
    return findPython();
  }

  async checkBackendFiles() {
    const missing = [];

    for (const file of BACKEND_REQUIRED_FILES) {
      if (!(await pathExists(path.join(packagedBackendDir, file)))) missing.push(file);
    }
    for (const dir of BACKEND_REQUIRED_DIRS) {
      if (!(await pathExists(path.join(packagedBackendDir, dir)))) missing.push(`${dir}/`);
    }

    if (missing.length === 0) {
      return new CheckResult({
        name: "Backend files",
        ok: true,
        kind: "ok",
        message: "Backend application files found",
      });
    }
    return new CheckResult({
      name: "Backend files",
      ok: false,
      kind: "error",
      message: "Backend application files are missing",
      details: `missing: ${missing.join(", ")}`,
      hint: "The package appears to be incomplete. Please reinstall it or report this issue.",
    });
  }

  async checkFrontendFiles() {
    const missing = [];

    for (const file of FRONTEND_REQUIRED_FILES) {
      if (!(await pathExists(path.join(packagedFrontendDir, file)))) missing.push(file);
    }
    for (const dir of FRONTEND_REQUIRED_DIRS) {
      if (!(await pathExists(path.join(packagedFrontendDir, dir)))) missing.push(`${dir}/`);
    }

    if (missing.length === 0) {
      return new CheckResult({
        name: "Frontend files",
        ok: true,
        kind: "ok",
        message: "Frontend application files found",
      });
    }
    return new CheckResult({
      name: "Frontend files",
      ok: false,
      kind: "error",
      message: "Frontend application files are missing",
      details: `missing: ${missing.join(", ")}`,
      hint: "The package appears to be incomplete. Please reinstall it or report this issue.",
    });
  }

  async checkFonts() {
    const fontsDir = path.join(packagedBackendDir, "static", "fonts");
    const missing = [];
    for (const font of REQUIRED_FONTS) {
      if (!(await pathExists(path.join(fontsDir, font)))) missing.push(font);
    }

    if (missing.length === 0) {
      return new CheckResult({
        name: "Fonts",
        ok: true,
        kind: "ok",
        message: "Required fonts found",
      });
    }
    return new CheckResult({
      name: "Fonts",
      ok: false,
      kind: "warn",
      message: `Font files missing (${missing.join(", ")})`,
      hint: "PDF export will fall back to system fonts. The app still works.",
    });
  }

  async checkFrontendDependencies() {
    if (await frontendDepsInstalled()) {
      return new CheckResult({
        name: "Frontend dependencies",
        ok: true,
        kind: "ok",
        message: "Installed",
      });
    }
    return new CheckResult({
      name: "Frontend dependencies",
      ok: false,
      kind: "fixable",
      message: "Not installed yet",
      hint: "They are installed automatically the first time you run the CLI.",
    });
  }

  async checkBackendDependencies() {
    if (await backendPackagesInstalled()) {
      return new CheckResult({
        name: "Python dependencies",
        ok: true,
        kind: "ok",
        message: "Installed",
        details: runtimeVenvDir,
      });
    }
    return new CheckResult({
      name: "Python dependencies",
      ok: false,
      kind: "fixable",
      message: "Not installed yet",
      hint: `A virtual environment is created automatically at ${runtimeRoot} on first start.`,
    });
  }

  async checkPlaywright() {
    const venvPython = getVenvPythonPath();
    if (!(await pathExists(venvPython))) {
      return new CheckResult({
        name: "Chromium (PDF export)",
        ok: false,
        kind: "fixable",
        message: "Not checked yet",
        hint: "Downloaded automatically on first start.",
      });
    }

    const ready = await playwrightChromiumReady(venvPython);
    if (ready === true) {
      return new CheckResult({
        name: "Chromium (PDF export)",
        ok: true,
        kind: "ok",
        message: "Installed",
      });
    }
    return new CheckResult({
      name: "Chromium (PDF export)",
      ok: ready === false ? false : true,
      kind: "fixable",
      message: ready === false ? "Not installed yet" : "Status unknown",
      hint: "It is downloaded automatically on first start; PDF export needs it.",
    });
  }

  async checkPort(port) {
    const busy = await isPortBusy(port);
    if (!busy) {
      return new CheckResult({
        name: `Port ${port}`,
        ok: true,
        kind: "ok",
        message: "Available",
      });
    }
    return new CheckResult({
      name: `Port ${port}`,
      ok: true,
      kind: "info",
      message: "In use – another free port will be chosen automatically",
    });
  }
}
