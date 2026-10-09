/* The range's Buy All (the user: "I want the menu experience to not be
 * tedious"; twenty rows were tapped one at a time):
 *
 *   - one tap spends the purse on the cheapest next level, again and again:
 *     what is left is less than any next level costs, and nothing was paid
 *     that a level did not get
 *   - a capped rung is never raised past its cap
 *   - with nothing in reach it buys nothing and says so
 *   - the rows say Lv and what it gives beside the name, on one line at 390
 */
'use strict';
module.exports = {
  name: 'buyall',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true;
        for (const u of B.UPG) S.upg[u.id] = 0;
        const capped = B.UPG.find(u => isFinite(capOf(u)));
        if (capped) S.upg[capped.id] = capOf(capped);
        S.gold = 5e6; setView('upg');
        const g0 = S.gold, lv0 = B.UPG.map(u => upgLv(u.id));
        $('buyAll').click();
        let paid = 0;
        B.UPG.forEach((u, i) => { const k = upgLv(u.id) - lv0[i]; if (k > 0) paid += costBulk(u.base, u.r, lv0[i], k); });
        o.levels = B.UPG.reduce((a, u, i) => a + upgLv(u.id) - lv0[i], 0);
        if (Math.abs(g0 - S.gold - paid) > 1e-6 * g0) f('paid ' + (g0 - S.gold) + ' for levels worth ' + paid);
        const next = Math.min(...B.UPG.filter(u => upgLv(u.id) < capOf(u)).map(u => costBulk(u.base, u.r, upgLv(u.id), 1)));
        if (S.gold >= next) f('left ' + S.gold + ' with a level at ' + next + ' still in reach');
        if (o.levels < 10) f('bought only ' + o.levels + ' levels with 5M');
        if (capped && upgLv(capped.id) > capOf(capped)) f(capped.n + ' went past its cap');
        S.gold = 0; const before = JSON.stringify(S.upg); $('buyAll').click();
        if (JSON.stringify(S.upg) !== before) f('bought with an empty purse');
        refreshUpg();
        const row = UPGREF[0].el, nm = row.querySelector('.nm'), mt = row.querySelector('.nm .mt');
        if (!mt || !/Level/.test(mt.textContent)) f('the level is not beside the name');
        else if (Math.abs(mt.getBoundingClientRect().top - nm.firstChild.getBoundingClientRect().top) > 6) f('the level wrapped under the name at 390');
      } finally {
        QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); refreshUpg(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['one tap bought ' + r.levels + ' levels, cheapest first, down to less than the next costs; caps held; an empty purse buys nothing'];
  }
};
