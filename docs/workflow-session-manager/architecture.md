# Per-Agent Workflow Session Manager Architecture

## Components

- `SessionManager`: synchronous CommonJS class in `workflow/session-manager.js`.
- Node.js `fs`: creates directories, reads session JSON, writes temporary files,
  and atomically renames completed files.
- Node.js `crypto`: creates unique session IDs and temporary-file suffixes.
- `workflow/sessions/`: default local persistence directory with one
  `<agent>-session.json` file for each allowlisted agent.
- `workflow/session-manager.test.js`: dependency-free tests using isolated
  temporary directories.

The constructor optionally accepts a sessions directory for testing. The
default resolves relative to the module, so its storage location is stable
regardless of the caller's current working directory.

## Data flow

1. Constructing the manager creates the storage directory and initializes each
   missing allowlisted agent file with a unique session ID and the required
   default schema.
2. A public method validates the agent against the fixed allowlist before
   deriving its filename.
3. Reads parse and validate the on-disk JSON. Invalid existing content is
   reported and left untouched.
4. Mutations load the current record, apply the requested change, refresh
   `lastUpdated`, validate the complete record, and write formatted JSON to a
   uniquely named temporary file in the same directory.
5. A rename replaces the target session file. Returned values are deep copies
   so callers cannot mutate the manager's persisted state by reference.
6. `listSessions()` loads and returns all eight records in the fixed allowlist
   order; it does not dispatch agents or advance workflow gates.

## Security

- Agent names are checked against a closed list before filesystem paths are
  constructed; untrusted path fragments are never used as filenames.
- JSON schema and record values are validated before persistence. Filesystem
  and persisted-data failures are logged and rethrown with operation context;
  invalid caller arguments raise explicit validation errors.
- Session files are plain local JSON and inherit operating-system directory
  permissions. Encryption, access-control policy, and secret management are
  not implemented. Callers must not store credentials or secrets in records.
- Same-directory temporary writes and rename reduce exposure to partial files;
  they do not provide cross-process locking or protection against all storage
  failures.

## Reliability, performance, and scalability

- Malformed or unreadable files fail explicitly; the manager does not silently
  reset them.
- Writes use a temporary file and rename, and the manager does not claim
  multi-process transaction guarantees.
- Synchronous filesystem I/O is appropriate for the fixed set of eight small
  local records in this demonstration. It can block the Node.js event loop if
  records or call frequency grow substantially.
- Storage grows linearly with the fixed agent count. Concurrent writers,
  distributed storage, retention policy, and high-volume operation are outside
  the documented scope.
- No benchmark, latency, availability, or recovery-time target was supplied;
  those are **Not Found**.

## Constraints

- CommonJS and Node.js `>=16`, matching `package.json`.
- No new dependency, application service, HTTP API, database, agent execution,
  or human-approval enforcement.
- Session status is a non-empty string to allow workflow-specific statuses;
  the initial value is `NOT_STARTED`.
