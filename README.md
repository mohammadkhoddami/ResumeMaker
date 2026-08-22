# Persian CV Builder - Resume Maker

A modern Persian CV builder built with React, Vite, and FastAPI. This repository contains a CLI tool that allows you to run the entire application with a single command.

## Quick Start

### Using the CLI

```bash
npm run cli:dev
```

Or install globally:

```bash
npm install -g .

resume-builder
```

Then use:

```bash
resume-builder start        # Start the application
resume-builder doctor        # Run diagnostics
resume-builder build         # Build the production version
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
npx @persian/resume-builder doctor
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