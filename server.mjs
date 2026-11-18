import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { askOpenAI } from './server/askOpenAI.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/ask') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const { message } = JSON.parse(raw || '{}');
      if (!message?.trim()) return send(res, 400, { error: 'Please enter a message.' });
      const answer = await askOpenAI(message.trim());
      return send(res, 200, { answer });
    }

    const requested = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(publicDir, path.normalize(requested));
    if (!filePath.startsWith(publicDir)) return send(res, 404, { error: 'Not found' });
    const body = await readFile(filePath);
    send(res, 200, body, mime[path.extname(filePath)] || 'text/plain');
  } catch (error) {
    const fix = error.fix || 'Check the server logs for details.';
    console.error(fix);
    send(res, 502, { error: { message: error.message || 'Something went wrong. Please try again.', fix } });
  }
});

server.listen(3000, '127.0.0.1', () => console.log('WellPath is running at http://127.0.0.1:3000'));
