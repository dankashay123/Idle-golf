/* Rare weather (the user picked "a rainbow after rain, a shooting star at
 * night or a bank of fog, each added to the Field Guide when you see it").
 *
 *   - rates over twenty thousand holes, at two Tour Cards: a rainbow on the
 *     first two fair holes after every wet round and now and then on a fair
 *     day, a fog bank rarer; neither ever on a wet or night round, fog never
 *     with a rainbow or Golden Hour; laid on a hole, neither at night or in
 *     the rain even when forced; none with the player's clock making it night
 *   - one rainbow in twenty is double (a second, fainter bow outside),
 *     never golden as well, and takes more of the sky than a single one
 *   - the rainbow is in the sky only: the frame with it against the same
 *     frame without, every changed pixel above the horizon (none on the
 *     field, nor copied down onto it by the blend at the horizon), faint,
 *     and the clouds where they were; at two stage sizes, on several holes
 *   - the shooting star: none by day or in a wager; at night one in each
 *     half minute, twenty to forty seconds apart, each under a second, the
 *     same from the same moment (no Math.random); drawn alone, only in the
 *     upper half of the sky; in the frame, only above the horizon
 *   - the fog bank: lies over the far end (the rows by the horizon change
 *     most), the near ground untouched
 *   - the Field Guide: the rainbow and the fog as the hole is laid, the star
 *     as it is drawn (not while it is day); none away or in a wager
 *   - the developer menu's buttons do what they say
 */
