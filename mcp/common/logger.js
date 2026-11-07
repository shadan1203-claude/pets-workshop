function write(level, server, message, metadata = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    server,
    message,
    ...metadata,
  };
  process.stderr.write(`${JSON.stringify(record)}\n`);
}

export function createLogger(server) {
  return {
    info: (message, metadata) => write("info", server, message, metadata),
    warn: (message, metadata) => write("warn", server, message, metadata),
    error: (message, metadata) => write("error", server, message, metadata),
  };
}