/* Thirty frames a second (the user: the phone gets hot after playing a
 * while): the course drawn at most about 30 times a second however fast the
 * screen refreshes, and the round still runs at the clock's own speed (the
 * golfer's time moves a second a second), so play is as quick as before.
 * Timed against the wall clock, so it runs alone. */
'use strict';
module.exports = {
  name: 'framecap', alone: true,
  async run(page) {
    const r = await page.evaluate(async () => {
      hideSheet(); Scene.announce = null;
      const orig = Scene.draw; let n = 0; Scene.draw = function () { n++; return orig.apply(this, arguments); };
      try {
        await new Promise(r => setTimeout(r, 600));
        n = 0; const t0 = Scene.t, w0 = performance.now();
        await new Promise(r => setTimeout(r, 3000));
        const secs = (performance.now() - w0) / 1000;
        return { fps: n / secs, pace: (Scene.t - t0) / secs };
      } finally { Scene.draw = orig; }
    });
    if (!(r.fps <= 32)) throw new Error('the course was drawn ' + r.fps.toFixed(1) + ' times a second, not at most 30');
    if (!(r.fps >= 15)) throw new Error('the course was drawn only ' + r.fps.toFixed(1) + ' times a second');
    if (!(r.pace > 0.9 && r.pace < 1.1)) throw new Error('the round ran at ' + r.pace.toFixed(2) + ' seconds a second, not the clock\'s own speed');
    return ['the course drawn ' + r.fps.toFixed(1) + ' times a second, the round at ' + r.pace.toFixed(2) + ' seconds a second'];
  }
};
