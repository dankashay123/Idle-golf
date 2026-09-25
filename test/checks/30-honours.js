/* The honours for the newer things on the course. Each one is counted by the
 * deed it names, and only by that:
 *
 *   - Round the Corner: a shot on the course that starts short of a designed
 *     corner (a bend of 8 or more) and comes down past it. A shot that stays
 *     short of the corner, one that starts past it, and a shot aimed at a mark
 *     do not count
 *   - Wind Cheater: a birdie or better with 15 mph of wind or more; a birdie
 *     in a breeze, or a par in a gale, does not
 *   - Matching Pair: the fairy wearing the golfer's own look
 *   - Home Tour: an event on each of the ten home courses. The home course is
 *     chosen when an event opens, and that is when it is noted; a calendar
 *     course is not a home course
 *   - Major Winner: one major of the week won; Full Staff: every caddie perk
 *     owned (its target is written as a number, so a new perk must move it)
 *   - each is awarded by the honours pass once reached, and a save carrying
 *     junk in the home courses played loads clean
 *   - the signature holes: a birdie or better counts on each kind (island,
 *     canyon, stones) and a par does not; an ace on an island counts; par or
 *     better on all four of a home round's counts once, a bogey on one of
 *     them spoils the round, and the one signature hole of any other course
 *     never makes a signature round; an ordinary hole counts for none; a save
 *     with junk in the round being counted loads clean
 */
