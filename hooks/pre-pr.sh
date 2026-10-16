#!/bin/bash

set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

(
    cd "$REPO_ROOT/app/client"
    npm test
)

cd "$REPO_ROOT"
npm audit --prefix "$REPO_ROOT/app/client"