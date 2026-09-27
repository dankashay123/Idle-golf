/* No turf through a bunker (found looking over every course: white sand
 * speckled with dots of the grass under it). A hazard is painted a column
 * at a time, and its columns fall a little further across from one slice
 * to the next as it narrows away: the pixel between two was never painted.
 *
 *   - every course, three holes, three places down each: with every
 *     hazard's surface painted one colour, no single pixel of anything else
 *     is left inside it (the same colour either side of it and above and
 *     below): three at the most in a view, where a bunker and a pond cross
 *     (it was five to nine a view on most courses), forty in all
 *   - and there are hazards to look at
 */
'use strict';
module.exports = {
  name: 'sandholes',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, px: 0, holes: 0 }, step0 = window.step;
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const Ps = [P_SAND, P_WATER, P_ICE, P_LAKE, P_ICEL, P_CANYON, P_RAIL], keep = Ps.map(P => P.tone), keepR = Scene.ripples;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; S.saver = 0; FROST_FORCE = 0;
        Ps.forEach(P => { P.tone = () => '#FF00FF'; });
        // (the glints on the water are laid over it on purpose)
        Scene.ripples = () => {};
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); try { hideSheet(); } catch (e) {}
          const first = S.hole;
          for (const hn of [2, 5, 8]) for (const f0 of [0, 0.4, 0.8]) {
            S.hole = first + hn - 1; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null;
            const cam = f0 * (Scene.pinD() - 6); Scene.camD = cam; Scene.walkTo = cam; Scene.t = 30;
            Scene._gKey = []; Scene.drawGround();
            const a = new Uint32Array(Scene.b.getImageData(0, 0, VW, VH).data.buffer), M = 0xFFFF00FF;
            o.views++;
            let n = 0, holes = 0;
            for (let y = 1; y < VH - 1; y++) for (let x = 1; x < VW - 1; x++) {
              const i = y * VW + x;
              if (a[i] === M) { n++; continue; }
              if (a[i - 1] === M && a[i + 1] === M && a[i - VW] === M && a[i + VW] === M) holes++;
            }
            o.px += n; o.holes += holes;
            if (holes > 3) f(B.COURSE[ci].n + ' hole ' + hn + ' from ' + cam.toFixed(0) + ': ' + holes + ' pixels of turf inside a hazard');
          }
        }
        if (o.holes > 40) f('in all ' + o.holes + ' pixels of turf inside hazards');
        if (o.px < 20000) f('only ' + o.px + ' pixels of hazards to look at');
      } finally {
        Ps.forEach((P, i) => { P.tone = keep[i]; }); Scene.ripples = keepR;
        window.step = step0; FROST_FORCE = null; Scene._gKey = [];
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.views + ' views: ' + r.px + ' pixels of bunkers and water, ' + r.holes + ' single pixels of turf inside them'];
  }
};
