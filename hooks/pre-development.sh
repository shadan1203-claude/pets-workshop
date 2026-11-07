#!/bin/bash
# Verifies the Jira-scoped inputs exist before development starts.
# Jira ID comes from $JIRA_ID, or from workflow/workflow-state.json (workflowId).

set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
RESOLVER="$REPO_ROOT/workflow/artifact-paths.js"

fail() {
    echo "Pre-development validation failed: $1" >&2
    exit 1
}

JIRA="${JIRA_ID:-}"
if [ -z "$JIRA" ]; then
    JIRA=$(cd "$REPO_ROOT" && node -e 'try{const s=JSON.parse(require("fs").readFileSync("workflow/workflow-state.json","utf8"));process.stdout.write(typeof s.workflowId==="string"?s.workflowId:"")}catch{}')
fi
[ -n "$JIRA" ] || fail "no Jira ID (set JIRA_ID or bind workflow-state.json workflowId)"
[ -f "$RESOLVER" ] || fail "artifact resolver missing: $RESOLVER"

echo "Checking prerequisites for $JIRA"

for artifact in requirements architecture design-review api-design implementation-plan test-cases tasks-test; do
    rel=$(cd "$REPO_ROOT" && node workflow/artifact-paths.js path --jira-id "$JIRA" --artifact "$artifact") \
        || fail "resolver could not resolve '$artifact'"
    [ -f "$REPO_ROOT/$rel" ] || fail "missing prerequisite: $rel"
done

echo "Pre-development prerequisites present for $JIRA"
