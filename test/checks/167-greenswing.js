/* No full swing on the green (the user saw a shot come down on the green,
 * then him hit it on like a normal shot a couple of feet and putt).
 *
 *   - played in frames, watched, on a home course with a normal bag and a
 *     strong one, and on an island hole: no swing is ever taken from the
 *     green (its collar on his line, 8.6 short of its middle), and none but
 *     a hole's last from where the others stop short of it (a dribble of a
 *     couple of feet)
 *   - and every hole still putted out (the last shot comes down where he
 *     putts from) */
'use strict';
module.exports = {
  name: 'greenswing',
  async run(page) {
    await page.evaluate(() => { const RD = Date, at = new RD(2026, 8, 26, 12, 0, 0).getTime(), t0 = RD.now();
      window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(at + RD.now() - t0); } static now() { return at + RD.now() - t0; } };
      S.t = Date.now() / 1000; });
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {}, mr = Math.random, raf = window.requestAnimationFrame;
      const pn = performance.now.bind(performance), keepL = Scene.launch, keepFH = window.finishHole;
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 777; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const play = (secs, isle) => {
          const R = { shots: 0, onGreen: 0, dribble: 0, holes: 0, putts: 0, worst: -99, isle: 0 };
          Scene.launch = function () {
            const last = S.yardsMax > 0 && S.yards <= 0 && Scene.hole === S.hole, I = Scene.isle;
            if (!S.dgnRun) { R.shots++; const g = Scene.camD - (LEN - 8.6); R.worst = Math.max(R.worst, g);
              // (an island's green is all there is past its bank)
              if (g > 0 || (I && I.land > LEN - 9 && Scene.camD > I.bank + 0.5)) { R.onGreen++; f((isle ? 'island ' : '') + 'hole ' + S.hole + ': a swing from ' + Scene.camD.toFixed(1) + ' (' + (last ? 'its last' : 'not its last') + ', the green from ' + (LEN - 8.6) + ')'); }
              if (!last && Scene.camD >= Scene.shotCap() - 0.6) R.dribble++; }
            return keepL.apply(this, arguments); };
          window.finishHole = function () { R.holes++; if (Scene.putt || Scene.cupT) R.putts++; if (Scene.isle && Scene.isle.fly && !Scene.isle.gold) R.isle++; return keepFH.apply(this, arguments); };
          for (let i = 0; i < 60 * secs; i++) { fake += 1000 / 60; const D = derive();
            step(1 / 60, D); Scene.draw(1 / 60, D); }
          Scene.launch = keepL; window.finishHole = keepFH; return R;
        };
        DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
        o.normal = play(150);
        for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 50);
        startHole(); o.strong = play(70);
        // (every hole from here an island)
        S.upg = JSON.parse(SNAP).upg; const h0 = S.hole, keepI = window.isIsland; window.isIsland = h => h >= h0 || keepI(h);
        try { startHole(); o.island = play(120, true); } finally { window.isIsland = keepI; }
        for (const k of ['normal', 'strong', 'island']) { const R = o[k];
          if (R.holes < (k === 'strong' ? 10 : 3) || R.shots < R.holes) f(k + ': only ' + R.holes + ' holes and ' + R.shots + ' shots played');
          if (R.dribble) f(k + ': ' + R.dribble + ' shots not a hole\'s last struck from the green\'s edge (a dribble)');
          if (R.putts < R.holes * 0.8) f(k + ': ' + R.putts + ' of ' + R.holes + ' holes putted out'); }
        if (o.island.isle < o.island.holes || o.island.holes < 3) f('only ' + o.island.isle + ' of ' + o.island.holes + ' holes on islands');
      } finally { Scene.launch = keepL; window.finishHole = keepFH; ISLE_FORCE = 0; Math.random = mr; performance.now = pn; window.requestAnimationFrame = raf;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole(); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const s = R => R.holes + ' holes, ' + R.shots + ' shots, the furthest ' + R.worst.toFixed(1) + ' from the green, ' + R.putts + ' putted out';
    return ['normal bag ' + s(r.o.normal) + '; strong bag ' + s(r.o.strong), 'island holes ' + s(r.o.island) + '; no swing on a green, none a dribble from its edge'];
  }
};
