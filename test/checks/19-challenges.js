/* Daily challenges: three a day, paid in sovereigns.
 *
 *   - the same three all day, however often the page is reloaded, and three
 *     different ones: a daily read off the save is a reroll on every reload
 *   - they rotate: every challenge in the pool comes up over a month, and the
 *     ones gated behind a level never come up before it
 *   - progress counts from the start of the day, not from the start of the
 *     career, so a long save does not finish them all the moment it loads
 *   - each pays DAILY_SOV once, all three pay the bonus once, and nothing is
 *     paid twice however often the tick runs
 *   - finishing all three on consecutive days builds a streak that raises the
 *     bonus up to its cap; one day missed and it starts again
 *   - a mangled daily in a save is thrown away and rebuilt, not trusted
 *   - none of them falls in the first five minutes of a brand-new save
 */
'use strict';
module.exports = {
  name: 'challenges',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {};
      const FIELD = { holes: 'totalHoles', cups: 'cups', events: 'eventsPlayed', nines: 'ninesWon', perks: 'perkUsed' };
      const bump = (m, n) => { if (FIELD[m]) S[FIELD[m]] = (S[FIELD[m]] || 0) + n; else S.tally[m] = (S.tally[m] || 0) + n; };
      const sov = () => S.sov || 0;
      QUIET = true;
      try {
        // ---- the same three all day, and three different ones ------------
        S.lv = 30;
        const D0 = 20000;
        DAY_FORCE = D0; delete S.daily; dailyTick();
        const first = S.daily.picks.join(',');
        delete S.daily; dailyTick();
        o.reroll = S.daily.picks.join(',') !== first ? first + ' then ' + S.daily.picks.join(',') : '';
        o.distinct = new Set(S.daily.picks).size;

        // ---- rotation, and the level gate --------------------------------
        const seen = {}, early = {};
        for (let d = 0; d < 30; d++) {
          S.lv = 30; dailyStart(D0 + d); S.daily.picks.forEach(id => seen[id] = 1);
          S.lv = 1;  dailyStart(D0 + d); S.daily.picks.forEach(id => { if (dailyDef(id).lv) early[id] = 1; });
        }
        o.never = B.DAILY_POOL.filter(c => !seen[c.id]).map(c => c.id);
        o.early = Object.keys(early);
        S.lv = 30;

        // ---- progress from the day's start, paid once each ---------------
        DAY_FORCE = D0 + 100; S.totalHoles = 50000; S.tally.birdie = 40000; delete S.daily;
        let s = sov(); dailyTick(); o.loadPaid = sov() - s;
        const picks = S.daily.picks.map(dailyDef);
        o.pays = [];
        picks.forEach((c, i) => {
          bump(c.m, c.v - 1); s = sov(); dailyTick(); const short = sov() - s;
          bump(c.m, 1); s = sov(); dailyTick(); const paid = sov() - s;
          s = sov(); dailyTick(); const again = sov() - s;
          o.pays.push({ id: c.id, short, paid, again, last: i === 2 });
        });
        o.streak1 = S.dailyStreak;

        // ---- the streak builds, caps, and breaks -------------------------
        const allThree = () => { dailyTick(); S.daily.picks.map(dailyDef).forEach(c => bump(c.m, c.v));
                                 const s0 = sov(); dailyTick(); return sov() - s0; };
        o.run = [];
        for (let d = 1; d <= B.DAILY_STREAK_MAX + 2; d++) { DAY_FORCE = D0 + 100 + d; o.run.push(allThree()); }
        o.runStreak = S.dailyStreak;
        DAY_FORCE = D0 + 100 + B.DAILY_STREAK_MAX + 4;   // a day missed
        dailyTick(); o.shownAfterGap = dailyStreak();
        o.afterGap = allThree(); o.streakAfterGap = S.dailyStreak;

        // ---- a mangled daily is rebuilt ----------------------------------
        o.mangled = [];
        for (const bad of [5, 'x', { day: DAY_FORCE, picks: ['nope', 'holes', 'rare'], base: {}, done: [0, 0, 0] },
                           { day: DAY_FORCE, picks: ['holes'], base: {}, done: [0] },
                           { day: DAY_FORCE, picks: ['holes', 'rare', 'runs'], done: [0, 0, 0] }]) {
          S.daily = bad; initState(); migrate();
          if (S.daily) o.mangled.push(JSON.stringify(bad));
          else { dailyTick(); if (!S.daily || S.daily.picks.length !== 3) o.mangled.push('not rebuilt after ' + JSON.stringify(bad)); }
        }
        // ---- none of them is a freebie ---------------------------------------
        // Five minutes of a brand-new save, playing: no daily done. The first
        // pool was sized by eye and 'Card 30 birdies' fell in three and a half.
        {
          const keep = JSON.stringify(S), realR = Math.random;
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); initState(); migrate(); startHole();
          let seed = 11; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          S.autoEquip = 1; S.lv = 30;
          const start = {}; for (const c of B.DAILY_POOL) start[c.m] = achMetric(c.m);
          let t = 0;
          while (t < 300) { step(B.TICK_MAX, derive()); t += B.TICK_MAX;
            if ((t % 10) < B.TICK_MAX) for (const u of B.UPG) buyUpg(u); }
          o.quick = B.DAILY_POOL.filter(c => c.m !== 'runs' && c.m !== 'perks'
            && achMetric(c.m) - start[c.m] >= c.v).map(c => c.d);
          Math.random = realR;
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(keep));
        }
        o.honours = (() => { try { const w = document.createElement('div'); honRows(w); return w.innerHTML.indexOf('Today') >= 0; } catch (e) { return 'threw ' + e.message; } })();
      } finally { QUIET = false; DAY_FORCE = null; }
      o.pool = B.DAILY_POOL.length; o.B = { sov: B.DAILY_SOV, all: B.DAILY_ALL, step: B.DAILY_STREAK, max: B.DAILY_STREAK_MAX };
      return o;
    });

    const Bc = r.B;
    if (r.reroll) throw new Error('the same day gave two different sets of dailies: ' + r.reroll);
    if (r.distinct !== 3) throw new Error('the day has ' + r.distinct + ' different dailies, not 3');
    if (r.never.length) throw new Error('over 30 days these never came up: ' + r.never.join(', '));
    if (r.early.length) throw new Error('these came up before the level they need: ' + r.early.join(', '));
    if (r.loadPaid) throw new Error('a save with 50,000 holes was paid ' + r.loadPaid
      + ' sovereigns the moment the day started; progress has to count from the start of the day');
    for (const p of r.pays) {
      if (p.short) throw new Error(p.id + ' paid ' + p.short + ' one short of its target');
      const want = Bc.sov + (p.last ? Bc.all + Bc.step : 0);
      if (p.paid !== want) throw new Error(p.id + ' paid ' + p.paid + ' when done; it should be ' + want);
      if (p.again) throw new Error(p.id + ' paid again: +' + p.again);
    }
    if (r.streak1 !== 1) throw new Error('first full day left a streak of ' + r.streak1 + ', not 1');
    const want = r.run.map((_, i) => 3 * Bc.sov + Bc.all + Bc.step * Math.min(Bc.max, i + 2));
    if (r.run.join() !== want.join())
      throw new Error('a streak paid ' + r.run.join(', ') + ' on consecutive days; it should be ' + want.join(', '));
    if (r.runStreak !== Bc.max + 3) throw new Error('streak reads ' + r.runStreak + ' after ' + (Bc.max + 3) + ' days');
    if (r.shownAfterGap !== 0) throw new Error('after a missed day the honours still show a ' + r.shownAfterGap + '-day streak');
    if (r.streakAfterGap !== 1 || r.afterGap !== 3 * Bc.sov + Bc.all + Bc.step)
      throw new Error('after a missed day the streak is ' + r.streakAfterGap + ' and paid ' + r.afterGap
        + '; it should start again at 1 and pay ' + (3 * Bc.sov + Bc.all + Bc.step));
    if (r.mangled.length) throw new Error('a mangled daily survived a load: ' + r.mangled.join('; '));
    if (r.quick.length) throw new Error('a brand-new save cleared these in five minutes: ' + r.quick.join('; ')
      + '. A daily is a goal for the day, not a freebie.');
    if (r.honours !== true) throw new Error('the honours sheet does not show today\'s three: ' + r.honours);

    return ['same three all day, all ' + r.pool + ' come round in a month, level gate held',
      'progress counts from the day\'s start; each pays ' + Bc.sov + ' once, all three ' + (Bc.all + Bc.step) + ' up to '
        + (Bc.all + Bc.step * Bc.max) + ' on a streak',
      'a missed day resets the streak; a mangled daily is rebuilt'];
  }
};
