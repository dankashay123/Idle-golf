/* The tee shot and the walk (the user: "sometimes the golfer will hit the
 * ball barely in front of them off the tee box, then hits another ball.
 * Sometimes after hitting a short ball off the tee box makes him teleport
 * to where the ball should have gone"). On a strong bag the yardage ran
 * far ahead of him and the camera carried him down the fairway in his
 * backswing; the ball then flew only what was left.
 *
 *   - played on bags from plain to strong, at 60 and at 30 frames a
 *     second: he never moves while he swings, and no tee shot comes down
 *     a few steps off the tee unless the hole itself is only that long
 */
'use strict';
module.exports = {
  name: 'teeshot',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], rows: [] }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const mr = Math.random, raf = window.requestAnimationFrame, pn = performance.now.bind(performance), keep = window.step, ol = Scene.launch;
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0; FROST_FORCE = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 5; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (const [lv, fps] of [[0, 60], [15, 30], [25, 60], [40, 30], [200, 60]]) {
          DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
          for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), lv);
          startHole();
          let slid = 0, short = 0, tees = 0;
          Scene.launch = function () { const tee = !this.shotN; ol.apply(this, arguments); const bb = this.balls[this.balls.length - 1];
            if (tee && bb) { tees++; if (!bb.cup && bb.dist < 3 && this.pinD() > 6) short++; } };
          for (let i = 0; i < fps * 30; i++) {
            fake += 1000 / fps; const D = derive(); keep(1 / fps, D);
            const c0 = Scene.camD, h0 = Scene.hole, sw = Scene.swingT > 0 && 1 - Scene.swingT / Scene.swingDur < 0.7;
            Scene.draw(1 / fps, D);
            if (sw && Scene.hole === h0 && Scene.camD - c0 > 0.01) slid++;
          }
          Scene.launch = ol;
          o.rows.push('bag ' + lv + ' at ' + fps + 'fps: ' + tees + ' tee shots');
          if (tees < 3) f('bag ' + lv + ': only ' + tees + ' tee shots');
          if (slid) f('bag ' + lv + ' at ' + fps + 'fps: carried on ' + slid + ' frames in his swing');
          if (short) f('bag ' + lv + ' at ' + fps + 'fps: ' + short + ' tee shots came down within 3 of the tee');
        }
      } finally {
        Scene.launch = ol; Math.random = mr; window.requestAnimationFrame = raf; performance.now = pn; window.step = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return [r.rows.join('; ') + '; never carried on in his swing, no tee shot dribbled'];
  }
};
