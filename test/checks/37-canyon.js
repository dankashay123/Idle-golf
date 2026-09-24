/* The second signature hole: a canyon carry on the home courses.
 *
 * On a home course the last par five of the round is played over a gorge cut
 * right across the hole, and the golfer crosses it on a rope bridge. It works
 * the way the island does: no ball lands in the gorge, he walks to the rim
 * and crosses at a steady pace, and a hole finished before he is over waits
 * for him while the course is on screen.
 *
 *   - which holes: par fives, the last of their round, on home courses only
 *   - no ball comes down in the gorge; where one lies only moves on
 *   - he crosses on the bridge at its pace, never standing still over the
 *     gorge, and under his feet out there is a plank, not the drop
 *   - a hole finished by one swing waits until he is across
 *   - the tee says it is a signature hole
 */
'use strict';
module.exports = {
  name: 'canyon',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { bad: [], home: 0, away: 0 };
      const inGorge = d => { const w = Scene.water, sp = w && w.canyon && Scene.hazSpan(w, d);
        return !!sp && sp.l > 0.8 && sp.r > 0.8; };
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          const cs = B.COURSE[ci], t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            if (!isCanyon(h)) continue;
            if (cs.slot !== 'home') { o.away++; continue; }
            o.home++;
            const r0 = holeInRound(h);
            let later = 0; for (let k = r0 + 1; k <= B.ROUND; k++) if (parOf(h + k - r0) === 5) later++;
            if (parOf(h) !== 5 || later || isIsland(h)) o.bad.push(cs.id + ' hole ' + r0 + ' par ' + parOf(h));
          }
        }
        o.homes = B.COURSE.filter(c => c.slot === 'home').length;

        QUIET = true;
        window.__step = window.step; window.step = () => {};
        CANYON_FORCE = S.hole; S.yards = S.yardsMax; Scene.newHole(S.hole, S.tier);
        const I = Scene.isle;
        o.laid = !!I && !I.fly && !!Scene.water && !!Scene.water.canyon;
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
        const PL = ['#94633A', '#7A4E2C', '#4E321C'].map(h => parseInt(h.slice(1), 16));
        for (let f = 0; f < 30 * 9; f++) {
          Scene.draw(dt, D);
          const c = Scene.camD, v = (c - last) / dt; last = c;
          const over = c > I.bank + 0.05 && c < I.land - 0.05;
          if (Scene.heli) flew++;
          if (over) {
            crossed++;
            if (v > B_BRIDGE * 1.05) fast++;
            if (v < 0.01) stood++;
            // under his feet: a plank of the bridge
            if (f % 5 === 0) {
              // beside him and a step ahead, clear of his own legs; the deck
              // sags toward the middle, so a few rows down from the ground line
              const p = Scene.proj(c + 0.6, 0.55);
              const px = Scene.b.getImageData(Math.round(p.x), Math.round(p.y) - 2, 1, 10).data;
              let hit = false;
              for (let k = 0; k < px.length; k += 4) if (PL.includes((px[k] << 16) | (px[k + 1] << 8) | px[k + 2])) hit = true;
              looked++; if (hit) plank++;
            }
          }
        }
        o.crossed = crossed * dt; o.fast = fast; o.stood = stood; o.flew = flew;
        o.plank = plank; o.looked = looked; o.end = +Scene.camD.toFixed(1); o.land = I.land;

        window.step = window.__step;
        QUIET = false;
        $('toasts').innerHTML = '';
        startHole();
        o.toast = $('toasts').textContent;
      } finally {
        window.step = window.__step || window.step;
        CANYON_FORCE = 0;
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
        CANYON_FORCE = S.hole; startHole(); Scene.announce = null;
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
        CANYON_FORCE = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
    });

    const f = m => { throw new Error(m); };
    if (r.bad.length) f('canyons on the wrong holes: ' + r.bad.slice(0, 4).join('; '));
    if (r.away) f(r.away + ' canyons away from the home courses');
    if (r.home !== r.homes * 4) f(r.home + ' canyons over ' + r.homes + ' home events, not ' + r.homes * 4 + ' (one a round)');
    if (!r.laid) f('a forced canyon hole has no gorge');
    if (!r.rims) f('the bridge does not run from rim to rim over the gorge');
    if (r.wet.length) f('balls come down in the gorge: ' + r.wet.slice(0, 4).join(', '));
    if (r.back) f('where a ball lies went back up the hole ' + r.back + ' times');
    if (!(r.crossed > 1)) f('he spent ' + r.crossed.toFixed(2) + 's crossing the gorge');
    if (r.flew) f('he flew over the canyon: that is the island');
    if (r.fast || r.stood) f('crossing the gorge he ' + (r.fast ? 'went faster than the bridge ' + r.fast + ' frames' : 'stood still ' + r.stood + ' frames'));
    if (r.plank < r.looked) f('under his feet over the gorge: a plank ' + r.plank + ' times in ' + r.looked);
    if (r.end < r.land) f('he ended the shot at ' + r.end + ', short of the far rim at ' + r.land);
    if (!/Canyon Carry/.test(r.toast)) f('the tee of a canyon hole said "' + r.toast + '"');
    if (!live.moved) f('a canyon hole finished by its tee shot never moved on');
    if (live.cam < live.land - 0.1 || !live.over) f('a canyon hole finished by its tee shot moved on before he crossed (stood at ' + live.cam + ' of ' + live.land + ')');
    return [r.home + ' canyons over ' + r.homes + ' home events, the last par five of each round, none elsewhere',
      'no ball in the gorge; he crossed in ' + r.crossed.toFixed(1) + 's at the bridge pace on planks all the way; a hole done early waits for him'];
  }
};
