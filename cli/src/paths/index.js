import fs from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

export const packageRoot = path.resolve(moduleDir, "..", "..");

export function readPackageInfo() {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
}

export const packagedAppRoot = path.join(packageRoot, "app");
export const packagedBackendDir = path.join(packagedAppRoot, "backend");
export const packagedFrontendDir = path.join(packagedAppRoot, "frontend");

export const runtimeRoot = path.join(os.homedir(), ".resume-builder");
export const runtimeAppRoot = path.join(runtimeRoot, "app");
export const runtimeBackendDir = path.join(runtimeAppRoot, "backend");
export const runtimeFrontendDir = path.join(runtimeAppRoot, "frontend");
export const runtimeVenvDir = path.join(runtimeRoot, "venv");

export const DEFAULT_BACKEND_PORT = 8000;
export const DEFAULT_FRONTEND_PORT = 5173;

export async function pathExists(target) {
  try {
    await fsPromises.access(target);
    return true;
  } catch {
    return false;
  }
}
