#!/bin/bash
# Blocking validation before `gh pr create` (exit code 2 blocks the tool call).

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

block() {
    echo "pre-pr: $1; pull request creation blocked." >&2
    exit 2
}

(cd "$REPO_ROOT/app/client" && npm test) || block "frontend/e2e tests failed"
(cd "$REPO_ROOT/app/client" && npm audit) || block "npm audit failed in app/client"
(cd "$REPO_ROOT" && npm audit) || block "npm audit failed at repository root"
