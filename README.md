# Persian CV Builder - Resume Maker

A modern Persian CV builder built with React, Vite, and FastAPI. This repository contains a CLI tool that allows you to run the entire application with a single command.

## Quick Start

### Run with npx (no install)

```bash
npx @mohammadhkhoddami/resume-builder
```

That single command:

1. Checks Node.js, Python 3.12+, npm, and required files
2. Copies the app to `~/.resume-builder` and installs dependencies on first run
3. Starts the FastAPI backend on `http://localhost:8000`
4. Starts the Vite frontend on `http://localhost:5173`
5. Opens the app in your browser and keeps the terminal attached (blocked) until you press `Ctrl+C`

`start` is the default command, so `npx @mohammadhkhoddami/resume-builder` is the same as
`npx @mohammadhkhoddami/resume-builder start`. If ports 8000/5173 are busy, free ports are chosen automatically.

> Note: the npm package is scoped as `@mohammadhkhoddami/resume-builder`. The bare name
> `resume-maker` is already taken on npm by an unrelated package, so `npx resume-maker` will
> not run this project.

### Run from a clone (development)

```bash
npm install          # install frontend dependencies
npm run cli:dev      # runs: node cli/bin/cli.js start
```

### Install globally

```bash
cd cli
npm install -g .
resume-builder
```

### CLI commands

```bash
resume-builder start        # Start the application (default)
resume-builder doctor       # Run diagnostics
resume-builder build        # Build the production frontend bundle
```

## Features

- ✨ Modern React + Vite frontend
- 🎨 Beautiful Persian fonts (Vazirmatn)
- 📄 Multiple resume templates (Modern, Minimal, Executive, Classic, ATS)
- 🎯 PDF export with customizable sections
- 🌐 Cross-platform support (Windows, macOS, Linux)
- 🚀 One-command installation and startup

## Project Structure

```
.
├── cli/                          # CLI orchestration layer
│   ├── bin/
│   │   └── cli.js                # CLI entry point
│   ├── src/
│   │   ├── environment/          # Environment checks
│   │   ├── logger/               # Logging utilities
│   │   ├── manager.js            # CLI orchestration
│   │   └── process/              # Process management
│   └── package.json
├── backend/                      # FastAPI application
│   ├── main.py                   # API endpoints
│   ├── config.py                 # Configuration
│   ├── services/                 # PDF generation
│   └── templates/                # Resume templates
├── src/                          # React application
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── App.tsx
├── package.json                  # Frontend dependencies
└── vite.config.ts               # Vite configuration
```

## Development

### Using the CLI

```bash
# Start development server
npm run cli:dev

# Build production version
npm run cli:build

# Run diagnostics
npm run cli:doctor
```

### Traditional Development

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate venv (Windows)
venv\Scripts\activate

# Activate venv (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
python main.py
```

#### Frontend

```bash
cd frontend (or src)

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment

### Required

- Node.js 18+
- Python 3.12+
- npm 9+

### Optional

- Git

## Troubleshooting

### CLI Issues

Run diagnostics:

```bash
npx @mohammadhkhoddami/resume-builder doctor
```

### Port Already in Use

Kill the existing process:

```bash
# Windows
npx kill-port 8000 5173

# Mac/Linux
kill $(lsof -t -i:8000) $(lsof -t -i:5173)
```

### Dependencies Not Found

Remove `node_modules` and install again:

```bash
rm -rf node_modules/
npm install
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand state management
- Firebase (authentication)

### Backend
- FastAPI
- Uvicorn
- Playwright (PDF generation)
- Pydantic
- Jinja2

## License

MIT