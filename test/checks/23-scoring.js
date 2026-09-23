/* What a round looks like for a golfer who plays.
 *
 * Holes are fixed to their card. A golfer gets stronger on a card and the
 * score shows it -- birdies, then eagles, then albatrosses -- and moves up
 * (the game's own auto-climb, once the next card is open and would still be
 * a birdie over a round), dropping back a band or two. So a healthy round is
 * a spread, not a spike:
 *
 *   birdie 20-45%, eagle 20-45%, par 8-30%, albatross or better 5-25%,
 *   bogey or worse under 12%, no single score over 45%, nine goals won
 *   25-75%. Eight seeds of two hours read about 31/31/16/15/7, nines 42%.
 *
 * What it guards against, both measured: the old handicap floor, which
 * stretched every hole to the golfer and made 67% of holes eagles; and the
 * plain static card, which a golfer outran at 2.35x a card for 63%
 * albatrosses. Before a round at albatross pace opened the next card, a
 * dominant golfer sat out whole events and 25% of holes were albatross or
 * better.
 */
'use strict';
module.exports = {
  name: 'scoring',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), real = Math.random;
      const rs = window.scoreFor, rf = window.finishHole;
      const n = {}; let holes = 0, nines = 0, ninesWon = 0, inHole = false;
      window.scoreFor = ratio => { const sc = rs(ratio); if (inHole){ inHole = false; n[sc.n] = (n[sc.n] || 0) + 1; holes++; } return sc; };
      window.finishHole = D => { inHole = true; try { return rf(D); } finally { inHole = false; } };
      QUIET = true;
      try {
        for (let sd = 1; sd <= 8; sd++) {
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); initState(); migrate(); startHole();
          let seed = sd * 7919 + 1; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          S.autoEquip = 1; S.autoClimb = true;   // the game's own climbing, as a player gets it
          const shop = () => {
            for (let g = 0; g < 400; g++) { let best = null, bc = Infinity;
              for (const u of B.UPG) { const lv = upgLv(u.id); if (lv >= capOf(u)) continue;
                const c = costBulk(u.base, u.r, lv, 1); if (c < bc) { bc = c; best = u; } }
              if (!best || S.gold < bc) break; S.gold -= bc; S.upg[best.id] = upgLv(best.id) + 1; }
            if (S.statPts > 0) { S.stat.drive = (S.stat.drive || 0) + S.statPts; S.statPts = 0; }
            };
          let t = 0;
          while (t < 2 * 3600) { step(B.TICK_MAX, derive()); t += B.TICK_MAX; if ((t % 20) < B.TICK_MAX) shop(); }
          nines += Math.floor(S.totalHoles / 9); ninesWon += S.ninesWon || 0;
        }
      } finally {
        window.scoreFor = rs; window.finishHole = rf; Math.random = real; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      const sh = k => (n[k] || 0) / holes;
      return { holes, birdie: sh('Birdie'), eagle: sh('Eagle'), par: sh('Par'),
               top: sh('Albatross') + sh('Ace'),
               worse: sh('Bogey') + sh('Double') + sh('Triple') + sh('Snowman'),
               nines: ninesWon / Math.max(1, nines) };
    });
    const pct = x => Math.round(x * 1000) / 10 + '%';
    const bad = [];
    if (!(r.birdie >= 0.20 && r.birdie <= 0.45)) bad.push('birdies ' + pct(r.birdie) + ' (20-45%)');
    if (!(r.eagle >= 0.20 && r.eagle <= 0.45)) bad.push('eagles ' + pct(r.eagle) + ' (20-45%)');
    if (!(r.par >= 0.08 && r.par <= 0.30)) bad.push('pars ' + pct(r.par) + ' (8-30%)');
    if (!(r.top >= 0.05 && r.top <= 0.25)) bad.push('albatross or better ' + pct(r.top) + ' (5-25%)');
    if (!(r.worse < 0.12)) bad.push('bogey or worse ' + pct(r.worse) + ' (under 12%)');
    if (!(r.nines >= 0.25 && r.nines <= 0.75)) bad.push('nine goals won ' + pct(r.nines) + ' (25-75%)');
    const most = Math.max(r.birdie, r.eagle, r.par, r.top, r.worse);
    if (most > 0.45) bad.push('one kind of score is ' + pct(most) + ' of all holes (45% at most)');
    if (bad.length) throw new Error('the round has lost its shape over ' + r.holes + ' holes: ' + bad.join(', '));
    return [r.holes + ' holes over 8 seeds x 2 hours: birdie ' + pct(r.birdie) + ', eagle ' + pct(r.eagle)
      + ', par ' + pct(r.par) + ', albatross or better ' + pct(r.top) + ', bogey or worse ' + pct(r.worse),
      'nine goals won ' + pct(r.nines)];
  }
};
