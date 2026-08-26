import fsPromises from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import cliLogger from "../logger/index.js";
import { findPython } from "../environment/python.js";
import {
  packagedAppRoot,
  runtimeAppRoot,
  runtimeBackendDir,
  runtimeFrontendDir,
  runtimeRoot,
  runtimeVenvDir,
  pathExists,
} from "../paths/index.js";

const SYNC_MARKER_FILE = ".resume-builder-app-version";
const BACKEND_PACKAGE_PROBE =
  "import fastapi, uvicorn, jinja2, pydantic_settings, playwright";
const MAX_TAIL_LINES = 200;

export class SetupError extends Error {
  constructor(message, { command, args = [], cwd, tail = [], suggestion } = {}) {
    super(message);
    this.name = "SetupError";
    this.command = command;
    this.args = args;
    this.cwd = cwd;
    this.tail = tail;
    this.suggestion = suggestion;
  }
}

async function readFileSafe(filePath) {
  try {
    return (await fsPromises.readFile(filePath, "utf8")).trim();
  } catch {
    return null;
  }
}

export function runProcess(command, args, options = {}) {
  const {
    cwd = process.cwd(),
    env = {},
    shell = false,
    timeoutMs = 15 * 60 * 1000,
    echo = true,
  } = options;

  return new Promise((resolve) => {
    const lines = [];
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    const pushLines = (text) => {
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        lines.push(line);
        if (lines.length > MAX_TAIL_LINES) lines.shift();
        if (echo) cliLogger.muted(`  │ ${line}`);
      }
    };

    let child;
    try {
      child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        shell,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      finish({ code: -1, error, lines, stdout, stderr, timedOut: false });
      return;
    }

    timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already dead */
      }
      finish({ code: -1, error: new Error("Timed out"), lines, stdout, stderr, timedOut: true });
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      pushLines(text);
    });

    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      pushLines(text);
    });

    child.on("error", (error) => {
      finish({ code: -1, error, lines, stdout, stderr, timedOut: false });
    });

    child.on("close", (code, signal) => {
      finish({ code: code ?? -1, signal, lines, stdout, stderr, timedOut: false });
    });
  });
}

function setupFailure(message, { command, args, cwd, result, suggestion }) {
  const detail = result.error?.message ?? `exit code ${result.code}`;
  return new SetupError(`${message} (${detail})`, {
    command,
    args,
    cwd,
    tail: result.lines.slice(-15),
    suggestion,
  });
}

export function getVenvPythonPath() {
  return process.platform === "win32"
    ? path.join(runtimeVenvDir, "Scripts", "python.exe")
    : path.join(runtimeVenvDir, "bin", "python");
}

export async function ensureApplicationSynced(pkgVersion, { force = false } = {}) {
  await fsPromises.mkdir(runtimeRoot, { recursive: true });

  if (!(await pathExists(packagedAppRoot))) {
    const error = new Error(
      "Backend application files are missing.\n\nThe Resume Builder package appears to be incomplete.\nPlease reinstall the package or report this issue."
    );
    error.kind = "package-incomplete";
    throw error;
  }

  const markerPath = path.join(runtimeAppRoot, SYNC_MARKER_FILE);
  const syncedVersion = await readFileSafe(markerPath);

  if (
    !force &&
    syncedVersion === pkgVersion &&
    (await pathExists(runtimeBackendDir)) &&
    (await pathExists(runtimeFrontendDir))
  ) {
    return { synced: false };
  }

  cliLogger.info("Preparing application files...");
  await fsPromises.rm(runtimeAppRoot, { recursive: true, force: true });
  await fsPromises.cp(packagedAppRoot, runtimeAppRoot, { recursive: true });
  await fsPromises.writeFile(markerPath, pkgVersion);

  return { synced: true };
}

export async function frontendDepsInstalled() {
  return pathExists(path.join(runtimeFrontendDir, "node_modules", ".package-lock.json"));
}

