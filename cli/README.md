# Resume Builder CLI

One command. Everything else is automatic.

The CLI packages the complete Persian Resume Builder application — a React/Vite frontend and a FastAPI backend — and runs it on your machine with zero manual setup.

## Quick Start

```bash
npx @mohammadhkhoddami/resume-builder
```

That's it. On first run the CLI will:

1. Check your environment (Node.js, Python, npm, ports)
2. Copy the application into a per-user runtime directory (`~/.resume-builder`)
3. Install frontend dependencies (`npm install`)
4. Create a Python virtual environment and install backend dependencies
5. Download the Chromium browser used for PDF export (one time)
6. Start FastAPI (default port `8000`) and Vite (default port `5173`)
7. Pick a free port automatically if a default one is busy
8. Open the app in your default browser

Subsequent starts skip every already-completed step, so they launch in seconds.

## Global Installation

```bash
npm install -g @mohammadhkhoddami/resume-builder
resume-builder
```

## Commands

| Command | Description |
| --- | --- |
| `resume-builder` | Start the application (same as `start`) |
| `resume-builder start` | Start backend + frontend and open the browser |
| `resume-builder doctor` | Diagnose the installation and environment |
| `resume-builder build` | Build the production frontend bundle |
| `resume-builder --version` | Show the CLI version |

Options for `start`:

| Flag | Description |
| --- | --- |
| `--no-check` | Skip pre-flight environment checks |
| `-v, --verbose` | Show debug output |

Press `Ctrl+C` to stop. The CLI shuts down both services and their child processes cleanly — no orphaned servers left behind.

## Requirements

- **Node.js 18+** (includes npm 9+)
- **Python 3.12+** available in `PATH`
- Internet access on first run (dependency downloads)

The CLI detects `python`, `python3`, and the Windows `py` launcher automatically.

## What the CLI manages for you

- **Full application bundled**: the npm package ships with both the FastAPI backend and the React/Vite frontend inside `app/`
- **Runtime isolation**: the working copy of the app lives in `~/.resume-builder/app`; the installed npm package is never modified
- **Automatic installs**: frontend `npm install` and backend `pip install -r requirements.txt` run only when needed
- **Virtual environments**: a shared venv is maintained at `~/.resume-builder/venv`
- **Port management**: if `8000` or `5173` are occupied, the next free ports are chosen and reported; the frontend receives the real API port automatically
- **Health checks**: startup completes only when `/health` responds on the backend and the Vite port accepts connections
- **Crash handling**: if either service dies unexpectedly, the other is stopped and the error output is shown

## Troubleshooting

Run diagnostics:

```bash
resume-builder doctor
```

Common fixes:

- **Reset the runtime** (removes the venv and installed dependencies; they reinstall on next start):
  ```bash
  rm -rf ~/.resume-builder   # Windows: delete %USERPROFILE%\.resume-builder
  ```
- **Force a fresh copy of the app files** after modifying the package:
  ```bash
  RESUME_BUILDER_FORCE_SYNC=1 resume-builder start
  ```
- **Python not found**: install Python 3.12+ from [python.org](https://www.python.org/downloads/) and ensure it is in `PATH`
- **PDF export fails**: Chromium may be missing; delete `~/.resume-builder` and start again so it re-downloads

## For maintainers: building the package

The published package embeds the whole application. From `cli/`:

```bash
npm run prepack   # copies backend/, frontend sources and fonts into cli/app/
npm pack          # produces @mohammadhkhoddami/resume-builder-<version>.tgz
```

`prepack` runs automatically before `npm pack` and `npm publish`. It copies only runtime-relevant sources (no `node_modules`, `.venv`, `__pycache__`, `dist`, logs) and downloads the two required Vazirmatn fonts into `app/backend/static/fonts` if they are not present locally.
