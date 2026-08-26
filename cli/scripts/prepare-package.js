import fsPromises from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(cliRoot, "..");
const appRoot = path.join(cliRoot, "app");
const fontCacheDir = path.join(cliRoot, "assets", "fonts");

const EXCLUDED_NAMES = new Set([
  "node_modules",
  "__pycache__",
  ".git",
  ".venv",
  "venv",
  "env",
  "dist",
  "build",
  "logs",
  ".pytest_cache",
  ".mypy_cache",
  ".DS_Store",
]);

const EXCLUDED_SUFFIXES = [".pyc", ".pyo", ".tsbuildinfo", ".log"];

function shouldInclude(source) {
  const base = path.basename(source);
  if (EXCLUDED_NAMES.has(base)) return false;
  if (EXCLUDED_SUFFIXES.some((suffix) => base.endsWith(suffix))) return false;
  return true;
}

async function copyFileList(files, sourceDir, targetDir) {
  let copied = 0;
  for (const name of files) {
    const source = path.join(sourceDir, name);
    try {
      await fsPromises.access(source);
    } catch {
      continue;
    }
    await fsPromises.mkdir(path.dirname(path.join(targetDir, name)), { recursive: true });
    await fsPromises.copyFile(source, path.join(targetDir, name));
    copied += 1;
  }
  return copied;
}

async function copyTree(source, target) {
  await fsPromises.mkdir(target, { recursive: true });
  const entries = await fsPromises.readdir(source, { withFileTypes: true });

  let copied = 0;
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    if (!shouldInclude(sourcePath)) continue;

    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copied += await copyTree(sourcePath, targetPath);
    } else {
      await fsPromises.copyFile(sourcePath, targetPath);
      copied += 1;
    }
  }
  return copied;
}

async function downloadFile(url, targetPath) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.subarray(0, 4).toString("ascii").startsWith("wOF2")) {
    throw new Error(`Downloaded file is not a WOFF2 font: ${url}`);
  }
  await fsPromises.writeFile(targetPath, buffer);
}

async function ensureFonts(appFontsDir) {
  const fonts = [
    {
      file: "Vazirmatn-Regular.woff2",
      urls: [
        "https://github.com/rastikerdar/vazirmatn/raw/master/fonts/webfonts/Vazirmatn-Regular.woff2",
        "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@master/fonts/webfonts/Vazirmatn-Regular.woff2",
      ],
    },
    {
      file: "Vazirmatn-Bold.woff2",
      urls: [
        "https://github.com/rastikerdar/vazirmatn/raw/master/fonts/webfonts/Vazirmatn-Bold.woff2",
        "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@master/fonts/webfonts/Vazirmatn-Bold.woff2",
      ],
    },
  ];

  await fsPromises.mkdir(appFontsDir, { recursive: true });
  let downloaded = 0;

  for (const font of fonts) {
    const targetPath = path.join(appFontsDir, font.file);
    try {
      await fsPromises.access(targetPath);
      continue;
    } catch {
      /* needs download */
    }

    const cachePath = path.join(fontCacheDir, font.file);
    let cached = false;
    try {
      await fsPromises.access(cachePath);
      cached = true;
    } catch {
      /* not cached */
    }

    if (!cached) {
      let lastError = null;
      for (const url of font.urls) {
        try {
          await fsPromises.mkdir(fontCacheDir, { recursive: true });
          await downloadFile(url, cachePath);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;
    }

    await fsPromises.copyFile(cachePath, targetPath);
    downloaded += 1;
  }

  return downloaded;
}

async function main() {
  console.log("Preparing npm package application bundle...");

  await fsPromises.rm(appRoot, { recursive: true, force: true });
  await fsPromises.mkdir(path.join(appRoot, "backend"), { recursive: true });
  await fsPromises.mkdir(path.join(appRoot, "frontend"), { recursive: true });

  const backendSource = path.join(repoRoot, "backend");
  const frontendSource = repoRoot;
  const backendTarget = path.join(appRoot, "backend");
  const frontendTarget = path.join(appRoot, "frontend");

  const backendTopFiles = ["main.py", "config.py", "logging_config.py", "run.py", "requirements.txt"];
  let count = await copyFileList(backendTopFiles, backendSource, backendTarget);

  for (const dir of ["models", "services", "templates", "static"]) {
    count += await copyTree(path.join(backendSource, dir), path.join(backendTarget, dir));
  }

  const frontendTopFiles = [
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tailwind.config.ts",
    "postcss.config.js",
    "tsconfig.json",
    "tsconfig.node.json",
  ];
  count += await copyFileList(frontendTopFiles, frontendSource, frontendTarget);

  count += await copyTree(path.join(frontendSource, "src"), path.join(frontendTarget, "src"));

  try {
    await fsPromises.access(path.join(frontendSource, "public"));
    count += await copyTree(path.join(frontendSource, "public"), path.join(frontendTarget, "public"));
  } catch {
    /* no public directory in this project */
  }

  let fontNote = "fonts already bundled";
  try {
    const downloaded = await ensureFonts(path.join(backendTarget, "static", "fonts"));
    if (downloaded > 0) fontNote = `downloaded ${downloaded} font file(s)`;
  } catch (error) {
    fontNote = `WARNING: fonts could not be downloaded (${error.message}). PDF export will fall back to system fonts.`;
  }

  console.log(`Copied ${count} files into cli/app.`);
  console.log(`Fonts: ${fontNote}`);
}

main().catch((error) => {
  console.error(`Package preparation failed: ${error.message}`);
  process.exit(1);
});
