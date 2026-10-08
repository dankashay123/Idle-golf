/* The sky turns with the hole (the user: balloons, clouds and airplanes
 * stayed in the same place as he turned a corner; they would stay over
 * their own ground, as the cloud shadows do).
 *
 *   - on the tee the sky is where it always was (no slide)
 *   - round a bend the sky's clouds move across by the slide, the same
 *     picture shifted, and the slide is a real one (10px or more)
 *   - balloons, an airplane, a flock of birds and geese move with it (the
 *     user saw birds keep to the screen as he turned, as if following him)
 *   - the sky as built always covers the whole view, at every point of 60
 *     holes, at 320 and 440 wide and on its side
 *   - never in a wager */
'use strict';
module.exports = {
  name: 'skyturn',
  async run(page) {
    const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { gaps: [] };
    for (const [w, h] of [[320, 700], [440, 900], [844, 390]]) {
      await page.setViewportSize({ width: w, height: h }); await page.evaluate(() => window.dispatchEvent(new Event('resize'))); await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
        const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true; const keepH = HOUR_FORCE;
        const D = derive();
        const turnAt = d => (Scene.curveAt(d + 0.5) - Scene.curveAt(d - 0.5)) - (Scene.curveAt(0.5) - Scene.curveAt(-0.5));
        try {
          hideSheet(); HOUR_FORCE = 12; PLANE_FORCE = false; BALLOON_FORCE = false;
          // the sky covers the view everywhere
          let gaps = 0, best = { h: 0, d: 0, t: 0 };
          for (let h = 1; h <= 60; h++) {
            S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier); Scene.buildSky();
            if (!Scene.curve) continue;
            for (let d = 0; d < LEN; d += 1) {
              const t = Math.abs(turnAt(d)); if (t > best.t) best = { h, d, t };
              Scene.camD = d; const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; Scene.drawSky(cv.getContext('2d'));
              const x0 = -Scene.skyM + Scene.skySh; if (x0 > 0 || x0 + Scene.sky.width < VW) gaps++;
            }
          }
          o.gaps = gaps; if (gaps) f(gaps + ' points where the sky left a gap at the side');
          // clouds: the same picture moved by the slide
          S.chaos = { n: 'Fair' }; Scene.newHole(best.h, S.tier); Scene.announce = null; Scene.night = false; Scene.rain = 0; Scene.skyKey = null;
          // (the sky drawn alone: near trees round a bend can hide most of it)
          const top = Math.round(HORIZON * 0.6);
          const shot = d => { Scene.camD = d; const cv = document.createElement('canvas'); cv.width = VW; cv.height = top; Scene.drawSky(cv.getContext('2d'));
            return { px: cv.getContext('2d').getImageData(0, 0, VW, top).data, sh: Scene.skySh }; };
          const a = shot(0), b = shot(best.d);
          if (a.sh !== 0) f('the sky slid ' + a.sh + 'px on the tee');
          o.sh = b.sh; if (!(Math.abs(b.sh) >= 10)) f('the sky slid only ' + b.sh + 'px at the bend of hole ' + best.h);
          let same = 0, n = 0, moved = 0;
          for (let y = 0; y < top; y++) for (let x = 0; x < VW; x++) { const x0 = x - b.sh; if (x0 < 0 || x0 >= VW) continue;
            const i = (y * VW + x) * 4, j = (y * VW + x0) * 4; n++;
            if (Math.abs(b.px[i] - a.px[j]) + Math.abs(b.px[i + 1] - a.px[j + 1]) + Math.abs(b.px[i + 2] - a.px[j + 2]) < 6) same++;
            if (Math.abs(b.px[i] - a.px[i]) + Math.abs(b.px[i + 1] - a.px[i + 1]) + Math.abs(b.px[i + 2] - a.px[i + 2]) >= 6) moved++; }
          o.same = same / Math.max(1, n); o.moved = moved / Math.max(1, VW * top);
          if (!(o.same > 0.9)) f('the upper sky round the bend only ' + (o.same * 100).toFixed(0) + '% the tee\'s moved by the slide');
          if (!(o.moved > 0.02)) f('the upper sky round the bend unchanged (' + (o.moved * 100).toFixed(1) + '% moved)');
          // balloons and an airplane, moved by the slide
          const lead = (fn, sh) => { const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; const g = cv.getContext('2d'); Scene.skySh = sh; fn(g);
            const p = g.getImageData(0, 0, VW, VH).data; let xs = []; for (let x = 0; x < VW; x++) { for (let y = 0; y < VH; y++) if (p[(y * VW + x) * 4 + 3] > 0) { xs.push(x); break; } } return xs; };
          BALLOON_FORCE = true; Scene.newHole(best.h, S.tier); Scene.t = 3;
          { const A = lead(g => Scene.drawBalloons(g), 0), Bx = lead(g => Scene.drawBalloons(g), 12);
            const inA = new Set(A), hit = Bx.filter(x => x - 12 >= 0 && inA.has(x - 12)).length, all = Bx.filter(x => x - 12 >= 0).length;
            o.ball = hit + '/' + all; if (!A.length || !(hit >= all * 0.9)) f('the balloons not moved with the sky (' + o.ball + ')'); }
          PLANE_FORCE = true; Scene.t = PLANE_DUR * 0.5 + 3 * PLANE_DUR;
          { const A = lead(g => Scene.drawPlane(g), 0), Bx = lead(g => Scene.drawPlane(g), 12);
            o.plane = (A.length ? Bx[0] - A[0] : 'none'); if (!A.length || Bx[0] - A[0] !== 12) f('the airplane not moved with the sky (' + o.plane + ')'); }
          PLANE_FORCE = null; BALLOON_FORCE = null;
          // a flock and geese, moved by the slide
          for (const geese of [false, true]) {
            const fl = g => { const b0 = Scene.b; Scene.b = g; Scene.night = false; Scene.rain = 0; Scene.t = 50; Scene.flockNext = 1e9;
              Scene.flock = { t0: 47, dir: 1, y: HORIZON * 0.45, m: 7, v: 0.08, n: 3, geese }; try { Scene.drawFlock(); } finally { Scene.b = b0; Scene.flock = null; } };
            const A = lead(fl, 0), Bx = lead(fl, 12), d = A.length && Bx.length ? Bx[Bx.length - 1] - A[A.length - 1] : 'none';   // (by the leader: one at the edge comes in with the slide)
            o[geese ? 'geese' : 'flock'] = d; if (d !== 12) f((geese ? 'the geese' : 'the flock') + ' not moved with the sky (' + d + ')');
          }
          // not in a wager
          { Scene.newDepthsHole({ id: B.DGN[0].id, floor: 1 }); const keep = S.dgnRun; S.dgnRun = { id: B.DGN[0].id };
            try { Scene.camD = 3; Scene.drawSky(document.createElement('canvas').getContext('2d')); if (Scene.skySh) f('the sky slid in a wager'); } finally { S.dgnRun = keep; Scene.dFloor = null; } }
        } finally { PLANE_FORCE = null; BALLOON_FORCE = null; HOUR_FORCE = keepH; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.skyKey = null; Scene.newHole(S.hole, S.tier); }
        return { fails, o };
      });
      r.fails.forEach(m => f(w + 'x' + h + ': ' + m));
      o.gaps.push(w + 'x' + h + ' slide ' + r.o.sh + 'px, ' + (r.o.same * 100).toFixed(0) + '% the same moved, balloons ' + r.o.ball + ', plane ' + r.o.plane + ', birds ' + r.o.flock + ', geese ' + r.o.geese);
    }
    if (fails.length) throw new Error(fails.join('; '));
    return ['the sky slides with the bend and covers the view at every point of 60 holes: ' + o.gaps.join('; ') + '; none on the tee or in a wager'];
  }
};
