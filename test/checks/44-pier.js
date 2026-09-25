/* The fourth signature hole: a green on a sea stack, out along a pier.
 *
 * On the coast (the Coastal Classic and the Seaside Open, and Harbour Lights,
 * whose front nine closes on it instead of an island) the last par three is
 * a green alone on a rock in the sea, and he walks out to it along a pier.
 * It works the way the island does, but on foot.
 *
 *   - which holes: par threes, the last of their round (Harbour Lights: of
 *     its front nine, where it has no island any more)
 *   - no ball comes down in the sea; where one lies only moves on
 *   - he walks the pier at its pace, never flying and never standing still,
 *     and under his feet out there are its planks
 *   - a hole finished by one swing waits until he is on the rock
 *   - the tee says it is a signature hole; the planks knock underfoot
 */
'use strict';
module.exports = {
  name: 'pier',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { bad: [], home: 0, away: 0, wrongCount: [], mineCourses: 0 };
      // in the sea and not on the green (the apron: 8.6 long, 3.05 wide)
      const inGorge = d => { const w = Scene.water, sp = w && w.lake && Scene.hazSpan(w, d), gd = (d - LEN) / 8.6;
        return !!sp && sp.l > 0.8 && sp.r > 0.8 && gd * gd >= 1; };
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          const cs = B.COURSE[ci], t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          const home = cs.slot === 'home', mine = home ? cs.id === 'harbour' : B.SIG_HOLE[cs.id] === 'pier';
          let n = 0;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            if (!isPier(h)) continue;
            n++;
            if (home) o.home++; else o.away++;
            const r0 = holeInRound(h), end = home ? 9 : B.ROUND;
            let later = 0; for (let k = r0 + 1; k <= end; k++) if (parOf(h + k - r0) === 3) later++;
            if (parOf(h) !== 3 || later || sigKind(h) !== 'pier' || isIsland(h) || (home && r0 > 9)) o.bad.push(cs.id + ' hole ' + r0 + ' par ' + parOf(h));
          }
          if (n !== (mine ? B.DAYS : 0)) o.wrongCount.push(cs.id + ' has ' + n + (mine ? ', not one a round' : ', but its signature is not this'));
          if (mine && !home) o.mineCourses++;
        }
        o.homes = 1;

        QUIET = true;
        window.__step = window.step; window.step = () => {};
        PIER_FORCE = S.hole; S.yards = S.yardsMax; Scene.newHole(S.hole, S.tier);
        const I = Scene.isle;
        o.laid = !!I && !I.fly && !!I.pier && !!Scene.water && !!Scene.water.lake;
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
        S.yards = S.yardsMax * 0.06;
        Scene.swing(1, false, null);
        let crossed = 0, fast = 0, stood = 0, last = Scene.camD, plank = 0, looked = 0, flew = 0;
        const PL = ['#A07C56', '#8A6A48', '#5A4230'].map(h => parseInt(h.slice(1), 16));
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
            // (on the pier: its last yards before the green are the rock)
            if (f % 5 === 0 && c + 0.6 < LEN - 8.6) {
              // beside him and a step ahead, clear of his own legs; the deck
              // sags toward the middle, so a few rows down from the ground line
              const p = Scene.proj(c + 0.6, 0.3);
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
        // in a week that is not this kind's: the week's own tee says more
        // (see sigweek), and the week follows the calendar
        SIGWEEK_FORCE = 'island';
        $('toasts').innerHTML = '';
        startHole();
        o.toast = $('toasts').textContent;
      } finally {
        SIGWEEK_FORCE = null;
        window.step = window.__step || window.step;
        PIER_FORCE = 0;
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
        PIER_FORCE = S.hole; startHole(); Scene.announce = null;
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
        PIER_FORCE = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
    });

    // the planks knock underfoot out on the pier
    const snd = await page.evaluate(() => {
      const keep = { ctx: Sfx.ctx, rotor: Sfx.rotor, plank: Sfx.plank, hop: Sfx.hop, chirp: Sfx.chirp, mt: Sfx.musicTick, heli: Scene.heli, crossing: Scene.crossing, ph: Scene.walkPh, sound: S.sound, isle: Scene.isle };
      const n = { rotor: 0, plank: 0, hop: 0 };
      try {
        S.sound = 1; QUIET = false;
        Sfx.ctx = { state: 'running', currentTime: 1 };
        Sfx.rotor = () => { n.rotor++; }; Sfx.plank = () => { n.plank++; }; Sfx.hop = () => { n.hop++; }; Sfx.chirp = () => {}; Sfx.musicTick = () => {};
        Scene.isle = { bank: 30, land: 54, fly: 0, pier: 1 };
        Scene.heli = 0; Scene.crossing = 0.5;
        for (let t = 0; t < 2; t += 0.05) { Scene.walkPh = (Scene.walkPh || 0) + 0.05 * 1.8; Sfx.tick(0.05); }
        return { pier: n };
      } finally {
        Sfx.ctx = keep.ctx; Sfx.rotor = keep.rotor; Sfx.plank = keep.plank; Sfx.hop = keep.hop; Sfx.chirp = keep.chirp; Sfx.musicTick = keep.mt;
        Scene.heli = keep.heli; Scene.crossing = keep.crossing; Scene.walkPh = keep.ph; S.sound = keep.sound; Scene.isle = keep.isle;
      }
    });

    const f = m => { throw new Error(m); };
    if (!(snd.pier.plank >= 5) || snd.pier.rotor || snd.pier.hop) f('walking the pier for 2s played ' + JSON.stringify(snd.pier));
    if (r.bad.length) f('sea stacks on the wrong holes: ' + r.bad.slice(0, 4).join('; '));
    if (r.wrongCount.length) f('sea stacks by course: ' + r.wrongCount.slice(0, 4).join('; '));
    if (r.mineCourses !== 2) f(r.mineCourses + ' courses besides Harbour Lights have the sea stack, not the Coastal Classic and the Seaside Open');
    if (r.home !== 4) f(r.home + ' sea stacks in a Harbour Lights event, not 4 (one a round)');
    if (!r.laid) f('a forced sea stack hole has no pier or no sea');
    if (!r.rims) f('the pier does not run from the bank over the sea to the rock');
    if (r.wet.length) f('balls come down in the sea: ' + r.wet.slice(0, 4).join(', '));
    if (r.back) f('where a ball lies went back up the hole ' + r.back + ' times');
    if (!(r.crossed > 1)) f('he spent ' + r.crossed.toFixed(2) + 's on the pier');
    if (r.flew) f('he flew to the sea stack: that is the island');
    if (r.fast || r.stood) f('on the pier he ' + (r.fast ? 'went faster than a walk ' + r.fast + ' frames' : 'stood still ' + r.stood + ' frames'));
    if (r.plank < r.looked) f('under his feet on the pier: a plank ' + r.plank + ' times in ' + r.looked);
    if (r.end < r.land) f('he ended the shot at ' + r.end + ', short of the rock at ' + r.land);
    if (!/Signature Hole/.test(r.toast) || !/Sea Stack/.test(r.toast)) f('the tee of a sea stack hole said "' + r.toast + '"');
    if (!live.moved) f('a sea stack hole finished by its tee shot never moved on');
    if (live.cam < live.land - 0.1 || !live.over) f('a sea stack hole finished by its tee shot moved on before he walked out (stood at ' + live.cam + ' of ' + live.land + ')');
    return [r.away + ' sea stacks on the Coastal Classic and the Seaside Open and ' + r.home + ' on Harbour Lights\' front nine, one a round',
      'no ball in the sea; he walked the pier in ' + r.crossed.toFixed(1) + 's on its planks, knocking underfoot; a hole done early waits for him'];
  }
};
