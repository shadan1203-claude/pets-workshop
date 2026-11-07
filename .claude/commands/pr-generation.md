---
description: Prepare a traceable PR description and create a GitHub pull request only after explicit approval.
argument-hint: [JIRA-KEY]
---

# PR Generation

Prepare the Jira-scoped pull-request description from completed, approved implementation and test evidence. Creating a GitHub PR is a separate externally visible action and requires explicit approval.

## Preconditions

1. Verify Jira key and workflow state. Require approved requirements, development, final code review, and testing, with no unresolved blocking findings or required test failures.
2. Resolve `requirements`, `development-report`, `code-review`, `testing`, and `pr-description` through `workflow/artifact-paths.js`; stop if resolver or inputs are missing.
3. Read `.claude/CLAUDE.md`, `.claude/agents/code-review.md`, and `.claude/skills/PR-generation/SKILL.md` (if present). Verify branch/diff and test evidence from repository/GitHub, not just narrative reports. Use GitHub MCP when available.

## Description

Create only the resolver-returned `pr-description` artifact, expected as `docs/<JIRA_ID>/pr-description.md`. Include:

- Jira key and verified issue link.
- Summary and changes made, each traceable to requirement/task IDs.
- Test evidence with exact executed commands and honest PASS/FAIL/NOT RUN status.
- Code-review outcome, known limitations, unresolved non-blocking risks, and deployment impact.
- Reviewer checklist, including acceptance criteria, security, regression, and rollback considerations.
- PR number and URL only after GitHub confirms the PR was created. Before creation use `Not Created` rather than a placeholder number or fabricated URL.

Validate links, IDs, evidence, and consistency against the final diff. Update workflow state with the artifact and `AWAITING_PR_APPROVAL`; do not mark a PR created from a draft artifact.

## Approval and GitHub action

Present the final description and ask for explicit human approval to create the PR. Approval to prepare text is not approval to create a PR. After approval, create via GitHub MCP if available; otherwise report that external creation is unavailable and do not simulate success. Confirm returned PR number, URL, repository, branch, and status. If creation fails or returns ambiguous data, record a blocker and do not invent identifiers. Update the Jira-scoped artifact with verified PR details and state with returned identifiers and timestamp.

## Example

`/pr-generation PET-123` first prepares the artifact. Only a separate clear response such as “Approve creating the PR” authorizes the GitHub creation call.