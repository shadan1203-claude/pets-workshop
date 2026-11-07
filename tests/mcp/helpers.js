export function captureTools(register) {
  const tools = new Map();
  const server = {
    registerTool(name, config, handler) {
      tools.set(name, { name, config, handler });
    },
  };
  register(server);
  return tools;
}

export function mockApi(responses = []) {
  const calls = [];
  return {
    calls,
    async request(method, path, options = {}) {
      calls.push({ method, path, options });
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response ?? {};
    },
  };
}

export function unauthorizedFetch() {
  return async () => ({
    ok: false,
    status: 401,
    async text() {
      return '{"message":"unauthorized"}';
    },
  });
}