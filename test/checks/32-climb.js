/* Auto-climb judges the golfer, not the moment.
 *
 * It moves you up a card once the next card's holes, over a round, would
 * come in at CLIMB_FIT of par time. Everything that only lasts a while has to
 * be left out of that judgement, or a climb taken on it strands the golfer:
 *
 *   - the weather and the course's affinity for the ball: a frost ball on a
 *     frost course read four times the golfer's strength, the game climbed
 *     him on it, and he took four times par on every hole of the card after
 *   - timed lifts: skills, caddie perks and sponsor perks lifted him for
 *     seconds; one fired at the right moment climbed him to twice par
 *   - Punch Shot, which pays only when the weather lengthens a hole
 *
 * and Reachable in Two pays on par fives only, so it is counted on the par
 * fives of the round and nowhere else, whichever hole he is standing on.
 * Everything taken out for the judgement is put back afterwards.
 */
'use strict';
module.exports = {
  name: 'climb',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {};
      try {
        hideSheet(); QUIET = true;
        S.tier = 3; S.tierMax = 5; startHole();
        S.equip.ball = makeItem(S.tier, 0, 3, 'ball'); S.equip.ball.el = 'frost';
        const base = roundRatio(S.tier + 1), plain = derive().dps;   // measured before any luck
        // the luck of the moment, all at once
        S.buff = { cPow: { v: 500, t: 30 }, gale: { v: 300, t: 30 }, cSpd: { v: 200, t: 30 }, ace: { v: 0.5, t: 30 },
                   rally: { v: 200, t: 30 } };
        S.perkOn = {}; B.PERKS.forEach(p => { if (p.dur) S.perkOn[p.id] = p.dur; });
        S.stretched = true;
        S.chaos = Object.assign({}, B.CHAOS.find(c => c.n === 'Cart Path Only'), { n: 'Cart Path Only' });
        S.courseEl = 'frost';
        const lucky = derive().dps;
        o.luckBig = lucky / plain;                        // the luck is real...
        o.lifted = roundRatio(S.tier + 1) / base;         // ...and the judgement ignores it
        o.restored = !!S.buff.cPow && S.stretched === true && S.courseEl === 'frost'
          && S.chaos.n === 'Cart Path Only' && Object.keys(S.perkOn).length > 0 && derive().dps === lucky;
        S.buff = {}; S.perkOn = {}; S.stretched = false; S.chaos = null; S.courseEl = null;

        // Reachable in Two, on the par fives of the round only
        const reach = B.TREES.flatMap(t => t.t).find(t => t.k === 'par5');
        S.tal[reach.id] = reach.max;
        // the round worked out hole by hole, standing on each one in turn
        const first = S.hole - holeInRound(S.hole) + 1, h0 = S.hole;
        let want = 0, fives = 0; const dAt = {};
        for (let i = 0; i < B.ROUND; i++) { const h = first + i; S.hole = h; fives += parOf(h) === 5 ? 1 : 0;
          const d = derive().dps; dAt[parOf(h)] = d;
          want += yardageFor(h, S.tier + 1, STILL) / d / parTimeFor(h); }
        S.hole = h0; want /= B.ROUND; o.fives = fives;
        o.talent = (dAt[5] || 0) / (dAt[4] || 1);
        const onHole = h => { S.hole = h; return roundRatio(S.tier + 1); };
        const five = [...Array(B.ROUND).keys()].map(i => first + i).find(h => parOf(h) === 5);
        const other = [...Array(B.ROUND).keys()].map(i => first + i).find(h => parOf(h) !== 5);
        o.onFive = five ? onHole(five) / want : 1; o.onOther = onHole(other) / want;
      } finally {
        QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    if (!(r.luckBig > 2)) throw new Error('the lucky moment only lifted the golfer x' + r.luckBig.toFixed(2) + ', so this measured nothing');
    if (Math.abs(r.lifted - 1) > 1e-9)
      throw new Error('a lucky moment (x' + r.luckBig.toFixed(1) + ') moved the climb judgement by x' + r.lifted.toFixed(4));
    if (!r.restored) throw new Error('judging the climb left the weather, affinity, lifts or perks changed');
    if (!(r.talent > 1.5)) throw new Error('Reachable in Two at full rank lifted par fives only x' + r.talent.toFixed(2));
    if (!r.fives) throw new Error('the round tried has no par five, so this measured nothing');
    if (Math.abs(r.onFive - 1) > 1e-9 || Math.abs(r.onOther - 1) > 1e-9)
      throw new Error('with Reachable in Two the judgement read x' + r.onFive.toFixed(3) + ' from a par five and x'
        + r.onOther.toFixed(3) + ' from another hole, against the round worked out hole by hole');
    return ['a lucky moment (x' + r.luckBig.toFixed(1) + ': lifts, perks, weather, a matching course) leaves the climb judgement where it was, and is put back',
      'Reachable in Two counts on the round\'s ' + r.fives + ' par fives only, whichever hole he stands on'];
  }
};
