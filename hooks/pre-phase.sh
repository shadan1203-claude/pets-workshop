#!/usr/bin/env bash

set -eu

# Validate one requested SDLC phase before its owning command or agent runs.
# State aliases support the requested jiraKey/currentPhase schema and this
# repository's workflowId/currentStage schema.

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd -P)
REPO_ROOT=$(CDPATH= cd "$SCRIPT_DIR/.." && pwd -P)
STATE_FILE="$REPO_ROOT/workflow/workflow-state.json"
RESOLVER="$REPO_ROOT/workflow/artifact-paths.js"

STATE_JIRA_ID=
STATE_PHASE=
STATE_STATUS=
JIRA_ID_VALUE=
CURRENT_PHASE_VALUE=

fail() {
    printf '❌ Phase Validation Failed\n❌ %s\n' "$1" >&2
    exit 1
}

load_workflow_state() {
    if [ ! -f "$STATE_FILE" ] || [ ! -r "$STATE_FILE" ]; then
        fail "Workflow state is missing or unreadable: $STATE_FILE"
    fi

    if ! command -v node >/dev/null 2>&1; then
        fail "Required runtime 'node' is unavailable for workflow state parsing."
    fi

    if ! state_summary=$(PHASE_STATE_FILE="$STATE_FILE" node -e '
        const fs = require("node:fs");
        const state = JSON.parse(fs.readFileSync(process.env.PHASE_STATE_FILE, "utf8"));
        const text = (value) => typeof value === "string" && value.length > 0;
        const jira = text(state.jiraKey) ? state.jiraKey : (text(state.workflowId) ? state.workflowId : "");
        const phase = text(state.currentPhase) ? state.currentPhase : (text(state.currentStage) ? state.currentStage : "");
        const status = text(state.status) ? state.status : "";
        const initial = !jira && phase === "NOT_STARTED" && status === "NOT_STARTED";
        const objectOrNull = (value) => value == null || (typeof value === "object" && !Array.isArray(value));
        const arrayOrNull = (value) => value == null || Array.isArray(value);
        if (!state || typeof state !== "object" || Array.isArray(state) || !phase || !status || (!jira && !initial)) process.exit(2);
        if (!objectOrNull(state.approvals) || !arrayOrNull(state.approvedStages) || !arrayOrNull(state.decisions)) process.exit(2);
        if (!objectOrNull(state.artifacts) || !arrayOrNull(state.risks) || !arrayOrNull(state.blockers)) process.exit(2);
        if (/[\t\r\n]/.test(jira + phase + status)) process.exit(2);
        process.stdout.write([jira, phase, status].join("\t"));
    ' 2>&1); then
        fail "Workflow state is corrupted or missing required fields: $state_summary"
    fi

    tab=$(printf '\t')
    STATE_JIRA_ID=${state_summary%%"$tab"*}
    state_rest=${state_summary#*"$tab"}
    STATE_PHASE=${state_rest%%"$tab"*}
    STATE_STATUS=$(printf '%s' "${state_rest#*"$tab"}" | tr '[:upper:]' '[:lower:]')
}

load_jira() {
    if [ -n "${JIRA_ID:-}" ]; then
        JIRA_ID_VALUE=$JIRA_ID
    elif [ -n "$STATE_JIRA_ID" ]; then
        JIRA_ID_VALUE=$STATE_JIRA_ID
    else
        fail "No Jira ID found. Set JIRA_ID or bind workflow state to a verified Jira issue."
    fi

    case "$JIRA_ID_VALUE" in
        *[!A-Za-z0-9-]* | "")
            fail "Jira ID contains unsafe path characters: $JIRA_ID_VALUE"
            ;;
    esac

    if [ -n "$STATE_JIRA_ID" ] && [ "$STATE_JIRA_ID" != "$JIRA_ID_VALUE" ]; then
        fail "Jira ID mismatch: environment has $JIRA_ID_VALUE but workflow state has $STATE_JIRA_ID"
    fi

    # Permit the repository's empty initial state to bootstrap Intake only
    # when an explicit JIRA_ID is supplied. No other unbound state is valid.
    if [ -z "$STATE_JIRA_ID" ]; then
        if [ -z "${JIRA_ID:-}" ] || [ "$STATE_PHASE" != "NOT_STARTED" ] || [ "$STATE_STATUS" != "not_started" ]; then
            fail "Workflow state is not bound to Jira $JIRA_ID_VALUE"
        fi
    fi
}

phase_number() {
    case "$1" in
        intake) printf '0' ;;
        requirements) printf '1' ;;
        architecture) printf '2' ;;
        design-review) printf '3' ;;
        api-design) printf '4' ;;
        planning) printf '5' ;;
        testing-design) printf '6' ;;
        development) printf '7' ;;
        code-review) printf '8' ;;
        testing-execution) printf '9' ;;
        pr-generation) printf '10' ;;
        deployment) printf '11' ;;
        closure) printf '12' ;;
        *) return 1 ;;
    esac
}

