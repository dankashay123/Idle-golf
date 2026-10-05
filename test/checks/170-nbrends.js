/* The other holes beside this one end round, not in a straight line across
 * (the user: "sometimes adjacent holes cut off to a hard line").
 *
 *   - another hole's fairway, at each end in view, narrows to a round end:
 *     at its last twentieth of a pace under 40% of its width
 *   - a wood across another hole's strip the same where it starts or ends
 *   - and it runs on under the fairway's or green's end, so no rough lies
 *     bare between them (the `course` check measures the rough) */
'use strict';
module.exports = {
  name: 'nbrends',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { ends: 0, woods: 0, worst: 0 };
      const SNAP = JSON.stringify(S);
      try {
        for (let h = 1; h <= 200; h++) {
          Scene.newHole(h, S.tier);
          for (const N of Scene.nbrs || []) {
            if (!(N.b > N.a)) continue;
            const full = Scene.nbrW(N, (N.a + N.b) / 2);
            for (const [d, at] of [[N.a + 0.05, N.a > -29], [N.b - 0.05, true]]) {
              if (!at) continue; o.ends++;
              const k = Scene.nbrW(N, d) * Scene.nbrQ(N, d) / full; o.worst = Math.max(o.worst, k);
              if (!(k < 0.4)) f('hole ' + h + ': another hole\'s fairway ' + (k * 100).toFixed(0) + '% wide at its end ' + d.toFixed(1));
            }
          }
          for (const F of Scene.fills || []) {
            if (!F.ring) continue; const N = F.ring;
            const full = 2 * Scene.nbrW(N, (F.d0 + F.d1) / 2) + 1.8;
            for (const [d, at] of [[F.d0 + 0.1, F.d0 > -39], [F.d1 - 0.1, F.d1 < Scene.back.d0 + 39.9]]) {
              if (!at) continue; o.woods++;
              const k = Scene.ringW(F, d) / full;
              if (!(k < 0.4)) f('hole ' + h + ': a wood across another hole ' + (k * 100).toFixed(0) + '% wide where it ends at ' + d.toFixed(1));
            }
            // (under its fairway's or green's end: full width where they end)
            if (F.d0 > -39 && N.hi < 1e8 && !(F.d0 <= N.hi - RING_ROUND + 0.01)) f('hole ' + h + ': a wood starts at ' + F.d0.toFixed(1) + ', past the end ' + N.hi.toFixed(1));
            if (F.d1 < Scene.back.d0 + 39.9 && N.lo > -1e8 && !(F.d1 >= N.lo + RING_ROUND - 0.01)) f('hole ' + h + ': a wood ends at ' + F.d1.toFixed(1) + ', short of ' + N.lo.toFixed(1));
          }
        }
        if (o.ends < 50 || o.woods < 50) f('only ' + o.ends + ' fairway ends and ' + o.woods + ' wood ends looked at');
      } finally { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['over 200 holes ' + r.o.ends + ' ends of other holes\' fairways (widest ' + (r.o.worst * 100).toFixed(0) + '% at its end) and ' + r.o.woods + ' of the woods across them, all rounded; the woods run on under the ends'];
  }
};
