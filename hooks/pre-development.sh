#!/bin/bash

set -eu

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

echo "Checking prerequisites"

for file in \
    docs/breed-search/requirements.md \
    docs/breed-search/architecture.md \
    docs/breed-search/api-design.md \
    docs/breed-search/implementation-plan.md
do
    if [ ! -f "$REPO_ROOT/$file" ]; then
        echo "Missing prerequisite: $REPO_ROOT/$file" >&2
        exit 1
    fi
done

echo "All prerequisite artifacts found"