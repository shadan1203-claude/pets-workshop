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

echo "Running client build..."

(
    cd "$REPO_ROOT/app/client"
    npm run build
)

echo "Running server tests..."

(
    cd "$REPO_ROOT/app/server"
    "$PYTHON" -m unittest -v test_app.py
)

echo "Validating Jira-scoped SDLC artifacts..."

if [ -z "${JIRA_ID:-}" ]; then
    echo "ERROR: JIRA_ID environment variable is not set." >&2
    exit 1
fi

DOCS_DIR="$REPO_ROOT/docs/$JIRA_ID"
TESTS_DIR="$REPO_ROOT/tests/$JIRA_ID"

required_files=(
    "$DOCS_DIR/requirements.md"
    "$DOCS_DIR/architecture.md"
    "$DOCS_DIR/design-review.md"
    "$DOCS_DIR/implementation-plan.md"
    "$DOCS_DIR/test-cases.md"
    "$DOCS_DIR/development-report.md"
    "$DOCS_DIR/code-review.md"
    "$DOCS_DIR/testing.md"
    "$DOCS_DIR/pr-description.md"
    "$TESTS_DIR/tasks.test.js"
)

missing=0

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required artifact: $file" >&2
        missing=1
    else
        echo "✅ Found: $file"
    fi
done

if [ "$missing" -ne 0 ]; then
    echo ""
    echo "SDLC artifact validation failed." >&2
    echo "All mandatory Jira-scoped artifacts must exist before continuing." >&2
    exit 1
fi

echo ""
echo "✅ All mandatory SDLC artifacts are present."
echo "✅ Client build passed."
echo "✅ Server tests passed."
echo "✅ Post-codegen validation completed successfully."