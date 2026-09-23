/* The dev menu writes straight to state with no cost and no undo. It must not
 * be reachable by a tap -- the course name is the most prominent text on the
 * screen and the easiest thing on it to hit by accident. */
'use strict';
module.exports = {
  name: 'devmenu',
  async run(page) {
    const open = () => page.evaluate(() => {
      const v = document.getElementById('veil');
      return !!v && getComputedStyle(v).display !== 'none' && v.classList.contains('on');
    });
    const shown = () => page.evaluate(() => (document.getElementById('sheet').textContent || '').includes('Developer'));

    await page.click('#eventLine');
    await page.waitForTimeout(400);
    if (await shown()) throw new Error('a single tap on the course name opened the dev menu');

    // a press that moves is a scroll, not a summon
    const b = await page.$eval('#eventLine', e => { const r = e.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2]; });
    await page.mouse.move(b[0], b[1]);
    await page.mouse.down();
    await page.waitForTimeout(400);
    await page.mouse.move(b[0] + 60, b[1] + 40);
    await page.waitForTimeout(1400);
    await page.mouse.up();
    if (await shown()) throw new Error('a press that moved away still opened the dev menu');

    // held still, it opens
    await page.mouse.move(b[0], b[1]);
    await page.mouse.down();
    await page.waitForTimeout(1800);
    await page.mouse.up();
    if (!await shown()) throw new Error('holding the course name did not open the dev menu');

    // Every button, pressed once, in order, with the menu reopened before
    // each. A dev button that throws is a dead button and hides whatever
    // state it half-wrote; one that leaves derive() non-finite breaks the
    // frame loop for the rest of the session.
    const press = await page.evaluate(async () => {
      const errs = [];
      const onErr = e => errs.push(String(e.message || e));
      window.addEventListener('error', onErr);
      DEV.open();
      const calls = [...document.querySelectorAll('#sheet .devbtn')].map(x => [x.textContent, x.getAttribute('onclick')]);
      for (const [label, call] of calls) {
        try { DEV.open(); new Function(call)(); } catch (e) { errs.push(label + ': ' + e.message); }
        const D = derive();
        if (!['dps', 'pow', 'gold', 'crit'].every(k => isFinite(D[k])))
          errs.push(label + ': derive() is not finite afterwards');
        await new Promise(r => requestAnimationFrame(r));
      }
      window.removeEventListener('error', onErr);
      try { S.dgnRun = null; hideSheet(); } catch (e) {}
      return { n: calls.length, errs };
    });
    if (press.errs.length)
      throw new Error(press.errs.length + ' dev button(s) failed: ' + press.errs.slice(0, 4).join('; '));
    if (press.n < 60) throw new Error('only ' + press.n + ' dev buttons found, so the scan is wrong');

    // and the newer ones do what they say
    const fx = await page.evaluate(() => {
      const o = {};
      QUIET = true;
      try {
        // pay whatever honours the button sweep left owing first, and start
        // the day fresh, so only the dailies are counted
        DEV.streak0(); delete S.daily; checkAch(); DEV.ach(); checkAch();
        const s0 = S.sov || 0; DEV.daily(3);
        o.daily = S.daily.done.every(Boolean) && S.daily.all === 1;
        o.dailyPaid = (S.sov || 0) - s0;
        o.dailyWant = 3 * B.DAILY_SOV + B.DAILY_ALL + B.DAILY_STREAK;
        DEV.named('stormforge');
        o.named = (activeSets().find(x => x.set.id === 'stormforge') || {}).n;
        DEV.disc(99); DEV.relics(B.TR_MAX); DEV.relics0(); o.trophies = trophiesFound();
        DEV.tier(5); DEV.tierSet(0); o.tier = S.tier;
        DEV.ach(); DEV.ach0(); o.honours = achCount();
        DEV.sov(100); DEV.sov0(); o.sov = S.sov;
        DEV.feat('twilight'); o.feat = featWager().id; DEV.feat(); o.featBack = FEAT_FORCE;
      } finally { QUIET = false; hideSheet(); }
      return o;
    });
    if (!fx.daily || fx.dailyPaid !== fx.dailyWant)
      throw new Error('"finish all" dailies: done ' + fx.daily + ', paid ' + fx.dailyPaid + ' of ' + fx.dailyWant);
    if (fx.named !== 6) throw new Error('the named set button put ' + fx.named + ' pieces of the set on, not 6');
    if (fx.trophies) throw new Error('"clear trophies" left ' + fx.trophies + ' found');
    if (fx.tier !== 0) throw new Error('"back to Card I" left the golfer on card ' + fx.tier);
    if (fx.honours) throw new Error('"clear all" honours left ' + fx.honours + ' done');
    if (fx.sov) throw new Error('"zero" sovereigns left ' + fx.sov);
    if (fx.feat !== 'twilight' || fx.featBack !== null)
      throw new Error('the stake of the day override did not take, or did not let go');

    return ['tap ignored, drag ignored, 1.5s hold opens it',
      'all ' + press.n + ' dev buttons pressed without an error; dailies, named sets, trophy and honours '
      + 'resets, Card I, sovereigns and the stake override all do what they say'];
  }
};
