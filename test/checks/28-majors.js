/* Home courses and the major of the week.
 *
 *   - every Tour Card has a home course, ten of them in turn, each with its
 *     own landmark on the skyline that actually reaches the frame, by day
 *     and by night; the majors of the week have one too
 *   - a new save opens at home (Card I's), and so does every season; the
 *     first regular event after you arrive on a card is its home; the next
 *     is back on the calendar; a major or a finale on the calendar is never
 *     taken over; climbing in the middle of an event does not move you to
 *     another course, and nor does loading a save mid-event
 *   - the major of the week takes the first event you tee off in a real
 *     week, Monday to Sunday: not before your first event is in the book,
 *     not in a catch-up, and only once a week. Four in turn, a different
 *     one each week. It pays a major's purse
 *   - won on your highest card: its jacket, for the golfer and the caddie,
 *     and WEEK_WIN_SOV; played through without winning: WEEK_PLAY_SOV and
 *     no jacket; won below your highest card: no jacket. A major that
 *     resolves in a catch-up was never played and waits for the next event
 *   - a jacket cannot be bought, only won; a save that says otherwise, or
 *     carries a mangled week, loads repaired
 *   - all four won is the Grand Slam
 *   - the Tour tab names this week's major, and the course is announced as
 *     the major of the week
 */
