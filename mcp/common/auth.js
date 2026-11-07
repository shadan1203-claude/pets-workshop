export function basicAuthorization(username, token) {
  if (!username?.trim() || !token?.trim()) {
    throw new Error("Basic authentication requires a username and token");
  }
  return `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`;
}

export function bearerAuthorization(token) {
  if (!token?.trim()) throw new Error("Bearer authentication requires a token");
  return `Bearer ${token}`;
}