'use strict';
module.exports = {
  name: 'honours',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {};
      try {
        hideSheet(); QUIET = false;
        // ---- round a dogleg ------------------------------------------------
        let h = 1; for (; h < 200; h++) { Scene.newHole(h, 0); if (Scene.curve.segs.some(g => Math.abs(g.a) >= 8)) break; }
        const g = Scene.curve.segs.find(q => Math.abs(q.a) >= 8);
        // one swing of the simulation, carrying the ball from one place to another
        // on the hole; counted there, so it counts with the menu over the field
        const D0 = derive();
        const shot = (from, to, wager) => {
          S.tally.dogleg = 0; S.yardsMax = 1000; S.yards = 1000 * (1 - from / LEN);
          S.armor = 0; S.frost = 0; S.holeSwings = 5;
          const D = Object.assign({}, D0, { pow: 1000 * (to - from) / LEN, mst: 0, crit: 0, proc: 0, ball: null,
                                            C: Object.assign({}, D0.C, { onesw: 0 }) });
          const keep = S.dgnRun; if (wager) S.dgnRun = { id: 'sand' };
          try { oneSwing(D, false); } finally { S.dgnRun = keep; }
          return S.tally.dogleg || 0;
        };
        o.dog = { round: shot(g.c - g.w, g.c + g.w), short: shot(g.c - g.w, g.c), past: shot(g.c + g.w * 0.6, g.c + g.w * 2),
                  aimed: shot(g.c - g.w, g.c + g.w, true), bend: +g.a.toFixed(1) };

        // ---- birdies in the wind -------------------------------------------
        const hole = (wind, ratio) => {
          S.tally.windBird = 0; startHole(); Scene.wind = wind;
          S.elapsed = S.parTime * ratio; finishHole(derive());
          return S.tally.windBird || 0;
        };
        QUIET = true;                                  // no toasts from the holes played
        o.wind = { gale: hole(1.0, 0.6), breeze: hole(0.3, 0.6), galePar: hole(1.0, 1.0), mph: Math.round(18 * 1.0) };

        // ---- after a wager, the course's own scene again ------------------------
        o.afterWager = [];
        for (const dg of B.DGN) {
          startHole(); const want = Scene.themeId;
          Scene.newDepthsHole({ id: dg.id, floor: 0, work: 5, full: 10, mode: dg.mode, t: 0, dur: 30, cleared: 0, log: [] });
          S.dgnRun = null; Scene.draw(0.016, derive());
          if (Scene.themeId !== want || Scene.hole !== S.hole) o.afterWager.push(dg.id + ' left ' + Scene.themeId);
        }

        // ---- the fairy in the golfer's look ----------------------------------
        S.styleOwn['o:tweed'] = 1; S.styleOwn['c:tweed'] = 1;
        S.styleOwn['c:classic'] = 1; S.outfit = 'classic'; S.caddie = 'classic'; o.twinStart = achMetric('twin');
        S.outfit = 'tweed'; S.caddie = 'bib'; o.twinOff = achMetric('twin');
        S.caddie = 'tweed'; o.twinOn = achMetric('twin');

        // ---- the home courses, noted when an event opens on one -------------
        // arriving on each of ten cards, the way a golfer comes to each home
        const homes = B.COURSE.filter(c => c.slot === 'home');
        let ev = 2; while (calendarCourse(ev).slot !== 'event' || (ev - 1) % B.SEASON === 0) ev++;
        const openOn = (tier, arrived) => {
          S.tier = tier; S.homeSeen = arrived ? -1 : tier; S.evCourse = null;
          S.hole = (ev - 1) * B.ROUND * B.DAYS + 1; startHole();
        };
        S.homes = {};
        for (let k = 0; k < homes.length; k++) openOn(k, true);
        o.homes = achMetric('homes'); o.homesNeed = homes.length;
        // a save that arrives part way through an event on a home course
        S.homes = {}; S.evCourse = { t: ev, id: homes[4].id }; S.hole = (ev - 1) * B.ROUND * B.DAYS + 7; startHole();
        o.midEvent = !!S.homes[homes[4].id];
        // and an event that opens on the calendar course is not a home one
        S.homes = {}; openOn(3, false); o.calNoted = achMetric('homes') + ' on ' + S.evCourse.id;

        // ---- awarded ----------------------------------------------------------
        S.homes = {}; for (const cs of homes) S.homes[cs.id] = 1;
        S.majorWins = { masters: 1 };
        S.cperkOwn = {}; for (const p of B.CPERKS) S.cperkOwn[p.id] = 1;
        const need = id => B.ACH.find(x => x.id === id).v;
        S.tally.dogleg = need('dogleg'); S.tally.windBird = need('windy');
        const ids = ['dogleg', 'windy', 'twin', 'homes', 'major1', 'staff'];
        for (const id of ids) delete S.achDone[id];
        checkAch();
        o.awarded = ids.filter(id => S.achDone[id]);
        o.staffV = B.ACH.find(a => a.id === 'staff').v; o.perks = B.CPERKS.length;

        // ---- an honour counted as a share reads as one -----------------------------
        const sb = B.ACH.find(a => a.m === 'mst'); delete S.achDone[sb.id];
        const hw = document.createElement('div'); honRows(hw);
        const row = [...hw.querySelectorAll('.row')].find(e => e.querySelector('.nm').textContent.indexOf(sb.n) >= 0);
        o.share = row ? row.querySelector('.mt').textContent : '';

        // ---- the signature holes ------------------------------------------------
        {
          S.autoClimb = 0;
          // the time that cards each score, read off the scoring itself
          const at = d => { for (let q = 0.01; q < 4; q += 0.005) if (scoreFor(q).d === d) return q; return null; };
          // and the Trophy Room's record of them, kept alongside
          const mine = {};
          const play = (h, d) => { const k = sigKind(h);
            if (k) { const m = mine[k] || (mine[k] = { n: 0, b: null }); m.n++; if (m.b === null || d < m.b) m.b = d; }
            S.hole = h; startHole(); S.elapsed = S.parTime * at(d); S.doneT = null; S.yards = 0; finishHole(derive()); };
          const T = () => ({ is: tally('sigIsle'), cn: tally('sigCanyon'), st: tally('sigStones'), rl: tally('sigRail'), rd: tally('sigRound'), ace: tally('isleAce') });
          for (const k of ['sigIsle', 'sigCanyon', 'sigStones', 'sigRail', 'sigRound', 'isleAce']) S.tally[k] = 0;
          delete S.sigRound; delete S.sigRec; S.tally.sigPier = 0;
          const home = B.COURSE.findIndex(c => c.slot === 'home');
          DEV.course(home); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          const round = r0 => { const a = []; for (let h = r0; h < r0 + B.ROUND; h++) if (sigKind(h)) a.push(h); return a; };
          const r1 = round(first), r2 = round(first + B.ROUND), r3 = round(first + 2 * B.ROUND);
          o.sigPer = r1.map(sigKind).join(',');
          // round one: par on all five -- a signature round, and no birdies
          r1.forEach(h => play(h, 0)); o.sigPar = T();
          // round two: birdies on all five but a bogey on the last -- birdies
          // counted on each kind, no round
          r2.forEach((h, i) => play(h, i === r2.length - 1 ? 1 : -1)); o.sigBogey = T(); o.sigR2 = r2.map(sigKind);
          // round three: an ace on an island
          play(r3.find(h => sigKind(h) === 'island'), -4); o.sigAce = T();
          // an ordinary hole with a birdie
          const plain = (() => { for (let h = first; h < first + B.ROUND; h++) if (!sigKind(h)) return h; })();
          play(plain, -1); o.sigPlain = T();
          // a course with one signature hole: four rounds of par on it are
          // never a signature round
          const away = B.COURSE.findIndex(c => c.slot !== 'home' && B.SIG_HOLE[c.id] === 'canyon');
          DEV.course(away); hideSheet();
          const t2 = tournamentOf(S.hole), f2 = (t2 - 1) * B.ROUND * B.DAYS + 1;
          const aw = []; for (let h = f2; h < f2 + B.ROUND * B.DAYS; h++) if (sigKind(h)) aw.push(h);
          o.awayN = aw.length;
          aw.forEach(h => play(h, 0)); play(aw[0], -1); o.sigAway = T();
          // Harbour Lights' sea stack, eagled
          DEV.course(B.COURSE.findIndex(c => c.id === 'harbour')); hideSheet();
          const t3 = tournamentOf(S.hole), f3 = (t3 - 1) * B.ROUND * B.DAYS + 1;
          let ph = f3; while (sigKind(ph) !== 'pier' && ph < f3 + B.ROUND) ph++;
          play(ph, -2); o.pierBird = tally('sigPier');
          // the record: a row for each kind, what was played and the best card
          o.recWant = mine; o.recGot = JSON.parse(JSON.stringify(S.sigRec || {}));
          const rw = document.createElement('div'); rw.id = 'statRows'; document.body.appendChild(rw);
          renderRecord();
          o.recRows = {};
          for (const l of rw.querySelectorAll('.lb')) o.recRows[l.children[1].textContent] = l.children[2].textContent;
          rw.remove();
          const keepRec = S.sigRec; delete S.sigRec;
          const rw2 = document.createElement('div'); rw2.id = 'statRows'; document.body.appendChild(rw2);
          renderRecord(); o.recNone = [...rw2.querySelectorAll('.lb')].filter(l => /Island|Canyon|Stepping|Sea Stack/.test(l.children[1].textContent)).map(l => l.children[2].textContent);
          rw2.remove(); S.sigRec = keepRec;
          checkAch();
          o.sigDone = ['sig4', 'sigIs', 'sigCn', 'sigSt', 'isleAce'].filter(id => S.achDone[id]).join(',');
          // junk in the round being counted
          o.sigRepair = [];
          for (const v of ['x', 5, { r: 'a', n: 1 }, { r: 3, n: 9, ok: 1 }]) { S.sigRound = v; initState(); if (S.sigRound !== undefined) o.sigRepair.push(JSON.stringify(v)); }
          S.sigRound = { r: 4, n: 2, ok: 1 }; initState(); if (!S.sigRound || S.sigRound.n !== 2) o.sigRepair.push('a good one was dropped');
          for (const v of ['x', [], { moat: { n: 1, b: 0 } }, { island: { n: 0, b: 0 } }, { canyon: { n: 2, b: 'x' } }, { stones: null }]) {
            S.sigRec = v; initState();
            if (S.sigRec !== undefined && Object.keys(S.sigRec).length) o.sigRepair.push('record ' + JSON.stringify(v) + ' loaded as ' + JSON.stringify(S.sigRec)); }
          S.sigRec = { pier: { n: 3.7, b: -9 } }; initState();
          if (!S.sigRec || !S.sigRec.pier || S.sigRec.pier.n !== 3 || S.sigRec.pier.b !== -4) o.sigRepair.push('a good record loaded as ' + JSON.stringify(S.sigRec));

          // ---- the Signature Week: all five kinds in one real week ----
          // (a home round has four; the sea stack is found at Harbour Lights)
          // (played without writing to the record's tally above, which is already read)
          const playW = (h, d) => { S.hole = h; startHole(); S.elapsed = S.parTime * at(d); S.doneT = null; S.yards = 0; finishHole(derive()); };
          const homeFour = () => { DEV.course(home); hideSheet(); const t0 = tournamentOf(S.hole); return round((t0 - 1) * B.ROUND * B.DAYS + 1); };
          const aPier = () => { DEV.course(B.COURSE.findIndex(c => c.id === 'harbour')); hideSheet();
            const t0 = tournamentOf(S.hole), f0 = (t0 - 1) * B.ROUND * B.DAYS + 1; let q = f0; while (sigKind(q) !== 'pier' && q < f0 + B.ROUND) q++; return q; };
          const recRow = () => { const rw = document.createElement('div'); rw.id = 'statRows'; document.body.appendChild(rw); renderRecord();
            const l = [...rw.querySelectorAll('.lb')].find(x => x.children[1].textContent === 'Signature Week'); rw.remove(); return l ? l.children[2].textContent : null; };
          const W = { }, mon = 7 * 2960 - 3;             // a Monday
          S.tally.sigWeek = 0; delete S.sigWk; delete S.achDone.sigWk;
          DAY_FORCE = mon + 1;
          W.none = recRow();
          const sov0 = S.sov || 0;
          homeFour().forEach(h => playW(h, 0)); W.four = { t: tally('sigWeek'), row: recRow(), sov: (S.sov || 0) - sov0 };
          // and on the Tour tab: each kind ticked off as it is played, the
          // hole of the week marked, the count in the band
          renderSigWeek();
          W.tour = { note: $('sigNote').textContent, rows: [...$('sigBox').querySelectorAll('.lb')].map(l => [l.children[1].textContent, l.children[2].textContent]) };
          playW(aPier(), 1); W.five = { t: tally('sigWeek'), row: recRow(), sov: (S.sov || 0) - sov0 };
          // again the same week: once a week
          playW(aPier(), -1); homeFour().forEach(h => playW(h, -1)); W.again = tally('sigWeek');
          W.againSov = (S.sov || 0) - sov0;
          checkAch(); W.honour = !!S.achDone.sigWk;
          // the next week starts again from none
          DAY_FORCE = mon + 7; W.nextRow = recRow();
          // four on the Sunday and the sea stack on the Monday: two weeks, not one
          DAY_FORCE = mon + 13; homeFour().forEach(h => playW(h, 0));
          DAY_FORCE = mon + 14; playW(aPier(), 0); W.split = { t: tally('sigWeek'), row: recRow() };
          // and the whole of it that next week
          homeFour().forEach(h => playW(h, 0)); W.second = tally('sigWeek');
          // junk in the week being counted
          W.repair = [];
          for (const v of ['x', 3, { wk: 'a', k: [] }, { wk: 3, k: 'island' }, { wk: 3, k: ['moat'] }, { wk: 3, k: ['pier', 'pier'] }]) { S.sigWk = v; initState(); if (S.sigWk !== undefined) W.repair.push(JSON.stringify(v)); }
          S.sigWk = { wk: 3, k: ['pier', 'rail'] }; initState(); if (!S.sigWk || S.sigWk.k.length !== 2) W.repair.push('a good one was dropped');
          DAY_FORCE = null;
          o.sigWeek = W; o.sigWeekSov = B.SIG_WEEK_SOV;
        }

        // ---- a save with junk in it ---------------------------------------------
        S.homes = { willow: 1, nowhere: 1, masters: 1 }; initState(); o.repaired = Object.keys(S.homes).join(',');
        S.homes = 'x'; initState(); o.repaired2 = typeof S.homes + ':' + Object.keys(S.homes).length;
      } finally {
        QUIET = false; OFFLINE = false; DAY_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    const f2 = m => { throw new Error(m); };
    const d = r.dog;
    if (d.round !== 1) throw new Error('a shot from short of the corner to past it counted ' + d.round + ' times round a dogleg (bend ' + d.bend + ')');
    if (d.short || d.past || d.aimed)
      throw new Error('shots that did not go round the corner counted: short ' + d.short + ', from past it ' + d.past + ', in a wager ' + d.aimed);
    const w = r.wind;
    if (w.gale !== 1) throw new Error('a birdie in ' + w.mph + ' mph of wind counted ' + w.gale + ' times');
    if (w.breeze || w.galePar) throw new Error('counted in the wind: a birdie in a breeze ' + w.breeze + ', a par in a gale ' + w.galePar);
    if (r.afterWager.length) throw new Error('after a wager the course kept the wager\'s scene: ' + r.afterWager.join('; '));
    if (r.twinStart !== 0) throw new Error('Matching Pair was given for the look a new golfer starts in');
    if (r.twinOff !== 0 || r.twinOn !== 1) throw new Error('Matching Pair read ' + r.twinOff + ' unmatched and ' + r.twinOn + ' matched');
    if (r.homes !== r.homesNeed) throw new Error('an event on each of the ' + r.homesNeed + ' home courses noted ' + r.homes);
    if (!r.midEvent) throw new Error('an event on a home course that the save arrived part way through was never noted');
    if (!/^0 /.test(r.calNoted)) throw new Error('an event on a calendar course was noted as a home course: ' + r.calNoted);
    if (r.awarded.length !== 6) throw new Error('only ' + r.awarded.join(', ') + ' were awarded once reached');
    if (r.staffV !== r.perks) throw new Error('Full Staff asks for ' + r.staffV + ' perks and there are ' + r.perks);
    if (!/^\d+% \/ \d+%/.test(r.share)) throw new Error('an honour counted as a share reads "' + r.share + '"');
    const J = x => JSON.stringify(x);
    if (r.sigPer.split(',').sort().join(',') !== 'canyon,island,island,rail,stones') f2('a home round\'s signature holes are ' + r.sigPer);
    if (J(r.sigPar) !== J({ is: 0, cn: 0, st: 0, rl: 0, rd: 1, ace: 0 })) f2('par on all five of a home round counted ' + J(r.sigPar) + ' (want one signature round, no birdies)');
    const bird = { is: 0, cn: 0, st: 0, rl: 0, rd: 1, ace: 0 };
    r.sigR2.slice(0, -1).forEach(k => bird[{ island: 'is', canyon: 'cn', stones: 'st', rail: 'rl' }[k]]++);
    if (J(r.sigBogey) !== J(bird))
      f2('birdies on four and a bogey on the last counted ' + J(r.sigBogey) + ' (want a birdie on each kind birdied, no new round)');
    if (r.sigAce.ace !== 1 || r.sigAce.is !== r.sigBogey.is + 1) f2('an ace on an island counted ' + J(r.sigAce));
    if (J(r.sigPlain) !== J(r.sigAce)) f2('a birdie on an ordinary hole counted: ' + J(r.sigPlain));
    if (r.awayN !== 4 || r.sigAway.rd !== 1 || r.sigAway.cn !== r.sigPlain.cn + 1) f2('a canyon course (' + r.awayN + ' signature holes an event): ' + J(r.sigAway) + ' (want one more canyon birdie and no signature round)');
    const W = r.sigWeek;
    if (W.none !== '0\u00a0of 5 this week' || W.four.t || W.four.row !== '4\u00a0of 5 this week' || W.five.t !== 1 || W.five.row !== '5\u00a0of 5 this week')
      f2('the Signature Week: ' + JSON.stringify(W) + ' (none at first, four from a home round and no honour, the sea stack makes five and the honour)');
    const tr = W.tour, B25 = r.sigWeekSov;
    if (tr.note !== '4\u00a0of 5 this week' || tr.rows.length !== 5 || tr.rows.filter(([, v]) => /played/.test(v)).length !== 4
        || /played/.test(tr.rows.find(([k]) => /Sea Stack/.test(k))[1]) || tr.rows.filter(([k]) => /pays/.test(k)).length !== 1)
      f2('the Signature Week on the Tour tab: ' + JSON.stringify(tr) + ' (five kinds, the four played ticked, the sea stack not, the hole of the week marked)');
    if (W.four.sov || W.five.sov !== B25 || W.againSov !== B25) f2('the Signature Week\'s prize: ' + W.four.sov + ' sovereigns with four kinds, ' + W.five.sov + ' with five, ' + W.againSov + ' after playing on that week (' + B25 + ' once a week)');
    if (W.again !== 1 || !W.honour) f2('the Signature Week counted again in the same week (' + W.again + '), or not awarded (' + W.honour + ')');
    if (W.nextRow !== '0\u00a0of 5 this week' || W.split.t !== 1 || W.split.row !== '1\u00a0of 5 this week' || W.second !== 2)
      f2('the Signature Week across weeks: ' + JSON.stringify(W) + ' (a new week starts from none; four on a Sunday and the fifth on the Monday is no week; all five the next week is)');
    if (W.repair.length) f2('junk in the Signature Week loaded: ' + W.repair.join(', '));
    if (r.sigDone !== 'sig4,isleAce') f2('signature honours awarded: ' + (r.sigDone || 'none') + ' (want Signature Round and Ace on the Island)');
    if (r.pierBird !== 1) f2('an eagle on a sea stack counted ' + r.pierBird + ' sea stack birdies');
    if (J(r.recGot) !== J(r.recWant)) f2('the signature record kept ' + J(r.recGot) + ', not ' + J(r.recWant));
    const nm = d => d <= -4 ? 'Ace' : { '-3': 'Albatross', '-2': 'Eagle', '-1': 'Birdie', 0: 'Par', 1: 'Bogey' }[d];
    for (const [k, t] of [['island', 'Island Green'], ['canyon', 'Canyon Carry'], ['stones', 'Stepping Stones'], ['pier', 'Sea Stack']]) {
      const w = r.recWant[k], want = w.n + '\u00a0played \u00b7 best ' + nm(w.b);
      if (r.recRows[t] !== want) f2('the Trophy Room\'s ' + t + ' row reads "' + r.recRows[t] + '", not "' + want + '"');
    }
    if (r.recNone.length !== 4 || r.recNone.some(x => x !== '\u2014')) f2('with none played the record reads ' + J(r.recNone));
    if (r.sigRepair.length) f2('a save with junk in its signature round: ' + r.sigRepair.join('; '));
    if (r.repaired !== 'willow' || r.repaired2 !== 'object:0') throw new Error('a save with junk home courses loaded as ' + r.repaired + ' / ' + r.repaired2);
    return ['round a dogleg: only a shot from short of the corner to past it (bend ' + d.bend + ')',
      'a birdie in ' + w.mph + ' mph of wind counts, a birdie in a breeze or a par in a gale does not',
      'the matching pair, all ' + r.homesNeed + ' home courses, a major and every caddie perk: all six awarded',
      'signature holes: birdies counted by kind, an island ace, a home round of par or better once, spoilt by a bogey, never on a course with one',
      'the Signature Week: four kinds from a home round, the sea stack the fifth and ' + r.sigWeekSov + ' sovereigns, once a week; four on a Sunday and the fifth on the Monday no week',
      'the Trophy Room records each kind: ' + Object.entries(r.recGot).map(([k, v]) => k + ' ' + v.n + ' best ' + v.b).join(', ')];
  }
};
