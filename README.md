# Daily Game Challenge: frontend

The web app of Daily Game Challenge, a site of daily puzzle games. It is a single-page app built with Vite, React and TypeScript.

The backend is the `my-list-be` repo (FastAPI). The contract between the two is `CONTRACTS.md` in the folder that holds both repos.

## Install

```sh
npm ci
```

## Run

Start the backend first (see its README), then:

```sh
npm run dev
```

Open `http://localhost:5173`. Use `localhost`, not `127.0.0.1`, because the session cookie is host-scoped. The dev server forwards `/api` to the backend on `http://localhost:8000`.

## Check

```sh
npm run lint
npm run format:check
npm run build   # type check, then the production build
npm test
```

## End-to-end tests

Playwright smoke tests with axe, in `e2e/`. They start the backend and the dev server themselves, so stop your own dev servers on ports 8000 and 5173 first.

Once:

```sh
cd ../my-list-be && docker compose up -d && docker compose exec -T db createdb -U postgres daily_game_challenge_e2e
uv sync   # in ../my-list-be
npx playwright install chromium
```

Each run:

```sh
npm run e2e
```

The tests use the database `daily_game_challenge_e2e` and Redis db 2. If your Postgres or Redis is on other ports, set `E2E_DATABASE_URL` and `E2E_REDIS_URL`, for example `E2E_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5544/daily_game_challenge_e2e E2E_REDIS_URL=redis://localhost:6390/2 npm run e2e`. The backend log is in `.e2e/backend.log`, the report in `playwright-report/`.

## Regenerate the API client

```sh
npm run api:generate
```

This reads `../my-list-be/openapi/openapi.json` and rewrites `src/api/generated/`. Do not edit those files by hand.
