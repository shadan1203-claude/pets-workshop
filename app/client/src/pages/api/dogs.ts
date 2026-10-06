import type { APIRoute } from 'astro';

export const prerender = false;

const API_SERVER_URL = process.env.API_SERVER_URL || 'http://localhost:5100';

// Proxies browser-side search requests to the Flask API so the instant
// search script can call a same-origin endpoint without hitting CORS.
export const GET: APIRoute = async ({ url }) => {
  try {
    const upstreamResponse = await fetch(`${API_SERVER_URL}/api/dogs${url.search}`);
    const body = await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to reach dog service: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
