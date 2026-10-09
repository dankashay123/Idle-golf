/* Golden Hour's hole (the user: "make the golden hour hole rain gold, piles
 * of gold along the fairway and the hole is up on a gold mountain made of
 * coins. The golfer has to fly (like an island hole) to the top of it to
 * put, and the flag is golden and there are sovereigns scattered around the
 * edges of the green too ... reward 10 sovereigns ... 1%").
 *
 *   - the odds: one hole in a hundred over a long sweep, never on a
 *     signature hole, at night, in the rain or in a wager
 *   - laid only on a Golden Hour hole: the mountain, the piles of coins down
 *     the fairway, the sovereigns and piles on its top, the gold flag; on its
 *     ground nothing of the hole's own (no tree, spectator or animal stands
 *     in it)
 *   - nothing of the hole's under it (the user saw bunkers run in under its
 *     foot, cut off by it): over sixty golden holes every bunker and pond,
 *     edge by edge as drawn, clear of its foot
 *   - a heap, not a stair (the user found its six tiers "very
 *     Minecraft-y"): its outline against what is behind, column by column,
 *     never flat for a few columns and then a jump, from three places on
 *     four holes; and no long shadow of what stands behind it lies across
 *     its face
 *   - never through the ground in front: every pixel of the mountain lies
 *     above the ground's line at its own distance, from many places down
 *     several golden holes, on their own gentle ground and on the steepest
 *     the hole's hills can make; every pile and sovereign drawn alone over a
 *     blank stays above the line at its own distance
 *   - never cut away under him: standing on the top at every pin, none of
 *     it is cut (drawn with the ground's line and without it), and the rows
 *     under his feet are all mountain (no ground below showing through)
 *   - played: he plays up to its foot, flies up it, lands on the top and
 *     putts there; an ace stays on the tee (no flight, no walk)
 *   - the reward: the hole pays twice, and finished live it pays exactly ten
 *     sovereigns and a ticket, once; nothing away, quietly or on another hole
 *   - the gold falling: drawn only on a Golden Hour hole, with fewer canvas
 *     calls than the rain's; a whole frame on the hole under the battery
 *     check's thousand calls from the tee to the top
 */
