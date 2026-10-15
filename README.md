# Pets workshop 

This repository contains the project for three guided workshops to explore various GitHub features. The project is a website for a fictional dog shelter, with a [Flask](https://flask.palletsprojects.com/en/stable/) backend using [SQLAlchemy](https://www.sqlalchemy.org/) and an [Astro](https://astro.build/) frontend using [Tailwind CSS](https://tailwindcss.com/).

The available workshops are:

- **[One hour](./content/1-hour/README.md)** — focused on GitHub Copilot
- **[Full-day](./content/full-day/README.md)** — a full day-in-the-life of a developer using GitHub for their DevOps processes
- **[GitHub Actions](./content/github-actions/README.md)** — CI/CD pipelines from running tests to deploying to Azure

## Getting started

> **[Get started learning about development with GitHub!](./content/README.md)**

## API

The Flask backend (`app/server`) exposes the following endpoints:

- `GET /api/dogs` — returns a paginated list of dogs. Supports optional query params:
  - `page` (default `1`), `per_page` (default `6`, max `100`)
  - `name` — case-insensitive partial match on the dog's name (max 100 characters)
  - `breed` — case-insensitive exact match on the breed name (max 100 characters); `category` is accepted as an alias
  - Filters are applied before pagination, so `total` and `total_pages` reflect the filtered results. The response shape is always `{dogs, page, per_page, total, total_pages}`.
  - Values longer than 100 characters return `400` with `{"error": ...}`. An unknown breed returns `200` with an empty `dogs` list.
- `GET /api/dogs/<id>` — returns details for a single dog.
- `GET /api/breeds` — returns `{"breeds": [{"id", "name"}, ...]}` ordered alphabetically (used to populate the category filter).

The homepage (`app/client`) uses `name` and `breed` to power an instant search/filter experience without a full page reload (name input is debounced by 300ms, and in-flight requests are cancelled with `AbortController` so stale responses never overwrite newer ones; filters are kept in the URL and a "Clear filters" button resets them), while keeping server-side pagination and a no-JS fallback via standard form submission.

## Running locally

**Easiest option (from the repo root, `app/scripts`):**

```sh
# macOS/Linux
./app/scripts/seed-database.sh   # seed the SQLite database (idempotent)
./app/scripts/start-app.sh        # starts Flask (http://localhost:5100) and Astro (http://localhost:4321)
```

```powershell
# Windows
./app/scripts/seed-database.ps1
./app/scripts/start-app.ps1
```

**Manual option, running each service yourself:**

1. Backend (Flask), from `app/server`:
   ```sh
   python -m venv venv && . venv/bin/activate   # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   python utils/seed_database.py                # seed dogshelter.db
   python app.py                                 # serves http://localhost:5100
   ```
2. Frontend (Astro), from `app/client`, in a second terminal:
   ```sh
   npm install
   npm run dev                                   # serves http://localhost:4321
   ```

The Astro dev server reads `API_SERVER_URL` (defaults to `http://localhost:5100`) to reach the Flask API for its server-side rendering and for the `/api/dogs` proxy route used by the instant search script. Visit `http://localhost:4321` to use the app.

**Running the tests locally:**

```sh
cd app/server && python -m unittest        # backend unit tests
cd app/client && npx playwright test       # end-to-end tests (seeds a test DB and starts both servers automatically)
```

## License 

This project is licensed under the terms of the MIT open source license. Please refer to the [LICENSE](./LICENSE) for the full terms.

## Maintainers 

You can find the list of maintainers in [CODEOWNERS](./.github/CODEOWNERS).

## Support

This project is provided as-is, and may be updated over time. If you have questions, please open an issue.
