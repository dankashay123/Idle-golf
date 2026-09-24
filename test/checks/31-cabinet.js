/* The trophy cabinet and the season, on the Tour tab.
 *
 *   - every event finished is logged with its course, card and whether its
 *     cup was won; one resolved in a catch-up is logged as away and posts no
 *     best card; the best five cards ever are kept, best first
 *   - the season shows its six events: what each came to, the one on now,
 *     and what is coming. What it says comes next has to be what the game
 *     then plays -- the major of the week when it is still to be claimed, a
 *     new card's home course, otherwise the calendar -- so each case is
 *     played through to the next event and compared
 *   - the cabinet lights a trophy for each major of the week won (with a
 *     count past one) and the jacket that came with it, shows the cups held
 *     and the best cards with the course they were posted on
 *   - retiring starts the calendar again, so the season's results go and the
 *     best cards stay; a save with junk in either loads clean
 */
'use strict';
module.exports = {
  name: 'cabinet',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {};
      const finish = (score, offline) => {
        const t = tournamentOf(S.hole);
        S.hole = t * B.ROUND * B.DAYS + 1; S.tourScore = score;
        OFFLINE = !!offline; try { endTournament(); } finally { OFFLINE = false; }
        try { hideSheet(); } catch (e) {}
        startHole();
      };
      try {
        hideSheet(); QUIET = false; S.eventsPlayed = 2;
        // ---- the log and the best cards --------------------------------------
        S.evLog = []; S.bestCards = []; S.weekly = { wk: weekNow(), t: 0, id: weekMajor(weekNow()).id, done: 1, won: 0 };
        const t0 = tournamentOf(S.hole), id0 = courseFor(t0).id;
        finish(-40); o.log1 = JSON.stringify(S.evLog[S.evLog.length - 1]); o.id0 = id0; o.t0 = t0;
        for (const sc of [-10, -70, -5, -55, -20, -90]) finish(sc);
        finish(-200, true);
        o.away = S.evLog[S.evLog.length - 1].s; o.best = S.bestCards.map(x => x.s).join(',');
        o.bestNamed = S.bestCards.every(x => !!courseById(x.id));

        // ---- the season: six rows, and the next one is what then gets played --
        setView('tour'); renderTour();
        const rows = () => [...document.querySelectorAll('#seasonBox .cal')];
        o.rows = rows().length; o.nowRows = rows().filter(e => e.classList.contains('now')).length;
        const said = () => { const t = tournamentOf(S.hole), first = seasonOf(t) * B.SEASON + 1, i = t + 1 - first;
          renderTour(); const row = rows()[i]; return row ? row.querySelector('.nm').textContent : null; };
        // play to the next event and name its course; the prediction has to
        // be about the NEXT event of the SAME season, so step to an event
        // with room after it in its season
        const toMid = () => { while ((tournamentOf(S.hole) - 1) % B.SEASON >= B.SEASON - 1) finish(0); };
        const check = (label, setup) => {
          toMid(); setup(); const want = said(); finish(0);
          const got = courseFor(tournamentOf(S.hole)).n;
          return label + ':' + (want === got ? 'ok' : want + ' but played ' + got);
        };
        o.predict = [
          check('major', () => { S.weekly = null; S.homeSeen = S.tier; }),
          check('home', () => { S.weekly = { wk: weekNow(), t: 0, id: weekMajor(weekNow()).id, done: 1, won: 0 }; S.homeSeen = -1; }),
          check('calendar', () => { S.weekly = { wk: weekNow(), t: 0, id: weekMajor(weekNow()).id, done: 1, won: 0 }; S.homeSeen = S.tier; })
        ];
        // past events show what they came to
        toMid(); const tNow = tournamentOf(S.hole);
        if ((tNow - 1) % B.SEASON === 0) finish(-33);
        renderTour();
        const done = rows().filter(e => e.classList.contains('done'));
        o.pastShown = done.length > 0 && done.every(e => e.querySelector('.s').textContent.trim() !== '');

        // ---- the cabinet --------------------------------------------------------
        const W = COURSE_WEEK;
        S.majorWins = {}; S.majorWins[W[0].id] = 2; S.majorWins[W[2].id] = 1;
        S.styleOwn['o:' + W[0].prize] = 1; S.styleOwn['o:' + W[2].prize] = 1;
        delete S.styleOwn['o:' + W[1].prize]; delete S.styleOwn['o:' + W[3].prize];
        S.cups = 17; renderTour();
        const shelves = [...document.querySelectorAll('#cabBox .shelf')];
        const lit = sh => [...sh.querySelectorAll('.ci')].map(e => e.classList.contains('no') ? 0 : 1).join('');
        o.trophies = lit(shelves[0]); o.jackets = lit(shelves[1]);
        o.count = shelves[0].querySelectorAll('.ci')[0].querySelector('.cc').textContent;
        o.cups = document.querySelector('#cabBox .cabn .big').textContent;
        o.plaque = [...document.querySelectorAll('#cabBox .plaque .pr')].map(e => e.textContent).slice(0, 3);
        o.note = document.getElementById('cabNote').textContent;

        // ---- retiring, and a roughed-up save ------------------------------------
        const bestBefore = S.bestCards.length;
        S.eventsPlayed = Math.max(S.eventsPlayed, B.RETIRE_EVENTS); retire(); try { hideSheet(); } catch (e) {}
        o.retired = S.evLog.length + '/' + (S.bestCards.length === bestBefore ? 'kept' : 'lost');
        S.evLog = [{ t: 3, id: 'nowhere', s: -5 }, { t: 'x', id: W[0].id, s: 1 }, 'junk', { t: 4, id: W[0].id, s: -9, b: 1 }];
        S.bestCards = [{ t: 1, id: W[0].id, s: 'lots' }, { t: 2, id: W[1].id, s: -3 }, null];
        initState(); o.repaired = S.evLog.length + '/' + S.bestCards.length;
        S.evLog = 'bad'; S.bestCards = 7; initState(); o.repaired2 = Array.isArray(S.evLog) + '/' + Array.isArray(S.bestCards);
      } finally {
        QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const L = JSON.parse(r.log1);
    if (L.t !== r.t0 || L.id !== r.id0 || L.s !== -40) throw new Error('an event was logged as ' + r.log1 + ' (event ' + r.t0 + ' on ' + r.id0 + ', -40)');
    if (r.away !== null) throw new Error('an event resolved away was logged with a card of ' + r.away);
    if (r.best !== '-90,-70,-55,-40,-20' || !r.bestNamed)
      throw new Error('the best cards are ' + r.best + ' (want the best five, best first, each with its course; none from away)');
    if (r.rows !== 6 || r.nowRows !== 1) throw new Error('the season shows ' + r.rows + ' events with ' + r.nowRows + ' marked as now');
    const off = r.predict.filter(x => !/:ok$/.test(x));
    if (off.length) throw new Error('the season named the wrong next course: ' + off.join('; '));
    if (!r.pastShown) throw new Error('an event already played this season shows no result');
    if (r.trophies !== '1010' || r.jackets !== '1010') throw new Error('the cabinet lit trophies ' + r.trophies + ' and jackets ' + r.jackets + ' for majors 1 and 3 won');
    if (r.count !== '×2') throw new Error('a major won twice reads "' + r.count + '"');
    if (r.cups !== '17') throw new Error('the cabinet shows ' + r.cups + ' cups of 17');
    if (!/^-90/.test(r.plaque[0] || '') || !/Card/.test(r.plaque[0])) throw new Error('the best cards plaque reads ' + JSON.stringify(r.plaque));
    if (!/^2 of 4 majors/.test(r.note)) throw new Error('the cabinet note reads "' + r.note + '"');
    if (r.retired !== '0/kept') throw new Error('after retiring the season log and best cards were ' + r.retired + ' (want 0/kept)');
    if (r.repaired !== '1/1' || r.repaired2 !== 'true/true') throw new Error('a save with junk records loaded as ' + r.repaired + ' / ' + r.repaired2);
    return ['every event logged with its course; away events post no card; the best five kept, best first',
      'the season shows six events, and what it names next is what then gets played (' + r.predict.map(x => x.split(':')[0]).join(', ') + ')',
      'the cabinet lights the majors won (x2 past one) and their jackets, holds ' + r.cups + ' cups and the best cards by course',
      'retiring clears the season and keeps the best cards; junk records load clean'];
  }
};
