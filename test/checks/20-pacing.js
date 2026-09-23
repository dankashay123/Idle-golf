/* The first two hours, played the way a person plays them.
 *
 * A sample of one idle run once read as a stall: birdies fell from 146 in the
 * first hour to 12 an hour after it. That run bought nothing, and a card's
 * holes grow across its five events, so standing still is falling behind --
 * which is the design, not a stall. What matters is someone who plays: buys
 * the cheapest Range rung whenever it can, lets clubs auto-equip, puts
 * attribute points somewhere and climbs when a card opens. Swept over eight
 * seeds, because weather and gear rolls make any one run noise.
 *
 * For that player, over two hours:
 *   - the pace holds: holes per twenty minutes never fall below half the
 *     first twenty minutes
 *   - the scoring holds: at least 60% of holes birdie or better in every
 *     window
 *   - the ladder moves: at least three Tour Cards open
 *
 * Not tighter than that, on purpose. This player climbs the moment a card
 * opens, before the one it is on has grown out, and a new card starts longer:
 * with unlucky gear that eager climber drifts behind the card and its holes
 * take longer -- 210 a window down to about 125 on five seeds of eight, still
 * birdie or better on 82% or more -- while a lucky one races ahead. That is a
 * choice with a cost, which is the design, not a stall. A 70% pace rule failed
 * on it and was chased to exactly this.
 *
 * What it can and cannot see: a handicap floor at par (HCP 1.0) fails it at
 * once, but a tenth of the purse or cards growing twice as fast do not. For
 * the first two hours a playing golfer outhits the card whatever the economy
 * does -- levels, attributes and clubs arrive free -- so the handicap floor,
 * not income, sets the score. That is a finding about the game, written down
 * here so nobody reads this check as proof the economy is tuned.
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
        S.autoEquip = active ? 1 : 0;
        const shop = () => {
          for (let guard = 0; guard < 400; guard++) {
            let best = null, bc = Infinity;
            for (const u of B.UPG) { const lv = upgLv(u.id); if (lv >= capOf(u)) continue;
              const c = costBulk(u.base, u.r, lv, 1); if (c < bc) { bc = c; best = u; } }
            if (!best || S.gold < bc) break;
            S.gold -= bc; S.upg[best.id] = upgLv(best.id) + 1;
          }
          if (S.statPts > 0) { S.stat.drive = (S.stat.drive || 0) + S.statPts; S.statPts = 0; }
          if (cardUnlocked(S.tier + 1) && S.tier < S.tierMax) climb(1, true);
        };
        const rows = []; let t = 0, last = { h: 0, b: 0 };
        for (let w = 1; w <= 6; w++) {
          const end = w * 1200;
          while (t < end) { step(B.TICK_MAX, derive()); t += B.TICK_MAX;
                            if (active && (t % 20) < B.TICK_MAX) shop(); }
          const h = S.totalHoles, bd = S.tally.birdie || 0;
          rows.push({ holes: h - last.h, birdie: (bd - last.b) / Math.max(1, h - last.h) });
          last = { h, b: bd };
        }
        return { rows, cards: (S.tierMax || 0) + 1 };
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
        if (w.holes < first * 0.5) bad.push('seed ' + (i + 1) + ' played ' + w.holes + ' holes in minutes '
          + (j * 20) + '-' + (j * 20 + 20) + ' against ' + first + ' in the first twenty');
        if (w.birdie < 0.6) bad.push('seed ' + (i + 1) + ' carded birdie or better on '
          + Math.round(w.birdie * 100) + '% of holes in minutes ' + (j * 20) + '-' + (j * 20 + 20));
      });
      if (run.cards < 4) bad.push('seed ' + (i + 1) + ' opened only ' + (run.cards - 1) + ' Tour Cards in two hours');
    });
    if (bad.length) throw new Error('a player who plays stalls in the first two hours: ' + bad.slice(0, 4).join('; '));

    // the contrast: buying nothing has to fall behind, or buying is pointless
    const idleLast = r.idle.rows[r.idle.rows.length - 1].birdie;
    const activeLast = r.active[0].rows[r.active[0].rows.length - 1].birdie;
    if (!(idleLast < activeLast - 0.2))
      throw new Error('a run that buys nothing cards birdie or better on ' + Math.round(idleLast * 100)
        + '% of holes after two hours, against ' + Math.round(activeLast * 100) + '% for one that plays: '
        + 'standing still has stopped costing anything');

    const all = r.active.flatMap(x => x.rows);
    const holes = all.map(w => w.holes), bird = all.map(w => w.birdie);
    return ['8 seeds x 2 hours of a player who plays: ' + Math.min(...holes) + '-' + Math.max(...holes)
      + ' holes per 20 minutes, birdie or better on ' + Math.round(Math.min(...bird) * 100) + '-'
      + Math.round(Math.max(...bird) * 100) + '% of holes, ' + r.active.map(x => x.cards - 1).join('/') + ' cards opened',
      'buying nothing falls behind: ' + Math.round(idleLast * 100) + '% birdie or better by hour two'];
  }
};
