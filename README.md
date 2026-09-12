# Pets workshop

This repository contains the project for three guided workshops to explore various GitHub features. The project is a website for a fictional dog shelter, with a [Flask](https://flask.palletsprojects.com/en/stable/) backend using [SQLAlchemy](https://www.sqlalchemy.org/) and an [Astro](https://astro.build/) frontend using [Tailwind CSS](https://tailwindcss.com/).

The available workshops are:

- **[One hour](./content/1-hour/README.md)** — focused on GitHub Copilot
- **[Full-day](./content/full-day/README.md)** — a full day-in-the-life of a developer using GitHub for their DevOps processes
- **[GitHub Actions](./content/github-actions/README.md)** — CI/CD pipelines from running tests to deploying to Azure

## Getting started

> **[Get started learning about development with GitHub!](./content/README.md)**

## License 

This project is licensed under the terms of the MIT open source license. Please refer to the [LICENSE](./LICENSE) for the full terms.

## Maintainers 

You can find the list of maintainers in [CODEOWNERS](./.github/CODEOWNERS).

## Support

This project is provided as-is, and may be updated over time. If you have questions, please open an issue.

---

## Features

### Dogs
- Browse adoptable dogs and their details
- Basic shelter-style catalogue experience backed by Flask + SQLAlchemy

### Pet Appointment & Booking System
- Create and manage appointments for pets (MVP)
- Role-based access patterns via request headers (see **Appointment booking (MVP)**)
- Frontend flows implemented in Astro + Tailwind (where applicable in the workshop)

---

## Quickstart

> Notes:
> - The project includes scripts under `app/scripts`. Use those when available for consistent local setup.
> - If you don’t see a referenced script in your branch, run the closest equivalent for your environment (e.g., `python -m ...`, `npm run ...`).

### Backend (Flask API)

1. Create and activate a virtual environment, then install dependencies:
   - `python -m venv .venv`
   - macOS/Linux: `source .venv/bin/activate`
   - Windows (PowerShell): `.venv\Scripts\Activate.ps1`
   - `pip install -r requirements.txt`

2. Run local setup scripts (preferred, when present):
   - Check available scripts: `ls app/scripts`
   - Run the backend setup script if provided (examples you may find in this repo):
     - `bash app/scripts/setup-backend.sh`
     - `bash app/scripts/init-db.sh`

3. Start the API:
   - Preferred: `bash app/scripts/start-backend.sh`
   - Or (fallback): `flask --app app run --reload`

### Frontend (Astro)

1. Install dependencies:
   - `cd frontend`
   - `npm install`

2. Start the dev server:
   - Preferred: `bash ../app/scripts/start-frontend.sh`
   - Or (fallback): `npm run dev`

---

## Appointment booking (MVP)

The appointment endpoints use simple request headers to model identity and authorization in the MVP.

### Required headers

- `X-User-Id`: A unique identifier for the current user (string or integer, depending on implementation).
- `X-Role`: The role for the current request.

Typical roles:
- `user` — standard user booking an appointment
- `admin` — administrative actions (e.g., viewing/managing all appointments)

### Example request

Create an appointment (example shape; see API documentation for the current schema):

- `X-User-Id: 123`
- `X-Role: user`

Using `curl` (update URL/path to match your local API base):

curl -X POST "http://localhost:5000/api/appointments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 123" \
  -H "X-Role: user" \
  -d '{
    "pet_id": 1,
    "start_time": "2026-01-01T10:00:00Z",
    "notes": "First visit"
  }'

---

## API overview (documentation)

API behavior, endpoint lists, and payloads are documented in Confluence:

- Dogs API overview: https://confluence.example.com/display/PETS/Dogs+API
- Appointments API overview: https://confluence.example.com/display/PETS/Appointments+API
- Auth (MVP headers) and roles: https://confluence.example.com/display/PETS/MVP+Auth+Headers

> Replace `confluence.example.com` with your organization Confluence base URL if different.

---

## Testing

### Backend (pytest)

- Preferred: `bash app/scripts/test-backend.sh`
- Or (fallback): `pytest`

### Frontend build

From `frontend/`:
- Preferred: `bash ../app/scripts/build-frontend.sh`
- Or (fallback): `npm run build`

### End-to-end tests (Playwright)

From `frontend/` (or wherever Playwright is configured in this repo):
- Preferred: `bash ../app/scripts/test-e2e.sh`
- Or (fallback):
  - `npx playwright install`
  - `npx playwright test`

---

## Deployment summary (local)

This repo is designed for local development and workshop-style CI/CD exercises.

A typical local “deployment” looks like:

1. Start backend API (Flask) on `http://localhost:5000`
2. Start frontend (Astro) on `http://localhost:4321` (default Astro port)
3. Ensure the frontend is configured to call the backend API base URL (environment/config depends on your branch)

If scripts exist under `app/scripts` for running both services together, prefer those for repeatable setup:
- `bash app/scripts/start-backend.sh`
- `bash app/scripts/start-frontend.sh`
- (Optional) `bash app/scripts/dev.sh` (if present)