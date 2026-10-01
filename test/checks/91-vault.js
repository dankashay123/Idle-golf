/* The Clubhouse Vault played as golf (the user: "no matter how far it goes,
 * the golfer just walks to the green while the yardage drops to 0"):
 *
 *   - played in frames and watched: every shot comes down somewhere down the
 *     floor and he walks to it before he swings again; the yardage left
 *     drops as each ball comes down, never while one flies
 *   - a floor cleared: its last ball goes in the cup from where he stands,
 *     FLOOR n is called as a birdie is, and the next floor opens after a
 *     wait of 1.5s or more (3.5s at the most) with the clock stood still
 *   - nobody watching (a catch-up, behind the saver): no wait at all, and
 *     the run clears as many floors as it did before
 *   - left between two floors, the floor just cleared counts
 */
'use strict';
module.exports = {
  name: 'vault',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const raf = window.requestAnimationFrame, pn = performance.now.bind(performance), mr = Math.random, holed = Scene.holed;
      const vault = B.DGN.find(d => d.id === 'vault');
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0; QUIET = false; OFFLINE = false;
        let fake = pn(); performance.now = () => fake;
        const seedAt = n => { let seed = n; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; };
        for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 8);
        const said = []; Scene.holed = function (sc) { said.push(sc.n); return holed.apply(this, arguments); };
        // ---- watched ----
        seedAt(77); S.dgnKeys.vault = 3; startDgn(vault); let R = S.dgnRun;
        let flyDrop = 0, swungShort = 0, shots = 0, cups = 0, holds = [], hold = null, clockMoved = 0, lastLeft = Scene.vaultLeft(R), walkedTo = 0;
        for (let i = 0; i < 60 * 120 && S.dgnRun; i++) {
          fake += 1000 / 60; const D = derive(), fly = Scene.balls.length > 0, sw = Scene.swingT, t0 = R.t, held0 = R.held;
          step(1 / 60, D); Scene.draw(1 / 60, D);
          if (!S.dgnRun) break;
          if (held0 && R.held && R.t !== t0) clockMoved++;
          const left = Scene.vaultLeft(R);
          if (fly && Scene.balls.length && left < lastLeft - 1e-6 && R.floor === (hold ? hold.floor : R.floor)) flyDrop++;
          // a swing struck with his last ball still lying out ahead of him
          if (!sw && Scene.swingT > 0) { shots++; if (Scene.restBall) swungShort++; }
          if (R.held && !hold) hold = { at: R.held, floor: R.floor, cup: null, called: said.length };
          if (hold && R.held && Scene.cupT && hold.cup === null) { hold.cup = R.held; cups++; }
          if (hold && !R.held) { hold.len = held0; hold.call = said.slice(hold.called); holds.push(hold); hold = null; }
          lastLeft = left;
        }
        o.cleared = R.cleared; o.shots = shots; o.holds = holds.map(h => +(h.len || 0).toFixed(2));
        if (shots < R.cleared * 2) f('only ' + shots + ' shots over ' + R.cleared + ' floors');
        if (swungShort) f(swungShort + ' swings struck with his ball still lying ahead of him');
        if (flyDrop) f('the yardage dropped ' + flyDrop + ' times while a ball was in the air');
        if (clockMoved) f('the clock ran ' + clockMoved + ' frames between floors');
        if (holds.length < 3) f('only ' + holds.length + ' floors cleared watched');
        for (const h of holds) {
          if (!(h.len >= B.VAULT_PAUSE - 0.02 && h.len <= B.VAULT_PAUSE_MAX + 0.02)) f('floor ' + (h.floor + 1) + ' waited ' + (h.len || 0).toFixed(2) + 's');
          if (h.cup === null) f('floor ' + (h.floor + 1) + ': no ball in the cup before the next');
          if (!h.call.includes('FLOOR ' + (h.floor + 1))) f('floor ' + (h.floor + 1) + ' called ' + JSON.stringify(h.call));
        }
        if (S.dgnRun) leaveDgn(), leaveDgn();
        // ---- left between two floors ----
        seedAt(78); S.dgnKeys.vault = 3; startDgn(vault); R = S.dgnRun;
        for (let i = 0; i < 60 * 60 && !R.held; i++) { fake += 1000 / 60; const D = derive(); step(1 / 60, D); Scene.draw(1 / 60, D); }
        const cl = R.cleared, fl = R.floor;
        if (!R.held) f('never between two floors to leave');
        else { endDgn(vault, R, derive()); if (R.floor !== fl + 1 || R.cleared !== cl) f('left between floors: floor ' + R.floor + ', ' + R.cleared + ' cleared (want ' + (fl + 1) + ', ' + cl + ')'); }
        hideSheet();
        // ---- nobody watching: no wait ----
        seedAt(79); S.dgnKeys.vault = 3; startDgn(vault); R = S.dgnRun; let waits = 0;
        for (let i = 0; i < 60 * 70 && S.dgnRun; i++) { fake += 1000 / 60; step(1 / 60, derive()); if (R.held) waits++; }
        o.away = R.cleared;
        if (waits) f('with nobody watching it waited ' + waits + ' steps between floors');
        if (!(R.cleared >= 3)) f('with nobody watching only ' + R.cleared + ' floors');
        hideSheet();
      } finally {
        window.requestAnimationFrame = raf; performance.now = pn; Math.random = mr; Scene.holed = holed; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['watched: ' + r.shots + ' shots over ' + r.cleared + ' floors, each walked to; waits between floors ' + r.holds.join('/') + 's, the clock stood still; away: ' + r.away + ' floors, no wait; left between floors, the floor counts'];
  }
};
