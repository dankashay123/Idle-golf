#!/usr/bin/env node
/* Mythic Mulligan -- the check suite.
 *
 * Serves index.html, opens it in a headless browser once per check, and
 * reports. Exits non-zero if anything fails, so it works in CI as-is.
 *
 *   node test/run.js            every check
 *   node test/run.js render     only checks whose name contains "render"
 *   node test/run.js --shots    also write PNGs to test/shots/
 *   node test/run.js --jobs=1   one at a time (the default is a lane a core,
 *                               up to four; checks that time things run alone after)
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
  // (sovereigns paid at once, as they were: a check measures what a thing
  // pays; the GET check turns this off to see them wait. The calendar's
  // season held at autumn, CAL_PIN, unless a check moves the date itself:
  // the checks were written in October and met a frozen January otherwise;
  // a check with realSeason: true reads the real month)
  await page.addInitScript((cal) => { window.__sovAuto = 1; window.__noShimmer = 1; window.__calSeason = cal; }, opts && opts.realSeason ? -1 : 1);
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

  const files = fs.readdirSync(CHECKS).filter(f => f.endsWith('.js')).sort();
  const checks = files.map(f => require(path.join(CHECKS, f)))
    .filter(c => !filter || c.name.includes(filter));

  // Run side by side, one browser to a lane (--jobs N, or as many lanes as the
  // machine has cores, up to four); a check that times anything (its file
  // reads the clock, or it says alone: true) runs after, on its own, on a
  // quiet machine, as the whole run used to (rule 44: a busy machine finds
  // timing bugs, and a check's own clock is not one of them).
  const jarg = process.argv.find(a => a.startsWith('--jobs'));
  const jobs = Math.max(1, jarg ? +(jarg.split('=')[1] || 1) : Math.min(4, require('os').cpus().length));
  const timed = c => c.alone || /performance\.now|frame time|battery/i.test(fs.readFileSync(path.join(CHECKS, files.find(f => require(path.join(CHECKS, f)) === c)), 'utf8'));
  const shared = checks.filter(c => !timed(c)), solo = checks.filter(timed);

  let failed = 0;
  const runOne = async (browser, check) => {
    const t0 = Date.now();
    let page, line;
    try {
      page = await open(browser, url, check);
      const notes = await check.run(page, { url, shots: wantShots ? SHOTS : null });
      if (page.errors.length) throw new Error(page.errors.slice(0, 4).join('\n      '));
      line = '  PASS  ' + check.name.padEnd(12) + ' ' + String(Date.now() - t0).padStart(5) + 'ms   '
        + (notes || []).join('\n                             ');
    } catch (err) {
      failed++;
      line = '  FAIL  ' + check.name.padEnd(12) + ' ' + String(Date.now() - t0).padStart(5) + 'ms\n'
        + '        ' + String(err.message || err).split('\n').join('\n        ');
    } finally {
      if (page) await page.close().catch(() => {});
    }
    console.log(line);
  };
  const lanes = async (list, n) => {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => {
      const browser = await chromium.launch();
      try { while (next < list.length) await runOne(browser, list[next++]); }
      finally { await browser.close(); }
    }));
  };
  await lanes(shared, jobs);
  await lanes(solo, 1);

  srv.close();
  console.log('\n' + (failed ? failed + ' of ' + checks.length + ' checks FAILED'
                             : 'all ' + checks.length + ' checks passed'));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
