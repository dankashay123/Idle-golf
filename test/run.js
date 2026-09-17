#!/usr/bin/env node
/* Mythic Mulligan -- the check suite.
 *
 * Serves index.html, opens it in a headless browser once per check, and
 * reports. Exits non-zero if anything fails, so it works in CI as-is.
 *
 *   node test/run.js            every check
 *   node test/run.js render     only checks whose name contains "render"
 *   node test/run.js --shots    also write PNGs to test/shots/
 *
 * The game is one self-contained HTML file with no build step, so the suite
 * drives the real thing in a real browser rather than importing pieces of it.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CHECKS = path.join(__dirname, 'checks');
const SHOTS = path.join(__dirname, 'shots');

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const file = (req.url === '/' || req.url === '') ? '/index.html' : req.url.split('?')[0];
      const abs = path.join(ROOT, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
      fs.readFile(abs, (err, body) => {
        if (err) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': abs.endsWith('.html') ? 'text/html' : 'text/plain' });
        res.end(body);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

// Boot the game to a known state: intro dismissed, a fresh save, nothing stored
// from a previous run.
async function open(browser, url, opts) {
  const page = await browser.newPage({
    viewport: { width: 400, height: 860 },
    deviceScaleFactor: (opts && opts.dsf) || 1
  });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  // Scene is a top level const in a classic script, so it is a script-scope
  // binding and never lands on window. Ask for the binding itself.
  await page.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
  await page.evaluate(() => { try { hideSheet(); } catch (e) {} });
  page.errors = errors;
  return page;
}

(async () => {
  const filter = process.argv.slice(2).filter(a => !a.startsWith('--'))[0];
  const wantShots = process.argv.includes('--shots');
  if (wantShots) fs.mkdirSync(SHOTS, { recursive: true });

  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) {
    console.error('playwright is not installed.\n  npm install\n  npx playwright install chromium');
    process.exit(2);
  }

  const { srv, port } = await serve();
  const url = 'http://127.0.0.1:' + port + '/index.html';
  const browser = await chromium.launch();

  const files = fs.readdirSync(CHECKS).filter(f => f.endsWith('.js')).sort();
  const checks = files.map(f => require(path.join(CHECKS, f)))
    .filter(c => !filter || c.name.includes(filter));

  let failed = 0;
  for (const check of checks) {
    const t0 = Date.now();
    let page;
    try {
      page = await open(browser, url, check);
      const notes = await check.run(page, { url, shots: wantShots ? SHOTS : null });
      if (page.errors.length) throw new Error(page.errors.slice(0, 4).join('\n      '));
      console.log('  PASS  ' + check.name.padEnd(12) + ' ' + String(Date.now() - t0).padStart(5) + 'ms   '
        + (notes || []).join('\n                             '));
    } catch (err) {
      failed++;
      console.log('  FAIL  ' + check.name.padEnd(12) + ' ' + String(Date.now() - t0).padStart(5) + 'ms');
      console.log('        ' + String(err.message || err).split('\n').join('\n        '));
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  await browser.close();
  srv.close();
  console.log('\n' + (failed ? failed + ' of ' + checks.length + ' checks FAILED'
                             : 'all ' + checks.length + ' checks passed'));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
