/* The Tour Pass's page (the user asked it to "look like it costs money, not
 * just a list"): a banner with the Cyber-Drive playing on its own stage, what
 * the paid row holds in chips, a gold button with the price; a medal for the
 * tier; the tiers a track, free left and paid right.
 *
 *   - at 320x568, 390x844 and 844x390: the banner, its stage moving (two
 *     frames apart differ), the five chips, the button with the price
 *     unbought and a seal in its place bought, the medal reading the tier,
 *     thirty rows of two tiles, nothing past the sheet's edge, no word cut
 *   - the paid tiles locked unbought; a reachable tile has its Get
 *   - the Pass tab wears a dot while a tier waits, and none when none does */
'use strict';
module.exports = {
  name: 'passpage',
  async run(page) {
    const fails = [], f = m => { if (fails.length < 12) fails.push(m); }, o = [];
    for (const [W, H] of [[320, 568], [390, 844], [844, 390]]) {
      await page.setViewportSize({ width: W, height: H });
      await page.waitForTimeout(200);
      const r = await page.evaluate(async () => {
        const SNAP = JSON.stringify(S.pass || null);
        try {
          S.pass = null; const P = passNow(); P.pts = 6 * PASS.PER + 20; P.paid = 0; P.got = [];
          openShop('pass');
          const sh = document.getElementById('sheet'), box = sh.getBoundingClientRect();
          const q = s => sh.querySelector(s);
          const out = { hero: !!q('.passhero'), chips: sh.querySelectorAll('.phchip').length,
            buy: q('.phbuy') ? q('.phbuy').textContent : '', medal: q('.phmedal b') ? q('.phmedal b').textContent : '',
            rows: sh.querySelectorAll('.phrow').length, tiles: sh.querySelectorAll('.phrow .ptile').length,
            locked: sh.querySelectorAll('.ptile.p.lock').length, gets: sh.querySelectorAll('.ptile.can .mini').length,
            rib: !!q('.phbuy .phrib'), ends: q('.phend') ? q('.phend').textContent : '',
            free30: passReward('f', PASS.TIERS).k + ':' + passReward('f', PASS.TIERS).v, paidSov: passReward('p', 2).v,
            dot: (openShop('offers'), !!q('.shopnav button.dot[data-sub="pass"]')) };
          openShop('pass');
          // the medal's number in its middle
          { const m = q('.phmedal').getBoundingClientRect(), b0 = q('.phmedal b'), rg = document.createRange(); rg.selectNodeContents(b0); const n = rg.getBoundingClientRect();
            out.medalOff = [Math.round((n.left + n.right) / 2 - (m.left + m.right) / 2), Math.round((n.top + n.bottom) / 2 - (m.top + m.bottom) / 2)]; }
          // the tabs stay at the top as it scrolls
          sh.scrollTop = 1200; await new Promise(r => setTimeout(r, 50));
          { const t = q('.shopnav').getBoundingClientRect(), b1 = sh.getBoundingClientRect(); out.navTop = Math.round(t.top - b1.top); out.scrolled = sh.scrollTop; }
          sh.scrollTop = 0;
          // the stage plays: two frames apart differ
          const cv = document.getElementById('showCv');
          const grab = () => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
          await new Promise(r => setTimeout(r, 300)); const a = grab();
          await new Promise(r => setTimeout(r, 500)); const b = grab();
          let d = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1]) d++;
          out.moved = d;
          // nothing past the sheet's edge, no word cut
          out.over = [];
          for (const el of sh.querySelectorAll('.passhero *, .phprog *, .phrow *')) {
            const e = el.getBoundingClientRect(); if (!e.width) continue;
            if (e.left < box.left - 1 || e.right > box.right + 1) out.over.push(el.className + ' ' + Math.round(e.left) + '-' + Math.round(e.right));
            if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' && el.tagName !== 'CANVAS') out.over.push('cut ' + el.className);
          }
          for (const el of sh.querySelectorAll('.ptx, .phchip span')) {
            const words = el.textContent.split(/\s+/).filter(Boolean);
            const rg = document.createRange(); rg.selectNodeContents(el);
            // a word broken over two lines shows as more line boxes than words could make
            if (rg.getClientRects().length > words.length + 2) out.over.push('broken ' + el.textContent);
          }
          // bought: a seal for the button, the paid tiles open
          P.paid = 1; openShop('pass');
          out.seal = !!q('.phseal') && !q('.phbuy'); out.lockedPaid = sh.querySelectorAll('.ptile.p.lock').length;
          // nothing waiting: no dot
          for (let t = 1; t <= PASS.TIERS; t++) P.got.push('f' + t, 'p' + t);
          openShop('pass'); out.dotNone = !!q('.shopnav button.dot');
          openShop('offers'); out.dotOffers = !!q('.shopnav button.dot');
          return out;
        } finally { S.pass = JSON.parse(SNAP); hideSheet(); }
      });
      const at = W + 'x' + H + ': ';
      if (!r.hero) f(at + 'no banner');
      if (r.chips !== 5) f(at + r.chips + ' chips of five');
      if (!/\$9\.99/.test(r.buy)) f(at + 'the button has no price: ' + r.buy);
      if (r.medal !== '6') f(at + 'the medal reads ' + r.medal + ' at tier 6');
      if (r.rows !== 30 || r.tiles !== 60) f(at + r.rows + ' rows, ' + r.tiles + ' tiles');
      if (r.locked !== 30) f(at + r.locked + ' paid tiles locked unbought');
      if (r.gets < 6) f(at + 'only ' + r.gets + ' Get buttons at tier 6');
      if (!r.dot) f(at + 'no dot on the Pass tab with tiers waiting');
      if (!r.rib) f(at + 'no Best Value on the button');
      if (!/left|Ends in/.test(r.ends)) f(at + 'no time left on the banner: ' + r.ends);
      if (r.free30 !== 'bag:legend') f(at + 'the free row\'s last is ' + r.free30 + ', not a Legend Bag');
      if (r.paidSov !== 60) f(at + 'a paid tier pays ' + r.paidSov + ', not 60');
      if (Math.abs(r.medalOff[0]) > 2 || Math.abs(r.medalOff[1]) > 5) f(at + 'the tier off the medal\'s middle by ' + r.medalOff);
      if (r.scrolled > 100 && Math.abs(r.navTop) > 2) f(at + 'scrolled ' + r.scrolled + 'px, the tabs ' + r.navTop + 'px off the top');
      if (r.dotNone || r.dotOffers) f(at + 'a dot on the Pass tab with nothing waiting');
      if (!(r.moved > 40)) f(at + 'the Cyber-Drive stage stood still (' + r.moved + ' pixels changed)');
      if (!r.seal || r.lockedPaid) f(at + 'bought: seal ' + r.seal + ', ' + r.lockedPaid + ' still locked');
      if (r.over.length) f(at + r.over.slice(0, 4).join('; '));
      o.push(W + 'x' + H + ' stage ' + r.moved + 'px moved, medal ' + r.medalOff + ', tabs at ' + r.navTop);
    }
    if (fails.length) throw new Error(fails.join('\n'));
    return ['banner, five chips, $9.99, medal, 30 rows of two, locked till bought, the dot only while a tier waits; ' + o.join(', ')];
  }
};
