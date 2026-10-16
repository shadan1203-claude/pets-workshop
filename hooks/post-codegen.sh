#!/bin/bash

set -eu

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if command -v py >/dev/null 2>&1; then
    PYTHON=py
elif command -v python3 >/dev/null 2>&1; then
    PYTHON=python3
elif command -v python >/dev/null 2>&1; then
    PYTHON=python
else
    echo "Python interpreter not found (tried py, python3, python)" >&2
    exit 1
fi

(
    cd "$REPO_ROOT/app/client"
    npm run build
)

(
    cd "$REPO_ROOT/app/server"
    "$PYTHON" -m unittest -v test_app.py test_breed_search.py
)