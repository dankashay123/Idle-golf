/* Things on the water stay where they are on the course as he walks (the
 * user: "raindrops on water don't stay anchored and move with the player";
 * the rain's rings and the ripples' lines were picked by the screen's row
 * and column, so they slid along with him).
 *
 *   - the same moment seen from two places a stride apart: every rain ring
 *     in view from both is the same drop at the same place on the course
 *   - the ripples' lines: those in view from both are at the same lines of
 *     the course (a line seen from one is seen from the other, at the same
 *     place within a line's spacing)
 *   - rings drawn at all, on the island's lake and the river */
'use strict';
module.exports = {
  name: 'anchored',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { rows: [] }, SNAP = JSON.stringify(S);
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      try {
        for (const go of ['isle', 'stones']) {
          STORM_FORCE = true; S.chaos = { n: 'Crosswind' }; DEV[go](); hideSheet(); Scene.announce = null; const D = derive(), W = Scene.water;
          const at = W.d - W.rd - 3;
          const look = cam => { Scene._anchorLog = []; Scene.t = 7.3; Scene.camD = cam; Scene.walkTo = cam; Scene.rain = 1; Scene.draw(0, D); Scene.t = 7.3; Scene._anchorLog = []; Scene.draw(0, D); const L = Scene._anchorLog; Scene._anchorLog = null; return L; };
          const A = look(at), B = look(at + 1.2);
          const ra = new Map(A.filter(e => e.w === 'ring').map(e => [e.q, e])), rb = B.filter(e => e.w === 'ring');
          let both = 0, moved = 0; for (const e of rb) { const a = ra.get(e.q); if (!a) continue; both++; if (Math.abs(a.d - e.d) > 1e-9 || Math.abs(a.x - e.x) > 1e-9) moved++; }
          const ka = new Map(A.filter(e => e.w === 'rip').map(e => [e.k, e.d])), kb = B.filter(e => e.w === 'rip');
          const dA = A.filter(e => e.w === 'rip').map(e => e.d), lo = Math.max(Math.min(...dA), Math.min(...kb.map(e => e.d))) + 1, hi = Math.min(Math.max(...dA), Math.max(...kb.map(e => e.d))) - 1;
          const kin = kb.filter(e => e.d > lo && e.d < hi), kmiss = kin.filter(e => !ka.has(e.k) || Math.abs(ka.get(e.k) - e.d) > 0.9 / RIP_K).length;
          o.rows.push(go + ': rings ' + ra.size + '/' + rb.length + ', ' + both + ' in both, ' + moved + ' moved; ripple lines ' + kin.length + ' in both views, ' + kmiss + ' not in the other');
          if (!ra.size || !rb.length) f(go + ': no rain rings drawn');
          if (both < 3) f(go + ': only ' + both + ' rings seen from both places');
          if (moved) f(go + ': ' + moved + ' rings moved on the course as he walked');
          if (kin.length && kmiss > kin.length * 0.34) f(go + ': ' + kmiss + ' of ' + kin.length + ' ripple lines not where they were');
        }
      } finally { STORM_FORCE = null; ISLE_FORCE = 0; STONES_FORCE = 0; Scene._anchorLog = null; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the rain\'s rings and the ripples fixed to the course from two places a stride apart: ' + r.o.rows.join('; ')];
  }
};