'use strict';
module.exports = {
  name: 'goldmountain',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const keep = { step: window.step, clipAt: Scene.clipAt };
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0;
        const D = derive(), c = Scene.b;
        // ---- the odds ----
        let n = 0; const N = 200000; for (let h = 1; h <= N; h++) if (goldenHole(h)) n++;
        o.rate = (N / n).toFixed(1);
        if (Math.abs(n / N - 0.01) > 0.0012) f('Golden Hour on 1 hole in ' + o.rate + ', not 1 in 100');
        const golds = [];
        for (let h = 1; h < 40000; h++) {
          if (!goldenOn(h, 'Fair')) continue;
          if (sigKind(h)) f('Golden Hour on a signature hole (' + h + ', ' + sigKind(h) + ')');
          if (golds.length < 6 && (!golds.length || tournamentOf(h) !== tournamentOf(golds[golds.length - 1]))) golds.push(h);
        }
        if (golds.length < 6) f('only ' + golds.length + ' Golden Hour holes found');
        const play = (h, ch) => { S.hole = h; S.chaos = { n: ch || 'Fair' }; Scene.newHole(h, S.tier); Scene.announce = null;
          Scene.balls = []; Scene.restBall = null; Scene.putt = null; Scene.cupT = 0; Scene.swingT = 0; };
        // ---- laid only on a golden hole ----
        o.laid = [];
        for (const h of golds) {
          play(h);
          const M = Scene.mtn, P = Scene.props || [];
          const piles = P.filter(p => p.kind === 20 && !p.top).length, top = P.filter(p => p.kind === 20 && p.top).length, gems = P.filter(p => p.kind === 21).length;
          o.laid.push(piles + '/' + top + '/' + gems);
          if (!M || !Scene.isle || !Scene.isle.gold || !Scene.isle.fly) { f('hole ' + h + ': golden but no mountain to fly up'); continue; }
          if (piles < 10 || gems < 8) f('hole ' + h + ': only ' + piles + ' piles down the fairway and ' + gems + ' sovereigns');
          for (const p of P) {
            const r0 = Scene.mtnR(p.d, p.x);
            const gd = (p.d - LEN) / 8.6, gx = p.x / 3.4;
            if (p.kind === 21 && (r0 > 1 || gd * gd + gx * gx < 1 || (p.d < LEN && Math.abs(p.x) < 1.5))) f('hole ' + h + ': a sovereign off the top or on the green (' + p.d.toFixed(1) + ', ' + p.x.toFixed(1) + ')');
            if (p.kind === 20 && !p.top && (p.d > M.bank || Scene.onPlay(p.d, p.x, 0))) f('hole ' + h + ': a pile on the fairway or past its foot');
            if (p.kind !== 20 && p.kind !== 21 && r0 < M.R0) f('hole ' + h + ': a prop of kind ' + p.kind + ' inside the mountain');
          }
          // (nor at night, in the rain or in a wager; nor on the next hole)
          for (const ch of ['Night Round', 'Crosswind']) { play(h, ch); if (Scene.mtn || Scene.props.some(p => p.kind >= 20 && p.kind <= 21)) f('hole ' + h + ': the mountain on a ' + ch + ' hole'); }
          let g = h + 1; while (goldenHole(g)) g++;
          play(g); if (Scene.mtn || Scene.props.some(p => p.kind === 20 || p.kind === 21)) f('hole ' + g + ': the mountain on an ordinary hole');
        }
        S.dgnRun = { id: B.DGN[0].id }; if (goldenOn(golds[0], 'Fair')) f('Golden Hour in a wager'); S.dgnRun = null;
        // ---- nothing of the hole's under it ----
        o.haz = 0; o.hazH = 0;
        for (let h = 1, n2 = 0; h < 200000 && n2 < 60; h++) {
          if (!goldenOn(h, 'Fair')) continue; n2++; play(h); o.hazH++;
          const M = Scene.mtn, lim = M.R0 * 1.03;
          for (const b of Scene.bunkers.concat(Scene.water ? [Scene.water] : [])) {
            o.haz++;
            for (let d = b.d - b.rd; d <= b.d + b.rd; d += 0.1) { const sp = Scene.hazSpan(b, d); if (!sp) continue;
              const xs = [b.x - sp.l, b.x + sp.r]; if (xs.some(x => Scene.mtnR(d, x) < lim)) { f('hole ' + h + ': a ' + (b === Scene.water ? 'pond' : 'bunker') + ' at ' + b.d.toFixed(1) + ', ' + b.x.toFixed(1) + ' runs under the mountain at ' + d.toFixed(1)); break; } } }
        }
        if (o.haz < 120) f('only ' + o.haz + ' hazards on ' + o.hazH + ' golden holes');
        // ---- a heap, not a stair; no shadows across it ----
        o.stairs = 0; o.cols = 0; o.streak = 0;
        for (const h of golds.slice(0, 4)) {
          play(h);
          for (const cam of [10, 20, 30]) {
            Scene.camD = cam; Scene.walkTo = cam; Scene.gGen++; Scene.draw(0, D);
            const MP = Scene._mtnPx, top = [];
            for (let x = 0; x < VW; x++) { let y = 0; while (y < VH && !MP[y * VW + x]) y++; top.push(y); }
            let run = 0;
            for (let x = 1; x < VW; x++) { if (top[x] >= VH || top[x - 1] >= VH) { run = 0; continue; } o.cols++;
              const dy = Math.abs(top[x] - top[x - 1]); if (dy === 0) run++; else { if (run >= 3 && dy >= 2) o.stairs++; run = 0; } }
            // (the frame with long shadows and without, on its face below its top)
            const A = c.getImageData(0, 0, VW, VH).data, ls = Scene.longShadow, FD = Scene._fdep.slice(), MP2 = MP.slice();
            Scene.longShadow = () => {}; Scene.gGen++; Scene.draw(0, D); Scene.longShadow = ls; const B2 = c.getImageData(0, 0, VW, VH).data;
            for (let i = 0; i < VW * VH; i++) if (MP2[i] && FD[i] < Scene.mtn.top0 - 0.5 && A[i * 4] + A[i * 4 + 1] + A[i * 4 + 2] < B2[i * 4] + B2[i * 4 + 1] + B2[i * 4 + 2] - 6) o.streak++;
          }
        }
        if (o.cols < 600) f('the mountain\'s outline seen over only ' + o.cols + ' columns');
        if (o.stairs > 6) f('the mountain\'s outline steps like a stair ' + o.stairs + ' times over ' + o.cols + ' columns');
        if (o.streak > 20) f(o.streak + ' pixels of its face under a long shadow from behind it');
        // ---- never through the ground in front ----
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        // (without long shadows: in Golden Hour's low sun they lie on the
        // nearer ground, below the line by rights; dusklife holds them)
        const alone = Q => { const was = Scene.props, ls = Scene.longShadow; blank(); Scene.props = [Q]; Scene.longShadow = () => {}; try { Scene.drawProps(); } finally { Scene.longShadow = ls; } Scene.props = was;
          return c.getImageData(0, 0, VW, VH).data; };
        o.views = 0; o.seen = 0; o.mpx = 0; o.ppx = 0; o.hidden = 0;
        for (const h of golds) for (const steep of [0, 1]) {
          play(h); if (steep) Scene.roll = 1.6;
          const M = Scene.mtn;
          for (const cam of [0, 6, 12, 18, 24, 30, 36, M.bank - 2, M.bank]) {
            Scene.camD = cam; Scene.walkTo = cam; Scene.t = 1 + cam * 0.1; Scene.gGen++;
            S.yards = S.yardsMax * (1 - cam / LEN);
            Scene.draw(0, D); o.views++;
            const MP = Scene._mtnPx, FD = Scene._fdep; let low = 0, k = 0;
            for (let i = 0; i < VW * VH; i++) { if (!MP[i]) continue; k++;
              const y = (i / VW) | 0; if (y > Scene.clipAt(FD[i]) + 1) low++; }
            o.mpx += k; if (k > 20) o.seen++;
            if (low) f('hole ' + h + (steep ? ' (steep)' : '') + ' from ' + cam.toFixed(1) + ': ' + low + ' pixels of the mountain under the ground in front');
            // (how much of it a crest hid: drawn again with no line)
            Scene.clipAt = () => 1e6; Scene.gGen++; Scene.draw(0, D); Scene.clipAt = keep.clipAt;
            let k2 = 0; for (let i = 0; i < VW * VH; i++) if (Scene._mtnPx[i]) k2++;
            o.hidden += Math.max(0, k2 - k);
            Scene.gGen++; Scene.draw(0, D);
            for (const Q of Scene.props) {
              if ((Q.kind !== 20 && Q.kind !== 21) || Q.d < cam - 2) continue;
              const lim = Scene.clipAt(Q.d) + 1, d = alone(Q);
              for (let i = 0; i < d.length; i += 4) {
                if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                o.ppx++;
                const y = (i / 4 / VW) | 0;
                if (y > lim) { f('hole ' + h + (steep ? ' (steep)' : '') + ' from ' + cam.toFixed(1) + ': a ' + (Q.kind === 20 ? 'pile' : 'sovereign') + ' at ' + Q.d.toFixed(1) + ' shows at row ' + y + ' under the line ' + Math.round(lim)); break; }
              }
            }
          }
        }
        if (o.seen < o.views * 0.8) f('the mountain seen in only ' + o.seen + ' of ' + o.views + ' views');
        if (o.ppx < 2000) f('the piles and sovereigns showed only ' + o.ppx + ' pixels');
        if (o.hidden < 50) f('no hill ever hid any of the mountain (' + o.hidden + ' pixels): the views test nothing');
        // ---- never cut away under him on the top ----
        o.top = 0;
        for (const h of golds.slice(0, 3)) {
          play(h);
          for (let k = 0; k < PINS.length; k++) {
            Scene.pin = PINS[k]; const cam = Scene.pinD() - B_GREEN_STAND;
            Scene.camD = cam; Scene.walkTo = cam; S.yards = 0; S.elapsed = S.parTime * 0.6; S.doneT = null; Scene.gGen++;
            Scene.draw(0, D);
            if (Scene.mcam !== Scene.mtn.Z) f('hole ' + h + ' pin ' + k + ': standing on the top, he is ' + Scene.mcam + ' up, not ' + Scene.mtn.Z);
            let a = 0; for (let i = 0; i < VW * VH; i++) if (Scene._mtnPx[i]) a++;
            const feet = Scene.proj(cam, 0).y;
            let under = 0, tot = 0;
            for (let y = Math.max(0, feet - 2); y < VH; y++) for (let x = Math.round(VW * 0.2); x < Math.round(VW * 0.8); x++) { tot++; if (Scene._mtnPx[y * VW + x]) under++; }
            Scene.clipAt = () => 1e6; Scene.gGen++; Scene.draw(0, D); Scene.clipAt = keep.clipAt;
            let b = 0; for (let i = 0; i < VW * VH; i++) if (Scene._mtnPx[i]) b++;
            if (b - a > 3) f('hole ' + h + ' pin ' + k + ': on the top, ' + (b - a) + ' of its ' + b + ' pixels cut away');
            if (under < tot * 0.995) f('hole ' + h + ' pin ' + k + ': under his feet ' + (tot - under) + ' of ' + tot + ' pixels are not the mountain');
            o.top++;
          }
        }
        // ---- the gold falling ----
        const callsOf = fn => { const P = CanvasRenderingContext2D.prototype, orig = {}; let calls = 0;
          for (const k of Object.getOwnPropertyNames(P)) { const d = Object.getOwnPropertyDescriptor(P, k); if (typeof d.value !== 'function') continue;
            orig[k] = d.value; P[k] = function () { calls++; return orig[k].apply(this, arguments); }; }
          try { fn(); } finally { for (const k in orig) P[k] = orig[k]; } return calls; };
        play(golds[0]); Scene.t = 5;
        const goldW = callsOf(() => Scene.drawWeather());
        Scene.fall = null; Scene.snow = false;
        blank(); Scene.drawWeather(); { const d = c.getImageData(0, 0, VW, VH).data; let px = 0, odd = 0;
          for (let i = 0; i < d.length; i += 4) { if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue; px++; if (!(d[i] > 150 && d[i] >= d[i + 1] && d[i + 1] > d[i + 2])) odd++; }
          o.goldPx = px; if (px < 40) f('the gold falling showed ' + px + ' pixels'); if (odd) f(odd + ' pixels of the gold falling not gold'); }
        Scene.fall = null; Scene.snow = false;
        const goldW2 = callsOf(() => Scene.drawWeather());
        Scene.golden = false; Scene.mtn = null; Scene.rain = true;
        const rainW = callsOf(() => Scene.drawWeather());
        play(golds[0] + 1, 'Fair'); Scene.fall = null; Scene.snow = false; Scene.rain = false;
        const plainW = callsOf(() => Scene.drawWeather());
        o.weather = goldW2 + ' (rain ' + rainW + ')';
        if (!(goldW2 > 20)) f('the gold falling drew ' + goldW2 + ' calls on a Golden Hour hole');
        if (goldW2 > rainW) f('the gold falling made ' + goldW2 + ' canvas calls, the rain ' + rainW);
        if (plainW) f('the weather drew ' + plainW + ' calls on an ordinary fair hole');
        if (goldW < goldW2) f('the gold falling missing with leaves or snow');
        // a whole frame, moving, from the tee to the top
        o.frame = 0;
        play(golds[0]); const M0 = Scene.mtn;
        for (const cam of [12, 30, M0.bank, (M0.bank + M0.land) / 2, Scene.pinD() - B_GREEN_STAND]) {
          Scene.camD = cam - 0.4; Scene.walkTo = Scene.camD; Scene.draw(1 / 60, D); Scene.camD = cam; Scene.walkTo = cam;
          const k = callsOf(() => Scene.draw(1 / 60, D)); o.frame = Math.max(o.frame, k);
          if (k >= 1000) f('a frame on the Golden Hour hole from ' + cam.toFixed(1) + ' made ' + k + ' canvas calls');
        }
        // ---- the reward ----
        // (everything in the Field Guide seen and the week's hunt paid: a
        // first sighting at night pays sovereigns of its own)
        S.guide = Object.fromEntries(GUIDE.map(g => [g.id, 1])); Object.assign(huntNow(), { paid: 1 });
        const fin = (hour, quiet, away) => { HOUR_FORCE = hour; S.dawnDusk = 1; S.hole = golds[0]; startHole(); S.chaos = { n: 'Fair' }; S.holeGold = 0;
          S.elapsed = S.parTime * 0.8; S.doneT = null; S.tickets = 0; S.goldPaid = null; QUIET = quiet; OFFLINE = away;
          const s0 = S.sov || 0, t0 = S.tickets; finishHole(derive()); const sv = (S.sov || 0) - s0, tk = S.tickets - t0;
          // (the same hole finished again)
          S.hole = golds[0]; startHole(); S.chaos = { n: 'Fair' }; S.holeGold = 0; S.elapsed = S.parTime * 0.8; S.doneT = null; QUIET = quiet; OFFLINE = away;
          const s1 = S.sov || 0; finishHole(derive()); const again = (S.sov || 0) - s1;
          QUIET = true; OFFLINE = false; return { sv, tk, again }; };
        const live = fin(14, false, false), plain = fin(23, false, false), quiet = fin(14, true, false), plainQ = fin(23, true, false), away = fin(14, false, true), plainA = fin(23, false, true);
        o.reward = 'live ' + (live.sv - plain.sv) + ' sovereigns, ' + (live.tk - plain.tk) + ' ticket';
        if (live.sv - plain.sv !== B.GOLDEN_SOV || B.GOLDEN_SOV !== 3) f('a Golden Hour hole finished live paid ' + (live.sv - plain.sv) + ' sovereigns more than the same hole plain, not ' + B.GOLDEN_SOV);
        if (!(live.tk - plain.tk >= 1)) f('no ticket for a Golden Hour hole');
        if (live.again - plain.again !== 0) f('the hole\'s sovereigns paid a second time');
        if (quiet.sv !== plainQ.sv) f('sovereigns paid on a Golden Hour hole run quietly (' + (quiet.sv - plainQ.sv) + ')');
        if (away.sv !== plainA.sv) f('sovereigns paid on a Golden Hour hole away (' + (away.sv - plainA.sv) + ')');
        S.dawnDusk = 0; HOUR_FORCE = 14;
        // ---- an ace: played from the tee, no flight, no walk ----
        play(golds[0]); S.hole = golds[0]; startHole(); S.chaos = { n: 'Fair' }; Scene.newHole(golds[0], S.tier); Scene.announce = null;
        Scene.camD = 0; Scene.walkTo = 0; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.cupT = 0;
        S.elapsed = S.parTime * 0.05; S.doneT = S.elapsed; S.yards = 0;
        { let cam = 0, heli = 0; for (let i = 0; i < 150; i++) { Scene.draw(1 / 60, D); cam = Math.max(cam, Scene.camD); heli = Math.max(heli, Scene.heli || 0); }
          o.ace = cam.toFixed(2) + '/' + heli + '/' + (Scene.cupT ? 'in' : 'out');
          if (cam > 0.3 || heli > 0 || Scene.putt || !Scene.cupT) f('an ace on the Golden Hour hole: he went ' + cam.toFixed(1) + ' up the hole, flew ' + heli + ', putted ' + !!Scene.putt + ', in the cup ' + !!Scene.cupT); }
      } finally {
        window.step = keep.step; Scene.clipAt = keep.clipAt;
        HOUR_FORCE = null; FROST_FORCE = null; QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    // played live: up to the foot, the flight, the putt on the top; an ace from the tee
    const live = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), out = {};
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const keep = HOUR_FORCE;
      try {
        hideSheet(); QUIET = false; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0;
        let h = S.hole; while (!goldenOn(h, chaosFor(h, S.tier).n)) h++;
        const once = async ace => {
          S.hole = h; startHole(); Scene.announce = null;
          const M = Scene.mtn, h0 = S.hole;
          S.yards = S.yardsMax * 0.005;
          if (ace) { S.elapsed = 0; S.walkMin = 0; } else S.elapsed = Math.max(S.elapsed, S.parTime * 0.4);
          let heli = 0, maxCam = 0, putt = null, moved = false, t0 = performance.now();
          while (performance.now() - t0 < 14000) {
            await sleep(30);
            if (S.hole !== h0) { moved = true; break; }
            heli = Math.max(heli, Scene.heli || 0); maxCam = Math.max(maxCam, Scene.camD);
            if (Scene.putt && !putt) putt = { cam: Scene.camD, up: Scene.mcam, z: M.Z, land: M.land };
          }
          return { moved, heli: +heli.toFixed(2), maxCam: +maxCam.toFixed(1), putt, mtn: !!M };
        };
        out.play = await once(false);
      } finally {
        HOUR_FORCE = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; startHole();
      }
      return out;
    });
    const P = live.play;
    if (!P.mtn) r.fails.push('the hole played live had no mountain');
    if (!P.moved) r.fails.push('the Golden Hour hole never moved on');
    if (!(P.heli > 0.8)) r.fails.push('he never flew up the mountain (flew ' + P.heli + ' of the way)');
    if (!P.putt || P.putt.cam < P.putt.land - 0.05 || P.putt.up !== P.putt.z) r.fails.push('he did not putt on the top: ' + JSON.stringify(P.putt));
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['nothing under it: ' + r.haz + ' bunkers and ponds on ' + r.hazH + ' golden holes clear of its foot; its outline over ' + r.cols + ' columns stepped ' + r.stairs + ' times; ' + r.streak + ' pixels of its face under a shadow from behind',
      'Golden Hour on 1 hole in ' + r.rate + ' (200,000 holes), never on a signature hole; piles down the fairway/on the top/sovereigns: ' + r.laid.join(', '),
      r.views + ' views over six golden holes, gentle and steep: the mountain in ' + r.seen + ', ' + r.hidden + ' of its pixels behind a hill and none through it; the piles and sovereigns ' + r.ppx + ' pixels, none under the line',
      'on the top at every pin (' + r.top + ' views) none of it cut away and only mountain under his feet',
      'played live he flew up (' + P.heli + ') and putted on the top at ' + P.putt.cam.toFixed(1) + '; an ace stayed on the tee (' + r.ace + ')',
      'reward: ' + r.reward + ', once, none quietly or away; the gold falling ' + r.weather + ' calls, a frame at most ' + r.frame];
  }
};
