---
mode: agent
---

# Automated Documentation Sync for pets-workshop

Use this workflow only for the approved Automated Documentation Sync architecture for pets-workshop. Do not modify application source code.

## Goal

Review the project’s source of truth, identify documentation-relevant facts, update only the approved technical documentation subset, and validate the documentation before finishing.

## Required behavior

1. Inspect the source of truth first.
   - Read the relevant implementation files in the repository.
   - Focus on the approved technical sources such as:
     - `app/server/app.py`
     - `app/server/models/`
     - `app/server/utils/`
     - `app/client/src/`
     - `app/client/e2e-tests/`
     - `README.md`, `architecture.md`, `design-review.md`, and `impl-plan.md`
   - Use the repository manifest or approved scope to determine what files are in scope.

2. Identify documentation changes.
   - Determine what documentation is technically relevant to the actual source implementation.
   - Ignore unrelated code, features, or workshop content that are outside the approved technical documentation scope.
   - Only propose changes to the approved documentation subset.

3. Update only approved documentation.
   - Do not change application runtime code.
   - Do not modify unrelated files.
   - Do not update workshop or educational content that is outside the approved sync scope.
   - Keep edits focused on documentation only.

4. Determine the source of truth.
   - Prefer direct source code and executable tests as the source of truth.
   - Use design artifacts only as supporting evidence when already validated by the repository.
   - Do not rely on guesswork or assumptions.

5. Never invent missing information.
   - If the project does not contain clear evidence, do not guess.
   - Mark the information as `Not Found`.
   - Use the required format:
     - `Status: Not Found`
     - `Notes: No evidence found in the repository for this behavior.`
     - `Evidence: Not Found`

6. Never expose secrets.
   - Do not include credentials, tokens, API keys, connection strings, or other sensitive values in documentation or logs.
   - If the repo contains sensitive material, do not reproduce it.

7. Validate generated documentation.
   - Confirm the statements are supported by source evidence.
   - Confirm the content is still within the approved documentation scope.
   - Confirm missing facts are marked as `Not Found` rather than guessed.
   - Confirm no unrelated files were touched.

8. Summarize changes.
   - Provide a brief summary of the documentation files changed.
   - Explain what evidence was used.
   - Call out any sections intentionally left as `Not Found`.

9. Report failures clearly.
   - If validation fails, describe the reason.
   - If evidence is missing or contradictory, report it explicitly.
   - If a file or section is out of scope, call that out and avoid changing it.

## Safety rules

- Do not modify application code.
- Do not touch unrelated files.
- Do not invent undocumented behavior.
- Do not expose secrets.
- Do not treat narrative workshop content as authoritative technical documentation.
- Do not proceed when evidence is missing and a valid `Not Found` statement cannot be used.

## Completion standard

The workflow is complete only when:

- the approved documentation subset has been updated only where evidence supports the change
- missing details are marked as `Not Found`
- validation has been run
- the summary clearly states what changed and whether any validation or evidence issues remain
- no application source code was modified
