import { spawn } from "node:child_process";

export const MIN_PYTHON_MAJOR = 3;
export const MIN_PYTHON_MINOR = 12;

let detectionPromise = null;

function probe(executable) {
  return new Promise((resolve) => {
    let settled = false;
    let output = "";

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), 10000);

    let child;
    try {
      child = spawn(executable, ["--version"], { shell: false, windowsHide: true });
    } catch {
      finish(null);
      return;
    }

    child.stdout?.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", () => finish(null));
    child.on("close", () => finish(output));
  });
}

function parseVersion(text) {
  const match = /Python\s+(\d+)\.(\d+)(?:\.(\d+))?/i.exec(text || "");
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] ?? 0),
    label: `${match[1]}.${match[2]}.${match[3] ?? 0}`,
  };
}

function satisfies(version) {
  if (!version) return false;
  if (version.major > MIN_PYTHON_MAJOR) return true;
  return version.major === MIN_PYTHON_MAJOR && version.minor >= MIN_PYTHON_MINOR;
}

async function detectPython() {
  const candidates = [
    process.env.PYTHON,
    "python",
    "python3",
    ...(process.platform === "win32" ? ["py"] : []),
  ].filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);

  for (const candidate of candidates) {
    const output = await probe(candidate);
    const version = parseVersion(output);
    if (satisfies(version)) {
      return { executable: candidate, version: version.label };
    }
  }

  const error = new Error(
    `Python ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR} or newer was not found on this machine.`
  );
  error.kind = "python-missing";
  error.candidates = candidates;
  throw error;
}

export function findPython() {
  if (!detectionPromise) {
    detectionPromise = detectPython().catch((error) => {
      detectionPromise = null;
      throw error;
    });
  }
  return detectionPromise;
}

export async function getBestPythonReport() {
  try {
    return { ok: true, ...(await findPython()) };
  } catch (error) {
    return { ok: false, kind: error.kind, message: error.message };
  }
}
