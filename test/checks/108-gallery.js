/* The final day's gallery (the user picked it from the menu): on the last
 * three holes of an event's final day, ropes down both sides of the fairway
 * and a crowd behind them.
 *
 *   - laid on those holes only: not on the same holes the day before, not
 *     on the final day's earlier holes, not on a signature hole
 *   - ropes run both sides and stop at a hazard; nobody stands in one, on
 *     the fairway or the green, or inside the ropes short of the green
 */
'use strict';
module.exports = {
  name: 'gallery',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], holes: 0, crowd: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet();
        const lay = h => { S.hole = h; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier); return Scene.props; };
        let h = S.hole, seen = 0, sig = 0;
        for (let k = 0; k < 4000 && seen < 8; k++, h++) {
          if (!isSunday(h) || holeInRound(h) <= B.ROUND - GALLERY_HOLES) continue;
          if (sigKind(h)) { if (sig++ < 2 && lay(h).some(p => p.kind === 2)) f('ropes on the signature hole ' + h); continue; }
          seen++;
          const P = lay(h), posts = P.filter(p => p.kind === 2), spans = posts.filter(p => p.nd !== undefined);
          const crowd = P.filter(p => p.kind === 1 && p.extra && p.d < LEN - 6);
          o.crowd.push(crowd.length);
          if (spans.length < 2) f('hole ' + h + ' (' + holeInRound(h) + ' on the final day) has ' + spans.length + ' rope spans');
          for (const s of [-1, 1]) if (!posts.some(p => Math.sign(p.x) === s)) f('hole ' + h + ' has no rope on its ' + (s < 0 ? 'left' : 'right'));
          if (crowd.length < 25) f('hole ' + h + ' has ' + crowd.length + ' behind the ropes');
          for (const p of posts) if (Scene.hitsHazard(p.d, p.x, 0.3)) f('a rope post in a hazard on hole ' + h);
          for (const p of P.filter(q => q.kind === 1)) {
            if (Scene.hitsHazard(p.d, p.x, 0.3)) f('a spectator in a hazard on hole ' + h + ' at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1));
            if (p.d < LEN && Scene.onPlay(p.d, p.x, 0)) f('a spectator on the short grass on hole ' + h + ' at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1) + (p.extra ? ' (new)' : '') + ' of ' + LEN);
            if (p.d < LEN - 6 && Math.abs(p.x) < Scene.fwWidth(p.d) + 1.3) f('a spectator inside the ropes on hole ' + h + ' at ' + p.d.toFixed(1));
          }
        }
        o.holes = seen;
        // none on the other holes: the day before, and earlier on the day
        let none = 0;
        for (let k = 0, g = S.hole; k < 4000 && none < 6; k++, g++) {
          const rd = holeInRound(g);
          const before = !isSunday(g) && rd > B.ROUND - GALLERY_HOLES, early = isSunday(g) && rd <= B.ROUND - GALLERY_HOLES && rd > 10;
          if (!before && !early) continue;
          none++;
          if (galleryHole(g)) f('hole ' + g + ' counted as a gallery hole');
          if (lay(g).some(p => p.kind === 2)) f('ropes on hole ' + g + ' (' + (before ? 'the day before' : rd + ' on the final day') + ')');
        }
        if (seen < 8) f('only ' + seen + ' final-day holes found');
      } finally {
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['on ' + r.holes + ' final-day holes: ropes both sides, ' + Math.min(...r.crowd) + ' to ' + Math.max(...r.crowd) + ' behind them, nobody in a hazard, on the short grass or inside the ropes',
      'none the day before, earlier on the final day or on a signature hole'];
  }
};
