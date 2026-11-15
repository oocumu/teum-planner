import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize as normalizePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTasks } from './ai.js';
import { buildSchedule } from './scheduler.js';

if (existsSync('.env')) process.loadEnvFile();

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function resolveStatic(urlPath) {
  const safe = normalizePath(decodeURIComponent(urlPath)).replace(/^([/\\]|\.\.)+/, '');
  if (safe.startsWith('lib') && (safe.endsWith('parser.js') || safe.endsWith('scheduler.js'))) {
    return join(ROOT, 'src', safe.slice(4));
  }
  return join(ROOT, 'public', safe || 'index.html');
}

async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1e5) throw new Error('too large');
  }
  return JSON.parse(body || '{}');
}

function send(res, status, data, type = MIME['.json']) {
  res.writeHead(status, { 'content-type': type });
  res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
}

export const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST' && url.pathname === '/api/plan') {
      const { text = '' } = await readBody(req);
      const { source, tasks } = await extractTasks(text);
      return send(res, 200, { source, ...buildSchedule(tasks) });
    }
    if (req.method === 'GET') {
      const file = resolveStatic(url.pathname === '/' ? '/index.html' : url.pathname);
      const data = await readFile(file);
      return send(res, 200, data, MIME[extname(file)] ?? 'application/octet-stream');
    }
    send(res, 405, { error: 'Method Not Allowed' });
  } catch (err) {
    send(res, err.code === 'ENOENT' ? 404 : 400, { error: err.message });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}
