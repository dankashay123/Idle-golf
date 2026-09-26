/* The hole waits for his putt while the course is on show (the user saw it
 * skip the putt and move on). It asked whether a frame had been drawn in the
 * last quarter second: a phone's hitch (one slow frame) read as nobody
 * watching, and every hole with one ended without the putt.
 *
 *   - in real frames, with one frame held a third of a second after the
 *     hole's ball is down, every hole still ends with the ball in the cup
 *   - with the menu pulled up over the field, the hole does not wait
 */
'use strict';
module.exports = {
  name: 'watched',
  async run(page) {
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), o = { holes: 0, skipped: 0, fails: [] }, f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = true; DEV.tierSet(3); DEV.god(); DEV.skills(); QUIET = false; hideSheet();
        S.autoClimb = 0; S.saver = 0;
        let hole = S.hole, stalled = false, cup = false;
        const t0 = performance.now();
        while (o.holes < 4 && performance.now() - t0 < 40000) {
          await new Promise(res => requestAnimationFrame(res));
          if (S.hole !== hole) { o.holes++; if (!cup) o.skipped++; hole = S.hole; stalled = false; cup = false; }
          if (Scene.hole === S.hole && S.yards <= 0) {
            if (!stalled && !Scene.cupT) { stalled = true; const e0 = performance.now(); while (performance.now() - e0 < 330) {} }
            cup = cup || !!Scene.cupT;
          }
        }
        if (!(o.holes >= 3) || o.skipped) f(o.skipped + ' of ' + o.holes + ' holes ended without the putt after one slow frame');
        // the menu over the field: nobody is watching it
        document.getElementById('app').classList.add('big');
        // (a few frames: the hole asks whether it was drawn in the last few steps)
        for (let i = 0; i < 8; i++) await new Promise(res => requestAnimationFrame(res));
        o.menuWaits = Scene.holeWait();
        document.getElementById('app').classList.remove('big');
        await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
        if (o.menuWaits && !(typeof SIDEWAYS !== 'undefined' && SIDEWAYS && SIDEWAYS.matches)) f('with the menu over the field the hole waited for him');
      } finally {
        QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['one slow frame after each hole\'s ball was down: all ' + r.holes + ' holes still ended in the cup; with the menu up the hole does not wait'];
  }
};
