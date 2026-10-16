/* On the green he walks up to his ball where it lies (the user saw it ride
 * along in front of him as he walked onto the green, and asked that he walk
 * to it, it stay where it is, and then he putts):
 *
 *   - played in frames on a home course, a normal bag and a strong one: the
 *     hole's ball comes to rest where he stands to putt, out in front of his
 *     feet where he addresses a ball
 *   - every frame he walks on the green with it lying there, it is drawn
 *     there, ahead of him, and never at his feet in front of him as he walks
 *   - and the holes still putted out */
'use strict';
module.exports = {
  name: 'greenwalk',
  async run(page) {
    await page.evaluate(() => { const RD = Date, at = new RD(2026, 8, 26, 12, 0, 0).getTime(), t0 = RD.now();
      window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(at + RD.now() - t0); } static now() { return at + RD.now() - t0; } };
      S.t = Date.now() / 1000; });
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {}, mr = Math.random, raf = window.requestAnimationFrame;
      const pn = performance.now.bind(performance), keepFH = window.finishHole, keepDL = window.drawLyingBall;
      let calls = [];
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 4242; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        window.drawLyingBall = function (c, x, y) { calls.push({ x, y }); return keepDL.apply(this, arguments); };
        const play = secs => {
          const R = { holes: 0, putts: 0, walk: 0, seen: 0, atFeet: 0, missing: 0, spotOff: 0 };
          window.finishHole = function () { R.holes++; if (Scene.putt || Scene.cupT) R.putts++; return keepFH.apply(this, arguments); };
          for (let i = 0; i < 60 * secs; i++) { fake += 1000 / 60; const D = derive(); calls = [];
            step(1 / 60, D); Scene.draw(1 / 60, D);
            const up = !S.dgnRun && S.yardsMax > 0 && S.yards <= 0 && Scene.hole === S.hole && !Scene.cupT && !Scene.putt;
            if (!up || !Scene.walkOn || Scene.camD < Scene.pinD() - 9) continue;
            R.walk++;
            const me = Scene.proj(Scene.camD, 0), G = Scene.gSpot;
            const h = Math.max(6, Math.round(B_GOLFER * US * me.s)), bs = h > 30 ? 2 : 1;
            // a ball at his feet, out to his side where he addresses one
            if (Scene.camD < Scene.pinD() - B_GREEN_STAND - 0.3 && calls.some(q => Math.abs(q.y - (me.y - bs)) <= 1.5 && q.x > me.x)) {
              R.atFeet++; f('hole ' + S.hole + ': a ball at his feet as he walks, ' + (Scene.pinD() - B_GREEN_STAND - Scene.camD).toFixed(2) + ' short of where he putts'); }
            if (!G) continue;
            R.seen++;
            if (Math.abs(G.d - (Scene.pinD() - B_GREEN_STAND)) > 0.01) { R.spotOff++; f('hole ' + S.hole + ': it lies at ' + G.d.toFixed(2) + ', he putts from ' + (Scene.pinD() - B_GREEN_STAND).toFixed(2)); }
            const p = Scene.proj(G.d, G.lat);
            if (p.y <= Scene.clipAt(G.d) + 1 && !calls.some(q => Math.abs(q.x - Math.round(p.x) - bs / 2) <= 1.5 && Math.abs(q.y - Math.round(p.y - bs)) <= 1.5)) {
              R.missing++; f('hole ' + S.hole + ': no ball where it lies as he walks up'); }
          }
          window.finishHole = keepFH; return R;
        };
        DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
        o.normal = play(150);
        for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 50);
        startHole(); o.strong = play(70);
        for (const k of ['normal', 'strong']) { const R = o[k];
          if (R.holes < 3) f(k + ': only ' + R.holes + ' holes played');
          if (R.seen < R.holes * 5) f(k + ': it was seen lying on the green in only ' + R.seen + ' frames of the walk over ' + R.holes + ' holes');
          if (R.putts < R.holes * 0.8) f(k + ': ' + R.putts + ' of ' + R.holes + ' holes putted out'); }
      } finally { window.finishHole = keepFH; window.drawLyingBall = keepDL; Math.random = mr; performance.now = pn; window.requestAnimationFrame = raf;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole(); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const s = R => R.holes + ' holes, ' + R.putts + ' putted out, ' + R.seen + ' frames walking up to it where it lies';
    return ['normal bag ' + s(r.o.normal), 'strong bag ' + s(r.o.strong) + '; never at his feet as he walks'];
  }
};
