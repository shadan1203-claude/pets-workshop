#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    printf 'Secret scan failed: repository root was not found.\n' >&2
    exit 2
fi

findings=0
scanned_files=0

while IFS= read -r -d '' file; do
    scanned_files=1

    if ! file_findings="$(
        git -C "$REPO_ROOT" show ":$file" |
            awk -v file="$file" '
                function is_reference(value) {
                    return value ~ /^\$\{[^}]*\}/ || value ~ /^\$\{\{.*\}\}/ || value ~ /^\$[[:alnum:]_]+/ || value ~ /^process\.env\./ || value ~ /^os\.getenv[[:space:]]*\(/
                }
                BEGIN {
                    pattern = "[[:alnum:]_]*(api_key|api_token|secret|password)[[:alnum:]_]*[[:space:]]*[:=]"
                }
                {
                    original = $0
                    lower = tolower($0)
                    offset = 1

                    while (offset <= length(lower) && match(substr(lower, offset), pattern)) {
                        start = offset + RSTART - 1
                        end = start + RLENGTH - 1
                        variable = substr(original, start, RLENGTH)
                        sub(/[[:space:]]*[:=][[:space:]]*$/, "", variable)
                        value = substr(original, end + 1)
                        sub(/^[[:space:]]*/, "", value)
                        reference = is_reference(value)

                        if (substr(value, 1, 1) == "\"" || substr(value, 1, 1) == "\047" || substr(value, 1, 1) == "`") {
                            quote = substr(value, 1, 1)
                            value = substr(value, 2)
                            closing_quote = index(value, quote)
                            if (closing_quote > 0) {
                                value = substr(value, 1, closing_quote - 1)
                            }
                            reference = reference || is_reference(value)
                        } else if (!reference) {
                            sub(/[[:space:]#;,}].*$/, "", value)
                        }

                        if (!reference && value != "") {
                            printf "%s:%d: %s\n", file, FNR, variable
                        }

                        offset = end + 1
                    }
                }
            '
    )"; then
        printf 'Secret scan failed to read staged file: %s\n' "$file" >&2
        exit 2
    fi

    if [[ -n "$file_findings" ]]; then
        printf '%s\n' "$file_findings" >&2
        findings=1
    fi
done < <(git -C "$REPO_ROOT" diff --cached --name-only --diff-filter=ACMR -z)

if [[ "$scanned_files" -eq 0 ]]; then
    printf 'Secret scan passed: no staged files to scan.\n'
    exit 0
fi

if [[ "$findings" -ne 0 ]]; then
    printf 'Secret scan failed: remove credential values from staged files and provide them at runtime through environment variables.\n' >&2
    exit 1
fi

printf 'Secret scan passed: no credential assignments found in staged files.\n'
