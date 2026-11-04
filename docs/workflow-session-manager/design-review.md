# Per-Agent Workflow Session Manager Design Review

## Scope and traceability

Reviewed the architecture against
[`requirements.md`](./requirements.md), including the eight-agent allowlist,
per-agent file mapping, JSON schema, synchronous API, validation, and
non-destructive behavior. This review covers local persistence only; it does
not approve agent dispatch, deployment, or multi-process use.

## Findings

| Area | Severity | Assessment |
| --- | --- | --- |
| Security | Low | The fixed agent allowlist prevents caller-controlled path traversal. JSON files are unencrypted and inherit local filesystem permissions; secrets must not be stored. |
| Reliability | Low | Schema validation and same-directory temporary-file rename reduce silent corruption and partial-write exposure. Existing malformed state is not overwritten. Concurrent processes are not coordinated. |
| Performance | Low | Synchronous local filesystem operations are small and bounded for eight records. They can block an event loop if used at higher scale. No measured latency target is available. |
| Scalability | Low | The design is intentionally fixed to eight agents and local files. Distributed/shared use, retention, and high-volume state require a separately approved design. |
| Maintainability | Low | The public API and schema are small, explicit, documented, and testable without new dependencies. |
| Observability | Low | Filesystem failures are logged and surfaced. No metrics, tracing, or operational monitoring is included. |

## Design decision

**Approved for the requested local per-agent session scope.** The fixed-name
allowlist, data validation, non-destructive creation, and atomic replacement
address the primary correctness and filesystem risks. Conditions:

1. Do not store credentials or secrets in session records.
2. Do not claim safe multi-process coordination; concurrent writers may
   overwrite one another.
3. Preserve malformed session files for diagnosis and report the failure.
4. Replace the former workflow-level API only alongside its test and example
   updates so repository guidance matches the new contract.

No Critical or High design findings remain. Encryption, file locking, and
performance targets are not requirements for this local demonstration and
remain outside scope.