validate_phase_sequence() {
    if [ -z "${CURRENT_PHASE:-}" ]; then
        fail "CURRENT_PHASE is required."
    fi

    CURRENT_PHASE_VALUE=$(printf '%s' "$CURRENT_PHASE" | tr '[:upper:]' '[:lower:]')
    REQUESTED_INDEX=$(phase_number "$CURRENT_PHASE_VALUE") || fail "Invalid phase: $CURRENT_PHASE"

    case "$STATE_STATUS" in
        blocked | failed | cancelled | closed | complete | completed)
            fail "Workflow status is $STATE_STATUS; resolve or explicitly reopen it before starting a phase."
            ;;
    esac

    STATE_PHASE_NORMALIZED=$(printf '%s' "$STATE_PHASE" | tr '[:upper:]' '[:lower:]')
    if [ "$STATE_PHASE_NORMALIZED" = "not_started" ]; then
        if [ "$CURRENT_PHASE_VALUE" != "intake" ]; then
            fail "Invalid phase transition: NOT_STARTED -> $CURRENT_PHASE_VALUE. Intake must start the workflow."
        fi
        return
    fi

    STATE_INDEX=$(phase_number "$STATE_PHASE_NORMALIZED") || fail "Invalid current phase in workflow state: $STATE_PHASE"

    if [ "$REQUESTED_INDEX" -eq "$STATE_INDEX" ]; then
        case "$STATE_STATUS" in
            in_progress | awaiting_approval) return ;;
            *) fail "Phase $CURRENT_PHASE_VALUE cannot be resumed while workflow status is $STATE_STATUS." ;;
        esac
    fi

    NEXT_INDEX=$((STATE_INDEX + 1))
    if [ "$REQUESTED_INDEX" -ne "$NEXT_INDEX" ]; then
        fail "Invalid phase transition: $STATE_PHASE_NORMALIZED -> $CURRENT_PHASE_VALUE. Phases cannot be skipped or run out of order."
    fi

    case "$STATE_STATUS" in
        completed | awaiting_approval) ;;
        *) fail "Cannot start $CURRENT_PHASE_VALUE while prior phase $STATE_PHASE_NORMALIZED has status $STATE_STATUS." ;;
    esac
}

approval_alias() {
    case "$1" in
        intake) printf 'intake-approval' ;;
        requirements) printf 'requirements-approval' ;;
        architecture) printf 'architecture-approval' ;;
        design-review) printf 'design-review-approval' ;;
        api-design) printf 'api-design-approval' ;;
        planning) printf 'planning-approval' ;;
        testing-design) printf 'testing-design-approval' ;;
        development) printf 'development-readiness' ;;
        code-review) printf 'code-review-approval' ;;
        testing-execution) printf 'testing' ;;
        pr-generation) printf 'pr' ;;
        deployment) printf 'deployment-approval' ;;
        closure) printf 'closure-approval' ;;
        *) printf '%s' "$1" ;;
    esac
}

