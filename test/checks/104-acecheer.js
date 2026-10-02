/* An ace's celebration, his and hers (the user asked for his too, and
 * "make sure the animation never bleeds into the next hole"):
 *
 *   - played on a strong bag that aces, as him and as her: each ace has
 *     its celebration (his leap and fist pump, her twirl and hop), it has
 *     finished moving before the hole is over, and nothing of it is drawn
 *     once the next hole has begun, whether or not the course has caught
 *     up with the new hole
 *   - a hole that is not an ace has no ace celebration
 *   - drawn: the leap lifts him off the tee and back, the shadow stays
 *     put, and each frame differs from him standing
 */
'use strict';
module.exports = {
  name: 'acecheer',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], aces: {}, frames: {} }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const mr = Math.random, raf = window.requestAnimationFrame, pn = performance.now.bind(performance), keep = window.step;
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0; FROST_FORCE = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 77; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (const g of ['m', 'f']) {
          S.gender = g; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites();
          DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
          for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 60);
          S.trail = 'plain'; startHole();
          const want = g === 'm' ? 'hisace' : 'herace';
          let at = S.hole, seen = 0, lastT = -1, holes = 0, aces = 0, bleed = 0, early = 0, wrong = 0, notAce = 0, aceHole = false;
          for (let i = 0; i < 60 * 30; i++) {
            fake += 1000 / 60; const D = derive(); keep(1 / 60, D);
            if (S.hole !== at) {
              holes++; if (aceHole) { aces++; if (lastT < CELEB_END) early++; }
              at = S.hole; seen = 0; lastT = -1; aceHole = false;
              // straight after the hole moves on, before the course has drawn it
              const G0 = Scene.golferPose(); if (G0.her || G0.leap) bleed++;
            }
            Scene.draw(1 / 60, D);
            const G = Scene.golferPose();
            if (G.her) {
              if (Scene.hole !== S.hole) bleed++;
              if (G.her.kind === want) { aceHole = true; lastT = Math.max(lastT, G.her.t); if (!Scene.aceHold(D)) notAce++; }
              else if (G.her.kind === 'hisace' || G.her.kind === 'herace') wrong++;
            }
          }
          o.aces[g] = aces + ' of ' + holes;
          if (aces < 3) f((g === 'm' ? 'him' : 'her') + ': only ' + aces + ' ace celebrations in 30s on a strong bag that aces');
          if (early) f((g === 'm' ? 'his' : 'her') + ' celebration still moving when ' + early + ' holes ended');
          if (bleed) f((g === 'm' ? 'his' : 'her') + ' celebration seen on the next hole in ' + bleed + ' frames');
          if (wrong) f('the other golfer\'s celebration came up ' + wrong + ' times');
          if (notAce) f('a celebration on a hole that was not an ace (' + notAce + ' frames)');
        }
        // ---- drawn: lifted and back, shadow put ----
        for (const [g, kind] of [['m', 'hisace'], ['f', 'herace']]) {
          S.gender = g; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites();
          let peak = 0, end = 0;
          for (const t of [0, 0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 1.0, 2.0]) { const lp = celebLift(kind, t); peak = Math.max(peak, lp); if (t >= CELEB_END) end = Math.max(end, lp); }
          if (peak < 0.08) f(kind + ' leaps only ' + peak.toFixed(2) + ' of his height');
          if (end) f(kind + ' still off the ground after it ends');
          const h = 60, spr = SPRITE.gFinish, w = Math.round(h * spr.w / spr.h), W = 200, H = 240, X = 70, Y = 140;
          const draw = P => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
            HER_POSE = P; try { paintGolfer(c, X, Y, w, h, 0, 1, Y + h, false, 0, spr, [], undefined, true, 0); } finally { HER_POSE = null; }
            return c.getImageData(0, 0, W, H).data; };
          const plain = draw(null);
          for (const t of [0.05, 0.3, 0.6, 1.5]) { const d = draw({ kind, t }); let diff = 0, below = 0;
            for (let i = 0; i < d.length; i += 4) { if (d[i + 3] !== plain[i + 3] || d[i] !== plain[i]) diff++; if (d[i + 3] && ((i >> 2) / W | 0) > Y + h + 1) below++; }
            if (diff < 25) f(kind + ' at ' + t + 's draws only ' + diff + ' pixels unlike standing');
            if (below) f(kind + ' at ' + t + 's: ' + below + ' pixels below the feet'); }
        }
      } finally {
        Math.random = mr; window.requestAnimationFrame = raf; performance.now = pn; window.step = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['ace celebrations played (aces of holes): him ' + r.aces.m + ', her ' + r.aces.f + '; each still before its hole ends, none on the next',
      'his leap and hers come back to the ground; each frame drawn unlike standing'];
  }
};
