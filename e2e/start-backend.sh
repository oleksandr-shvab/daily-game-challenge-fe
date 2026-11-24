#!/usr/bin/env bash
# Starts the backend for the e2e suite: migrate, seed, serve. Playwright's webServer runs it with
# the settings of e2e/support/backend-env.ts. The server's output goes to .e2e/backend.log, where
# e2e/support/reset-link.ts reads the password reset link.
set -euo pipefail

frontend_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backend_dir="${BACKEND_DIR:-$frontend_root/../my-list-be}"

cd "$backend_dir"
uv run --no-sync alembic upgrade head
# seed_dev.py refuses to run when CI is set. Every other guard still applies: ENVIRONMENT must be
# local, the database must be on this machine and storage must be local.
CI= uv run --no-sync python scripts/seed_dev.py

mkdir -p "$frontend_root/.e2e"
exec uv run --no-sync uvicorn app.main:app --port 8000 > "$frontend_root/.e2e/backend.log" 2>&1
