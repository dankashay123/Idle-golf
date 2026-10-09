/* An ace's ball never disappears (the user saw it fly a little way and
 * vanish, then the ace played): it went behind a nearer tree or a rise in
 * front of a green over a crest, on most frames of most aces. Played on
 * strong bags on a home course, watched: every ace's ball goes in off a
 * flight of its own, and on every frame of that flight the ball is drawn,
 * the plain one and a wake bought from the shop alike. */
'use strict';
module.exports = {
  name: 'aceball',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { aces: 0, frames: 0, hidden: 0, notLanded: 0, by: {} };
      const raf = window.requestAnimationFrame, pn = performance.now.bind(performance), mr = Math.random, fb = window.flightBall;
      let drawn = 0;
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0; FROST_FORCE = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 7; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        window.flightBall = function () { drawn++; return fb.apply(this, arguments); };
        for (const [trail, lvl] of [['plain', 45], ['plain', 80], ['tCyber', 60]]) {
          DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
          for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), lvl);
          S.trail = trail; S.styleOwn = S.styleOwn || {}; S.styleOwn['t:' + trail] = 1; startHole();
          const T = BALLFX[trailNow().fx], keepT = trailNow().fx && BALLFX[trailNow().fx];
          if (keepT) BALLFX[trailNow().fx] = function () { drawn++; return keepT.apply(this, arguments); };
          try {
            for (let i = 0; i < 60 * 45; i++) {
              fake += 1000 / 60; const D = derive(); step(1 / 60, D);
              const before = Scene.cupT, cb = Scene.balls.find(x => x.cup), landing = cb && cb.t + 1 / 60 >= cb.dur;
              drawn = 0; Scene.draw(1 / 60, D);
              if (cb && Scene.balls.includes(cb)) { o.frames++; if (!drawn) { o.hidden++; o.by[trail + lvl] = (o.by[trail + lvl] || 0) + 1; } }
              if (Scene.aceHold(D) && S.yards <= 0 && !before && Scene.cupT) { o.aces++; if (!landing) o.notLanded++; }
            }
          } finally { if (keepT) BALLFX[trailNow().fx] = keepT; }
        }
      } finally {
        window.flightBall = fb; Math.random = mr; performance.now = pn; window.requestAnimationFrame = raf;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    const f = [];
    if (r.aces < 20) f.push('only ' + r.aces + ' aces played');
    if (r.notLanded) f.push(r.notLanded + ' aces played without their ball landing in the cup');
    if (r.hidden) f.push(r.hidden + ' of ' + r.frames + ' frames of aces\' flights drew no ball ' + JSON.stringify(r.by));
    if (f.length) throw new Error(f.join('\n'));
    return [r.aces + ' aces, each ball flown into the cup and drawn on all ' + r.frames + ' frames of its flight'];
  }
};
