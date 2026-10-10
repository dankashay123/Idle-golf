/* Tap areas big enough for a finger (the user plays on an iPhone; the small
 * buttons were 24 pixels tall, well under a fingertip): at 320 wide and on
 * its side, on the course, the Range, the Bag, Career, the shop, settings,
 * perks and a club's sheet,
 *   - every button still answers a tap at its own middle (no neighbour's
 *     larger area laid over it)
 *   - the small buttons (+1, Buy, the Range's x1 to Max, Use, the ? folds)
 *     answer a tap at least 32 pixels tall, and the buttons down the left
 *     of the course 32
 * by where a tap lands (elementFromPoint), not by the drawn size, which is
 * unchanged. */
'use strict';
module.exports = {
  name: 'taps',
  async run(page) {
    const out = [];
    for (const [w, h] of [[320, 640], [760, 360]]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        const fails = [], f = m => { if (fails.length < 14) fails.push(m); }; let n = 0, small = 0;
        const hitH = el => { const q = el.getBoundingClientRect(), x = q.left + q.width / 2; let lo = null, hi = null;
          for (let y = Math.floor(q.top - 12); y <= Math.ceil(q.bottom + 12); y++) { const e = document.elementFromPoint(x, y); if (e && (e === el || el.contains(e))) { if (lo === null) lo = y; hi = y; } }
          return lo === null ? 0 : hi - lo + 1; };
        const look = where => {
          for (const el of document.querySelectorAll('button')) {
            if (!el.offsetParent || el.closest('#dev') || el.disabled) continue;
            const q = el.getBoundingClientRect(); if (q.width < 4 || q.height < 4 || q.top < 0 || q.bottom > innerHeight || q.left < 0 || q.right > innerWidth) continue;
            // (scrolled part way out of its own scrolling box: not counted)
            let sc = el.parentElement, cut = false; while (sc && sc !== document.body) { const cs = getComputedStyle(sc); if (/(auto|scroll|hidden)/.test(cs.overflowY)) { const b = sc.getBoundingClientRect(); if (q.top < b.top + 12 || q.bottom > b.bottom - 12) { cut = true; break; } } sc = sc.parentElement; }
            if (cut) continue;
            const top = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
            if (!top) continue;
            // (behind an open sheet, a button cannot be tapped at all: not counted)
            if (top.closest('#veil') && !el.closest('#sheet')) continue;
            if (top.closest('#sheet') && !el.closest('#sheet')) continue;
            n++;
            const near = top.closest('button');
            if (near && near !== el && !el.contains(near) && !near.contains(el)) f(where + ': "' + (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 16) + '" is covered at its middle by "' + (near.innerText || near.getAttribute('aria-label') || '').trim().slice(0, 16) + '"');
            if (el.matches('.mini, .mbtn, #buyAll, .qm, #hudLeft button') && q.height < 30) { small++; const hh = hitH(el); if (hh < 32) f(where + ': "' + (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 16) + '" (at ' + Math.round(q.top) + ') answers a tap only ' + hh + ' pixels tall'); }
          }
        };
        try { hideSheet(); } catch (e) {}
        QUIET = true; DEV.gold(20); DEV.lv(40); DEV.tierSet(8); QUIET = false; try { hideSheet(); } catch (e) {}
        look('course');
        $('app').classList.add('big');
        for (const v of ['upg', 'bag', 'dgn', 'career']) { setView(v); look(v); }
        setView('career'); const st = [...document.querySelectorAll('#careerNav button')].find(x => x.dataset.s === 'stat'); if (st) { st.click(); look('career/attributes'); }
        $('app').classList.remove('big');
        for (const sub of ['offers', 'perm', 'style']) { openShop(sub); look('shop/' + sub); }
        settingsSheet(); look('settings'); perksSheet(); look('perks');
        try { const it = makeItem(S.tier, 0, 4, 'driver'); S.bag.push(it); itemSheet(it, false); look('club'); S.bag.pop(); } catch (e) {}
        try { hideSheet(); } catch (e) {}
        return { fails, n, small };
      });
      if (r.fails.length) throw new Error(w + 'x' + h + ': ' + r.fails.join('; '));
      out.push(w + 'x' + h + ' ' + r.n + ' buttons (' + r.small + ' small)');
    }
    await page.setViewportSize({ width: 400, height: 860 });
    return ['every button answers at its middle and the small ones a tap 32 pixels tall or more: ' + out.join(', ')];
  }
};
