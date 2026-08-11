# Persian CV Builder

A modern, RTL-first CV/resume builder with real-time preview, cloud sync via Firebase, and PDF export.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography` |
| State Management | Zustand 5 |
| Auth & Cloud Sync | Firebase 11 (Auth + Firestore) |
| PDF Export | `jspdf` + `html2canvas` (image-based) or native browser print |
| Utilities | `nanoid` for ID generation |

## Directory Structure

```
src/
├── components/
│   ├── cv/              # CV preview & section renderers
│   │   ├── CVPreview.tsx
│   │   ├── SectionRenderer.tsx
│   │   └── sections/    # Individual section components
│   ├── layout/          # ErrorBoundary
│   ├── sidebar/         # Editor sidebar panels
│   └── ui/              # Shared UI primitives (Toast, buttons, etc.)
├── hooks/               # useAuth, useCloudSync, useDragDrop
├── services/            # Firebase, PDF export, JSON validation
├── store/               # Zustand stores (cvStore, uiStore)
├── styles/              # Print CSS
├── types/               # TypeScript type definitions
└── utils/               # Defaults, ID helpers
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Configure Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** (Email/Password provider).
3. Create a **Cloud Firestore** database.
4. Copy `.env.example` → `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_CONFIG='{"apiKey":"AIza...","authDomain":"my-app.firebaseapp.com","projectId":"my-app","storageBucket":"my-app.appspot.com","messagingSenderId":"123456","appId":"1:123:web:abc"}'
```

> All fields are required. The value must be a single-line JSON string wrapped in single quotes.

### Build for Production

```bash
npm run build
```

Output is written to `dist/`. Preview the production build locally:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## PDF Export Methods

### 1. Native Print (Recommended)

Uses the browser's built-in **Print → Save as PDF** dialog. Produces vector-quality text, selectable/searchable content, and correct page breaks. Triggered via the "Print" button in the Export panel.

- Styled with `src/styles/print.css` (`@media print` rules).
- Respects A4 page size (`210mm × 297mm`) with proper margins.

### 2. Image-Based Export (html2canvas + jsPDF)

Captures the CV preview as a raster image and embeds it in a PDF. Useful when the print dialog is unavailable (e.g., embedded WebViews).

- **Pros**: Consistent rendering across environments.
- **Cons**: Larger file size, non-selectable text, potential quality loss at zoom.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint on all `.ts`/`.tsx` files |

## License

MIT