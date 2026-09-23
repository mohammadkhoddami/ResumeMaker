import { spawn } from "node:child_process";

export const MIN_PYTHON_MAJOR = 3;
export const MIN_PYTHON_MINOR = 12;

let detectionPromise = null;

function probe(command, args = ["--version"]) {
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
      child = spawn(command, args, { shell: false, windowsHide: true });
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

function buildCandidates() {
  const isWindows = process.platform === "win32";
  const versionedNames = ["3.14", "3.13", "3.12"];

  const raw = [
    process.env.PYTHON && { command: process.env.PYTHON },
    { command: "python" },
    { command: "python3" },
    ...(isWindows
      ? [
          { command: "py" },
          ...versionedNames.map((version) => ({ command: "py", args: [`-${version}`] })),
        ]
      : versionedNames.map((version) => ({ command: `python${version}` }))),
  ].filter(Boolean);

  const seen = new Set();
  return raw
    .map(({ command, args }) => ({
      command,
      args: [...(args ?? []), "--version"],
      label: [command, ...(args ?? [])].join(" "),
    }))
    .filter(({ label }) => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
}

async function detectPython() {
  const candidates = buildCandidates();

  for (const candidate of candidates) {
    const output = await probe(candidate.command, candidate.args);
    const version = parseVersion(output);
    if (satisfies(version)) {
      return {
        executable: candidate.command,
        args: candidate.args.slice(0, -1),
        version: version.label,
      };
    }
  }

  const error = new Error(
    `Python ${MIN_PYTHON_MAJOR}.${MIN_PYTHON_MINOR} or newer was not found on this machine.`
  );
  error.kind = "python-missing";
  error.candidates = candidates.map(({ label }) => label);
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
