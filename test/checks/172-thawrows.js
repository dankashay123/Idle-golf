/* The thaw's floes whole near at hand (the user: "when it's passed by, it
 * turns into thin lines prior to going off screen"; they were laid on one
 * row a slice of water, and near at hand a slice is many rows).
 *
 *   - walking past the water, over the nearer half of the rows the floes
 *     reach, rows with them and rows without change over no more than one
 *     row in four (a frame with the thaw against the same frame without)
 *   - they thin out toward each end of the water, so they give out ragged
 *     short of where its bank runs straight across: the rows within a pace
 *     of the water's near start hold under half the floes of its middle */
'use strict';
module.exports = {
  name: 'thawrows',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { gaps: [] }, keepH = HOUR_FORCE;
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      const SNAP = JSON.stringify(S);
      try {
        HOUR_FORCE = 8; THAW_FORCE = true; DEV.waterHole(); hideSheet(); Scene.announce = null; const D = derive(), W = Scene.water;
        if (!W) throw new Error('no water hole');
        const shot = (at, on) => { Scene.thaw = on ? 0.5 : 0; Scene.t = 3; Scene.camD = at; Scene.walkTo = at; Scene.draw(0, D); Scene.thaw = on ? 0.5 : 0; Scene.draw(0, D); return Scene.b.getImageData(0, 0, VW, VH).data; };
        // (stripes: rows with floes and rows without, turn about; floes lie
        // in blobs, so whole they change over now and then, as lines often)
        for (const k of [4, 8, 12, 16, 20]) {
          const at = Math.max(0, W.d - W.rd + k), a = shot(at, true), b = shot(at, false);
          const rows = []; for (let y = HORIZON; y < VH; y++) { let n = 0; for (let x = 0; x < VW; x++) { const i = (y * VW + x) * 4; if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 30) n++; } rows.push(n > 0 ? 1 : 0); }
          const top = rows.indexOf(1), bot = rows.lastIndexOf(1);
          if (top < 0) continue;
          // (the nearer half of the rows they span, where a slice is many rows)
          const y0 = Math.round((top + bot) / 2); let flips = 0;
          for (let y = y0 + 1; y <= bot; y++) if (rows[y] !== rows[y - 1]) flips++;
          const span = bot - y0 + 1; o.gaps.push(k + ':' + flips + '/' + span);
          if (span >= 12 && flips > span * 0.25) f('at ' + k + ' past the water\'s start the floes in stripes: ' + flips + ' changes over ' + span + ' rows');
        }
        if (!o.gaps.length) f('no floes drawn');
        // fewer at the water's ends: the thinning, by the function itself
        { const L = Scene._iceR && [...Scene._iceR.entries()][0]; const P = L ? L[1].P : null;
          if (!P) f('no water rows recorded'); else {
            const w0 = W.d - W.rd + 2 * W.rd * P.e0 * 0.85, G = Scene.thawGrid(), cnt = dd => { let n = 0; for (let x = -6; x < 6; x += 0.05) if (G(x, dd) < 0.5 * (0.15 + 0.85 * Math.min(1, Math.max(0, (dd - w0 - 0.3) / 2.6)))) n++; return n; };
            let edge = 0, mid = 0; for (let j = 0; j < 10; j++) { edge += cnt(w0 + 0.1 * j); mid += cnt(W.d + j * 0.3); }
            o.ends = edge + '/' + mid; if (!(edge < mid * 0.5)) f('at the water\'s near start ' + edge + ' floes against ' + mid + ' in its middle'); } }
      } finally { THAW_FORCE = null; HOUR_FORCE = keepH; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the thaw\'s floes walking past the water, changes between floe and bare rows over the nearer half: ' + r.o.gaps.join(', ') + '; at the near start against the middle ' + r.o.ends];
  }
};
