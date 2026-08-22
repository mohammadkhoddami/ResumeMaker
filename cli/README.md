# Resume Builder CLI

A simple, installable CLI tool for building Persian CVs without manual setup.

## Installation

### via npm (npx)

```bash
npx @persian/resume-builder
```

### via npm (global)

```bash
npm install -g @persian/resume-builder
resume-builder
```

## Usage

### Start the Application

```bash
npx @persian/resume-builder start
```

This will:
- Check your environment (Node.js, Python, dependencies)
- Start the FastAPI backend
- Start the React/Vite frontend
- Open the application in your browser

### Run Diagnostics

```bash
npx @persian/resume-builder doctor
```

This checks:
- Node.js installation
- Python installation and version
- Frontend dependencies
- Backend Python packages
- Available ports for the application
- Required files
- Fonts

### Build Production Version

```bash
npx @persian/resume-builder build
```

Builds the frontend and copies backend assets to the `build/` directory.

## What Happens Under the Hood

The CLI orchestrates:

1. **Environment Check**: Validates Node.js and Python presence and versions
2. **Backend Startup**: Starts FastAPI on port 8000
3. **Frontend Startup**: Starts Vite development server on port 5173

No manual virtual environments, no manual dependency installation, no separate startup commands.

## User Experience

```
npx @persian/resume-builder

ℹ Starting Resume Builder...

ℹ Checking environment...
✓ Node.js
✓ Python 3.14
✓ Frontend dependencies installed
✓ Python packages available
✓ Port 8000 available
✓ Port 5173 available
✓ Backend directory found
✓ Frontend directory found

ℹ Preparing application...
ℹ Starting backend...
[backend] INFO: Uvicorn running on http://0.0.0.0:8000

ℹ Starting frontend...
  VITE v6.0.5  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose


Application is ready!
  UI: http://localhost:3000

Press Ctrl+C to stop
```

## Requirements

- Node.js 18+
- Python 3.12+
- npm 9+

## Troubleshooting

### Python not found

The CLI automatically detects Python using system PATH. Ensure Python is installed and in your PATH.

### Dependencies not found

Run `npx @persian/resume-builder doctor` to check your environment.

### Port already in use

Kill the existing process using the port, or the CLI will automatically use an available port.

### Frontend not starting

Check that `node_modules/.vite` exists. If missing, run the CLI and it will automatically install dependencies.

## Architecture

The CLI acts as an orchestration layer:

```
                    Resume Builder CLI
                     │
          ┌──────────┴──────────┐
          │                     │
     Backend Process       Frontend Process
          │                     │
       FastAPI                Vite/React
```

The CLI manages:
- Process lifecycle (start, stop, restart)
- Environment validation
- Dependency management
- Error handling

## Development

### Structure

```
cli/
├── bin/
│   └── cli.js              # CLI entry point
├── src/
│   ├── commands/          # Command handlers
│   ├── process/           # Process management
│   ├── environment/       # Environment checks
│   ├── logger/           # Logging utilities
│   └── manager.js        # CLI orchestration
└── package.json
```

### Local Testing

```bash
cd cli
npm run dev
```

## License

MIT