approval_label() {
    case "$1" in
        intake) printf 'Intake' ;;
        requirements) printf 'Requirements' ;;
        architecture) printf 'Architecture' ;;
        design-review) printf 'Design Review' ;;
        api-design) printf 'API Design' ;;
        planning) printf 'Planning' ;;
        testing-design) printf 'Testing Design' ;;
        development) printf 'Development Readiness' ;;
        code-review) printf 'Code Review' ;;
        testing-execution) printf 'Testing' ;;
        pr-generation) printf 'PR' ;;
        deployment) printf 'Deployment' ;;
        closure) printf 'Closure' ;;
        *) printf '%s' "$1" ;;
    esac
}

approval_is_recorded() {
    gate=$1
    alias=$2

        node -e '
                const fs = require("node:fs");
                const [file, gate, alias] = process.argv.slice(1);
                const state = JSON.parse(fs.readFileSync(file, "utf8"));
                const norm = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
                const approved = (value) => {
                    if (value === true) return true;
                    if (typeof value === "string") return ["approved", "approve"].includes(norm(value));
                    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
                    return value.approved === true || [value.status, value.outcome, value.decision].some(approved);
                };
                const matches = (entry) => {
                    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
                    const name = norm(entry.gate || entry.phase || entry.stage || entry.name);
                    return name === gate || name === alias;
                };
                const approvals = state.approvals;
                let found = false;
                if (approvals && !Array.isArray(approvals) && typeof approvals === "object") {
                    found = approved(approvals[gate]) || approved(approvals[alias]);
                } else if (Array.isArray(approvals)) {
                    found = approvals.some((entry) => matches(entry) && approved(entry));
                }
                if (!found && Array.isArray(state.approvedStages)) {
                    found = state.approvedStages.some((stage) => [gate, alias].includes(norm(stage)));
                }
                if (!found && Array.isArray(state.decisions)) {
                    found = state.decisions.some((entry) => matches(entry)
                        && typeof (entry.approver || entry.approvedBy) === "string"
                        && (entry.approver || entry.approvedBy).trim().length > 0
                        && approved(entry.outcome || entry.status || entry.decision));
                }
                process.exit(found ? 0 : 1);
        ' "$STATE_FILE" "$gate" "$alias" >/dev/null 2>&1
}

require_approval() {
    gate=$1
    alias=$(approval_alias "$gate")
    label=$(approval_label "$gate")

    if ! approval_is_recorded "$gate" "$alias"; then
        printf '❌ Phase Validation Failed\n❌ Approval Missing: %s\nStatus:\nAWAITING_APPROVAL\n' "$label" >&2
        exit 1
    fi
}

