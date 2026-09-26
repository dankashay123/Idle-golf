/* The trophy cabinet, in the Trophy Room off the trophy on the course, and
 * the season, on the Tour tab.
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
 *   - the case pays for what goes in it: majors won, cups, and the best card
 *     (to 288 under, a perfect card). A reward waits at each step until it is
 *     collected in the Trophy Room, pays once, and never goes; Collect all
 *     takes everything waiting, the free sovereigns too, and is only offered
 *     when there are two things to take; each other Collect button takes its
 *     own and nothing else. The trophy on the course carries a dot while
 *     anything waits and not otherwise, and opens the room on what it is for
 *   - the Career tab carries its dot when retiring now would find an
 *     heirloom, and not before retiring opens or once every one is found:
 *     nothing on screen ever pointed at retiring before
 *   - Season Bests in the Cabinet (the user asked): the best card of each
 *     of this golfer's seasons, newest first, with its course and card;
 *     never one played away; an old save's taken from its log
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
        S.cups = 17; trophyRoom('case');
        const shelves = [...document.querySelectorAll('#cabBox .shelf')];
        const lit = sh => [...sh.querySelectorAll('.ci')].map(e => e.classList.contains('no') ? 0 : 1).join('');
        o.trophies = lit(shelves[0]); o.jackets = lit(shelves[1]);
        o.count = shelves[0].querySelectorAll('.ci')[0].querySelector('.cc').textContent;
        o.cups = document.querySelector('#cabBox .cabn .big').textContent;
        o.plaque = [...document.querySelectorAll('#cabBox .plaque .pr')].map(e => e.textContent).slice(0, 3);
        o.note = document.getElementById('cabNote').textContent;

        // ---- the case's rewards: at each step, paid once, never lost ---------------
        hideSheet(); S.caseGot = {}; S.majorWins = {}; S.cups = 0; S.bestRound = undefined; S.freeT = 0;
        const dot = () => { renderStageBtns(); return document.getElementById('roomBtn').classList.contains('ready'); };
        o.dotIdle = dot();
        S.cups = 5;                                           // steps at 1 and 5
        o.cupPend = casePending().map(x => x.c.id + x.i).join(',');
        o.dotWaiting = dot();
        // the trophy opens on what its dot is for, wherever the room was left
        roomTab = 'hon'; document.getElementById('roomBtn').click();
        o.opensToday = roomTab + '/' + !!document.querySelector('#roomBody [data-collect="cup"]'); hideSheet();
        const sov0 = S.sov || 0; collect('cup'); o.cupPaid = (S.sov || 0) - sov0;
        o.cupAgain = casePending().length; o.cupPaidAgain = (collect('cup'), (S.sov || 0) - sov0);
        S.cups = 12; S.bestRound = -120; S.majorWins = { masters: 1, crown: 1 };   // cup 10; card 25, 50, 100; majors 1, 2
        S.freeT = B.FREE_EVERY;
        trophyRoom('today');
        o.collectAll = !!document.querySelector('#roomBody [data-collect=""]');
        const want = casePay(casePending()) + B.FREE_GIFT, sov1 = S.sov || 0;
        document.querySelector('#roomBody .act[data-collect=""]').click();
        o.allPaid = (S.sov || 0) - sov1; o.allWant = want;
        o.afterAll = casePending().length + '/' + (freeReady() ? 'free' : 'none') + '/' + (dot() ? 'dot' : 'clear');
        // the free sovereigns alone are enough to light the dot
        S.freeT = B.FREE_EVERY; o.freeDot = dot(); collect(); o.freeGone = !dot();
        // the free sovereigns' own button takes them and nothing else
        S.cups = 25; S.freeT = B.FREE_EVERY; trophyRoom('today');       // the cup step at 25 waits too
        const sov2 = S.sov || 0; document.querySelector('#roomBody [data-collect="free"]').click();
        o.freeOnly = (S.sov || 0) - sov2 + '/' + casePending().map(x => x.c.id + x.i).join(',');
        // with one thing waiting there is no Collect all beside its own button
        o.oneAll = !!document.querySelector('#roomBody .act[data-collect=""]'); o.freeGift = B.FREE_GIFT;
        collect('cup');
        // a track collected to its end says so, and a perfect card is the last step
        S.bestRound = -288; collect('card'); trophyRoom('case');
        o.cardDone = /every reward collected/.test(document.getElementById('cabBox').textContent);
        o.cardTop = B.CASE.find(c => c.id === 'card').at.slice(-1)[0];
        S.caseGot = { cup: 99, card: -3, nope: 2 }; initState(); o.caseRepair = JSON.stringify(S.caseGot);
        hideSheet();
        S.cups = 17;                     // as the cabinet above had it: retiring pays off the cups

        // ---- the Career tab says when retiring would find an heirloom -------------
        const worth = () => { retireWorth._t = -1e9; renderXp(); return retireWorth()
          && document.querySelector('.tab[data-v="career"]').classList.contains('alert'); };
        const keepPts = [S.talPts, S.statPts, S.paraPts];
        S.talPts = 0; S.statPts = 0; S.paraPts = {};
        // one short of the first heirloom, so this retirement is what finds it
        const relic0 = S.relic; S.relic = {};
        S.eventsPlayed = B.RETIRE_EVENTS; S.legacy = discoverCost() - 1;
        const Pv = legacyPreview(); o.retireFinds = Pv.after > Pv.held;
        o.worthOn = worth();
        S.eventsPlayed = 0; o.worthEarly = worth();
        S.eventsPlayed = B.RETIRE_EVENTS; S.relic = {}; B.TROPHY.forEach(t => S.relic[t.id] = 1); o.worthAll = worth();
        S.relic = relic0; S.legacy = 0; [S.talPts, S.statPts, S.paraPts] = keepPts;

        // ---- retiring, and a roughed-up save ------------------------------------
        const bestBefore = S.bestCards.length;
        S.eventsPlayed = Math.max(S.eventsPlayed, B.RETIRE_EVENTS); retire(); try { hideSheet(); } catch (e) {}
        o.retired = S.evLog.length + '/' + (S.bestCards.length === bestBefore ? 'kept' : 'lost');
        S.evLog = [{ t: 3, id: 'nowhere', s: -5 }, { t: 'x', id: W[0].id, s: 1 }, 'junk', { t: 4, id: W[0].id, s: -9, b: 1 }];
        S.bestCards = [{ t: 1, id: W[0].id, s: 'lots' }, { t: 2, id: W[1].id, s: -3 }, null];
        // ---- season bests: the best card of each season, in the Cabinet --------
        {
          // (the junk the repair below is given, kept aside meanwhile)
          const kE = S.evLog, kB = S.bestCards, kH = S.hole;
          S.seasonBest = []; S.evLog = []; S.bestCards = []; S.hole = 1; startHole();
          const g = S.retires || 0;
          for (const sc of [-10, -50, -30, -5, -60, -20, -15, -45]) finish(sc);   // events 1-8: six in season 1, two in season 2
          const mine = () => S.seasonBest.filter(x => x.g === g).map(x => x.n + ':' + x.s).sort().join(',');
          o.sb = mine();
          finish(-300, true); o.sbAway = mine();
          QUIET = false; trophyRoom('case');
          const lines = () => [...document.querySelectorAll('#seasonBests .pr')].map(e => e.textContent);
          o.sbLines = lines();
          o.sbNamed = S.seasonBest.every(x => !!courseById(x.id) && lines().some(l => l.indexOf(courseById(x.id).n) >= 0));
          S.retires = g + 1; renderCabinet(); o.sbOther = lines().length; S.retires = g; hideSheet();
          delete S.seasonBest; S.evLog = [{ t: 1, id: courseFor(1).id, s: -33, b: 0, w: 0, c: 0 }, { t: 2, id: courseFor(2).id, s: null, b: 0, w: 0, c: 0 }];
          initState(); o.sbRepair = S.seasonBest.map(x => x.n + ':' + x.s).join(',');
          S.seasonBest = [{ n: 1, g, t: 1, id: 'nowhere', s: -5, c: 0 }, 'x', { n: 2, g, t: 7, id: courseFor(7).id, s: -9, c: 0 }]; initState();
          o.sbJunk = S.seasonBest.map(x => x.n + ':' + x.s).join(',');
          S.evLog = kE; S.bestCards = kB; S.hole = kH; startHole();
        }
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
    if (r.dotIdle) throw new Error('the trophy carried its dot with nothing waiting');
    if (r.cupPend !== 'cup0,cup1' || !r.dotWaiting) throw new Error('five cups left ' + r.cupPend + ' waiting (want the steps at 1 and 5), dot ' + r.dotWaiting);
    if (r.opensToday !== 'today/true') throw new Error('with a reward waiting the trophy opened the room on ' + r.opensToday);
    if (r.cupPaid !== 25 || r.cupAgain || r.cupPaidAgain !== 25) throw new Error('collecting the cups paid ' + r.cupPaid + ' then ' + r.cupPaidAgain + ' (want 25 once)');
    if (!r.collectAll || r.allPaid !== r.allWant) throw new Error('Collect all paid ' + r.allPaid + ' of ' + r.allWant + ' (the case and the free ' + 'sovereigns)');
    if (r.afterAll !== '0/none/clear') throw new Error('after Collect all: ' + r.afterAll);
    if (!r.freeDot || !r.freeGone) throw new Error('with only the free sovereigns waiting the trophy\'s dot was ' + r.freeDot + ', and after collecting ' + !r.freeGone);
    if (r.freeOnly !== r.freeGift + '/cup3') throw new Error('the free sovereigns\' button paid and left ' + r.freeOnly + ' (want ' + r.freeGift + '/cup3)');
    if (r.oneAll) throw new Error('with one thing to collect the Trophy Room still offered Collect all beside it');
    if (!r.cardDone || r.cardTop !== 288) throw new Error('the best card track ends at ' + r.cardTop + ' and reads done: ' + r.cardDone);
    if (r.caseRepair !== JSON.stringify({ cup: 8 })) throw new Error('a save with junk collected steps loaded as ' + r.caseRepair);
    if (!r.retireFinds) throw new Error('retiring here would find no heirloom, so the Career tab test measured nothing');
    if (!r.worthOn) throw new Error('retiring would find an heirloom and the Career tab said nothing');
    if (r.worthEarly || r.worthAll) throw new Error('the Career tab pointed at retiring before it opens, or with every heirloom found');
    if (r.retired !== '0/kept') throw new Error('after retiring the season log and best cards were ' + r.retired + ' (want 0/kept)');
    if (r.sb !== '1:-60,2:-45' || r.sbAway !== r.sb) throw new Error('the season bests are ' + r.sb + ' (want 1:-60,2:-45), and after an event away ' + r.sbAway);
    if (r.sbLines.length !== 2 || !/^-45Season 2 \(now\)/.test(r.sbLines[0]) || !/^-60Season 1 /.test(r.sbLines[1]) || !r.sbNamed)
      throw new Error('the Cabinet\'s Season Bests read ' + JSON.stringify(r.sbLines) + ' (want season 2 then 1, each with its course)');
    if (r.sbOther) throw new Error('a new golfer\'s Cabinet showed ' + r.sbOther + ' of the last golfer\'s season bests');
    if (r.sbRepair !== '1:-33' || r.sbJunk !== '2:-9') throw new Error('season bests from an old save\'s log read ' + r.sbRepair + ', and with junk ' + r.sbJunk);
    if (r.repaired !== '1/1' || r.repaired2 !== 'true/true') throw new Error('a save with junk records loaded as ' + r.repaired + ' / ' + r.repaired2);
    return ['every event logged with its course; away events post no card; the best five kept, best first',
      'the season shows six events, and what it names next is what then gets played (' + r.predict.map(x => x.split(':')[0]).join(', ') + ')',
      'the cabinet lights the majors won (x2 past one) and their jackets, holds ' + r.cups + ' cups and the best cards by course',
      'its rewards wait at each step, pay once and never go; Collect all takes them and the free sovereigns, and the trophy\'s dot goes',
      'the Career tab points at retiring when it would find an heirloom, and only then',
      'retiring clears the season and keeps the best cards; junk records load clean',
      'Season Bests: the best card of each season, newest first with its course; none from away, none of another golfer\'s; an old save starts from its log'];
  }
};
