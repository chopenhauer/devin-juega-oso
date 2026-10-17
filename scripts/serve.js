// Local static server for public/ that applies the same headers as vercel.json,
// so the CSP is exercised during development and e2e tests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { createHandler } from '../api/_sala.js';
import { memoryStore } from '../api/_store.js';
import { createVisitHandler } from '../api/_visita.js';
import { writeInvitePage } from './invite-page.js';
import middleware, { config as middlewareConfig } from '../middleware.js';

const root = resolve('public');
const port = Number(process.env.PORT) || 4173;
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
writeInvitePage();
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const headersFor = (path) =>
  config.headers
    .filter(({ source }) => new RegExp(`^${source.replace('(.*)', '.*')}$`).test(path))
    .flatMap(({ headers }) => headers);

// /api/sala and /api/visita run locally with rooms and counters in memory (Redis only on Vercel).
const store = memoryStore();
const handlers = { '/api/sala': createHandler(store), '/api/visita': createVisitHandler(store) };
async function api(req, res, handle) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const response = await handle(
    new Request(new URL(req.url, `http://${req.headers.host}`), {
      method: req.method,
      headers: req.headers,
      body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
    }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers)).end(await response.text());
}

// Same as Vercel: middleware.js may rewrite the paths in its matcher.
function route(url) {
  if (url.pathname !== middlewareConfig.matcher) return url.pathname;
  const to = middleware(new Request(url))?.headers.get('x-middleware-rewrite');
  return to ? new URL(to).pathname : url.pathname;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (handlers[url.pathname]) return api(req, res, handlers[url.pathname]);
  const path = decodeURIComponent(route(url));
  const file = normalize(join(root, path === '/' ? 'index.html' : path));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    // Same as Vercel's cleanUrls: /privacidad serves privacidad.html.
    const body = await readFile(file).catch((e) => {
      if (extname(file)) throw e;
      return readFile(`${file}.html`);
    });
    for (const { key, value } of headersFor(path)) res.setHeader(key, value);
    res
      .writeHead(200, { 'Content-Type': types[extname(file) || '.html'] ?? 'application/octet-stream' })
      .end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`OSO en http://localhost:${port}`));
