#!/bin/bash

set -eu

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

echo "Checking prerequisites"

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required to resolve the Jira-specific artifact directory" >&2
    exit 1
fi

ARTIFACT_PATHS="$REPO_ROOT/workflow/artifact-paths.js"
if [ ! -f "$ARTIFACT_PATHS" ]; then
    echo "Missing Jira artifact resolver: $ARTIFACT_PATHS" >&2
    exit 1
fi

ARTIFACT_DIR="$(node "$ARTIFACT_PATHS" ensure)"
node "$ARTIFACT_PATHS" validate-stage pre-development >/dev/null

echo "Using Jira artifact directory: $ARTIFACT_DIR"
echo "All prerequisite artifacts found"