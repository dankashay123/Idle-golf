/* The shot that finishes the hole lands on the green (the user saw it land
 * short: he walked to the ball, stopped, then walked on to the green):
 *
 *   - a ball in the air when the hole's ball goes down carries on from where
 *     it is to the green, a putt short of the cup, without a jump
 *   - a ball lying short when the hole's ball goes down: he walks to it and
 *     plays it on, and that shot comes down on the green
 *   - with yardage still to go neither happens: a ball lands where it lands
 */
'use strict';
module.exports = {
  name: 'finish',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => o.fails.push(m), keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        const D = derive(), putSpot = LEN - B_GREEN_STAND - 0.4;
        const fresh = () => { S.hole = 4; startHole(); Scene.announce = null; Scene.camD = 20; Scene.walkTo = 20; Scene.balls = []; Scene.restBall = null;
          Scene.swingT = 0; Scene.putt = null; Scene.cupT = 0; Scene.pendingBall = null; Scene.queued = null;
          S.doneT = S.parTime; };   // (a par: an ace goes in the cup, see below)
        const pos = b => b.d0 + b.dist * Math.min(1, b.t / b.dur);
        // ---- in the air ----
        fresh();
        Scene.balls.push({ d0: 20, dist: 12, t: 0.2, dur: 0.6, el: null, crit: false, seed: 1, lat0: 0.42, lat: 0, cup: 0 });
        S.yards = 0; Scene.drawBalls(0);
        const b = Scene.balls[0], at0 = pos(b);
        Scene.drawBalls(0.0001); o.jump = Math.abs(pos(b) - at0);
        o.air = +(b.d0 + b.dist).toFixed(2);
        if (Math.abs(o.air - putSpot) > 0.05 || o.jump > 0.05) f('a ball in the air as the hole was won came down at ' + o.air + ' (the green at ' + putSpot.toFixed(2) + '), jumping ' + o.jump.toFixed(2));
        // it lands, and he walks to it on the green
        for (let i = 0; i < 40 && Scene.balls.length; i++) Scene.drawBalls(0.05);
        o.lay = Scene.restBall ? +Scene.restBall.d.toFixed(2) : null;
        // ---- lying short ----
        fresh(); S.yards = 0; Scene.restBall = { d: 26, lat: 0 };
        const cam = []; for (let i = 0; i < 400 && !Scene.swingT; i++) { Scene.draw(1 / 60, D); cam.push(Scene.camD); }
        o.stopAt = +Scene.camD.toFixed(2); o.swung = Scene.swingT > 0;
        o.passed = cam.some(d => d > 26.2);
        // the swing goes off: where does the ball come down?
        for (let i = 0; i < 200 && !Scene.balls.length; i++) Scene.draw(1 / 60, D);
        o.chip = Scene.balls.length ? +(Scene.balls[0].d0 + Scene.balls[0].dist).toFixed(2) : null;
        if (!o.swung || o.passed || !(o.stopAt > 25) || Math.abs(o.chip - putSpot) > 0.05)
          f('with his ball lying short he ' + (o.swung ? 'swung' : 'did not swing') + ' at ' + o.stopAt + (o.passed ? ', walking past it,' : '') + ' and it came down at ' + o.chip + ' (the green at ' + putSpot.toFixed(2) + ')');
        // ---- an ace in the air goes on into the cup ----
        fresh(); S.doneT = S.parTime * 0.05;
        Scene.balls.push({ d0: 20, dist: 12, t: 0.2, dur: 0.6, el: null, crit: false, seed: 1, lat0: 0.42, lat: 0, cup: 0 });
        S.yards = 0; Scene.drawBalls(0); o.ace = [+(Scene.balls[0].d0 + Scene.balls[0].dist).toFixed(2), Scene.balls[0].cup].join('/');
        if (o.ace !== LEN + '/1') f('an ace in the air came down at ' + o.ace + ' (want the cup)');
        // ---- yardage to go: as it was ----
        fresh(); S.yards = S.yardsMax * 0.5;
        Scene.balls.push({ d0: 20, dist: 12, t: 0.2, dur: 0.6, el: null, crit: false, seed: 1, lat0: 0.42, lat: 0, cup: 0 });
        Scene.drawBalls(0); o.still = +(Scene.balls[0].d0 + Scene.balls[0].dist).toFixed(2);
        Scene.balls = []; Scene.restBall = { d: 26, lat: 0 }; Scene.camD = 25.6; Scene.drawBalls(0); o.noSwing = !Scene.swingT;
        if (o.still !== 32 || !o.noSwing) f('with yardage to go a ball came down at ' + o.still + ' (want 32), or he swung at his ball (' + !o.noSwing + ')');
      } finally {
        window.step = keep; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['a ball in the air as the hole was won carries on to ' + r.air + ' without a jump; one lying short is walked to (' + r.stopAt + ') and played on to ' + r.chip + '; with yardage to go, as before'];
  }
};
