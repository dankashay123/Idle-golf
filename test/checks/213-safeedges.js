/* The screen's edges in the app (the user asked, to make it ready for the
 * iPhone): the game served with each phone's own notch, island and home-bar
 * sizes in place of the browser's (which gives none off a phone).
 *
 *   - an SE, a mini, a 15 and a Pro Max upright, and a 15, an SE and a Pro
 *     Max on its side
 *   - on the course, the bag, career, the shop, the Trophy Room and the
 *     settings: nothing to tap or read in those bands where it is on top
 *   - every list that scrolls, scrolled to its end, ends clear of the home
 *     bar (it may pass under it while scrolling) */
'use strict';
const fs = require('fs'), path = require('path');
const PHONES = [
  ['SE', 375, 667, { top: 20, bottom: 0, left: 0, right: 0 }],
  ['mini', 375, 812, { top: 50, bottom: 34, left: 0, right: 0 }],
  ['15', 393, 852, { top: 59, bottom: 34, left: 0, right: 0 }],
  ['Pro Max', 430, 932, { top: 59, bottom: 34, left: 0, right: 0 }],
  ['15 on its side', 852, 393, { top: 0, bottom: 21, left: 59, right: 59 }],
  ['SE on its side', 667, 375, { top: 0, bottom: 0, left: 0, right: 0 }],
  ['Pro Max on its side', 932, 430, { top: 0, bottom: 21, left: 59, right: 59 }]];
module.exports = {
  name: 'safeedges',
  async run(page, opts) {
    const SRC = fs.readFileSync(process.env.EDGE_SRC || path.join(__dirname, '..', '..', 'index.html'), 'utf8');
    const ST = await page.evaluate(() => JSON.stringify(S));
    const fails = [], f = m => { if (fails.length < 12) fails.push(m); };
    let n = 0;
    for (const [name, W, H, I] of PHONES) {
      const html = SRC.replace(/env\(safe-area-inset-(top|bottom|left|right)(\s*,\s*0px)?\)/g, (m, s) => I[s] + 'px');
      const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true });
      try {
        await ctx.route('**/*', r => r.request().resourceType() === 'document' ? r.fulfill({ status: 200, contentType: 'text/html', body: html }) : r.continue());
        const p = await ctx.newPage(), errs = [];
        p.on('pageerror', e => errs.push(e.message));
        await p.addInitScript(() => { window.__inApp = 1; window.__noShimmer = 1; });
        await p.goto(opts.url.split('?')[0]);
        await p.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
        if (!(await p.evaluate(() => !/env\(safe-area-inset/.test(document.documentElement.outerHTML)))) f(name + ': the phone\'s edges were not put in');
        await p.evaluate(st => { window.requestAnimationFrame = () => 0; hideSheet(); const o = JSON.parse(st); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState(), o); initState(); startHole(); buildSprites(); renderAll(); if (window.fitTop) fitTop(); }, ST);
        for (const vn of ['course', 'bag', 'career', 'shop', 'Trophy Room', 'settings']) {
          await p.evaluate(vn => { hideSheet();
            if (vn === 'course') setView('upg'); else if (vn === 'bag') setView('bag'); else if (vn === 'career') setView('career');
            else if (vn === 'shop') openShop('offers'); else if (vn === 'Trophy Room') trophyRoom('today'); else if (window.openSettings) openSettings();
            for (let i = 0; i < 30; i++) { Scene.t += 0.03; Scene.draw(1 / 60, derive()); } }, vn);
          await p.waitForTimeout(200);
          const bad = await p.evaluate(I => {
            const W = innerWidth, H = innerHeight, out = [];
            const zones = [[0, 0, W, I.top], [0, H - I.bottom, W, H], [0, 0, I.left, H], [W - I.right, 0, W, H]].filter(z => z[2] > z[0] && z[3] > z[1]);
            const els = [...document.querySelectorAll('body *')].filter(e => /^(BUTTON|A|INPUT|IMG)$/.test(e.tagName) || e.getAttribute('role') === 'button' || [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
            const inList = e => { for (let sc = e.parentElement; sc; sc = sc.parentElement) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY) && sc.scrollHeight > sc.clientHeight + 2) return true; } return false; };
            for (const e of els) {
              const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) continue;
              const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= H || inList(e)) continue;
              for (const z of zones) { const ix = Math.min(r.right, z[2]) - Math.max(r.left, z[0]), iy = Math.min(r.bottom, z[3]) - Math.max(r.top, z[1]);
                if (!(ix > 1 && iy > 1)) continue;
                const top = document.elementFromPoint(Math.max(r.left, z[0]) + ix / 2, Math.max(r.top, z[1]) + iy / 2);
                if (top && (top === e || e.contains(top) || top.contains(e))) { out.push('"' + (e.textContent || e.id || e.tagName).trim().slice(0, 24) + '" ' + Math.round(ix) + 'x' + Math.round(iy) + ' in the band'); break; } }
            }
            for (const sc of document.querySelectorAll('*')) { const cs = getComputedStyle(sc);
              if (!/(auto|scroll)/.test(cs.overflowY) || sc.scrollHeight <= sc.clientHeight + 2 || !sc.offsetParent) continue;
              const keep = sc.scrollTop; sc.scrollTop = sc.scrollHeight;
              const kids = [...sc.querySelectorAll('button, .lb, .row, .ds, .nm')].filter(k => k.offsetParent && k.getBoundingClientRect().height > 2);
              const lastB = kids.reduce((m, k) => Math.max(m, k.getBoundingClientRect().bottom), 0), cut = Math.min(sc.getBoundingClientRect().bottom, H - I.bottom);
              if (lastB > cut + 1) out.push('a list ends ' + Math.round(lastB - cut) + 'px under the home bar');
              sc.scrollTop = keep; }
            return out.slice(0, 4);
          }, I);
          n++;
          if (bad.length) f(name + ', ' + vn + ': ' + bad.join('; '));
        }
        if (errs.length) f(name + ': ' + errs[0]);
      } finally { await ctx.close(); }
    }
    if (fails.length) throw new Error(fails.join(' | '));
    return [PHONES.length + ' iPhones upright and on their sides, ' + n + ' screens: nothing to tap or read under the notch, island or home bar; every list ends clear'];
  }
};