validate_deployment_scope() {
    if [ -z "${DEPLOYMENT_TARGET:-}" ] || [ -z "${DEPLOYMENT_VERSION:-}" ]; then
        printf '❌ Phase Validation Failed\n❌ Approval Missing: Deployment approval must name DEPLOYMENT_TARGET and DEPLOYMENT_VERSION\nStatus:\nAWAITING_APPROVAL\n' >&2
        exit 1
    fi

        if ! node -e '
                const fs = require("node:fs");
                const [file, target, version] = process.argv.slice(1);
                const state = JSON.parse(fs.readFileSync(file, "utf8"));
                const norm = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
                const approved = (value) => {
                    if (value === true) return true;
                    if (typeof value === "string") return ["approved", "approve"].includes(norm(value));
                    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
                    return value.approved === true || [value.status, value.outcome, value.decision].some(approved);
                };
                const scopedApproval = (entry) => entry && typeof entry === "object"
                    && entry.target === target && entry.version === version && approved(entry);
                const matchesDeployment = (entry) => entry && typeof entry === "object"
                    && ["deployment", "deployment-approval"].includes(norm(entry.gate || entry.phase || entry.stage || entry.name));
                const approvals = state.approvals;
                let found = false;
                if (approvals && !Array.isArray(approvals) && typeof approvals === "object") {
                    found = scopedApproval(approvals.deployment) || scopedApproval(approvals["deployment-approval"]);
                } else if (Array.isArray(approvals)) {
                    found = approvals.some((entry) => matchesDeployment(entry) && scopedApproval(entry));
                }
                if (!found && Array.isArray(state.decisions)) {
                    found = state.decisions.some((entry) => matchesDeployment(entry)
                        && typeof (entry.approver || entry.approvedBy) === "string"
                        && (entry.approver || entry.approvedBy).trim().length > 0
                        && scopedApproval(entry));
                }
                process.exit(found ? 0 : 1);
        ' "$STATE_FILE" "$DEPLOYMENT_TARGET" "$DEPLOYMENT_VERSION" >/dev/null 2>&1; then
        printf '❌ Phase Validation Failed\n❌ Approval Missing: No explicit approval for target %s, version %s\nStatus:\nAWAITING_APPROVAL\n' "$DEPLOYMENT_TARGET" "$DEPLOYMENT_VERSION" >&2
        exit 1
    fi
}

validate_approvals() {
    approval_gates=

    case "$CURRENT_PHASE_VALUE" in
        intake) approval_gates= ;;
        requirements) approval_gates='intake' ;;
        architecture) approval_gates='requirements' ;;
        design-review) approval_gates='architecture' ;;
        api-design) approval_gates='design-review' ;;
        planning) approval_gates='design-review' ;;
        testing-design) approval_gates='planning' ;;
        development) approval_gates='testing-design' ;;
        code-review) approval_gates='development' ;;
        testing-execution) approval_gates='code-review' ;;
        pr-generation) approval_gates='testing-execution' ;;
        deployment) approval_gates='pr-generation deployment' ;;
        closure) approval_gates='deployment closure' ;;
    esac

    for gate in $approval_gates; do
        require_approval "$gate"
    done

    if [ "$CURRENT_PHASE_VALUE" = "deployment" ]; then
        validate_deployment_scope
    fi
}

resolve_artifact() {
    artifact_key=$1

    if [ ! -f "$RESOLVER" ]; then
        fail "Artifact resolver is missing: $RESOLVER"
    fi
    if ! command -v node >/dev/null 2>&1; then
        fail "Required runtime 'node' is unavailable for artifact path resolution."
    fi

    if ! resolved=$(node "$RESOLVER" path --jira-id "$JIRA_ID_VALUE" --artifact "$artifact_key" 2>&1); then
        fail "Artifact resolver failed for '$artifact_key': $resolved"
    fi
    if [ -z "$resolved" ]; then
        fail "Artifact resolver returned an empty path for '$artifact_key'."
    fi

    line_count=$(printf '%s\n' "$resolved" | wc -l | tr -d ' ')
    if [ "$line_count" -ne 1 ]; then
        fail "Artifact resolver returned more than one path for '$artifact_key'."
    fi

    ARTIFACT_PATH=$resolved
}

