#!/bin/bash
# Blocking validation before `git commit` (exit code 2 blocks the tool call).

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT/app/client" || exit 2

if ! npm test; then
    echo "pre-commit: frontend/e2e tests failed; commit blocked." >&2
    exit 2
fi
