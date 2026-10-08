// Local static server for public/ that applies the same headers as vercel.json,
// so the CSP is exercised during development and e2e tests.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

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

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = normalize(join(root, path === '/' ? 'index.html' : path));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    for (const { key, value } of headersFor(path)) res.setHeader(key, value);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(port, () => console.log(`OSO en http://localhost:${port}`));
