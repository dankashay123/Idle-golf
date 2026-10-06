/* The signature holes' own ground kept clear (the user saw bunkers run in
 * under Golden Hour's mountain; the island, sea stack, canyon, railway and
 * river looked over the same way).
 *
 *   - no bunker's outline within a stride of the canyon, the railway, the
 *     river, the island's or the sea stack's water (they ran to the rim, cut)
 *   - no frost speck or fallen leaf laid on them (they lay across the gorge,
 *     the rails and the river), but on the island's and sea stack's own ground
 *   - no lake beside a canyon or the railway (it ran across, cut off by
 *     them, an alligator over the drop)
 *   - and each kind still has its bunkers */
'use strict';
module.exports = {
  name: 'sigclear',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = {}, SNAP = JSON.stringify(S);
      try {
        hideSheet();
        for (let h = 1; h <= 3000; h++) {
          const k = sigKind(h); if (!k) continue; const O = o[k] = o[k] || { n: 0, bk: 0 }; if (O.n >= 40) continue; O.n++;
          S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier); const W = Scene.water; O.bk += Scene.bunkers.length; if (!W) continue;
          for (const B of Scene.bunkers) if (Math.abs(B.d - W.d) < W.rd + B.rd * 1.25 + 0.5 && Math.abs(B.x - W.x) < W.rx + B.rx * 1.25 + 0.5) f(k + ' ' + h + ': a bunker at ' + B.d.toFixed(1) + ',' + B.x.toFixed(1) + ' runs to its ' + k);
          for (const q of Scene.props || []) if (q.kind === 6 && (W.lake ? Scene.wetAt(W, q.d, q.x) : Math.abs(q.d - W.d) < W.rd && Math.abs(q.x - W.x) < W.rx)) { f(k + ' ' + h + ': a frost speck on its ' + k + ' at ' + q.d.toFixed(1) + ',' + q.x.toFixed(1)); break; }
          if ((W.canyon || W.rail) && (Scene.fills || []).some(F => F.kind === 'lake')) f(k + ' ' + h + ': a lake beside it');
        }
        for (const k of ['island', 'pier', 'canyon', 'stones', 'rail']) { const O = o[k]; if (!O || O.n < 10) f('only ' + (O ? O.n : 0) + ' ' + k + ' holes'); else if (O.bk < O.n * 2) f(k + ': only ' + O.bk + ' bunkers on ' + O.n + ' holes'); }
      } finally { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['signature holes kept clear: ' + Object.entries(r.o).map(([k, O]) => k + ' ' + O.n + ' holes, ' + O.bk + ' bunkers').join(', ') + '; no bunker within a stride of the feature, no frost or leaf on it, no lake by a canyon or the railway'];
  }
};
