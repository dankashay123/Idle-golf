/* What a round looks like for a golfer who plays.
 *
 * The handicap floor used to sit at 0.34 of par time, which is an Eagle: over
 * sixteen seeds of three hours a golfer ahead of the card carded eagles on 67%
 * of holes, albatrosses on 15%, birdies on 17% and pars on under 1%, and won
 * 92% of the nine goals. Score said nothing. The floor is now 0.52 with par
 * times cut to two thirds, so the same golfer plays the same holes in the same
 * time and they read a band worse; the score table's pay was raised 1.27x and
 * the cup targets reset so income, level and cups are unchanged (16 seeds:
 * 600 against 591 holes an hour, level 21.9 both, 12.9 against 13.1 cups,
 * income inside its own spread).
 *
 * Over eight seeds of two hours of real play this holds the shape:
 *   birdies 45-75%, eagles 12-35%, pars 5-25%, albatross or better under 8%,
 *   bogey or worse under 6%, and nine goals won 35-80% of the time.
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
          S.autoEquip = 1;
          const shop = () => {
            for (let g = 0; g < 400; g++) { let best = null, bc = Infinity;
              for (const u of B.UPG) { const lv = upgLv(u.id); if (lv >= capOf(u)) continue;
                const c = costBulk(u.base, u.r, lv, 1); if (c < bc) { bc = c; best = u; } }
              if (!best || S.gold < bc) break; S.gold -= bc; S.upg[best.id] = upgLv(best.id) + 1; }
            if (S.statPts > 0) { S.stat.drive = (S.stat.drive || 0) + S.statPts; S.statPts = 0; }
            if (cardUnlocked(S.tier + 1) && S.tier < S.tierMax) climb(1, true);
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
    if (!(r.birdie >= 0.45 && r.birdie <= 0.75)) bad.push('birdies ' + pct(r.birdie) + ' (45-75%)');
    if (!(r.eagle >= 0.12 && r.eagle <= 0.35)) bad.push('eagles ' + pct(r.eagle) + ' (12-35%)');
    if (!(r.par >= 0.05 && r.par <= 0.25)) bad.push('pars ' + pct(r.par) + ' (5-25%)');
    if (!(r.top < 0.08)) bad.push('albatross or better ' + pct(r.top) + ' (under 8%)');
    if (!(r.worse < 0.06)) bad.push('bogey or worse ' + pct(r.worse) + ' (under 6%)');
    if (!(r.nines >= 0.35 && r.nines <= 0.80)) bad.push('nine goals won ' + pct(r.nines) + ' (35-80%)');
    if (bad.length) throw new Error('the round has lost its shape over ' + r.holes + ' holes: ' + bad.join(', '));
    return [r.holes + ' holes over 8 seeds x 2 hours: birdie ' + pct(r.birdie) + ', eagle ' + pct(r.eagle)
      + ', par ' + pct(r.par) + ', albatross or better ' + pct(r.top) + ', bogey or worse ' + pct(r.worse),
      'nine goals won ' + pct(r.nines)];
  }
};
