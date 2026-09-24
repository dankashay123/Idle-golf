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

    // the buttons for the newer parts of the game do what they say
    const nw = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S);
      QUIET = false; S.dgnRun = null;
      // the sweep above pressed every switch once; put the switches back first
      if (DEV._recs) DEV.synth();
      if (DEV_FPS) DEV.fps();
      Scene.pixGround = true;
      try {
        DEV.majorNext(); const t = tournamentOf(S.hole);
        o.majorNext = isWeekMajor(t) && courseFor(t).slot === 'weekly' && holesPlayed(S.hole) === 0;
        DEV.major0(); DEV.majorWin(1);
        const wk = S.weekly && courseById(S.weekly.id);
        o.majorWin = !!wk && S.majorWins[wk.id] >= 1 && styleOwned('o', wk.prize) && S.weekly.won === 1;
        DEV.majorWin(4); o.majorAll = COURSE_WEEK.every(c => S.majorWins[c.id] >= 1 && styleOwned('o', c.prize));
        S.outfit = COURSE_WEEK[0].prize; DEV.major0();
        o.major0 = !Object.keys(S.majorWins).length && !COURSE_WEEK.some(c => styleOwned('o', c.prize)) && S.outfit === 'classic';
        const i = B.COURSE.findIndex(c => c.slot === 'weekly'); DEV.course(i);
        o.coursePlaysMajor = isWeekMajor(tournamentOf(S.hole)) && courseFor(tournamentOf(S.hole)).id === B.COURSE[i].id;
        const t0 = tournamentOf(S.hole); DEV.nextEvent(1); o.nextEvent = tournamentOf(S.hole) === t0 + 1 && holesPlayed(S.hole) === 0;
        DEV.nextSeason(); o.nextSeason = (tournamentOf(S.hole) - 1) % B.SEASON === 0;
        DEV.nextEvent(2); DEV.cabinet(1);
        o.cabFill = COURSE_WEEK.every(c => S.majorWins[c.id] >= 1) && S.cups >= 12 && S.bestCards.length === 5
          && S.evLog.filter(x => seasonOf(x.t) === seasonOf(tournamentOf(S.hole))).length === 2;
        DEV.cabinet(0); o.cabEmpty = !Object.keys(S.majorWins).length && !S.cups && !S.bestCards.length && !S.evLog.length;
        Scene.fairySay = null; DEV.say('cheer'); o.cheer = Scene.fairySay && Scene.fairySay.kind;
        Scene.fairySay = null; DEV.say('quip'); o.quip = Scene.fairySay && Scene.fairySay.kind;
        S.cperkOwn = { tempo: 1 }; S.cperk = 'tempo'; S.buff = {}; DEV.cperkNow(); o.perkNow = !!S.buff.cSpd;
        DEV.cperks(1); o.allPerks = B.CPERKS.every(p => S.cperkOwn[p.id]); DEV.cperks(0); o.noPerks = !S.cperk && !Object.keys(S.cperkOwn).length;
        const had = Object.keys(Sfx.recs).length; DEV.synth(); o.synthOff = !Object.keys(Sfx.recs).length; DEV.synth();
        o.synthBack = Object.keys(Sfx.recs).length === had;
        DEV.fps(); o.fpsOn = !!document.getElementById('devFps'); DEV.fps(); o.fpsOff = !document.getElementById('devFps');
        DEV.ground(); o.rects = Scene.pixGround === false; DEV.ground(); o.pixels = Scene.pixGround !== false;
        DEV.hon('homes'); o.homes = achMetric('homes');
        o.read = /climb check/.test(document.getElementById('sheet').textContent) && /audio /.test(document.getElementById('sheet').textContent);
      } finally {
        QUIET = false; hideSheet();
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    const wrong = Object.entries(nw).filter(([k, v]) => k === 'homes' ? v !== 10 : k === 'cheer' ? v !== 'cheer'
      : k === 'quip' ? v !== 'quip' : v !== true).map(([k, v]) => k + '=' + v);
    if (wrong.length) throw new Error('newer dev buttons did not do what they say: ' + wrong.join(', '));

    return ['tap ignored, drag ignored, 1.5s hold opens it',
      'all ' + press.n + ' dev buttons pressed without an error; dailies, named sets, trophy and honours '
      + 'resets, Card I, sovereigns and the stake override all do what they say',
      'and the newer ones: the major of the week, the season, the cabinet, the fairy, caddie perks, sound, the frame readout'];
  }
};
