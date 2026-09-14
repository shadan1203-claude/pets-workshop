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
   - Preferred: `bash app/scripts/start-app.sh` (runs app components together when available)
   - Or (fallback): `flask --app app/server run --reload --port 5100`

### Frontend (Astro)

1. Install dependencies:
   - `cd app/client`
   - `npm install`

2. Start the dev server:
   - Preferred: `bash ../scripts/start-app.sh` (runs app components together when available)
   - Or (fallback): `npm run dev`

> Default ports (unless overridden by scripts/config):
> - Backend API: `http://localhost:5100`
> - Astro dev server: `http://localhost:4321`

---

## Appointment booking (MVP)

The appointment endpoints use simple request headers to model identity and authorization in the MVP.

### Security note

Header-based authentication/authorization is for development/workshop purposes only. It is not a secure production approach and should be replaced with proper authentication (e.g., sessions/JWT/OAuth) before any real deployment.

### Required headers

- `X-User-Id`: A unique identifier for the current user (string or integer, depending on implementation).
- `X-Role`: The role for the current request.

Typical roles:
- `user` — standard user booking an appointment
- `admin` — administrative actions (e.g., viewing/managing all appointments)

### Example request

Create an appointment (example shape; see documentation for the current schema and what is implemented in your branch):

- `X-User-Id: 123`
- `X-Role: user`

Using `curl` (update URL/path to match your local API base and the endpoints available in your branch):

curl -X POST "http://localhost:5100/api/appointments" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 123" \
  -H "X-Role: user" \
  -d '{
    "pet_id": 1,
    "start_time": "2026-01-01T10:00:00Z",
    "notes": "First visit"
  }'

---

## Pet Appointment & Booking System (Documentation)

This repository includes a documentation-driven design for a Pet Appointment & Booking System (MVP). Depending on the workshop branch and progress, some or all of the implementation may not yet be merged—use the Confluence pages below as the source of truth for requirements and intended behavior.

### Feature overview (MVP)

- Customers can request/book appointments for pet services.
- Admins can review and manage appointments.
- The MVP uses request headers to emulate identity and roles for workshop scenarios (see the security note above).

### MVP assumptions

- Simplified authorization via `X-User-Id` and `X-Role` headers (workshop-only).
- The workflow and UI/API behavior should be validated against the Confluence requirements and designs; do not assume an endpoint exists unless it is present in your current branch.

### Confluence documentation links

- Requirement: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12910593/EPMCDMETST-63008+Add+appointment+booking+workflow+customer+admin+for+pet+services
- Architecture: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12943361/Architecture+EPMCDMETST-63008
- HLD: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12976129/HLD+EPMCDMETST-63008
- LLD: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12484610/LLD+EPMCDMETST-63008
- Wireframes: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12812305/Wireframe+EPMCDMETST-63008
- Implementation Plan: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12615682/Implementation+Plan+EPMCDMETST-63008

---

## API overview (documentation)

API behavior, endpoint lists, and payloads are documented in Confluence:

- Requirement (workflow scope and acceptance criteria): https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12910593/EPMCDMETST-63008+Add+appointment+booking+workflow+customer+admin+for+pet+services
- Architecture: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12943361/Architecture+EPMCDMETST-63008
- HLD: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12976129/HLD+EPMCDMETST-63008
- LLD: https://epam-team-qucnxcim.atlassian.net/wiki/spaces/~712020fd7c84af4994406f8a7d7fb120cebee3/pages/12484610/LLD+EPMCDMETST-63008

---

## Testing

### Backend (pytest)

- Preferred: `bash app/scripts/test-backend.sh`
- Or (fallback): `pytest`

### Frontend build

From `app/client/`:
- Preferred: `bash ../scripts/build-frontend.sh`
- Or (fallback): `npm run build`

### End-to-end tests (Playwright)

From `app/client/` (or wherever Playwright is configured in this repo):
- Preferred: `bash ../scripts/test-e2e.sh`
- Or (fallback):
  - `npx playwright install`
  - `npx playwright test`

---

## Deployment summary (local)

This repo is designed for local development and workshop-style CI/CD exercises.

A typical local “deployment” looks like:

1. Start backend API (Flask) on `http://localhost:5100`
2. Start frontend (Astro) on `http://localhost:4321` (default Astro port)
3. Ensure the frontend is configured to call the backend API base URL (environment/config depends on your branch)

If scripts exist under `app/scripts` for running both services together, prefer those for repeatable setup:
- `bash app/scripts/start-app.sh`
- (Optional) `bash app/scripts/start-backend.sh`
- (Optional) `bash app/scripts/start-frontend.sh`
- (Optional) `bash app/scripts/dev.sh` (if present)