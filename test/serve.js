#!/usr/bin/env node
/* Serve the game on http://localhost:8080.
 *
 * Open index.html straight off the disk and the browser treats file:// as an
 * opaque origin, which blocks localStorage -- the game runs but never saves,
 * and the failure is silent. Always play it over http. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;

http.createServer((req, res) => {
  const file = (req.url === '/' || req.url === '') ? '/index.html' : req.url.split('?')[0];
  const abs = path.join(ROOT, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(abs, (err, body) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': abs.endsWith('.html') ? 'text/html' : 'text/plain' });
    res.end(body);
  });
}).listen(PORT, () => console.log('http://localhost:' + PORT));
