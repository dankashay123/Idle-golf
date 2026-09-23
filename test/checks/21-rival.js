/* The rival: one named golfer per event, set off your own recent form.
 *
 *   - the same golfer on the same total all event, whatever reloads: seeded
 *     by the event, and made on its first hole whether or not anyone opens
 *     the Tour tab (made only when the tab was drawn, a player who never
 *     opened it had no rival at all)
 *   - beating them pays RIVAL_SOV once and counts toward the daily; losing,
 *     tying, or an event resolved during a catch-up pays nothing and teaches
 *     the form nothing (a catch-up posts level par for every event)
 *   - a mangled rival in a save is thrown away and rebuilt
 *   - and they are beatable about half the time: eight seeds of three hours
 *     played for real must land between 40% and 65% overall (48% with holes
 *     fixed to their card; 35% once, centred on form alone, while a card's
 *     holes grew across its events).
 */
'use strict';
module.exports = {
  name: 'rival',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}; const SNAP = JSON.stringify(S); const real = Math.random;
      QUIET = true;
      try {
        // ---- the same rival all event --------------------------------------
        const a = rivalNow(); const n1 = a.n + ' ' + a.total;
        S.rival = null; startHole(); const b = S.rival;
        o.same = b && (b.n + ' ' + b.total) === n1;
        o.onTab = (() => { renderTour(); return document.getElementById('cardBox').textContent.indexOf(a.n) >= 0; })();

        // ---- paid when beaten, and only then --------------------------------
        // below the highest card, so no event here opens a card, which pays
        // sovereigns of its own and would be counted as the rival's
        S.tier = 0; S.tierMax = 5; startHole();
        const endWith = (score, total, offline) => {
          const t = tournamentOf(S.hole);
          S.rival = { t, n: B.RIVALS[0], total };
          S.hole = t * B.ROUND * B.DAYS + 1; S.tourScore = score;
          const s0 = S.sov || 0, r0 = S.tally.rivals || 0, f0 = S.form;
          OFFLINE = !!offline;
          try { endTournament(); } finally { OFFLINE = false; hideSheet(); }
          startHole();
          return { paid: (S.sov || 0) - s0, counted: (S.tally.rivals || 0) - r0, formMoved: S.form !== f0 };
        };
        o.win = endWith(-50, -40); o.lose = endWith(-30, -40); o.tie = endWith(-40, -40); o.away = endWith(-90, -40, true);
        o.want = B.RIVAL_SOV;

        // ---- a mangled rival is rebuilt ---------------------------------------
        o.mangled = [];
        for (const bad of [5, { t: 1, n: 'Nobody', total: -3 }, { t: 1, n: B.RIVALS[1], total: 'x' }]) {
          S.rival = bad; initState(); if (S.rival) o.mangled.push(JSON.stringify(bad));
        }

        // ---- beatable about half the time ------------------------------------
        let events = 0, beaten = 0;
        for (const sd of [1, 2, 3, 4, 5, 6, 7, 8]) {
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
          while (t < 3 * 3600) { step(B.TICK_MAX, derive()); t += B.TICK_MAX; if ((t % 20) < B.TICK_MAX) shop(); }
          events += S.eventsPlayed; beaten += S.tally.rivals || 0;
        }
        o.events = events; o.beaten = beaten;
      } finally {
        Math.random = real; QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); hideSheet();
      }
      return o;
    });

    if (!r.same) throw new Error('a reload gave the event a different rival or total');
    if (!r.onTab) throw new Error('the Tour tab does not show the rival');
    if (r.win.paid !== r.want || r.win.counted !== 1)
      throw new Error('beating the rival paid ' + r.win.paid + ' and counted ' + r.win.counted + '; it should pay ' + r.want + ' and count 1');
    for (const [k, x] of [['losing', r.lose], ['a tie', r.tie]])
      if (x.paid || x.counted) throw new Error(k + ' to the rival paid ' + x.paid + ' and counted ' + x.counted);
    if (r.away.paid || r.away.counted || r.away.formMoved)
      throw new Error('an event resolved while away paid the rival ' + r.away.paid + ', counted ' + r.away.counted
        + (r.away.formMoved ? ', and moved the form off a level-par card nobody played' : ''));
    if (!r.win.formMoved) throw new Error('a finished card did not move the form the next rival is set from');
    if (r.mangled.length) throw new Error('a mangled rival survived a load: ' + r.mangled.join('; '));
    const rate = r.beaten / r.events;
    if (!(rate >= 0.40 && rate <= 0.65))
      throw new Error('the rival was beaten in ' + r.beaten + ' of ' + r.events + ' events (' + Math.round(rate * 100)
        + '%) over eight seeds of three hours; it should be about half, between 40% and 65%');

    return ['same rival all event, made on the first hole, shown on the Tour tab',
      'beaten pays ' + r.want + ' once; a loss, a tie or an event resolved away pays nothing and moves no form',
      'beaten in ' + r.beaten + ' of ' + r.events + ' events (' + Math.round(rate * 100) + '%) over 8 seeds x 3 hours'];
  }
};
