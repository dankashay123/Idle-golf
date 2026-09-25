/* Signature holes: an island green on the home courses.
 *
 * On a home course the last par three of each nine is played to a green
 * alone in a lake. Shots are drawn landing where the yardage says, so an
 * island needs landing places that are never in the water, and the golfer
 * crosses to it on his club, spun over his head like a rotor.
 *
 *   - which holes: par threes, the last of their nine, on home courses (but
 *     Harbour Lights' front nine, which closes on its sea stack instead)
 *   - no ball ever comes down in the water, and where one lies only ever moves
 *     on down the hole
 *   - he walks to the bank and flies the rest, at the flight's pace, and never
 *     stands or walks on the water
 *   - the green is drawn on top of its lake (a sunken pond that size painted
 *     the green out)
 *   - the tee says it is a signature hole
 *   - a hole finished by the tee shot waits for him to fly across and land,
 *     scored from when the ball was down; behind the battery saver it does
 *     not wait (the first version never waited, so he never got there)
 */
'use strict';
module.exports = {
  name: 'island',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {};
      // in the lake and not on the green, which is drawn over the lake (the
      // apron as drawn: an ellipse 8.6 long and 3.05 wide at the pin)
      const wet = (d, x) => { const w = Scene.water, sp = w && Scene.hazSpan(w, d);
        const gd = (d - LEN) / 8.6, gx = x / 3.05;
        return !!sp && x > w.x - sp.l && x < w.x + sp.r && gd * gd + gx * gx >= 1; };
      try {
        // ---- which holes ----------------------------------------------------
        // a home course: the last par three of each nine; any other course
        // whose own signature is the island: the last par three of the round
        o.bad = []; o.home = 0; o.away = 0; o.wrongCount = []; o.noKind = []; o.islandCourses = 0;
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          const cs = B.COURSE[ci], t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          const home = cs.slot === 'home', mine = !home && B.SIG_HOLE[cs.id] === 'island';
          if (!home && !SIG_KINDS.includes(B.SIG_HOLE[cs.id])) o.noKind.push(cs.id);
          // Harbour Lights closes its front nine on the sea stack instead
          const pierFront = home && cs.id === 'harbour';
          let n = 0;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            if (courseFor(tournamentOf(h)).id !== cs.id) throw new Error('hole ' + h + ' is not on ' + cs.id);
            if (!isIsland(h)) continue;
            n++;
            if (home) o.home++; else o.away++;
            const r0 = holeInRound(h), end = home && r0 <= 9 ? 9 : 18;
            if (pierFront && r0 <= 9) o.bad.push(cs.id + ' hole ' + r0 + ' is an island, on the nine that closes on its sea stack');
            let later = 0; for (let k = r0 + 1; k <= end; k++) if (parOf(h + k - r0) === 3) later++;
            if (parOf(h) !== 3 || later) o.bad.push(cs.id + ' hole ' + r0 + ' par ' + parOf(h) + (later ? ', not the last par three of its ' + (home ? 'nine' : 'round') : ''));
          }
          if (!home && n !== (mine ? B.DAYS : 0)) o.wrongCount.push(cs.id + ' has ' + n + (mine ? ', not one a round' : ', but its signature is not the island'));
          if (mine) o.islandCourses++;
        }
        o.homes = B.COURSE.filter(c => c.slot === 'home').length;

        // ---- where balls lie, and the walk ------------------------------------
        QUIET = true;
        window.__step = window.step; window.step = () => {};
        ISLE_FORCE = S.hole; S.yards = S.yardsMax; Scene.newHole(S.hole, S.tier);
        const I = Scene.isle;
        o.isle = !!I && !!Scene.water && !!Scene.water.lake;
        o.wetSpot = []; o.back = 0;
        let prev = -1;
        for (let i = 0; i <= 1000; i++) {
          const d = Scene.spot(i / 1000);
          if (wet(d, 0) || wet(d, -0.3)) o.wetSpot.push((i / 10) + '% at ' + d.toFixed(1));
          if (d < prev - 1e-9) o.back++;
          prev = d;
        }
        o.bankDry = !wet(I.bank, 0); o.landDry = !wet(I.land, 0);

        // one shot from the tee onto the island, played out frame by frame
        const D = derive(), dt = 1 / 30;
        S.yards = S.yardsMax * 0.06;
        Scene.swing(1, false, null);
        let flew = 0, fast = 0, stood = 0, walked = 0, t = 0, last = Scene.camD;
        for (let f = 0; f < 30 * 9; f++) {
          Scene.draw(dt, D); t += dt;
          const c = Scene.camD, v = (c - last) / dt; last = c;
          const over = c > I.bank + 0.02 && c < I.land - 0.02;
          if (Scene.heli > 0) flew++;
          if (over && v > B_FLY * 1.05) fast++;
          if (over && v < 0.01) stood++;
          if (over && Scene.walkOn) walked++;
        }
        o.flew = flew * dt; o.fast = fast; o.stood = stood; o.walked = walked;
        o.end = +Scene.camD.toFixed(1); o.land = I.land;

        // the green under the flag, not the lake
        const p = Scene.proj(LEN - 2.5, 0);
        const px = Scene.b.getImageData(Math.round(p.x), Math.round(p.y) - 1, 1, 1).data;
        const hex = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        const T = Scene.theme, lake = new Set([].concat(T.wt || [], T._wt || []).map(x => String(x).toUpperCase()));
        o.greenPx = hex; o.greenWet = lake.has(hex);
        o.greenBlue = px[2] > px[1] + 10;

        // the tee says so
        window.step = window.__step;
        QUIET = false;
        // in a week that is not this kind's: the week's own tee says more
        // (see sigweek), and the week follows the calendar
        SIGWEEK_FORCE = 'canyon';
        $('toasts').innerHTML = '';
        startHole();
        o.toast = $('toasts').textContent;
      } finally {
        SIGWEEK_FORCE = null;
        window.step = window.__step || window.step;
        ISLE_FORCE = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
      return o;
    });
    // ---- the hole waits for him ------------------------------------------------
    // The ball is often down with the tee shot, and the first version moved on
    // to the next hole before he had flown: nobody ever saw him reach the
    // green. Played here in real frames, a hole finished by its first swing.
    const live = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), out = {};
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const once = async hidden => {
        ISLE_FORCE = S.hole; startHole(); Scene.announce = null;
        const h0 = S.hole, I = Scene.isle, pt = S.parTime;
        if (hidden) saverNow();
        S.yards = S.yardsMax * 0.005;          // the next swing finishes it
        let heli = 0, cam = 0, doneT = null, el = 0, t0 = performance.now(), moved = false;
        while (performance.now() - t0 < 12000) {
          await sleep(40);
          if (S.hole !== h0) { moved = true; break; }
          heli = Math.max(heli, Scene.heli || 0); cam = Scene.camD; doneT = S.doneT; el = S.elapsed;
        }
        const sc = S.scores[holeInRound(h0) - 1];
        if (hidden) saverOff();
        return { moved, heli: +heli.toFixed(2), cam: +cam.toFixed(1), land: I.land, doneT, el: +el.toFixed(2),
                 scored: sc && sc.d, want: doneT != null ? scoreFor(doneT / pt).d : null };
      };
      try {
        hideSheet(); QUIET = false;
        out.seen = await once(false);
        out.saver = await once(true);
      } finally {
        ISLE_FORCE = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
      return out;
    });

    const f = m => { throw new Error(m); };
    const L = live.seen;
    if (!L.moved) f('an island hole finished by the tee shot never moved on');
    if (!(L.heli > 0.8) || L.cam < L.land - 0.1) f('an island hole finished by the tee shot moved on before he had flown across (flew '
      + L.heli + ' of the way, stood at ' + L.cam + ' of ' + L.land + ')');
    if (L.scored !== L.want) f('the island hole was scored ' + L.scored + ', not ' + L.want + ' as at the moment the ball was down');
    const V = live.saver;
    // with no wait the hole moves on in the step the ball is down, so that
    // moment is never seen from here at all
    if (!V.moved || (V.doneT != null && V.el - V.doneT > 0.3)) f('behind the battery saver an island hole '
      + (V.moved ? 'waited ' + (V.el - V.doneT).toFixed(2) + 's for a flight nobody could see' : 'never moved on'));
    if (r.bad.length) f('island greens on the wrong holes: ' + r.bad.slice(0, 4).join('; '));
    if (r.noKind.length) f('courses with no signature hole of their own: ' + r.noKind.join(', '));
    if (r.wrongCount.length) f('island greens on the other courses: ' + r.wrongCount.slice(0, 4).join('; '));
    if (!r.islandCourses) f('no course but the home courses has an island green');
    const wantHome = r.homes * B_ISLANDS_PER_EVENT - 4;   // Harbour Lights' front nine has the sea stack
    if (r.home !== wantHome) f(r.home + ' island greens over ' + r.homes + ' home events, not '
      + wantHome + ' (the last par three of each nine, but Harbour Lights\' front)');
    if (!r.isle) f('a forced island hole has no lake');
    if (r.wetSpot.length) f('balls come down in the water: ' + r.wetSpot.slice(0, 4).join(', '));
    if (r.back) f('where a ball lies went back up the hole ' + r.back + ' times');
    if (!r.bankDry || !r.landDry) f('he takes off from ' + (r.bankDry ? 'dry ground' : 'the water') + ' and lands on ' + (r.landDry ? 'dry ground' : 'the water'));
    if (!(r.flew > 1)) f('he flew for ' + r.flew.toFixed(2) + 's crossing the water');
    if (r.fast) f('he crossed ' + r.fast + ' frames of water faster than the flight');
    if (r.stood || r.walked) f('he ' + (r.stood ? 'stood still ' + r.stood : 'walked ' + r.walked) + ' frames on the water');
    if (r.end < r.land) f('he ended the shot at ' + r.end + ', short of the island at ' + r.land);
    if (r.greenWet || r.greenBlue) f('the lake is drawn over the green by the flag (' + r.greenPx + ')');
    if (!/Signature Hole/.test(r.toast) || !/Island Green/.test(r.toast)) f('the tee of an island hole said "' + r.toast + '"');
    return [r.home + ' island greens over ' + r.homes + ' home events, the last par three of each nine; ' + r.away + ' on the '
      + r.islandCourses + ' other courses whose signature it is, one a round; every course has a signature hole',
      'a tee shot that finishes it waits for him to land (' + (L.el - L.doneT).toFixed(1) + 's, scored from the ball) and not behind the saver',
      'no ball lands wet; he flew ' + r.flew.toFixed(1) + 's at the flight pace and never stood on the water; green by the flag ' + r.greenPx];
  }
};
const B_ISLANDS_PER_EVENT = 8;   // two a round, four rounds
