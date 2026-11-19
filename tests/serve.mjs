// Tiny static server that behaves like GitHub Pages: gzip, cache-control max-age=600, correct types. Usage: node tests/serve.mjs [port]
import http from 'http'; import fs from 'fs'; import path from 'path'; import zlib from 'zlib'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), port = +(process.argv[2] || 8081);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.md': 'text/markdown', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nope'); }
  const ext = path.extname(f), type = types[ext] || 'application/octet-stream', body = fs.readFileSync(f);
  const h = { 'Content-Type': type, 'Cache-Control': 'max-age=600', 'Access-Control-Allow-Origin': '*' };
  if (/text|json|javascript|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; res.writeHead(200, h); return res.end(zlib.gzipSync(body)); }
  res.writeHead(200, h); res.end(body);
}).listen(port, () => console.log('serving', root, 'on', port));
