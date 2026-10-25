/* The chances in each bag, shown before it is bought (Apple asks it of a
 * game where anything random is bought with what money buys), and true.
 *
 *   - the Bags tab carries them behind its ?: every bag, its other clubs and
 *     its last, every rarity it can give with its chance, each list adding
 *     to 100%, and the Mythic count where the bag has one
 *   - opened 2,500 times each (the dice seeded), the clubs come out at the
 *     chances shown: every rarity within four standard errors and half a
 *     point, the other clubs and the last apart, at two club lucks
 *   - and when a bag's Mythic count is due, the last club reads Mythic 100%
 *     and is a Mythic */
'use strict';
module.exports = {
  name: 'bagodds',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => { if (fl.length < 12) fl.push(m); }, o = { n: 0 };
      const real = Math.random, mk = window.makeItem, dv = window.derive;
      try {
        hideSheet(); DEV_OFF = true;
        // ---- shown before buying --------------------------------------------
        QUIET = false; openShop('bags');
        const box = document.getElementById('bagOdds');
        if (!box || !box.querySelector('.qm')) f('the Bags tab has no chances to open');
        else {
          const txt = box.querySelector('.fold').textContent;
          for (const bg of B.BAGS) if (!txt.includes(bg.n)) f('the chances leave out the ' + bg.n);
          const O = bagOdds(B.BAGS[0], derive().drop + 0.5);
          for (const [rr] of O.rest) if (!txt.includes(B.RARITY[rr].n)) f('the chances leave out ' + B.RARITY[rr].n);
          if (!/within \d+\s+bags/.test(txt)) f('the chances do not say when a Mythic is certain');
        }
        hideSheet(); QUIET = true;
        for (const bg of B.BAGS) { const O = bagOdds(bg, 0.5);
          for (const L of [O.rest, O.last]) { const t = L.reduce((a, x) => a + x[1], 0); if (Math.abs(t - 1) > 1e-9) f(bg.n + '\'s chances add to ' + t); } }

        // ---- and true ------------------------------------------------------
        let seed = 4242; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        let log = []; window.makeItem = function () { const it = mk.apply(this, arguments); log.push(it.rar); return it; };
        S.sov = 1e9; S.bag = []; S.equip = S.equip || {};
        for (const drop of [0, 0.6]) {
          window.derive = function () { const D = dv.apply(this, arguments); D.drop = drop; return D; };
          for (const bg of B.BAGS) {
            const O = bagOdds(bg, drop + 0.5), N = 2500, rest = new Array(6).fill(0), last = new Array(6).fill(0);
            S.pityB = {};
            for (let i = 0; i < N; i++) {
              if (bg.pity) S.pityB[bg.id] = 0;        // (the count held off, so the plain chances are measured)
              log = []; openBag(bg, true);
              log.forEach((rr, j) => (j === bg.num - 1 ? last : rest)[rr]++);
              if (S.bag.length > 200) S.bag.length = 0;
            }
            const cmp = (L, got, n, what) => { for (let rr = 0; rr < 6; rr++) {
              const p = (L.find(x => x[0] === rr) || [0, 0])[1], q = got[rr] / n, se = Math.sqrt(Math.max(p * (1 - p), 1e-6) / n);
              o.n++;
              if (Math.abs(q - p) > 4 * se + 0.005) f(bg.n + ' at luck ' + drop + ', ' + what + ': ' + B.RARITY[rr].n + ' came out ' + (q * 100).toFixed(2) + '%, shown ' + (p * 100).toFixed(2) + '%'); } };
            cmp(O.rest, rest, N * (bg.num - 1), 'the other clubs'); cmp(O.last, last, N, 'the last club');
          }
        }
        // ---- the Mythic count due ------------------------------------------
        window.derive = dv;
        for (const bg of B.BAGS.filter(x => x.pity)) {
          S.pityB = { [bg.id]: bg.pity - 1 };
          const O = bagOdds(bg, derive().drop + 0.5);
          if (!(O.last.length === 1 && O.last[0][0] === 5 && O.last[0][1] === 1)) f(bg.n + ' with its count due shows ' + JSON.stringify(O.last));
          log = []; openBag(bg, true);
          if (log[log.length - 1] !== 5) f(bg.n + ' with its count due gave a ' + B.RARITY[log[log.length - 1]].n);
        }
      } finally {
        Math.random = real; window.makeItem = mk; window.derive = dv; QUIET = false; DEV_OFF = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['every bag\'s chances behind the Bags tab\'s ?, each adding to 100%; 2,500 of each bag at two lucks: ' + r.o.n + ' rarities out at the chances shown; a due count a Mythic'];
  }
};
