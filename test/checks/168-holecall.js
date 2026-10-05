/* The hole's call as the ball drops (Birdie, Par ...), in type over the
 * course (the user asked it "better ... higher quality": it was the pixel
 * letters scaled up).
 *
 *   - shown on the call, its lettering painted on its canvas (it came out
 *     blank on his iPhone when drawn in styles alone), its word and under it the score to par (E for a
 *     par, none for a call that is not a score), in its colour; gone with
 *     the banner, and on a new hole
 *   - never over the readout or its buttons: upright at 320 and 440 wide,
 *     and on its side
 *   - not in a wager (it has its own, smaller, on the page) */
'use strict';
module.exports = {
  name: 'holecall',
  async run(page) {
    const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { sizes: [] };
    const look = () => page.evaluate(() => {
      // (measured at its full size, not part way through its pop)
      const el = document.getElementById('holecall'); el.style.animation = 'none'; const q = el.getBoundingClientRect(), hits = [];
      for (const id of ['readout', 'setRow', 'shopBtn', 'roomBtn', 'perkBtn', 'hudClimb']) { const e = document.getElementById(id); if (!e || !e.offsetParent) continue;
        const r = e.getBoundingClientRect(); if (r.width && r.right > q.left && r.left < q.right && r.bottom > q.top && r.top < q.bottom) hits.push(id); }
      el.style.animation = '';
      // (and its lettering painted: the call came out blank on the phone)
      const cv = el.querySelector('canvas'), d = cv.width && cv.height ? cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data : [];
      let ink = 0, lit = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) { ink++; if (d[i - 3] + d[i - 2] + d[i - 1] > 450) lit++; }
      return { shown: !el.hidden, w: el.dataset.w || '', s: el.dataset.s || '', cls: el.className, hits, top: q.top, h: q.height, ink: ink / Math.max(1, d.length / 4), lit: lit / Math.max(1, d.length / 4) };
    });
    const call = (n, d) => page.evaluate(([n, d]) => { hideSheet(); window.step = window.step || (() => {}); Scene.announce = null; Scene.holed({ n, d }); Scene.draw(0, derive()); }, [n, d]);
    await page.evaluate(() => { window.__keepStep = window.step; window.step = () => {}; window.requestAnimationFrame = () => 0; QUIET = false; });
    for (const [w, h] of [[320, 700], [440, 900], [860, 400], [700, 330]]) {
      await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); });
      await page.waitForTimeout(150);
      for (const [n, d, want, cls] of [['Birdie', -1, '−1', 'aur'], ['Par', 0, 'E', 'par'], ['Albatross', -3, '−3', 'myth'], ['Double', 2, '+2', 'bad'], ['FRONT NINE', -2, '', 'gold']]) {
        await call(n, d); const L = await look();
        if (!L.shown) { f(w + 'x' + h + ': ' + n + ' not shown'); continue; }
        if (L.w.toUpperCase() !== n.toUpperCase() || L.s !== want || L.cls !== cls) f(w + 'x' + h + ': ' + n + ' shown as "' + L.w + '" "' + L.s + '" ' + L.cls);
        if (L.hits.length) f(w + 'x' + h + ': ' + n + ' over the ' + L.hits.join(', '));
        if (L.h < 20) f(w + 'x' + h + ': ' + n + ' only ' + L.h + 'px tall');
        if (!(L.ink > 0.12) || !(L.lit > 0.03)) f(w + 'x' + h + ': ' + n + ' barely painted (' + (L.ink * 100).toFixed(1) + '% inked, ' + (L.lit * 100).toFixed(1) + '% lit)');
        o.ink = Math.min(o.ink ?? 1, L.ink); o.lit = Math.min(o.lit ?? 1, L.lit);
      }
      o.sizes.push(w + 'x' + h);
    }
    // gone with the banner, and on a new hole
    const gone = await page.evaluate(() => { Scene.holed({ n: 'Birdie', d: -1 }); Scene.draw(0, derive()); Scene.draw(1.3, derive()); const a = document.getElementById('holecall').hidden;
      Scene.holed({ n: 'Par', d: 0 }); Scene.draw(0, derive()); Scene.newHole(S.hole, S.tier); const b = document.getElementById('holecall').hidden; return [a, b]; });
    if (!gone[0]) f('the call still up after its banner'); if (!gone[1]) f('the call still up on a new hole');
    // not in a wager
    const wager = await page.evaluate(() => { Scene.newHole(S.hole, S.tier); const keep = S.dgnRun; S.dgnRun = { id: B.DGN[0].id };
      try { Scene.holed({ n: 'Birdie', d: -1 }); Scene.drawNums ? 0 : 0; const b = Scene.banner; Scene.banner = b; try { Scene.draw(0, derive()); } catch (e) {} return !document.getElementById('holecall').hidden; } finally { S.dgnRun = keep; Scene.banner = null; Scene.newHole(S.hole, S.tier); } });
    if (wager) f('the call shown in a wager');
    await page.evaluate(() => { window.step = window.__keepStep; });
    if (fails.length) throw new Error(fails.join('; '));
    return ['the call, its figure and colour right for five calls at ' + o.sizes.join(', ') + ', its lettering painted (least ' + (o.ink * 100).toFixed(0) + '% inked, ' + (o.lit * 100).toFixed(0) + '% lit), never over the readout or its buttons; gone with its banner and on a new hole; none in a wager'];
  }
};
