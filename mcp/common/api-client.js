export class ApiError extends Error {
  constructor(status, method, pathname) {
    const reason = status === 401 || status === 403
      ? "Authentication or permission check failed"
      : `HTTP ${status}`;
    super(`${reason} for ${method} ${pathname}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export function createApiClient({ baseUrl, authorization, userAgent, apiVersion, fetchImpl = globalThis.fetch, timeoutMs = 20000 }) {
  if (typeof fetchImpl !== "function") throw new Error("Node.js fetch is required");
  if (!baseUrl || !authorization) throw new Error("API base URL and authorization are required");
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    async request(method, endpoint, { query, body, headers = {} } = {}) {
      const url = new URL(endpoint.replace(/^\/+/, ""), normalizedBase);
      for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const requestHeaders = {
        Accept: "application/json",
        Authorization: authorization,
        "User-Agent": userAgent,
        ...headers,
      };
      if (apiVersion) requestHeaders["X-GitHub-Api-Version"] = apiVersion;
      if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

      try {
        const response = await fetchImpl(url, {
          method,
          headers: requestHeaders,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
        const text = await response.text();
        let data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            if (response.ok) throw new Error(`API returned non-JSON data for ${method} ${url.pathname}`);
          }
        }
        if (!response.ok) throw new ApiError(response.status, method, url.pathname);
        return data;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error?.name === "AbortError") {
          throw new Error(`API request timed out for ${method} ${url.pathname}`);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}