validate_one_artifact() {
    artifact_key=$1
    area=$2
    filename=$3
    expected_relative="$area/$JIRA_ID_VALUE/$filename"

    resolve_artifact "$artifact_key"

    case "$ARTIFACT_PATH" in
        "$expected_relative") candidate="$REPO_ROOT/$ARTIFACT_PATH" ;;
        "$REPO_ROOT/$expected_relative") candidate=$ARTIFACT_PATH ;;
        *) fail "Unsafe or unexpected resolver path for '$artifact_key': $ARTIFACT_PATH" ;;
    esac

    case "/$ARTIFACT_PATH/" in
        *"/../"*) fail "Artifact resolver returned a traversal path: $ARTIFACT_PATH" ;;
    esac

    if [ ! -f "$candidate" ] || [ ! -s "$candidate" ]; then
        missing_artifacts="${missing_artifacts}${candidate}|"
        return
    fi

    if [ -L "$candidate" ]; then
        fail "Artifact path must not be a symbolic link: $candidate"
    fi

    if [ ! -d "$REPO_ROOT/$area/$JIRA_ID_VALUE" ] || [ -L "$REPO_ROOT/$area/$JIRA_ID_VALUE" ]; then
        fail "Jira artifact directory is missing or unsafe: $REPO_ROOT/$area/$JIRA_ID_VALUE"
    fi

    artifact_parent=$(CDPATH= cd "$(dirname "$candidate")" && pwd -P) || fail "Cannot resolve artifact directory: $candidate"
    expected_parent=$(CDPATH= cd "$REPO_ROOT/$area/$JIRA_ID_VALUE" && pwd -P) || fail "Cannot resolve Jira artifact directory."
    case "$expected_parent/" in
        "$REPO_ROOT/$area/"*) ;;
        *) fail "Jira artifact directory resolves outside the repository: $expected_parent" ;;
    esac
    if [ "$artifact_parent" != "$expected_parent" ]; then
        fail "Artifact resolves outside its Jira-scoped directory: $candidate"
    fi

    found_artifacts=$((found_artifacts + 1))
}

validate_artifacts() {
    missing_artifacts=
    found_artifacts=0

    case "$CURRENT_PHASE_VALUE" in
        intake | requirements) required_artifacts= ;;
        architecture) required_artifacts='requirements|docs|requirements.md' ;;
        design-review) required_artifacts='requirements|docs|requirements.md architecture|docs|architecture.md' ;;
        api-design) required_artifacts='requirements|docs|requirements.md architecture|docs|architecture.md design-review|docs|design-review.md' ;;
        planning) required_artifacts='requirements|docs|requirements.md architecture|docs|architecture.md design-review|docs|design-review.md api-design|docs|api-design.md' ;;
        testing-design) required_artifacts='requirements|docs|requirements.md architecture|docs|architecture.md implementation-plan|docs|implementation-plan.md' ;;
        development) required_artifacts='requirements|docs|requirements.md architecture|docs|architecture.md design-review|docs|design-review.md api-design|docs|api-design.md implementation-plan|docs|implementation-plan.md test-cases|docs|test-cases.md tasks-test|tests|tasks.test.js' ;;
        code-review) required_artifacts='development-report|docs|development-report.md' ;;
        testing-execution) required_artifacts='code-review|docs|code-review.md test-cases|docs|test-cases.md tasks-test|tests|tasks.test.js' ;;
        pr-generation) required_artifacts='testing|docs|testing.md' ;;
        deployment) required_artifacts='pr-description|docs|pr-description.md' ;;
        closure) required_artifacts='deployment|docs|deployment.md deployment-validation|docs|deployment-validation.md' ;;
    esac

    for artifact_spec in $required_artifacts; do
        artifact_key=${artifact_spec%%|*}
        artifact_rest=${artifact_spec#*|}
        area=${artifact_rest%%|*}
        filename=${artifact_rest#*|}
        validate_one_artifact "$artifact_key" "$area" "$filename"
    done

    if [ -n "$missing_artifacts" ]; then
        printf '❌ Phase Validation Failed\n❌ Missing Artifact:\n' >&2
        printf '%s' "$missing_artifacts" | tr '|' '\012' >&2
        exit 1
    fi
}

load_workflow_state
load_jira
validate_phase_sequence
validate_approvals
validate_artifacts

printf '✅ Phase Validation Passed\n'
printf '✅ Jira: %s\n' "$JIRA_ID_VALUE"
printf '✅ Phase: %s\n' "$CURRENT_PHASE_VALUE"
printf '✅ Required Artifacts Found: %s\n' "$found_artifacts"
printf '✅ Required Approvals Found\n'