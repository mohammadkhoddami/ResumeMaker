# Font Assets

Place the following WOFF2 font files in this directory before running the PDF export service **outside** of Docker.

## Required

| File | Source |
|------|--------|
| `Vazirmatn-Regular.woff2` | [Vazirmatn GitHub](https://github.com/rastikerdar/vazirmatn) (OFL) |
| `Vazirmatn-Bold.woff2` | [Vazirmatn GitHub](https://github.com/rastikerdar/vazirmatn) (OFL) |

## Optional (licensed separately)

| File | Source |
|------|--------|
| `IRANSans-Regular.woff2` | Obtain from a valid IRANSans license |
| `IRANSans-Bold.woff2` | Obtain from a valid IRANSans license |

## Docker deployments

Font files are **bundled into the Docker image** at build time. The
`Dockerfile` runs a validation step (`validate_fonts()`) after copying the
application source; if any required WOFF2 file is missing the build fails
immediately with a clear log message. No manual download step is needed when
deploying via `docker compose`.

## Local (non-Docker) development

If you run the backend directly (e.g. `uvicorn main:app`), ensure the two
required Vazirmatn files listed above are present in this directory. The
server calls `validate_fonts()` at startup and will log a warning and exit
if they are absent.

> **Note:** These fonts are NOT committed to the repository. Download them
> from their respective licensed sources and place them here manually for
> local development.