'use strict';
module.exports = {
  name: 'rareweather',
  async run(page) {
    const one = async () => page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0;
        const D = derive(), c = Scene.b, grab = () => c.getImageData(0, 0, VW, VH).data;
        const ch = n => Object.assign({}, B.CHAOS.find(x => x.n === n));
        const play = (h, n) => { S.hole = h; S.chaos = ch(n || 'Fair'); Scene.newHole(h, S.tier); Scene.announce = null; Scene.balls = []; Scene.restBall = null; };
        o.rates = [];
        // ---- rates ----
        for (const tier of [0, 6]) {
          let rb = 0, fg = 0, after = 0, afterRb = 0, N = 20000;
          for (let h = 1; h <= N; h++) {
            const n = chaosFor(h, tier).n, r = rainbowAt(h, n, tier), g = fogAt(h, n, tier);
            if (r) rb++; if (g) fg++;
            if ((r || g) && !clearCh(n)) f('card ' + tier + ' hole ' + h + ': ' + (r ? 'a rainbow' : 'fog') + ' on a ' + n + ' round');
            if (g && (r || goldenHole(h))) f('card ' + tier + ' hole ' + h + ': fog with a rainbow or Golden Hour');
            if (h > 2 && clearCh(n) && (wetCh(chaosFor(h - 1, tier).n) || wetCh(chaosFor(h - 2, tier).n))) { after++; if (r) afterRb++; }
          }
          o.rates.push('card ' + (tier + 1) + ': rainbow ' + (rb / N * 100).toFixed(2) + '%, fog ' + (fg / N * 100).toFixed(2) + '%, after the rain ' + afterRb + '/' + after);
          if (rb / N < 0.01 || rb / N > 0.06) f('card ' + tier + ': a rainbow on ' + (rb / N * 100).toFixed(2) + '% of holes');
          if (fg / N < 0.0025 || fg / N > 0.02) f('card ' + tier + ': fog on ' + (fg / N * 100).toFixed(2) + '% of holes');
          if (!after || afterRb !== after) f('card ' + tier + ': a rainbow on ' + afterRb + ' of ' + after + ' fair holes after the rain');
        }
        // laid on a hole: never at night or in the rain, even forced; nor in
        // the night the player's clock makes
        RAINBOW_FORCE = 1; FOG_FORCE = 1;
        for (const n of ['Night Round', 'Crosswind', 'Marshal Sweep']) { play(S.hole, n); if (Scene.rainbow || Scene.fog) f('forced, on a ' + n + ' hole: rainbow ' + Scene.rainbow + ', fog ' + Scene.fog); }
        RAINBOW_FORCE = null; FOG_FORCE = null;
        { S.dawnDusk = 1; HOUR_FORCE = 23; let n = 0; for (let h = 1; h < 3000; h++) if (rainbowAt(h, 'Fair', S.tier) || fogAt(h, 'Fair', S.tier)) n++;
          S.dawnDusk = 0; HOUR_FORCE = 14; if (n) f(n + ' rainbows or fogs in the clock\'s night'); }
        { let n = 0; const hs = S.hole; for (let h = hs; h < hs + 200; h++) { play(h, chaosFor(h, S.tier).n); if ((Scene.rainbow || Scene.fog) && (Scene.night || Scene.rain)) n++; if (Scene.fog && (Scene.golden || Scene.rainbow)) n++; }
          if (n) f(n + ' holes laid with rare weather against their weather'); }
        // ---- the rainbow, in the sky only ----
        o.rb = 0; o.rbMax = 0;
        // one rainbow in ten is golden, from the hole's hash
        { let n = 0; for (let h = 1; h <= 20000; h++) if (goldbowAt(h)) n++; o.gb = n / 20000;
          if (o.gb < 0.08 || o.gb > 0.12) f('a golden rainbow on ' + (o.gb * 100).toFixed(1) + '% of rainbows, not about 10%'); }
        // and one in twenty double, never golden as well
        { let n = 0; for (let h = 1; h <= 20000; h++) if (dblbowAt(h)) n++; o.db = n / 20000;
          if (o.db < 0.04 || o.db > 0.06) f('a double rainbow on ' + (o.db * 100).toFixed(1) + '% of rainbows, not about 5%');
          RAINBOW_FORCE = 1; let both = 0, dbl = 0; const hs = S.hole; for (let h = hs; h < hs + 400; h++) { play(h); if (Scene.dblbow) dbl++; if (Scene.dblbow && Scene.goldbow) both++; } RAINBOW_FORCE = null;
          if (both) f(both + ' rainbows both golden and double'); if (!dbl) f('no double rainbow in 400 rainbows'); }
        const h0 = S.hole;
        for (const ci of [0, 3, 6]) {
          DEV.course(ci); hideSheet(); const hh = S.hole;
          for (const at of [0, 0.5, 0.25]) {
            RAINBOW_FORCE = 0; play(hh); Scene.camD = LEN * at; Scene.walkTo = Scene.camD; Scene.t = 2; Scene.draw(0, D); Scene.draw(0, D); const b = grab();
            const sky0 = Scene.sky.getContext('2d').getImageData(0, 0, Scene.sky.width, Scene.sky.height).data;
            // (the golden rainbow half way down: the same arc in gold)
            // (and the double a quarter of the way: a second, fainter bow
            // outside the first, more of the sky than the single one)
            const dbl = at === 0.25, view = () => { play(hh); Scene.camD = LEN * at; Scene.walkTo = Scene.camD; Scene.t = 2; Scene.draw(0, D); Scene.draw(0, D); return grab(); };
            let one = null;
            if (dbl) { RAINBOW_FORCE = 1; GOLDBOW_FORCE = 0; DBLBOW_FORCE = 0; one = view(); }
            RAINBOW_FORCE = 1; GOLDBOW_FORCE = at === 0.5 ? 1 : 0; DBLBOW_FORCE = dbl ? 1 : 0; const a = view(), wat = Scene.waterAt(Scene.b, Scene.theme);
            if (at === 0.5 && !Scene.goldbow) f('the golden rainbow did not come when forced');
            if (dbl && !Scene.dblbow) f('the double rainbow did not come when forced');
            RAINBOW_FORCE = null; GOLDBOW_FORCE = null; DBLBOW_FORCE = null;
            if (one) { let n1 = 0, n2 = 0; for (let i = 0; i < a.length; i += 4) { if (one[i] !== b[i] || one[i + 1] !== b[i + 1] || one[i + 2] !== b[i + 2]) n1++; if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n2++; }
              o.dblPx = [n1, n2]; if (n2 < n1 * 1.4) f(B.COURSE[ci].id + ': the double rainbow took ' + n2 + ' pixels to the single one\'s ' + n1); }
            // (and the sky's own picture: nothing of it in the rows by the
            // horizon, which the far hills may not cover and the blend there
            // copies down onto the ground)
            { const W = Scene.sky.width, sk = Scene.sky.getContext('2d').getImageData(0, 0, W, Scene.sky.height).data;
              for (let i = 0; i < sk.length; i += 4) if (sk[i] !== sky0[i] || sk[i + 1] !== sky0[i + 1] || sk[i + 2] !== sky0[i + 2]) {
                const y = Math.floor(i / 4 / W); if (y >= HORIZON - 2) { f(B.COURSE[ci].id + ': the rainbow in the sky\'s row ' + y + ', by the horizon (' + HORIZON + ')'); break; } } }
            let n = 0, low = 0, far = 0;
            for (let i = 0; i < a.length; i += 4) {
              const dd = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
              if (!dd) continue;
              n++; o.rbMax = Math.max(o.rbMax, dd);
              // (below the horizon only its reflection, on the water)
              const y = Math.floor(i / 4 / VW); if (y >= HORIZON - 1 && !(y > HORIZON && wat((i / 4) % VW, y))) low++;
              if (y < HORIZON * 0.08) far++;
            }
            o.rb += n;
            const where = B.COURSE[ci].id + ' at ' + at;
            if (low) f(where + ': ' + low + ' pixels of rainbow at or below the horizon (row ' + HORIZON + ')');
            if (n < VW * 0.3) f(where + ': only ' + n + ' pixels of rainbow');
            if (far > VW * 0.2) f(where + ': the sky changed at its top (' + far + ' pixels: the clouds moved?)');
          }
        }
        if (o.rbMax > 120) f('the rainbow changed a pixel by ' + o.rbMax + ': not faint');
        // its reflection in the water: over the stepping stones' river, the
        // arc mirrored on the water and nowhere else below the horizon
        { DEV.stones(); hideSheet(); const view = on => { RAINBOW_FORCE = on; play(S.hole); Scene.camD = Scene.isle.bank - 4; Scene.walkTo = Scene.camD; Scene.t = 3; Scene.draw(0, D); Scene.draw(0, D); return grab(); };
          const b = view(0), a = view(1), wat = Scene.waterAt(Scene.b, Scene.theme); RAINBOW_FORCE = null;
          let on = 0, off = 0; for (let i = 0; i < a.length; i += 4) { const y = Math.floor(i / 4 / VW); if (y <= HORIZON) continue;
            if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { if (wat((i / 4) % VW, y)) on++; else off++; } }
          o.refl = on; if (on < 12) f('the rainbow\'s reflection on the river: ' + on + ' pixels'); if (off) f(off + ' pixels of the rainbow\'s reflection off the water');
          STONES_FORCE = 0; }
        // ---- the shooting star ----
        play(h0, 'Night Round'); Scene.meteorT = undefined;
        { const R = Math.random; Math.random = () => { throw new Error('Math.random in the star'); };
          const starts = [];
          try {
            let on = false, t0 = 0;
            for (let t = 0; t < 600; t += 0.02) {
              Scene.t = t; const M = Scene.meteorNow(), M2 = Scene.meteorNow();
              if (JSON.stringify(M) !== JSON.stringify(M2)) f('the star differs at the same moment');
              if (M && !on) { on = true; t0 = t; starts.push(t); }
              if (!M && on) { on = false; if (t - t0 > 1) f('a star lasted ' + (t - t0).toFixed(2) + 's'); }
            }
          } finally { Math.random = R; }
          o.stars = starts.length;
          const gaps = starts.slice(1).map((t, i) => t - starts[i]);
          if (starts.length < 15 || starts.length > 30) f(starts.length + ' stars in ten minutes');
          if (gaps.some(g => g < 19.9 || g > 40.1)) f('stars ' + Math.min(...gaps).toFixed(1) + ' to ' + Math.max(...gaps).toFixed(1) + 's apart');
          o.gaps = gaps.length ? Math.min(...gaps).toFixed(0) + '-' + Math.max(...gaps).toFixed(0) : '';
          // drawn alone over a blank: the upper sky only
          let px = 0, k = 0;
          for (const t of starts) for (const d of [0.1, 0.3, 0.5]) {
            Scene.t = t + d; c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); Scene.drawMeteor(c); k++;
            const g = grab();
            for (let i = 0; i < g.length; i += 4) if (!(g[i] === 1 && g[i + 1] === 2 && g[i + 2] === 3)) { px++;
              const y = Math.floor(i / 4 / VW); if (y >= HORIZON * 0.5) { f('the star at row ' + y + ', below the upper sky (horizon ' + HORIZON + ')'); break; } }
          }
          o.starPix = px;
          if (px < k * 4) f('the stars drew only ' + px + ' pixels over ' + k + ' moments');
          // in the frame, above the horizon only: with it and with it stubbed out
          const st = starts[0] + 0.3, dm = Scene.drawMeteor;
          Scene.t = st; Scene.draw(0, D); Scene.t = st; Scene.draw(0, D); const a = grab();
          Scene.drawMeteor = () => {}; Scene.t = st; Scene.draw(0, D); const b = grab(); Scene.drawMeteor = dm;
          let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { n++;
            if (Math.floor(i / 4 / VW) >= HORIZON) { f('the star in the frame below the horizon'); break; } }
          o.starFrame = n;
          if (n < 3) f('the star showed ' + n + ' pixels in the frame');
          // not by day, not in a wager
          play(h0, 'Fair'); let day = 0; for (let t = 0; t < 120; t += 0.1) { Scene.t = t; if (Scene.meteorNow()) day++; }
          if (day) f('a star by day');
          play(h0, 'Night Round'); S.dgnRun = { id: B.DGN[0].id }; let w = 0; for (let t = 0; t < 120; t += 0.1) { Scene.t = t; if (Scene.meteorNow()) w++; } S.dgnRun = null;
          if (w) f('a star in a wager');
        }
        // ---- the fog bank ----
        // (over the far end, from the ground at its distance up; under the
        // ground's line in front of it; never on the near ground, the upper
        // sky, or a tree of the forest nearer than it; drawn among the
        // scenery, so what stands nearer is drawn clear over it)
        {
          let hf = h0; while (sigKind(hf)) hf++;
          // (no heat shimmer in either frame: on a summer afternoon the frame
          // without fog slid its far rows a pixel and its trees read as misted)
          const at = (fog, cam) => { FOG_FORCE = fog; SHIMMER_FORCE = false; play(hf); FOG_FORCE = null; Scene.camD = cam; Scene.walkTo = cam; Scene.t = 2; Scene.draw(0, D); Scene.draw(0, D); return grab(); };
          o.fog = [];
          for (const cam of [0, LEN * 0.25, LEN * 0.5]) {
            const a = at(1, cam), FD = Scene.fogD(), cut = Scene.clipAt(FD), FDEP = Scene._fdep && Scene._fdep.slice(), b = at(0, cam);
            let most = 0, low = 0, tree = 0, sky = 0;
            for (let y = 0; y < VH; y++) { let s = 0;
              for (let x = 0; x < VW; x++) { const i = (y * VW + x) * 4, d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
                if (!d) continue; s += d;
                if (y > cut + 1) low++; else if (y < HORIZON * 0.4) sky++; else if (FDEP && FDEP[y * VW + x] < FD) tree++; }
              most = Math.max(most, s / VW); }
            // (the trees nearer than the bank, each drawn alone for where it
            // stands, the same with the fog as without)
            let near = 0, nearPix = 0;
            const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
            for (const q of Scene.props.filter(p => p.kind === 0 && p.d > cam + 3 && p.d < FD - 1)) {
              const was = Scene.props; blank(); Scene.props = [q]; Scene.drawProps(); Scene.props = was;
              const m = grab(); let n = 0, bad = 0;
              for (let i = 0; i < m.length; i += 4) { if (m[i] === 1 && m[i + 1] === 2 && m[i + 2] === 3) continue;
                if (Math.floor(i / 4 / VW) > cut) continue; n++;
                if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) bad++; }
              nearPix += n; if (bad > Math.max(4, n * 0.05)) near++;
            }
            o.fogNear = (o.fogNear || 0) + nearPix;
            if (near) f('camera at ' + cam.toFixed(0) + ': ' + near + ' trees nearer than the bank misted over');
            o.fog.push(most.toFixed(0));
            const w = 'camera at ' + cam.toFixed(0) + ': ';
            if (cam < LEN * 0.4 && most < (cam ? 10 : 40)) f(w + 'the fog changed its thickest row by only ' + most.toFixed(1));
            if (low) f(w + low + ' pixels of fog under the ground\'s line in front of it (row ' + Math.round(cut) + ')');
            if (sky) f(w + sky + ' pixels of fog in the upper sky');
            if (tree) f(w + tree + ' pixels of fog over a tree of the forest nearer than the bank');
          }
          if (!(o.fogNear >= 100)) f('only ' + o.fogNear + ' pixels of trees nearer than the bank to look at');
          // with an ace's beam at the cup, beyond the bank and nearer than it
          const AQ = Scene.aceBeamQ; Scene.aceBeamQ = () => 0.3;
          try { for (const cam of [0, LEN * 0.7]) at(1, cam); } finally { Scene.aceBeamQ = AQ; }
          // and none on a signature hole
          for (const k of SIG_KINDS) { let h = h0; while (sigKind(h) !== k && h < h0 + 5000) h++; FOG_FORCE = 1; play(h); FOG_FORCE = null; if (Scene.fog) f('fog on the ' + SIG_NAME[k]); }
        }
        // ---- the Field Guide ----
        {
          QUIET = false; S.guide = {};
          RAINBOW_FORCE = 1; play(h0); RAINBOW_FORCE = 0; FOG_FORCE = 1; play(h0); FOG_FORCE = null; RAINBOW_FORCE = null;
          if (!S.guide.rainbow || !S.guide.fog) f('seen live, not in the Guide: ' + JSON.stringify(S.guide));
          play(h0, 'Fair'); Scene.meteorT = Scene.t; Scene.drawMeteor(c);
          if (S.guide.meteor) f('a star recorded by day');
          // (at a moment it shows: it can pass behind the moon)
          play(h0, 'Night Round'); Scene.t = 5;
          for (let e = 0.1; e < 0.95; e += 0.1) { Scene.meteorT = 5 - e * METEOR_DUR; c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); Scene.drawMeteor(c);
            const g = grab(); let px = 0; for (let i = 0; i < g.length; i += 4) if (g[i] !== 1) px++; if (px) break; }
          Scene.drawMeteor(c);
          if (S.guide.meteor !== 1) f('a star drawn on a live night hole recorded ' + S.guide.meteor + ' times, not once');
          const was = JSON.stringify(S.guide);
          QUIET = true; RAINBOW_FORCE = 1; play(h0); Scene.meteorT = 9.8; Scene.t = 10; play(h0, 'Night Round'); Scene.meteorT = 9.8; Scene.drawMeteor(c); QUIET = false;
          OFFLINE = true; FOG_FORCE = 1; play(h0); OFFLINE = false;
          S.dgnRun = { id: B.DGN[0].id }; play(h0); S.dgnRun = null; RAINBOW_FORCE = null; FOG_FORCE = null;
          if (JSON.stringify(S.guide) !== was) f('recorded while away or in a wager: ' + JSON.stringify(S.guide));
          Scene.meteorT = undefined; QUIET = true;
        }
        // ---- the developer menu ----
        {
          S.chaos = ch('Crosswind'); DEV.rare('rainbow'); if (!Scene.rainbow) f('the menu\'s rainbow hole has none');
          DEV.rare('dblbow'); if (!Scene.rainbow || !Scene.dblbow) f('the menu\'s double rainbow hole has none');
          DEV.rare('fog'); if (!Scene.fog || Scene.rainbow) f('the menu\'s fog hole: fog ' + Scene.fog + ', rainbow ' + Scene.rainbow);
          if (RAINBOW_FORCE !== null || FOG_FORCE !== null) f('the menu left the weather forced');
          play(h0, 'Fair'); DEV.meteor(); const t = Scene.t; Scene.t = t + 0.5; const M = Scene.meteorNow(); Scene.t = t;
          if (!Scene.night || !M) f('the menu\'s shooting star: night ' + Scene.night + ', star ' + !!M);
          DEV.lights(1); if (!lightsOn()) f('the menu\'s lights on are off'); DEV.lights(null);
          Scene.meteorT = undefined;
        }
      } finally {
        window.step = keep; SHIMMER_FORCE = SHIMMER_DEF; RAINBOW_FORCE = null; FOG_FORCE = null; GOLDBOW_FORCE = null; DBLBOW_FORCE = null; LIGHTS_FORCE = null; HOUR_FORCE = null; FROST_FORCE = null; QUIET = false; OFFLINE = false;
        Scene.meteorT = undefined; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    const r = await one();
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    // on its side too (the rainbow and the star against a wide stage)
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    const s = await one();
    if (s.fails.length) throw new Error('on its side: ' + s.fails.join('\n'));
    return [r.rates.join('; ') + '; none on a wet or night round, fog never with a rainbow or Golden Hour; ' + (r.gb * 100).toFixed(1) + '% of rainbows golden, ' + (r.db * 100).toFixed(1) + '% double (never both)',
      'the rainbow: ' + r.rb + '/' + s.rb + ' pixels upright/on its side, all above the horizon but its reflection on the water (' + r.refl + '/' + s.refl + ' on the river), at most ' + r.rbMax + ' off the sky; a double ' + r.dblPx[1] + ' to a single\'s ' + r.dblPx[0],
      'the star: ' + r.stars + ' in ten minutes, ' + r.gaps + 's apart, ' + r.starPix + ' pixels drawn alone, all in the upper sky; ' + r.starFrame + ' in the frame; none by day or in a wager',
      'the fog: its thickest row changed by ' + r.fog.join('/') + ' a pixel from the tee, a quarter and half way (a rise in front can hide it); none under the ground in front, in the upper sky or over a nearer tree (' + r.fogNear + ' pixels of them); none on a signature hole',
      'the Field Guide: the rainbow and fog as laid, the star as drawn, none by day, away or in a wager; the menu\'s buttons work'];
  }
};
