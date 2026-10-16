// Cross-platform script to seed the test database and start the Flask server
import { execSync, spawn } from 'child_process';
import { createServer, request as httpRequest } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..', 'server');
const testDbPath = path.join(serverDir, 'e2e_test_dogshelter.db');
const python = process.env.PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
const flaskPort = 5100;
const proxyPort = 5101;
const failedEndpoints = new Set();

// Seed the test database
execSync(`${python} utils/seed_test_database.py`, {
  cwd: serverDir,
  stdio: 'inherit',
});

// Start Flask with the test database
const server = spawn(python, ['app.py'], {
  cwd: serverDir,
  env: { ...process.env, DATABASE_PATH: testDbPath },
  stdio: 'inherit',
});

const proxy = createServer((incoming, outgoing) => {
  const requestUrl = new URL(incoming.url, `http://127.0.0.1:${proxyPort}`);
  if (requestUrl.pathname === '/__test/fail-next') {
    const endpoint = requestUrl.searchParams.get('endpoint');
    if (endpoint !== 'dogs' && endpoint !== 'breeds') {
      outgoing.writeHead(400).end('Unknown API endpoint');
      return;
    }

    failedEndpoints.add(endpoint);
    outgoing.writeHead(204).end();
    return;
  }

  const endpoint = requestUrl.pathname === '/api/dogs' ? 'dogs'
    : requestUrl.pathname === '/api/breeds' ? 'breeds'
      : null;
  if (endpoint && failedEndpoints.delete(endpoint)) {
    outgoing.writeHead(503, { 'content-type': 'application/json' });
    outgoing.end(JSON.stringify({ error: 'Test fixture forced an API failure' }));
    return;
  }

  const upstream = httpRequest({
    hostname: '127.0.0.1',
    port: flaskPort,
    path: incoming.url,
    method: incoming.method,
    headers: incoming.headers,
  }, (response) => {
    outgoing.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(outgoing);
  });
  upstream.on('error', () => {
    if (!outgoing.headersSent) {
      outgoing.writeHead(502);
    }
    outgoing.end('Test API proxy could not reach Flask');
  });
  incoming.pipe(upstream);
});

proxy.listen(proxyPort, '127.0.0.1');
proxy.on('close', () => server.kill());
server.on('close', (code) => process.exit(code ?? 1));