'use strict';
module.exports = {
  name: 'majors',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}; const SNAP = JSON.stringify(S);
      hideSheet();
      const EV = B.ROUND * B.DAYS;
      const first = t => (t - 1) * EV + 1;
      // tee off event t as a live player would
      const tee = t => { S.hole = first(t); S.scores = []; S.tourScore = 0; startHole(); return courseFor(t); };
      // finish event t with a score, on the card we are on
      const finish = (t, score) => { S.tourScore = score; S.hole = t * EV + 1; endTournament(); hideSheet(); };
      try {
        QUIET = false;
        // ---- home courses --------------------------------------------------
        {
          const homes = B.COURSE.filter(c => c.slot === 'home');
          o.homes = { n: homes.length, lms: new Set(homes.map(c => c.lm)).size };
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); initState();
          S.eventsPlayed = 0; DAY_FORCE = 7000;       // no major yet: nothing in the book
          const seq = [];
          seq.push(tee(1).id);                           // a new save: Card I's home
          S.tier = S.tierMax = 2; S.hole = first(1) + 30; startHole();
          seq.push(courseFor(1).id);                     // a climb mid-event moves nothing
          seq.push(tee(2).id);                           // arrived on Card III: its home
          seq.push(tee(3).id);                           // a major on the calendar stays one
          seq.push(tee(4).id);                           // back on the calendar
          S.tier = S.tierMax = 5;
          seq.push(tee(6).id);                           // the finale stays the finale
          seq.push(tee(7).id);                           // a season opens at home
          seq.push(tee(8).id);                           // then the calendar
          seq.push(tee(13).id);                          // and the next season, same card, home again
          o.home = { seq, want: [homeFor(0).id, homeFor(0).id, homeFor(2).id, calendarCourse(3).id,
                                 calendarCourse(4).id, calendarCourse(6).id, homeFor(5).id,
                                 calendarCourse(8).id, homeFor(5).id],
                     cal4: calendarCourse(4).slot, cal3: calendarCourse(3).slot, cal6: calendarCourse(6).slot };
          // a save loaded in the middle of an event keeps the calendar's course
          S.evCourse = null; S.tier = 8; S.homeSeen = 1; S.hole = first(8) + 40; startHole();
          o.home.midLoad = courseFor(8).id === calendarCourse(8).id;
          // eleven cards on, home comes round again
          o.home.wrap = homeFor(10).id === homeFor(0).id && homeFor(11).id === homeFor(1).id;
        }
        // ---- every landmark reaches the frame --------------------------------
        {
          const lmd = [];
          for (const cs of B.COURSE.filter(c => c.lm)) {
            for (const mode of ['day', 'night']) {
              DEV.course(B.COURSE.indexOf(cs)); hideSheet();
              Scene.theme = buildTheme(cs, mode); Scene.themeId = cs.id + '|' + mode;
              Scene.ridgeKey = ''; Scene.buildRidge();
              const a = Scene.ridge.getContext('2d').getImageData(0, 0, Scene.ridge.width, Scene.ridge.height).data;
              const keep = Scene.theme.lm; Scene.theme = Object.assign({}, Scene.theme, { lm: null });
              Scene.ridgeKey = ''; Scene.buildRidge();
              const b = Scene.ridge.getContext('2d').getImageData(0, 0, Scene.ridge.width, Scene.ridge.height).data;
              let n = 0;
              for (let i = 0; i < a.length; i += 4)
                if (Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]) > 24) n++;
              lmd.push({ what: cs.id + '/' + mode, kind: keep.kind, n });
            }
          }
          o.lm = lmd;
          Scene.ridgeKey = '';
        }
        // ---- the major of the week -------------------------------------------
        {
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); initState();
          const W0 = 7000 * 7 - 3;          // a Monday
          DAY_FORCE = W0;
          const wk = weekNow();
          o.wk = { mon: wk, sun: (DAY_FORCE = W0 + 6, weekNow()), nextMon: (DAY_FORCE = W0 + 7, weekNow()) };
          DAY_FORCE = W0;
          tee(1);
          o.wk.firstEver = isWeekMajor(1);               // nothing in the book yet
          finish(1, 0);
          S.tier = S.tierMax = 3;
          OFFLINE = true; tee(2); OFFLINE = false;
          o.wk.offline = isWeekMajor(2);                 // not claimed in a catch-up
          const c3 = tee(3);
          o.wk.claimed = isWeekMajor(3) && c3.slot === 'weekly' && c3.id === weekMajor(wk).id;
          o.wk.slot = slotOfEvent(3); o.wk.purse = purseMult(3);
          o.wk.again = (tee(4), isWeekMajor(4));          // once a week
          // won on the top card: the jacket, both of them, and the purse
          const prize = weekMajor(wk).prize;
          let sov = S.sov;
          S.hole = first(3); S.weekly.t = 3; S.evCourse = { t: 3, id: weekMajor(wk).id };
          o.wk.buy = (S.sov = 1e6, styleBuy('o', prize), styleOwned('o', prize));   // cannot be bought
          S.sov = sov;
          finish(3, -900);
          o.wk.won = { done: S.weekly.done, won: S.weekly.won, sov: S.sov - sov,
                       o: styleOwned('o', prize), c: styleOwned('c', prize), wins: S.majorWins[weekMajor(wk).id] };
          // next week: a different major; played and lost pays a little
          DAY_FORCE = W0 + 7;
          const c5 = tee(5);
          o.wk.nextWeek = isWeekMajor(5) && c5.id === weekMajor(wk + 1).id && c5.id !== weekMajor(wk).id;
          sov = S.sov; finish(5, 50);
          o.wk.lost = { sov: S.sov - sov, o: styleOwned('o', weekMajor(wk + 1).prize), won: S.weekly.won };
          // won below your highest card: no jacket
          DAY_FORCE = W0 + 14; S.tier = 1; S.tierMax = 3;
          tee(6); sov = S.sov; finish(6, -900);
          o.wk.below = { o: styleOwned('o', weekMajor(wk + 2).prize), sov: S.sov - sov };
          // resolved in a catch-up: still there to play
          DAY_FORCE = W0 + 21; S.tier = S.tierMax;
          tee(7); OFFLINE = true; finish(7, -900); OFFLINE = false;
          o.wk.away = { held: !S.weekly.done && !S.weekly.t, o: styleOwned('o', weekMajor(wk + 3).prize) };
          o.wk.retake = (tee(8), isWeekMajor(8) && courseFor(8).id === weekMajor(wk + 3).id);
          // four weeks, four majors
          o.wk.four = new Set([0, 1, 2, 3].map(i => weekMajor(wk + i).id)).size;
          // the Grand Slam
          COURSE_WEEK.forEach(c => S.majorWins[c.id] = 1);
          o.wk.slam = achMetric('slam') >= B.ACH.find(a => a.id === 'slam').v;
          // the Tour tab and the announcement
          S.majorWins = {};
          DAY_FORCE = W0 + 28; S.courseSeen = 0; tee(9);
          setView('tour'); renderTour();
          o.wk.tab = ($('majBox') || {}).textContent || '';
          o.wk.tabWant = weekMajor(weekNow()).n;
          announceCourse(); o.wk.ann = Scene.announce ? Scene.announce.sub : null;
          Scene.announce = null; setView('upg');
        }
        // ---- a save that says otherwise ---------------------------------------
        {
          const junk = { styleOwn: {}, outfit: 'mjMasters', caddie: 'mjClaret',
                         weekly: { wk: 'x', id: 'nowhere' }, evCourse: { t: 3, id: 'nowhere' },
                         majorWins: { masters: 1, bogus: 4, crown: -2 } };
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState(), junk); initState();
          o.repair = { outfit: S.outfit, caddie: S.caddie, weekly: S.weekly, ev: S.evCourse,
                       wins: JSON.stringify(S.majorWins) };
        }
      } finally {
        DAY_FORCE = null; OFFLINE = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); hideSheet();
      }
      return o;
    });
    const out = [];
    const H = r.home;
    if (r.homes.n !== 10 || r.homes.lms !== 10)
      throw new Error(r.homes.n + ' home courses with ' + r.homes.lms + ' landmarks; ten of each');
    if (H.cal3 !== 'major' || H.cal4 !== 'event' || H.cal6 !== 'finale')
      throw new Error('the check assumes the season runs event, event, major, event, event, finale');
    const names = ['new save', 'climb mid-event', 'arrived on Card III', 'calendar major', 'after the home event', 'finale',
                   'season opener on a new card', 'after it', 'season opener on the same card'];
    H.seq.forEach((id, i) => { if (id !== H.want[i])
      throw new Error(names[i] + ': played ' + id + ', should be ' + H.want[i] + ' (' + H.seq.join(', ') + ')'); });
    if (!H.midLoad) throw new Error('a save loaded mid-event moved to another course');
    if (!H.wrap) throw new Error('home courses do not come round again after ten cards');
    out.push('home: a new save, each new card and each season open at home; majors, finales and a mid-event climb untouched');

    const weak = r.lm.filter(x => x.n < 60);
    if (weak.length) throw new Error('a landmark barely reaches the skyline: '
      + weak.map(x => x.what + ' ' + x.n + 'px').join(', '));
    const least = r.lm.reduce((a, b) => (b.n < a.n ? b : a));
    out.push(r.lm.length + ' skylines with a landmark on them, the faintest ' + least.what + ' at ' + least.n + 'px');

    const W = r.wk;
    if (W.sun !== W.mon || W.nextMon !== W.mon + 1) throw new Error('a week does not run Monday to Sunday');
    if (W.firstEver) throw new Error('a major was put on before the first event was in the book');
    if (W.offline) throw new Error('a catch-up claimed the major of the week');
    if (!W.claimed) throw new Error('the first live event of the week was not its major');
    if (W.slot !== 'major' || W.purse !== 1.5 && W.purse <= 1) throw new Error('the major of the week pays as ' + W.slot + ' at ' + W.purse + 'x');
    if (W.again) throw new Error('a second major in the same week');
    if (W.buy) throw new Error('a jacket was bought with sovereigns');
    if (!(W.won.done && W.won.won && W.won.o && W.won.c && W.won.sov >= 60 && W.won.wins === 1))
      throw new Error('won on the top card should give the jacket for both and the purse: ' + JSON.stringify(W.won));
    if (!W.nextWeek) throw new Error('next week did not bring a different major');
    if (W.lost.o || W.lost.won || W.lost.sov < 10) throw new Error('lost: ' + JSON.stringify(W.lost));
    if (W.below.o) throw new Error('a major won below the highest card gave its jacket');
    if (!W.away.held || W.away.o) throw new Error('a major resolved in a catch-up: ' + JSON.stringify(W.away));
    if (!W.retake) throw new Error('a major resolved away was not there for the next event');
    if (W.four !== 4) throw new Error('four weeks brought ' + W.four + ' different majors');
    if (!W.slam) throw new Error('all four majors won is not the Grand Slam');
    if (W.tab.indexOf(W.tabWant) < 0) throw new Error('the Tour tab does not name ' + W.tabWant + ': ' + W.tab.slice(0, 120));
    if (!W.ann || !/MAJOR OF THE WEEK/.test(W.ann)) throw new Error('the major was announced as ' + W.ann);
    out.push('major: first live event of the week, once, not in a catch-up; won on top pays the jacket twice and +60, lost +10, away waits');
    out.push('four majors in four weeks, the Grand Slam, named on the Tour tab and announced');

    const R = r.repair;
    if (R.outfit !== 'classic' || R.caddie !== 'bib' || R.weekly || R.ev || R.wins !== '{"masters":1}')
      throw new Error('a mangled save loaded as ' + JSON.stringify(R));
    out.push('a jacket not won, a mangled week or course and bogus wins load repaired');
    return out;
  }
};
