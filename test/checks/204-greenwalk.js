/* On the green he walks up to his ball where it lies (the user saw it ride
 * along in front of him as he walked onto the green, and asked that he walk
 * to it, it stay where it is, and then he putts):
 *
 *   - played in frames on a home course, a normal bag and a strong one: the
 *     hole's ball comes to rest where he stands to putt, out in front of his
 *     feet where he addresses a ball
 *   - every frame he walks on the green with it lying there, it is drawn
 *     there, ahead of him, and never at his feet in front of him as he walks
 *   - and the holes still putted out
 *   - down the fairway too (the user asked for it like putting): a shot
 *     comes down on his line where he addresses a ball, and every frame he
 *     walks up to it, it is drawn where it lies; he is never walking with
 *     no ball in sight, and the ball he stands to is drawn where it lay */
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
          const R = { holes: 0, putts: 0, walk: 0, seen: 0, atFeet: 0, missing: 0, spotOff: 0, fw: 0, fwMiss: 0, bare: 0, offLine: 0, sig: 0 };
          window.finishHole = function () { R.holes++; if (Scene.putt || Scene.cupT) R.putts++; return keepFH.apply(this, arguments); };
          for (let i = 0; i < 60 * secs; i++) { fake += 1000 / 60; const D = derive(); calls = [];
            step(1 / 60, D);
            // (as the frame is drawn from: a shot lands, or is reached, part way through it)
            const RB = Scene.restBall, flying = Scene.balls.length, walk0 = Scene.walkOn, fly0 = Scene.balls.map(b => b.d0 + b.dist * Math.min(1, b.t / b.dur));
            Scene.draw(1 / 60, D);
            if (sigKind(S.hole)) R.sig++;
            const up = !S.dgnRun && S.yardsMax > 0 && S.yards <= 0 && Scene.hole === S.hole && !Scene.cupT && !Scene.putt;
            // ---- the fairway ----
            if (!up && !S.dgnRun && flying && Scene.swingT === 0) { const me = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * me.s)), bs = h > 30 ? 2 : 1;
              if (fly0.every(d => d > Scene.camD + 0.5) && calls.some(q => Math.abs(q.y - Math.round(me.y - bs)) <= 0.5 && q.x > me.x)) { R.atFeet++; f('hole ' + S.hole + ': a ball at his feet while his shot is in the air'); } }
            if (!up && !S.dgnRun && Scene.hole === S.hole && S.yards > 0) {
              if (RB && !RB.green) { R.fw++;
                if (Math.abs(RB.lat - (Scene.teeLat === undefined ? 0.42 : Scene.teeLat)) > 0.02) { R.offLine++; f('hole ' + S.hole + ': a shot lies at ' + RB.lat.toFixed(2) + ' across, he addresses a ball at ' + Scene.teeLat); }
                const q = Scene.proj(RB.d, RB.lat);
                if (q.y <= Scene.clipAt(RB.d) + 1 && !calls.some(c => Math.abs(c.x - q.x) <= 3 && Math.abs(c.y - q.y) <= 7)) { R.fwMiss++; f('hole ' + S.hole + ': no ball where his shot lies, ' + (RB.d - Scene.camD).toFixed(2) + ' ahead'); } }
              if (Scene.walkOn && walk0 && Scene.swingT === 0 && !Scene.gSpot && !RB && !flying && !Scene.restBall && !Scene.balls.length && !Scene.crossing && Scene.camD > 1) { R.bare++; if (R.bare < 4) f('hole ' + S.hole + ': walking at ' + Scene.camD.toFixed(2) + ' with no ball in sight'); }
              if (!RB && !Scene.walkOn && Scene.swingT === 0 && Scene.gSpot) { const q = Scene.proj(Scene.gSpot.d, Scene.gSpot.lat), h = Math.max(6, Math.round(B_GOLFER * US * q.s)), bs = h > 30 ? 2 : 1;
                if (!calls.some(c => Math.abs(c.x - Math.round(q.x) - bs / 2) <= 0.5 && Math.abs(c.y - Math.round(q.y - bs)) <= 0.5)) { R.fwMiss++; f('hole ' + S.hole + ': the ball he stands to is not where it lay'); } }
            }
            if (!up || !Scene.walkOn || !walk0 || Scene.swingT > 0 || Scene.camD < Scene.pinD() - 9) continue;
            R.walk++;
            const me = Scene.proj(Scene.camD, 0), G = Scene.gSpot;
            const h = Math.max(6, Math.round(B_GOLFER * US * me.s)), bs = h > 30 ? 2 : 1;
            // a ball at his feet, out to his side where he addresses one
            // (but the ball he is a step from, lying short of the green, is at his feet)
            if (Scene.camD < Scene.pinD() - B_GREEN_STAND - 0.3 && !(RB && RB.d - Scene.camD < 0.3) && calls.some(q => Math.abs(q.y - (me.y - bs)) <= 1.5 && q.x > me.x)) {
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
        // (and every hole one of each signature kind in turn: over the water
        // on his club, across the canyon's bridge, the stepping stones, the
        // sea stack, the railway; the normal bag)
        S.upg = JSON.parse(SNAP).upg;
        for (const kind of ['Island', 'Canyon', 'Stones', 'Pier', 'Rail']) {
          const keep = window['is' + kind], h0 = S.hole + 1; window['is' + kind] = h => h >= h0 || keep(h);
          try { S.hole = h0 - 1; startHole(); o['sig' + kind] = play(50); } finally { window['is' + kind] = keep; }
        }
        for (const k of ['normal', 'strong', 'sigIsland', 'sigCanyon', 'sigStones', 'sigPier', 'sigRail']) { const R = o[k];
          if (R.holes < (k.startsWith('sig') ? 2 : 3)) f(k + ': only ' + R.holes + ' holes played');
          if (!k.startsWith('sig') && R.seen < R.holes * 5) f(k + ': it was seen lying on the green in only ' + R.seen + ' frames of the walk over ' + R.holes + ' holes');
          if (R.putts < R.holes * 0.8) f(k + ': ' + R.putts + ' of ' + R.holes + ' holes putted out');
          if (k === 'normal' && R.fw < R.holes * 5) f(k + ': a shot seen lying on the fairway in only ' + R.fw + ' frames'); }
      } finally { window.finishHole = keepFH; window.drawLyingBall = keepDL; Math.random = mr; performance.now = pn; window.requestAnimationFrame = raf;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole(); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const s = R => R.holes + ' holes, ' + R.putts + ' putted out, ' + R.seen + ' frames walking up to it on the green, ' + R.fw + ' on the fairway';
    const sg = ['Island', 'Canyon', 'Stones', 'Pier', 'Rail'].map(k => k + ' ' + r.o['sig' + k].holes + ' (' + r.o['sig' + k].sig + ' frames on it)').join(', ');
    return ['normal bag ' + s(r.o.normal), 'signature holes each (holes): ' + sg, 'strong bag ' + s(r.o.strong) + '; never at his feet as he walks or while his shot flies, never walking with no ball in sight'];
  }
};
