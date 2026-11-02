/* Frame Rate on Auto (the default, the user chose it): about sixty a second
 * touched, thirty after half a minute untouched, sixty again at a touch;
 * set to 60, sixty untouched. Sixty frames a second at most, thirty with Frame Rate set to Cooler (the
 * user: the phone got hot at sixty; then thirty looked low): the course drawn
 * at most about 60 times a second however fast the screen refreshes, at most
 * 30 on Cooler, and the round still runs at the clock's own speed (the
 * golfer's time moves a second a second), so play is as quick either way.
 * Timed against the wall clock, so it runs alone. */
'use strict';
module.exports = {
  name: 'framecap', alone: true,
  async run(page) {
    const r = await page.evaluate(async () => {
      hideSheet(); Scene.announce = null;
      const orig = Scene.draw; let n = 0; Scene.draw = function () { n++; return orig.apply(this, arguments); };
      const run = async () => { await new Promise(r => setTimeout(r, 600));
        n = 0; const t0 = Scene.t, w0 = performance.now();
        await new Promise(r => setTimeout(r, 3000));
        const secs = (performance.now() - w0) / 1000;
        return { fps: n / secs, pace: (Scene.t - t0) / secs }; };
      const keep = S.fps, keepT = touchedAt, touch = ago => { touchedAt = performance.now() - ago; };
      try {
        // Auto: touched just now, sixty; untouched 40 seconds, thirty; then a touch, sixty again
        delete S.fps; touch(0); const a = await run();
        touch(40000); const idle = await run();
        touch(0); const back = await run();
        // sixty and thirty, always
        S.fps = 60; touch(40000); const sixty = await run();
        S.fps = 30; touch(0); const b = await run();
        return { fps: a.fps, pace: a.pace, idle: idle.fps, idlePace: idle.pace, back: back.fps, sixty: sixty.fps, cool: b.fps, coolPace: b.pace };
      } finally { Scene.draw = orig; touchedAt = keepT; if (keep === undefined) delete S.fps; else S.fps = keep; }
    });
    if (!(r.fps <= 62)) throw new Error('the course was drawn ' + r.fps.toFixed(1) + ' times a second, not at most 60');
    if (!(r.fps >= 40)) throw new Error('the course was drawn only ' + r.fps.toFixed(1) + ' times a second, not about 60');
    if (!(r.idle <= 32 && r.idle >= 15)) throw new Error('on Auto, untouched 40 seconds, the course was drawn ' + r.idle.toFixed(1) + ' times a second, not about 30');
    if (!(r.back >= 40 && r.back <= 62)) throw new Error('on Auto, touched again, the course was drawn ' + r.back.toFixed(1) + ' times a second, not about 60');
    if (!(r.sixty >= 40 && r.sixty <= 62)) throw new Error('set to 60 and untouched, the course was drawn ' + r.sixty.toFixed(1) + ' times a second, not about 60');
    if (!(r.cool <= 32 && r.cool >= 15)) throw new Error('on Cooler the course was drawn ' + r.cool.toFixed(1) + ' times a second, not about 30');
    for (const [k, v] of [['', r.pace], [' on Cooler', r.coolPace], [' on Auto untouched', r.idlePace]]) if (!(v > 0.9 && v < 1.1)) throw new Error('the round ran at ' + v.toFixed(2) + ' seconds a second' + k + ', not the clock\'s own speed');
    return ['Auto: the course drawn ' + r.fps.toFixed(1) + ' times a second touched, ' + r.idle.toFixed(1) + ' untouched 40 seconds, ' + r.back.toFixed(1) + ' touched again; 60: ' + r.sixty.toFixed(1) + ' untouched (' + r.cool.toFixed(1) + ' on Cooler), the round at ' + r.pace.toFixed(2) + ' seconds a second (' + r.coolPace.toFixed(2) + ' on Cooler)'];
  }
};
