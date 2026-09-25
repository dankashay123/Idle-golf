/* The third signature hole: stepping stones over a river, on home courses.
 *
 * On a home course the last par four of the round crosses a river cut right
 * across the hole, and the golfer hops over it on a line of stones. As with
 * the island and the canyon: no ball lands in the water, he walks to the bank
 * and crosses at a steady pace, and a hole finished before he is over waits.
 *
 *   - which holes: par fours, the last of their round, on home courses only
 *   - no ball comes down in the river; where one lies only moves on
 *   - the stones run bank to bank, all in the water, a hop apart
 *   - he hops across at the hop's pace, never standing still in the river,
 *     and every stone gets a knock and a splash
 *   - a hole finished by one swing waits until he is across
 *   - the tee says it is a signature hole
 */
'use strict';
module.exports = {
  name: 'stones',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { bad: [], home: 0, away: 0, wrongCount: [], mineCourses: 0 };
      const inGorge = d => { const w = Scene.water, sp = w && w.river && Scene.hazSpan(w, d);
        return !!sp && sp.l > 0.8 && sp.r > 0.8; };
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          const cs = B.COURSE[ci], t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          const home = cs.slot === 'home', mine = !home && B.SIG_HOLE[cs.id] === 'stones';
          let n = 0;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            if (!isStones(h)) continue;
            n++;
            if (home) o.home++; else o.away++;
            const r0 = holeInRound(h);
            let later = 0; for (let k = r0 + 1; k <= B.ROUND; k++) if (parOf(h + k - r0) === 4) later++;
            if (parOf(h) !== 4 || later || sigKind(h) !== 'stones') o.bad.push(cs.id + ' hole ' + r0 + ' par ' + parOf(h));
          }
          if (!home && n !== (mine ? B.DAYS : 0)) o.wrongCount.push(cs.id + ' has ' + n + (mine ? ', not one a round' : ', but its signature is not this'));
          if (mine) o.mineCourses++;
        }
        o.homes = B.COURSE.filter(c => c.slot === 'home').length;

        QUIET = true;
        window.__step = window.step; window.step = () => {};
        STONES_FORCE = S.hole; S.yards = S.yardsMax; Scene.newHole(S.hole, S.tier);
        const I = Scene.isle;
        o.laid = !!I && I.hop && !!Scene.water && !!Scene.water.river;
        const st = I.stones || [];
        o.stones = st.length;
        o.stonesWet = st.every(d => inGorge(d));
        o.gaps = [I.bank].concat(st, [I.land]).slice(1).map((d, i, a) => +(d - (i ? a[i - 1] : I.bank)).toFixed(2));
        o.wet = []; o.back = 0;
        let prev = -1;
        for (let i = 0; i <= 1000; i++) {
          const d = Scene.spot(i / 1000);
          if (inGorge(d)) o.wet.push((i / 10) + '% at ' + d.toFixed(1));
          if (d < prev - 1e-9) o.back++;
          prev = d;
        }
        o.rims = !inGorge(I.bank) && !inGorge(I.land) && inGorge((I.bank + I.land) / 2);

        // one shot over the gorge, frame by frame
        const D = derive(), dt = 1 / 30;
        S.yards = S.yardsMax * 0.3;
        Scene.swing(1, false, null);
        let crossed = 0, fast = 0, stood = 0, last = Scene.camD, plank = 0, looked = 0, flew = 0;
        for (let f = 0; f < 30 * 9; f++) {
          Scene.draw(dt, D);
          const c = Scene.camD, v = (c - last) / dt; last = c;
          const over = c > I.bank + 0.05 && c < I.land - 0.05;
          if (Scene.heli) flew++;
          if (over) {
            crossed++;
            if (v > B_HOP * 1.05) fast++;
            if (v < 0.01) stood++;
          }
        }
        o.crossed = crossed * dt; o.fast = fast; o.stood = stood; o.flew = flew;
        o.plank = plank; o.looked = looked; o.end = +Scene.camD.toFixed(1); o.land = I.land;

        // the last hundredth of a hop before the far bank is still crossing:
        // that moment once read as neither, and the hole went on without him
        Scene.camD = I.land - 0.03; Scene.crossing = 0.99; Scene.landT = -99; Scene.drawnAt = performance.now();
        Scene.hole = S.hole; const q = QUIET; QUIET = false;
        o.edgeWaits = Scene.holeWait(); QUIET = q;

        window.step = window.__step;
        QUIET = false;
        // in a week that is not this kind's: the week's own tee says more
        // (see sigweek), and the week follows the calendar
        SIGWEEK_FORCE = 'island';
        $('toasts').innerHTML = '';
        startHole();
        o.toast = $('toasts').textContent;
      } finally {
        SIGWEEK_FORCE = null;
        window.step = window.__step || window.step;
        STONES_FORCE = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
      return o;
    });

    // a hole finished by one swing, in real frames
    const live = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S);
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      try {
        hideSheet(); QUIET = false;
        STONES_FORCE = S.hole; startHole(); Scene.announce = null;
        const h0 = S.hole, I = Scene.isle;
        S.yards = S.yardsMax * 0.005;
        let cam = 0, moved = false, over = 0;
        const t0 = performance.now();
        while (performance.now() - t0 < 12000) {
          await sleep(40);
          if (S.hole !== h0) { moved = true; break; }
          cam = Scene.camD; if (Scene.crossing) over++;
        }
        return { moved, cam: +cam.toFixed(1), land: I.land, over };
      } finally {
        STONES_FORCE = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
    });

    // a knock and a splash for every stone, through a stand-in audio context
    const snd = await page.evaluate(() => {
      const keep = { ctx: Sfx.ctx, hop: Sfx.hop, plank: Sfx.plank, chirp: Sfx.chirp, mt: Sfx.musicTick,
                     isle: Scene.isle, camD: Scene.camD, crossing: Scene.crossing, heli: Scene.heli, sound: S.sound };
      const n = { hop: 0, plank: 0 };
      try {
        S.sound = 1; QUIET = false;
        Sfx.ctx = { state: 'running', currentTime: 1 };
        Sfx.hop = () => { n.hop++; }; Sfx.plank = () => { n.plank++; }; Sfx.chirp = () => {}; Sfx.musicTick = () => {};
        Scene.isle = { bank: 10, land: 16, hop: 1, hopLen: 1.2, stones: [11.2, 12.4, 13.6, 14.8] };
        Scene.heli = 0; Sfx.stepK = null;
        for (let c = 10.05; c < 16; c += 0.1) { Scene.camD = c; Scene.crossing = (c - 10) / 6; Sfx.tick(0.04); }
        return n;
      } finally {
        Sfx.ctx = keep.ctx; Sfx.hop = keep.hop; Sfx.plank = keep.plank; Sfx.chirp = keep.chirp; Sfx.musicTick = keep.mt;
        Scene.isle = keep.isle; Scene.camD = keep.camD; Scene.crossing = keep.crossing; Scene.heli = keep.heli; S.sound = keep.sound;
      }
    });

    const f = m => { throw new Error(m); };
    if (snd.hop !== 5 || snd.plank) f('hopping five stones\' worth played ' + snd.hop + ' splashes and ' + snd.plank + ' plank knocks');
    if (r.bad.length) f('stepping stones on the wrong holes: ' + r.bad.slice(0, 4).join('; '));
    if (r.wrongCount.length) f('stepping-stone holes on the other courses: ' + r.wrongCount.slice(0, 4).join('; '));
    if (!r.mineCourses) f('no course but the home courses has stepping-stone holes');
    if (r.home !== r.homes * 4) f(r.home + ' stepping-stone holes over ' + r.homes + ' home events, not ' + r.homes * 4 + ' (one a round)');
    if (!r.laid) f('a forced stepping-stones hole has no river');
    if (!r.rims) f('the crossing does not run from bank to bank over the river');
    if (!(r.stones >= 3) || !r.stonesWet || r.gaps.some(g => g > 1.4 || g < 0.8)) f('the stones: ' + r.stones + ', in the water ' + r.stonesWet + ', gaps ' + r.gaps.join(' '));
    if (r.wet.length) f('balls come down in the river: ' + r.wet.slice(0, 4).join(', '));
    if (r.back) f('where a ball lies went back up the hole ' + r.back + ' times');
    if (!r.edgeWaits) f('a step short of the far bank the hole did not wait for him');
    if (!(r.crossed > 1)) f('he spent ' + r.crossed.toFixed(2) + 's crossing the river');
    if (r.flew) f('he flew over the river: that is the island');
    if (r.fast || r.stood) f('crossing the river he ' + (r.fast ? 'went faster than a hop ' + r.fast + ' frames' : 'stood still ' + r.stood + ' frames'));
    if (r.end < r.land) f('he ended the shot at ' + r.end + ', short of the far bank at ' + r.land);
    if (!/Signature Hole/.test(r.toast) || !/Stepping Stones/.test(r.toast)) f('the tee of a stepping-stones hole said "' + r.toast + '"');
    if (!live.moved) f('a stepping-stones hole finished by its tee shot never moved on');
    if (live.cam < live.land - 0.1 || !live.over) f('a stepping-stones hole finished by its tee shot moved on before he crossed (stood at ' + live.cam + ' of ' + live.land + ')');
    return [r.home + ' stepping-stone holes over ' + r.homes + ' home events and ' + r.away + ' on the ' + r.mineCourses + ' other courses whose signature it is, the last par four of each round',
      r.stones + ' stones, all in the water, gaps ' + r.gaps.join(' ') + '; a splash on each of 5 stones',
      'no ball in the river; he crossed in ' + r.crossed.toFixed(1) + 's at the hop pace; a hole done early waits for him'];
  }
};
