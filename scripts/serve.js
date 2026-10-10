// Local static server for public/ that applies the same headers as vercel.json,
// so the CSP is exercised during development and e2e tests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { createHandler } from '../api/_sala.js';
import { memoryStore } from '../api/_store.js';

const root = resolve('public');
const port = Number(process.env.PORT) || 4173;
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const headersFor = (path) =>
  config.headers
    .filter(({ source }) => new RegExp(`^${source.replace('(.*)', '.*')}$`).test(path))
    .flatMap(({ headers }) => headers);

// /api/sala runs locally with rooms in memory (Redis only on Vercel).
const sala = createHandler(memoryStore());
async function api(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const response = await sala(
    new Request(new URL(req.url, `http://${req.headers.host}`), {
      method: req.method,
      headers: req.headers,
      body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
    }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers)).end(await response.text());
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path === '/api/sala') return api(req, res);
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
