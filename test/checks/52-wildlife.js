/* Life on the other signature holes: ducks, a hawk, fish (the user asked).
 *
 * After the pier's spray and gulls, the user asked for life on the other
 * three: ducks on the island's lake, a hawk circling over the canyon, fish
 * jumping by the stepping stones.
 *
 *   - ducks: four in view from the tee on every island hole of a home
 *     course, each always on open water inside the lake's own outline and
 *     short of the island, over two minutes; each tips up to feed now and
 *     then; none on a sea stack, a canyon or a stones hole
 *   - the hawk: in view from the tee over the canyon, soaring and now and
 *     then beating its wings; not at night; none on another hole
 *   - fish: they leap on the stones hole, always in the river between the
 *     banks and clear of the stones' line; none when the river is frozen
 *   - sounds: a quack now and then on an island hole and a hawk's cry over
 *     the canyon (neither at night nor elsewhere), and a plop for every fish
 *     that lands, none on ice; each about as loud as a bird in the trees
 *     (the plop as the stones' own splash), rendered offline and measured
 *   - drawing them never calls Math.random
 *   - the sigview check holds all of it above the ground in front
 */
'use strict';
module.exports = {
  name: 'wildlife',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = {}, SNAP = JSON.stringify(S), mr = Math.random;
      const keep = { tone: Sfx.tone, hiss: Sfx.hiss, ctx: Sfx.ctx, quack: Sfx.quack, hawk: Sfx.hawk, plop: Sfx.plop, gull: Sfx.gull, chirp: Sfx.chirp, gust: Sfx.gust, mt: Sfx.musicTick,
                     sound: S.sound, night: Scene.night, t: Scene.t };
      try {
        hideSheet(); QUIET = true; SEASON_FORCE = 0;
        const c = Scene.b, D = derive();
        const look = cam => { Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.fairyMove = null; Scene.draw(0, D); };
        const count = (cols) => { const d = c.getImageData(0, 0, VW, VH).data; let n = 0;
          for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue;
            const h = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
            if (cols.includes(h)) n++; }
          return n; };
        const near = () => Scene.camD - CAM_BACK + 0.7;
        const home = B.COURSE.findIndex(cs => cs.slot === 'home');
        DEV.course(home); hideSheet();
        const first = awayFirstHole(S.hole), holes = { island: [], canyon: [], stones: [], pier: [] };
        for (let h = first; h < first + B.ROUND * B.DAYS; h++) { const k = sigKind(h); if (k && holes[k]) holes[k].push(h); }
        const DUCKCOL = ['#2E6B3A', '#7A5A3C', '#9A8C7A', '#8A6A48', '#6E6254', '#6A5038'];

        // ---- ducks ----
        o.duckPx = []; o.offWater = []; o.tips = [0, 0, 0, 0]; o.duckRnd = 0;
        for (const h of holes.island) {
          S.hole = h; startHole(); Scene.announce = null;
          const W = Scene.water, I = Scene.isle;
          look(0);
          c.clearRect(0, 0, VW, VH);
          let calls = 0; Math.random = () => { calls++; return mr(); };
          try { Scene.drawDucks(); } finally { Math.random = mr; }
          o.duckRnd += calls;
          o.duckPx.push(count(DUCKCOL));
          for (let t = 0; t < 120; t += 0.25) for (let i = 0; i < 4; i++) {
            const U = Scene.duckAt(i, t); if (!U) { o.offWater.push('hole ' + holeInRound(h) + ' duck ' + i + ' at ' + t + ': no water'); continue; }
            const sp = Scene.hazSpan(W, U.d);
            // on the water, not on the island (its rocks ring LEN at 8.9 by 3.35)
            if (!(U.x > -sp.l * 0.9 && U.x < sp.r * 0.9) || U.d > LEN - 9 || U.d < I.bank + 1)
              o.offWater.push('hole ' + holeInRound(h) + ' duck ' + i + ' at ' + U.d.toFixed(1) + ', ' + U.x.toFixed(1));
            if (U.tip) o.tips[i]++;
          }
        }
        const noneOn = (hs, fn) => { S.hole = hs[0]; startHole(); Scene.announce = null; look(0); c.clearRect(0, 0, VW, VH); fn(); return count(DUCKCOL.concat(['#5A3E28', '#2E2018', '#34495A', '#E6EEF2'])); };
        o.ducksElsewhere = [noneOn(holes.canyon, () => Scene.drawDucks()), noneOn(holes.stones, () => Scene.drawDucks())];

        // ---- the hawk ----
        S.hole = holes.canyon[0]; startHole(); Scene.announce = null; Scene.night = false;
        look(0);
        let hawk = 0, flaps = new Set(), hawkRnd = 0;
        for (let k = 0; k < 40; k++) {
          Scene.t += 0.3; c.clearRect(0, 0, VW, VH);
          // seen with the bridge it comes with
          Math.random = () => { hawkRnd++; return mr(); };
          try { Scene.drawBridge(); } finally { Math.random = mr; }
          const n = count(['#5A3E28']); hawk += n > 0;
          c.clearRect(0, 0, VW, VH); Scene.drawHawk(near());
          // its rows: soaring holds the tips up; a beat moves them
          const d = c.getImageData(0, 0, VW, VH).data; let top = VH, bot = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const y = (i / 4 / VW) | 0; top = Math.min(top, y); bot = Math.max(bot, y); }
          flaps.add(bot - top);
        }
        o.hawkSeen = hawk; o.hawkShapes = flaps.size; o.hawkRnd = hawkRnd;
        Scene.night = true; c.clearRect(0, 0, VW, VH); Scene.drawHawk(near()); o.hawkNight = count(['#5A3E28', '#2E2018']);
        Scene.night = false;
        // the hawk comes with the canyon's bridge, the fish with the stones
        o.hawkElsewhere = noneOn(holes.stones, () => Scene.drawBridge());
        o.fishElsewhere = noneOn(holes.canyon, () => Scene.drawStones()) + noneOn(holes.island, () => Scene.drawStones());
        S.hole = holes.island[0]; startHole(); look(0); c.clearRect(0, 0, VW, VH); Scene.drawBridge(); o.hawkIsle = count(['#5A3E28', '#2E2018']);

        // ---- fish ----
        S.hole = holes.stones[0]; startHole(); Scene.announce = null;
        const I = Scene.isle, Wr = Scene.water;
        o.jumps = 0; o.fishBad = []; o.fishRnd = 0;
        for (let t = 0; t < 120; t += 0.05) for (let i = 0; i < 3; i++) {
          const F = Scene.fishAt(i, t);
          if (!F.jumps || F.u > F.J) continue;
          if (F.u < 0.05 / F.L) o.jumps++;
          for (const x of [F.x, F.x + F.dir * 0.7]) {
            const sp = Scene.hazSpan(Wr, F.d);
            // well out in the river: three tenths of its width clear of either bank
            if (Math.abs(F.d - Wr.d) > Wr.rd * 0.7 || !sp || Math.abs(x) < 0.9) o.fishBad.push(F.d.toFixed(1) + ', ' + x.toFixed(1));
          }
        }
        // drawn: some frames show a fish or its splash
        look(I.bank - 8);
        let shown = 0;
        for (let k = 0; k < 60; k++) { Scene.t += 0.13; c.clearRect(0, 0, VW, VH);
          Math.random = () => { o.fishRnd++; return mr(); };
          try { Scene.drawStones(); } finally { Math.random = mr; }
          shown += count(['#34495A', '#E6EEF2']) > 0; }
        o.fishShown = shown;
        // frozen in winter: none
        SEASON_FORCE = 2; startHole(); Scene.announce = null; look(I.bank - 8);
        o.frozen = Scene.ice; let iced = 0;
        for (let k = 0; k < 60; k++) { Scene.t += 0.13; c.clearRect(0, 0, VW, VH); Scene.drawFish(near()); iced += count(['#34495A', '#E6EEF2', '#EAF4F6']); }
        o.fishIce = iced;
        SEASON_FORCE = 0;

        { // a sea stack: on the regular stop that has one (last: it moves the event)
          DEV.course(B.COURSE.findIndex(cs => cs.id === 'coastal')); hideSheet();
          const f2 = awayFirstHole(S.hole); let hp = f2; while (!isPier(hp)) hp++;
          o.ducksOnPier = noneOn([hp], () => Scene.drawDucks());
          DEV.course(home); hideSheet();
          const f3 = awayFirstHole(S.hole); for (const k in holes) holes[k] = [];
          for (let h = f3; h < f3 + B.ROUND * B.DAYS; h++) { const k = sigKind(h); if (k && holes[k]) holes[k].push(h); }
        }

        // ---- the sounds ----
        S.sound = 1; QUIET = false;
        Sfx.ctx = { state: 'running', currentTime: 1 };
        const heard = { quack: 0, hawk: 0, plop: 0 };
        Sfx.quack = () => heard.quack++; Sfx.hawk = () => heard.hawk++; Sfx.plop = () => heard.plop++;
        Sfx.gull = () => {}; Sfx.chirp = () => {}; Sfx.gust = () => {}; Sfx.musicTick = () => {};
        Sfx.tone = () => {}; Sfx.hiss = () => {};          // anything else it plays, unheard
        const listen = (h, secs, night, season) => {
          SEASON_FORCE = season || 0; S.hole = h; startHole(); Scene.announce = null; Scene.night = night;
          Sfx.quackT = Sfx.hawkT = undefined; Sfx.fishN = null;
          const h0 = Object.assign({}, heard);
          let lands = 0; const seen = [];
          for (let t = 0; t < secs; t += 0.1) {
            Scene.t += 0.1; Sfx.tick(0.1);
            if (Scene.isle && Scene.isle.stones) for (let i = 0; i < 3; i++) { const F = Scene.fishAt(i, Scene.t);
              if (F.u >= F.J && seen[i] !== F.n) { if (F.jumps && seen[i] !== undefined) lands++; seen[i] = F.n; } }
          }
          return { quack: heard.quack - h0.quack, hawk: heard.hawk - h0.hawk, plop: heard.plop - h0.plop, lands };
        };
        o.sIsle = listen(holes.island[0], 120, false); o.sIsleNight = listen(holes.island[0], 120, true);
        o.sCanyon = listen(holes.canyon[0], 120, false); o.sCanyonNight = listen(holes.canyon[0], 120, true);
        o.sStones = listen(holes.stones[0], 120, false); o.sIce = listen(holes.stones[0], 120, false, 2);
        { // and none on the sea stack (the regular stop that has one)
          DEV.course(B.COURSE.findIndex(cs => cs.id === 'coastal')); hideSheet();
          let hp = awayFirstHole(S.hole); while (!isPier(hp)) hp++;
          o.sPier = listen(hp, 120, false);
          DEV.course(home); hideSheet();
          const f4 = awayFirstHole(S.hole); holes.stones = [];
          for (let h = f4; h < f4 + B.ROUND * B.DAYS; h++) if (sigKind(h) === 'stones') holes.stones.push(h);
        }
        o.sPlain = listen(holes.stones[0] + 1 + (sigKind(holes.stones[0] + 1) ? 1 : 0), 120, false);
        Object.assign(Sfx, { tone: keep.tone, hiss: keep.hiss, ctx: keep.ctx, quack: keep.quack, hawk: keep.hawk, plop: keep.plop, gull: keep.gull, chirp: keep.chirp, gust: keep.gust, musicTick: keep.mt });

        // ---- how loud ----
        const loud = async fn => {
          const oc = new OfflineAudioContext(1, 88200, 44100), k2 = { ctx: Sfx.ctx, master: Sfx.master, nz: Sfx._nz };
          Sfx.ctx = oc; Sfx.master = oc.destination; Sfx._nz = null;
          const m = Math.random; Math.random = () => 0.5;
          try { fn(0.05); } finally { Sfx.ctx = k2.ctx; Sfx.master = k2.master; Sfx._nz = k2.nz; Math.random = m; }
          const d = (await oc.startRendering()).getChannelData(0), Wn = 13230; let sum = 0, best = 0;
          for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; if (i >= Wn) sum -= d[i - Wn] * d[i - Wn]; if (i >= Wn - 1) best = Math.max(best, sum / Wn); }
          return +(10 * Math.log10(best + 1e-12)).toFixed(1);
        };
        o.db = { quack: await loud(t => Sfx.quack(t)), hawk: await loud(t => Sfx.hawk(t)), chirp: await loud(t => Sfx.chirp(t)),
                 plop: await loud(t => Sfx.plop(t)), hop: await loud(t => Sfx.hop(t, false)) };
      } finally {
        Math.random = mr;
        Object.assign(Sfx, { tone: keep.tone, hiss: keep.hiss, ctx: keep.ctx, quack: keep.quack, hawk: keep.hawk, plop: keep.plop, gull: keep.gull, chirp: keep.chirp, gust: keep.gust, musicTick: keep.mt });
        S.sound = keep.sound; Scene.night = keep.night; QUIET = false; OFFLINE = false; SEASON_FORCE = -1;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (!r.duckPx.length) f('no island holes on the home course');
    if (r.duckPx.some(n => n < 12)) f('ducks in view from the tee on each island hole: ' + r.duckPx.join(', ') + ' pixels');
    if (r.offWater.length) f(r.offWater.length + ' duck positions off the open water: ' + r.offWater.slice(0, 3).join('; '));
    if (r.tips.some(n => n === 0)) f('a duck never tipped up in two minutes: ' + r.tips.join(', '));
    if (r.ducksElsewhere.some(n => n) || r.ducksOnPier) f('ducks drawn on a canyon, stones or sea stack hole: ' + r.ducksElsewhere.join(', ') + ', ' + r.ducksOnPier);
    if (!(r.hawkSeen >= 36) || r.hawkShapes < 2) f('the hawk was in view in ' + r.hawkSeen + ' of 40 frames from the tee, in ' + r.hawkShapes + ' shapes');
    if (r.hawkNight || r.hawkElsewhere || r.hawkIsle) f('a hawk at night (' + r.hawkNight + ') or on another hole (' + r.hawkElsewhere + ', ' + r.hawkIsle + ')');
    if (r.fishElsewhere) f('fish drawn on a canyon or island hole: ' + r.fishElsewhere + ' pixels');
    if (!(r.jumps >= 20)) f('only ' + r.jumps + ' fish leapt in two minutes');
    if (r.fishBad.length) f(r.fishBad.length + ' fish out of the river or on the stones\' line: ' + r.fishBad.slice(0, 3).join('; '));
    if (!(r.fishShown >= 10)) f('a fish or its splash showed in only ' + r.fishShown + ' of 60 frames');
    if (!r.frozen || r.fishIce) f('fish in a frozen river: ' + r.fishIce + ' pixels (frozen ' + r.frozen + ')');
    if (r.duckRnd || r.hawkRnd || r.fishRnd) f('drawing them called Math.random: ' + [r.duckRnd, r.hawkRnd, r.fishRnd].join(', '));
    const S_ = r;
    if (!(S_.sIsle.quack >= 8) || S_.sIsleNight.quack || S_.sIsle.hawk || S_.sIsle.plop) f('two minutes on the island: ' + JSON.stringify(S_.sIsle) + ', at night ' + JSON.stringify(S_.sIsleNight));
    if (!(S_.sCanyon.hawk >= 5) || S_.sCanyonNight.hawk || S_.sCanyon.quack || S_.sCanyon.plop) f('two minutes over the canyon: ' + JSON.stringify(S_.sCanyon) + ', at night ' + JSON.stringify(S_.sCanyonNight));
    if (!(S_.sStones.plop >= 10) || S_.sStones.plop !== S_.sStones.lands || S_.sStones.quack || S_.sStones.hawk) f('two minutes by the stones: ' + JSON.stringify(S_.sStones) + ' (a plop for each fish that lands)');
    if (S_.sIce.plop) f('plops on a frozen river: ' + S_.sIce.plop);
    if (S_.sPier.quack || S_.sPier.hawk || S_.sPier.plop) f('sounds on the sea stack: ' + JSON.stringify(S_.sPier));
    if (S_.sPlain.quack || S_.sPlain.hawk || S_.sPlain.plop) f('sounds on a plain hole: ' + JSON.stringify(S_.sPlain));
    const d = r.db;
    if (Math.abs(d.quack - d.chirp) > 3 || Math.abs(d.hawk - d.chirp) > 3 || Math.abs(d.plop - d.hop) > 3)
      f('loudness: quack ' + d.quack + ', hawk ' + d.hawk + ' against a bird\'s ' + d.chirp + '; plop ' + d.plop + ' against the stones\' ' + d.hop);
    return ['ducks from the tee on ' + r.duckPx.length + ' island holes (' + r.duckPx.join(', ') + ' px), always on open water, each tipping up; none on other holes',
      'the hawk over the canyon in ' + r.hawkSeen + ' of 40 frames, soaring and beating; none at night; ' + r.jumps + ' fish leaps in two minutes, all in the river; none on ice',
      'in two minutes: ' + S_.sIsle.quack + ' quacks, ' + S_.sCanyon.hawk + ' hawk cries, ' + S_.sStones.plop + ' plops for ' + S_.sStones.lands + ' landings; loudness quack ' + d.quack + ', hawk ' + d.hawk + ' (bird ' + d.chirp + '), plop ' + d.plop + ' (stones ' + d.hop + ') dB'];
  }
};
