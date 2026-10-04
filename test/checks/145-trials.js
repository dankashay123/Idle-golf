/* Trials, challenge cards (the user picked them from the menu): nine holes
 * on your best card with a handicap; par or better keeps a small bonus for
 * good; three tiers each, opening at Cards 25, 75 and 150.
 *
 *   - started only on your best card, with the next tier open, one at a time
 *   - the handicap in the golfer while it is on, never in a catch-up
 *   - nine holes judged: par or better keeps a tier, worse keeps nothing;
 *     gone down to an easier card, it is off
 *   - the bonus kept is small (6% at most a stat) and in the golfer
 *   - a broken save repaired */
'use strict';
module.exports = {
  name: 'trials',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), tw = window.toast;
      try {
        hideSheet(); window.toast = () => {}; delete S.chal; delete S.chalDone;
        S.tierMax = 10; S.tier = 10; if (chalStart('short')) f('started below Card 25');
        S.tierMax = 30; S.tier = 29; if (chalStart('short')) f('started off the best card');
        S.tier = 30; const p0 = derive().pow;
        if (!chalStart('short')) f('could not start on the best card at Card 31');
        if (chalStart('legs')) f('two at once');
        const p1 = derive().pow; if (Math.abs(p1 / p0 - 0.33) > 1e-6) f('Short Bag left power x' + (p1 / p0));
        OFFLINE = true; const p2 = derive().pow; OFFLINE = false; if (Math.abs(p2 / p0 - 1) > 1e-6) f('the handicap in a catch-up: x' + (p2 / p0));
        // nine holes at par or better: a tier kept
        for (let i = 0; i < 8; i++) chalHole(i === 0 ? -1 : 0);
        if (!S.chal) f('done before nine'); chalHole(0);
        if (S.chal) f('still on after nine'); if (chalDone('short') !== 1) f('par or better kept ' + chalDone('short') + ' tiers');
        const p3 = derive().pow; if (Math.abs(p3 / p0 - 1.02) > 1e-6) f('a tier of Short Bag gives x' + (p3 / p0));
        // tier 2 needs Card 75
        if (chalStart('short')) f('tier 2 started below Card 75');
        // worse than par: nothing
        chalStart('legs'); for (let i = 0; i < 9; i++) chalHole(i < 2 ? 1 : 0);
        if (chalDone('legs')) f('over par kept a tier');
        // an easier card: off
        chalStart('yips'); chalHole(0); S.tier = 20; chalHole(-3); if (S.chal) f('still on after going down a card'); S.tier = 30;
        // the Yips and Lost Balls
        chalStart('yips'); if (derive().crit !== 0) f('the Yips left pure strikes at ' + derive().crit); chalQuit();
        chalStart('lost'); if (derive().mst !== 0) f('Lost Balls left provisionals at ' + derive().mst); chalQuit();
        // at the top: 6% at most
        S.chalDone = {}; B.CHAL.forEach(c => S.chalDone[c.id] = 3);
        for (const k of ['pow', 'spd', 'cpw', 'gold', 'elem']) if (chalBonus(k) > 0.0901) f(k + ' kept at the top: +' + chalBonus(k));
        // repair
        S.chal = { id: 'nope', n: 0, sum: 0, c: 1 }; S.chalDone = { short: 9, nope: 1, legs: -1 }; migrate();
        if (S.chal) f('a made-up trial kept'); if (JSON.stringify(S.chalDone) !== '{"short":3}') f('tiers repaired to ' + JSON.stringify(S.chalDone));
        // the panel
        setView('upg'); rangeSub = 'chal'; renderRangeNav(); if (document.querySelectorAll('#chalRows .row').length !== B.CHAL.length) f('the Trials list shows ' + document.querySelectorAll('#chalRows .row').length);
      } finally { window.toast = tw; OFFLINE = false; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); rangeSub = 'upg'; renderRangeNav(); }
      return fails;
    });
    if (r.length) throw new Error(r.join('; '));
    return ['started on the best card with its tier open, one at a time; the handicap live only; nine holes judged, par or better kept; off on an easier card; small at the top; repaired'];
  }
};
