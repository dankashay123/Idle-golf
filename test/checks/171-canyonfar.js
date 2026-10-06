/* The canyon whole from the tee (the user: its graphics "render constantly
 * until crossed"; far off it was sampled every half pace or so, and how
 * often changed as he walked, so its walls came and went).
 *
 *   - from the tee and at every point on the way to its bank, the canyon is
 *     drawn at every sixteenth of a pace across it that is in view
 *   - and a frame at the tee costs no more than 1.6 times a plain hole's */
'use strict';
module.exports = {
  name: 'canyonfar',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { got: [] }, keepH = HOUR_FORCE;
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
      const SNAP = JSON.stringify(S), keep = Scene.hazSlice;
      try {
        HOUR_FORCE = 12; DEV.canyon(); hideSheet(); Scene.announce = null; const D = derive(), W = Scene.water;
        if (!W || !W.canyon) throw new Error('no canyon');
        let seen;
        Scene.hazSlice = function (c, T, hz, P, d) { if (hz && hz.canyon) seen.add(Math.round(d * 16)); return keep.apply(this, arguments); };
        for (const at of [0, 3, 7, 11, 15, 19]) {
          seen = new Set(); Scene.t = 3; Scene.camD = at; Scene.walkTo = at; Scene.draw(0, D);
          // (the sixteenths across it in front of the near rim's view: past
          // its middle the far wall hides the floor, but each is still drawn)
          let want = 0, have = 0;
          for (let k = Math.ceil((W.d - W.rd) * 16) + 1; k < Math.floor((W.d + W.rd) * 16); k++) { if (!Scene.hazSpan(W, k / 16)) continue; want++; if (seen.has(k)) have++; }
          o.got.push(at + ':' + have + '/' + want);
          if (!(have >= want * 0.95)) f('from ' + at + ' the canyon drawn at ' + have + ' of ' + want + ' sixteenths');
        }
        Scene.hazSlice = keep;
        // the cost: the quickest of several blocks at the tee, against a plain hole's
        const time = () => { let best = 1e9; for (let b = 0; b < 5; b++) { const t0 = performance.now(); for (let i = 0; i < 8; i++) { Scene.t = 3 + i * 0.01; Scene.camD = 0; Scene.draw(0, D); } best = Math.min(best, performance.now() - t0); } return best / 8; };
        const tc = time(); S.chaos = { n: 'Fair' }; Scene.newHole(S.hole + 1, S.tier); Scene.announce = null; const tp = time();
        o.ms = [tc, tp].map(v => v.toFixed(1));
        if (tc > tp * 1.6 + 1) f('a canyon tee frame ' + tc.toFixed(1) + 'ms against a plain one\'s ' + tp.toFixed(1));
      } finally { Scene.hazSlice = keep; HOUR_FORCE = keepH; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the canyon drawn at every sixteenth across it from the tee on: ' + r.o.got.join(', ') + '; a tee frame ' + r.o.ms[0] + 'ms, a plain hole ' + r.o.ms[1] + 'ms'];
  }
};
