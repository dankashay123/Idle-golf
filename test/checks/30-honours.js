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

        // ---- a save with junk in it ---------------------------------------------
        S.homes = { willow: 1, nowhere: 1, masters: 1 }; initState(); o.repaired = Object.keys(S.homes).join(',');
        S.homes = 'x'; initState(); o.repaired2 = typeof S.homes + ':' + Object.keys(S.homes).length;
      } finally {
        QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
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
    if (r.repaired !== 'willow' || r.repaired2 !== 'object:0') throw new Error('a save with junk home courses loaded as ' + r.repaired + ' / ' + r.repaired2);
    return ['round a dogleg: only a shot from short of the corner to past it (bend ' + d.bend + ')',
      'a birdie in ' + w.mph + ' mph of wind counts, a birdie in a breeze or a par in a gale does not',
      'the matching pair, all ' + r.homesNeed + ' home courses, a major and every caddie perk: all six awarded'];
  }
};
