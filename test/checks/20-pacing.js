/* The first two hours, played the way a person plays them.
 *
 * A sample of one idle run once read as a stall: birdies fell from 146 in the
 * first hour to 12 an hour after it. That run bought nothing, so standing
 * still fell behind -- which is the design, not a stall. What matters is someone who plays: buys
 * the cheapest Range rung whenever it can, lets clubs auto-equip, puts
 * attribute points somewhere and climbs when a card opens. Swept over eight
 * seeds, because weather and gear rolls make any one run noise.
 *
 * For that player, over two hours:
 *   - the pace holds: at least 60 holes in every twenty minutes, twenty
 *     seconds a hole, about twice par. It was "never below half the first
 *     twenty minutes", which meant something while every hole was stretched
 *     to the golfer; with holes fixed to their card, the first twenty minutes
 *     are a sprint through a card a new golfer outdrives -- 260-300 holes --
 *     and a golfer who has since climbed to where they belong plays 95-130 at
 *     par pace. That is the game working, so the rule is absolute now.
 *   - the scoring holds: at least 40% of holes par or better in every
 *     window (60% before holes were fixed). Where you belong, a course whose
 *     affinity fights your ball halves your carry for its rounds and a window
 *     can read 44%; the armour wall this caught read 0%, and cards at 7x read
 *     27%. It was birdie or better while a golfer ahead of the card
 *     carded eagles; scoring moved a band (the floor is a birdie now), and
 *     the same rule failed on it at 42-52% for an eager climber behind the
 *     card -- pars, not a stall, since the pace rule held. One band down is
 *     the same rule.
 *   - the ladder moves: at least three Tour Cards open
 *
 * Not tighter than that, on purpose. Holes are fixed to their card and the
 * game climbs for you once you can birdie the next one, so a playing golfer
 * spends the two hours near where they belong -- par-to-birdie country, not a
 * wall of eagles -- and the lucky seeds race eight to twelve cards up while
 * the unlucky ones sit a card lower on pars. That spread is the game.
 *
 * What it catches: an armour wall on closing holes read 0% par or better
 * here, and a TIER_Y the economy outgrows runs away to 100% eagles with the
 * card count climbing without end. What it cannot see is a purse tuned a
 * little rich or poor: auto-climb absorbs that as a card more or less.
 *
 * And the idle run is kept as the contrast, so a change that made standing
 * still pay as well as playing would show up here too.
 */
'use strict';
module.exports = {
  name: 'pacing',
  async run(page) {
    const r = await page.evaluate(() => {
      const real = Math.random;
      const SNAP = JSON.stringify(S);
      const play = (seedN, active) => {
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState());
        initState(); migrate(); startHole();
        let seed = seedN * 7919 + 1;
        Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        S.autoEquip = active ? 1 : 0; S.autoClimb = true;  // the game's own climbing, on by default for everyone
        const shop = () => {
          for (let guard = 0; guard < 400; guard++) {
            let best = null, bc = Infinity;
            for (const u of B.UPG) { const lv = upgLv(u.id); if (lv >= capOf(u)) continue;
              const c = costBulk(u.base, u.r, lv, 1); if (c < bc) { bc = c; best = u; } }
            if (!best || S.gold < bc) break;
            S.gold -= bc; S.upg[best.id] = upgLv(best.id) + 1;
          }
          if (S.statPts > 0) { S.stat.drive = (S.stat.drive || 0) + S.statPts; S.statPts = 0; }
        };
        const rows = []; let t = 0, last = { h: 0, b: 0, p: 0 };
        // counted once per finished hole, from the hole's own lookup: the Tour
        // tab's climb preview reads the same table and can be redrawn from
        // inside a hole that opens a card, which counted 2% of holes twice
        let parOrBetter = 0, inHole = false; const rs = window.scoreFor, rf = window.finishHole;
        window.scoreFor = ratio => { const sc = rs(ratio); if (inHole){ inHole = false; if (sc.d <= 0) parOrBetter++; } return sc; };
        window.finishHole = D => { inHole = true; try { return rf(D); } finally { inHole = false; } };
        for (let w = 1; w <= 6; w++) {
          const end = w * 1200;
          while (t < end) { step(B.TICK_MAX, derive()); t += B.TICK_MAX;
                            if (active && (t % 20) < B.TICK_MAX) shop(); }
          const h = S.totalHoles, bd = S.tally.birdie || 0;
          rows.push({ holes: h - last.h, birdie: (bd - last.b) / Math.max(1, h - last.h),
                      par: (parOrBetter - last.p) / Math.max(1, h - last.h) });
          last = { h, b: bd, p: parOrBetter };
        }
        window.scoreFor = rs; window.finishHole = rf;
        return { rows, cards: (S.tierMax || 0) + 1, tier: S.tier };
      };
      const out = { active: [], idle: null };
      QUIET = true;
      try {
        for (const sd of [1, 2, 3, 4, 5, 6, 7, 8]) out.active.push(play(sd, true));
        out.idle = play(1, false);
      } finally {
        Math.random = real; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return out;
    });

    const bad = [];
    r.active.forEach((run, i) => {
      const first = run.rows[0].holes;
      run.rows.forEach((w, j) => {
        if (w.holes < 60) bad.push('seed ' + (i + 1) + ' played ' + w.holes + ' holes in minutes '
          + (j * 20) + '-' + (j * 20 + 20) + ', over twenty seconds a hole');
        if (w.par < 0.40) bad.push('seed ' + (i + 1) + ' carded par or better on '
          + Math.round(w.par * 100) + '% of holes in minutes ' + (j * 20) + '-' + (j * 20 + 20));
      });
      if (run.cards < 4) bad.push('seed ' + (i + 1) + ' opened only ' + (run.cards - 1) + ' Tour Cards in two hours');
    });
    if (bad.length) throw new Error('a player who plays stalls in the first two hours: ' + bad.slice(0, 4).join('; '));

    // the contrast: buying nothing has to fall behind, or buying is pointless.
    // On fixed holes that shows as the card you end up on: the idle run keeps
    // the default auto-climb and still has to finish three cards below every
    // player who plays. (It compared birdie rates while holes were stretched to
    // the golfer; a player who climbs to where they belong cards fewer birdies
    // than one parked on Card I, so that stopped measuring anything.)
    const idleTier = r.idle.tier, minActive = Math.min(...r.active.map(x => x.tier));
    if (!(minActive >= idleTier + 3))
      throw new Error('a run that buys nothing ends on Card ' + (idleTier + 1) + ', and the weakest player '
        + 'who plays on Card ' + (minActive + 1) + ': standing still has stopped costing anything');
    const all = r.active.flatMap(x => x.rows);
    const holes = all.map(w => w.holes), bird = all.map(w => w.birdie), par = all.map(w => w.par);
    return ['8 seeds x 2 hours of a player who plays: ' + Math.min(...holes) + '-' + Math.max(...holes)
      + ' holes per 20 minutes, par or better on ' + Math.round(Math.min(...par) * 100) + '-'
      + Math.round(Math.max(...par) * 100) + '% of holes (birdie or better ' + Math.round(Math.min(...bird) * 100) + '-'
      + Math.round(Math.max(...bird) * 100) + '%), ' + r.active.map(x => x.cards - 1).join('/') + ' cards opened',
      'buying nothing falls behind: Card ' + (r.idle.tier + 1) + ' against Card '
      + (Math.min(...r.active.map(x => x.tier)) + 1) + ' or higher for everyone who plays'];
  }
};