export async function ensureFrontendDependencies() {
  if (await frontendDepsInstalled()) {
    return { installed: false };
  }

  const command = "npm";
  const args = ["install", "--no-audit", "--no-fund"];

  cliLogger.info("Installing frontend dependencies...");
  const result = await runProcess(command, args, {
    cwd: runtimeFrontendDir,
    shell: process.platform === "win32",
    timeoutMs: 30 * 60 * 1000,
  });

  if (result.code !== 0 || !(await frontendDepsInstalled())) {
    throw setupFailure("Failed to install frontend dependencies", {
      command,
      args,
      cwd: runtimeFrontendDir,
      result,
      suggestion:
        "Check your internet connection and npm registry access, then run the command again.",
    });
  }

  return { installed: true };
}

export async function backendPackagesInstalled(venvPython = getVenvPythonPath()) {
  if (!(await pathExists(venvPython))) return false;

  const result = await runProcess(venvPython, ["-c", BACKEND_PACKAGE_PROBE], {
    cwd: runtimeBackendDir,
    echo: false,
    timeoutMs: 2 * 60 * 1000,
  });
  return result.code === 0;
}

export async function ensureBackendDependencies({ python } = {}) {
  const interpreter = python ?? (await findPython());
  const venvPython = getVenvPythonPath();

  if (!(await pathExists(venvPython))) {
    cliLogger.info(`Creating Python virtual environment at ${runtimeVenvDir}...`);
    const result = await runProcess(interpreter.executable, ["-m", "venv", runtimeVenvDir], {
      timeoutMs: 10 * 60 * 1000,
    });

    if (result.code !== 0 || !(await pathExists(venvPython))) {
      throw setupFailure("Failed to create the Python virtual environment", {
        command: interpreter.executable,
        args: ["-m", "venv", runtimeVenvDir],
        cwd: process.cwd(),
        result,
        suggestion: "Make sure Python 3.12+ is installed correctly and available in PATH.",
      });
    }
  }

  if (!(await backendPackagesInstalled(venvPython))) {
    const args = ["-m", "pip", "install", "--progress-bar=off", "-r", "requirements.txt"];
    cliLogger.info("Installing backend dependencies...");
    const result = await runProcess(venvPython, args, {
      cwd: runtimeBackendDir,
      timeoutMs: 45 * 60 * 1000,
    });

    if (result.code !== 0 || !(await backendPackagesInstalled(venvPython))) {
      throw setupFailure("Failed to install backend dependencies", {
        command: venvPython,
        args,
        cwd: runtimeBackendDir,
        result,
        suggestion:
          "Check your internet connection and PyPI access. You can retry by deleting ~/.resume-builder and running the CLI again.",
      });
    }
  }

  return { venvPython };
}

export async function playwrightChromiumReady(venvPython) {
  const result = await runProcess(
    venvPython,
    ["-m", "playwright", "install", "chromium", "--dry-run"],
    { cwd: runtimeBackendDir, echo: false, timeoutMs: 2 * 60 * 1000 }
  );

  if (result.code !== 0) return null;

  const locations = [
    ...`${result.stdout}\n${result.stderr}`.matchAll(/Install location:\s+(.+)/gi),
  ].map((match) => match[1].trim());

  if (locations.length === 0) return null;

  for (const location of locations) {
    if (!(await pathExists(location))) return false;
  }
  return true;
}

export async function ensurePlaywrightChromium(venvPython) {
  const ready = await playwrightChromiumReady(venvPython);
  if (ready === true) {
    return { installed: false };
  }

  cliLogger.info("Ensuring Chromium browser for PDF export (one-time download)...");

  const result = await runProcess(venvPython, ["-m", "playwright", "install", "chromium"], {
    cwd: runtimeBackendDir,
    echo: true,
    timeoutMs: 60 * 60 * 1000,
  });

  if (result.code !== 0) {
    cliLogger.warn(
      "Chromium installation failed. The app will start, but PDF export may not work until it is installed."
    );
    return { installed: false, failed: true };
  }

  return { installed: true };
}
