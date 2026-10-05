/* Snow on the gallery, long shadows at dawn and dusk, autumn leaves at the
 * edges, breath in the cold and the stars coming out (the user picked all
 * five).
 *
 *   - snow on the fans: whiter at each level of a snowy round, none at 0;
 *     an umbrella whiter with it; umbrellas in the snow, more as the round
 *     goes on, none on a dry clear day
 *   - long shadows: with the sun low the frame darker below the horizon
 *     and never above it; dawn's fall the other way from dusk's; none at
 *     night or once the stars are mostly out
 *   - leaves: drifts in a course's autumn, more by the 7th and the 13th,
 *     none in other seasons; never on the short grass, a hazard or water;
 *     drawn in the leaves' own colours
 *   - breath: on a frosty morning pale puffs by his head now and then, none
 *     on a mild one; each gone within a second
 *   - stars: none at seven, some by twenty past eight, most by nine; at
 *     dawn the other way; the sky with them has bright points high up that
 *     it has not without them, and none low by the hills */
'use strict';
module.exports = {
  name: 'dusklife',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true; const keepH = HOUR_FORCE;
      const D = derive(), px = () => Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
      const shot = (cam, t) => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = cam; Scene.walkTo = cam; Scene.draw(0, D); } return px(); };
      const fair = () => { S.chaos = { n: 'Fair' }; };
      const white = cv => { const a = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let w = 0; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 200 && a[i] > 225 && a[i + 1] > 230 && a[i + 2] > 235) w++; return w; };
      try {
        DEV.course(0); hideSheet();
        // ---- snow on the gallery ----
        { const lv = [0, 1, 2, 3].map(L => { let n = 0; for (let v = 0; v < 12; v++) n += white(spectSpr(v % 6, 'rest', false, v * 97 + 3, L).cv); return n; });
          o.fans = lv.join('/'); if (!(lv[1] > lv[0] && lv[2] > lv[1] && lv[3] > lv[2])) f('snow on the fans by level ' + o.fans);
          const um = [0, 3].map(L => { const cv = document.createElement('canvas'); cv.width = cv.height = 40; drawUmbrella(cv.getContext('2d'), 20, 34, 8, 30, 1, false, L); return white(cv); });
          o.umb = um.join('/'); if (!(um[1] > um[0] + 5)) f('an umbrella in the snow ' + o.umb);
          const keepU = window.drawUmbrella; let n = 0;
          const count = (sn, L) => { SEASON_FORCE = sn; SNOWSET_FORCE = L; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; n = 0; for (const cam of [0, 20, 40]) shot(cam, 2); return n; };
          drawUmbrella = function () { n++; return keepU.apply(this, arguments); };
          try { const u0 = count(0, null), u1 = count(2, 1), u3 = count(2, 3); o.umbN = u0 + '/' + u1 + '/' + u3; if (u0) f('umbrellas on a clear summer day'); if (!(u1 > 0 && u3 > u1)) f('umbrellas in the snow ' + o.umbN); }
          finally { drawUmbrella = keepU; SNOWSET_FORCE = null; SEASON_FORCE = -1; } }
        // ---- long shadows ----
        { SEASON_FORCE = 0; HOUR_FORCE = 14; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null;
          const dark = (a, b) => { let n = 0, up = 0, sx = 0; for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] < b[i] + b[i + 1] + b[i + 2] - 8) { n++; sx += (i / 4) % VW; if (Math.floor(i / 4 / VW) < HORIZON - 2) up++; } return { n, up, x: n ? sx / n : 0 }; };
          const keepS = Scene.longShadow, keepB = Scene.longBar;
          const keepDD = S.dawnDusk;
          const pair = (dawn) => { S.dawnDusk = 1; HOUR_FORCE = dawn ? 6.25 : 19.2; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null;
            Scene.skyKey = ''; const a = shot(30, 3); Scene.longShadow = () => {}; Scene.longBar = () => {}; const b = shot(30, 3); Scene.longShadow = keepS; Scene.longBar = keepB; return dark(a, b); };
          const dk = pair(false), dn = pair(true);
          o.sh = dk.n + '/' + dn.n; if (dk.n < 200 || dn.n < 200) f('long shadows darkened ' + o.sh + ' pixels'); if (dk.up + dn.up > (dk.n + dn.n) * 0.02) f((dk.up + dn.up) + ' shadow pixels in the sky');
          // (which way: one pine's shadow alone, from its foot)
          { const spr = Scene.treeSpr.pine, way = dir => { const cv = document.createElement('canvas'); cv.width = 200; cv.height = 120; const g = cv.getContext('2d'); const keepL = Scene._lsh, keepB2 = Scene.b;
              Scene._lsh = { w: 1, dir, fade: 1 }; Scene.b = g; Scene.longShadow(g, spr, 90, 20, 20, 40); Scene._lsh = keepL; Scene.b = keepB2;
              const P = g.getImageData(0, 0, 200, 120).data; let n = 0, sx = 0, up = 0; for (let i = 0; i < P.length; i += 4) if (P[i + 3]) { n++; sx += (i / 4) % 200; if (Math.floor(i / 4 / 200) < 60) up++; } return { n, x: n ? sx / n - 100 : 0, up }; };
            const L = way(1), R = way(-1); o.way = L.x.toFixed(0) + '/' + R.x.toFixed(0);
            if (!(L.n > 20 && L.x < -5 && R.x > 5)) f('a pine\'s shadow at dusk/dawn falls ' + o.way + ' of its foot'); if (L.up || R.up) f('a shadow above its foot'); }
          // (and only on ground that shows: each shadow pixel on the ground of
          // a point just in front of what casts it, where that ground is open;
          // never over a rise in front; from each thing alone, every home
          // course's first three holes, six places down each)
          { let px = 0, bad = 0, where = ''; const c = Scene.b;
            for (const cs of B.COURSE.filter(x => x.slot === 'home')) { DEV.course(B.COURSE.indexOf(cs)); hideSheet(); S.dawnDusk = 1; HOUR_FORCE = 19.2;
              for (let hh = S.hole; hh < S.hole + 3; hh++) { fair(); Scene.newHole(hh, S.tier); Scene.announce = null;
                for (let v = 0; v < 6; v++) { const cam = LEN * v / 6; Scene.camD = cam; Scene.walkTo = cam; Scene.t = 2; Scene.draw(0, D);
                  for (const Q of Scene.props) { if (Q.d < cam - 2 || Q.d > cam + 45 || Q.kind === 9) continue;
                    const one = sh => { const was = Scene.props, ls = Scene.longShadow; c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); Scene.props = [Q]; if (!sh) Scene.longShadow = () => {}; try { Scene.drawProps(); } finally { Scene.longShadow = ls; Scene.props = was; } return c.getImageData(0, 0, VW, VH).data; };
                    const A = one(true), B1 = one(false);
                    for (let i = 0; i < A.length; i += 4) { if (A[i] === B1[i] && A[i + 1] === B1[i + 1] && A[i + 2] === B1[i + 2]) continue;
                      const y = Math.floor(i / 4 / VW); px++; let ok = false;
                      for (let d2 = Q.d; d2 >= Q.d - 16 && !ok; d2 -= 0.05) { const gy = Scene.proj(d2, Q.x).y; if (Math.abs(gy - y) <= 1.5 && y <= Scene.clipAt(d2) + 1) ok = true; }
                      if (!ok) { bad++; if (!where) where = cs.id + ' hole ' + holeInRound(hh) + ' cam ' + cam.toFixed(0) + ' kind ' + Q.kind + ' at ' + Q.d.toFixed(1) + ' row ' + y; } } } } } }
            DEV.course(0); hideSheet(); if (keepDD === undefined) delete S.dawnDusk; else S.dawnDusk = keepDD; o.shOpen = px; if (px < 500) f('shadows alone drew ' + px + ' pixels'); if (bad > px * 0.01) f(bad + ' of ' + px + ' shadow pixels over hidden ground (' + where + ')'); }
          HOUR_FORCE = 19.2; S.chaos = { n: 'Night Round' }; Scene.newHole(S.hole, S.tier); shot(30, 3); if (Scene._lsh) f('long shadows at night');
          HOUR_FORCE = 20.9; fair(); Scene.newHole(S.hole, S.tier); shot(30, 3); if (Scene._lsh) f('long shadows with the sun down');
          if (keepDD === undefined) delete S.dawnDusk; else S.dawnDusk = keepDD; HOUR_FORCE = 14; }
        // ---- leaves at the edges ----
        { const lv = [], cnt = [];
          for (const k of [1, 6, 7, 12, 13, 18]) { SEASON_FORCE = 1; fair(); Scene.newHole(S.hole - holeInRound(S.hole) + k, S.tier); lv.push(Scene.leafL); cnt.push(Scene.props.filter(p => p.sp === 'gleaf').length); }
          o.leafL = lv.join(''); o.leafN = cnt.join('/'); if (o.leafL !== '112233') f('leaves by hole 1/6/7/12/13/18: ' + o.leafL); if (!(cnt[2] > cnt[0] && cnt[4] > cnt[2])) f('leaf drifts by hole ' + o.leafN);
          let bad = 0, n = 0;
          for (let ci = 0; ci < B.COURSE.length; ci++) { DEV.course(ci); hideSheet(); for (let k = 0; k < 6; k++) { GLEAF_FORCE = 3; fair(); Scene.newHole(S.hole + k, S.tier);
            for (const p of Scene.props.filter(p => p.sp === 'gleaf')) { n++; if (Scene.onPlay(p.d, p.x, 0) || Scene.hitsHazard(p.d, p.x, 0) || Scene.wetSpot(p.d, p.x)) bad++; } } }
          GLEAF_FORCE = null; DEV.course(0); hideSheet(); o.leafAll = n; if (bad) f(bad + ' of ' + n + ' leaf drifts on the short grass, a hazard or water');
          for (const sn of [0, 2, 3]) { SEASON_FORCE = sn; fair(); Scene.newHole(S.hole, S.tier); if (Scene.leafL || Scene.props.some(p => p.sp === 'gleaf')) f('leaf drifts in season ' + sn); }
          SEASON_FORCE = 1; GLEAF_FORCE = 3; fair(); let hl = S.hole; while (sigKind(hl)) hl++; Scene.newHole(hl, S.tier); Scene.announce = null;
          const G0 = Scene.props.filter(p => p.sp === 'gleaf' && p.d > 12 && p.d < 50); const cam = G0.length ? G0[G0.length - 1].d - 7 : 12; const a = shot(cam, 2);
          const keep = Scene.props; Scene.props = keep.filter(p => p.sp !== 'gleaf'); const b = shot(cam, 2); Scene.props = keep;
          let lp = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { if (a[i] > a[i + 2] + 40 && a[i] > a[i + 1]) lp++; }
          o.leafPx = lp; if (lp < 60) f('leaf drifts drew ' + lp + ' pixels on hole ' + hl); GLEAF_FORCE = null; }
        // ---- breath ----
        { const puffs = frost => { SEASON_FORCE = 1; HOUR_FORCE = 8; FROST_FORCE = frost; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; let on = 0, n = 0, longest = 0, run = 0;
            const keepP = Scene.breath; let drawn = 0; const keepPuff = window.puffSprite;
            for (let i = 0; i < 120; i++) { const before = drawn; const t = i / 30; const cnt = { n: 0 };
              Scene.breath = function (c, x, y, h, k) { const P = 2.8 + hr(k, 1058) * 1.6, u = ((this.t + hr(k, 1059) * P) % P) / 0.85; if (k === 0 && h >= 9 && u < 1) cnt.n++; return keepP.apply(this, arguments); };
              shot(LEN - 13, t); n++; if (cnt.n) { on++; run++; longest = Math.max(longest, run); } else run = 0; }
            Scene.breath = keepP; return { on, n, longest }; };
          const a = puffs(1), b = puffs(0); o.breath = a.on + '/' + a.n; if (!(a.on > 0)) f('no breath on a frosty morning'); if (b.on) f('breath on a mild morning');
          if (a.longest > 27) f('a puff lasted ' + a.longest + ' frames');
          // drawn: pale pixels by his head with it, not without
          FROST_FORCE = 1; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; let best = 0;
          for (let i = 0; i < 40; i++) { const t = i * 0.1, A = shot(LEN - 13, t); const keepB = Scene.breath; Scene.breath = () => {}; const B0 = shot(LEN - 13, t); Scene.breath = keepB;
            let m = 0; for (let j = 0; j < A.length; j += 4) if (A[j] + A[j + 1] + A[j + 2] > B0[j] + B0[j + 1] + B0[j + 2] + 30) m++; best = Math.max(best, m); }
          o.puffPx = best; if (best < 3) f('a puff drew ' + best + ' pixels'); FROST_FORCE = null; HOUR_FORCE = 14; }
        // ---- stars ----
        { const keepD = S.dawnDusk; S.dawnDusk = 1; const at = hh => { HOUR_FORCE = hh; const d = dawnDusk(); return d ? d.stars || 0 : 0; };
          const s = [19, 20.2, 20.9, 5.2, 6.5].map(at); o.stars = s.map(v => v.toFixed(2)).join('/');
          if (!(s[0] === 0 && s[1] > 0 && s[2] > s[1] && s[2] >= 0.9 && s[3] > 0.5 && s[4] === 0)) f('the stars by the hour ' + o.stars);
          SEASON_FORCE = 0; fair(); const sky = hh => { HOUR_FORCE = hh; Scene.newHole(S.hole, S.tier); Scene.skyKey = ''; Scene.buildSky(); return Scene.sky.getContext('2d').getImageData(0, 0, Scene.sky.width, Scene.sky.height).data; };
          const W = Scene.sky ? 0 : 0; const A = sky(20.9), B0 = sky(19.6), H = Scene.sky.height, SW = Scene.sky.width;
          // bright points against a darker sky: a pixel much brighter than its neighbours
          const points = (P, y0, y1) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = 1; x < SW - 1; x++) { const i = (y * SW + x) * 4, v = P[i] + P[i + 1] + P[i + 2], l = P[i - 4] + P[i - 3] + P[i - 2], r = P[i + 4] + P[i + 5] + P[i + 6]; if (v > l + 60 && v > r + 60) n++; } return n; };
          const hiA = points(A, 1, Math.round(H * 0.45)), hiB = points(B0, 1, Math.round(H * 0.45)), lowA = points(A, Math.round(H * 0.8), H - 1);
          o.starPx = hiA + '/' + hiB; if (!(hiA >= 12 && hiA > hiB + 8)) f('stars in the upper sky ' + o.starPx); if (lowA > 4) f(lowA + ' stars low by the hills');
          if (keepD === undefined) delete S.dawnDusk; else S.dawnDusk = keepD; }
      } finally { DUSK_FORCE = null; STARS_FORCE = null; GLEAF_FORCE = null; SNOWSET_FORCE = null; FROST_FORCE = null; HOUR_FORCE = keepH; SEASON_FORCE = -1; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const o = r.o;
    return ['snow on the fans ' + o.fans + 'px by level, an umbrella ' + o.umb + '; umbrellas clear/snow 1/snow 3: ' + o.umbN,
      'long shadows dusk/dawn ' + o.sh + 'px, below the horizon, ' + o.shOpen + 'px alone all on open ground, falling opposite ways; none at night or with the sun down',
      'leaves by hole ' + o.leafL + ', drifts ' + o.leafN + ', ' + o.leafAll + ' over every course none on the short grass, hazards or water, ' + o.leafPx + 'px drawn; none out of autumn',
      'breath on ' + o.breath + ' frosty frames, ' + o.puffPx + 'px, none on a mild morning; stars by 7/8:12/8:54pm, 5:12/6:30am ' + o.stars + ', points high ' + o.starPx];
  }
};
