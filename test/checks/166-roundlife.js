/* Snow on the path, moonrise, spring's petals gathering and the morning's
 * mist lifting (the user picked all four).
 *
 *   - the path in a snowy round: paler at each level (on the frame, where
 *     the path is), as built when not snowing
 *   - moonrise (Dawn and Dusk on): at dusk with most of the stars out a
 *     moon low in the east; at nine just risen there, by eleven at its own
 *     place high in the west; none of it with the setting off
 *   - petals: in a course's spring drifts of petals (pink and white), more
 *     as the round goes on, none in summer
 *   - the mist lifting: full on the 1st, thinner hole by hole, a trace from
 *     the 13th, and drawn fainter there */
'use strict';
module.exports = {
  name: 'roundlife',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true; const keepH = HOUR_FORCE, keepStep = window.step; window.step = () => {};
      const D = derive(), px = () => Scene.b.getImageData(0, 0, VW, VH).data;
      const shot = (cam, t) => { Scene.camD = cam; Scene.walkTo = cam; Scene.t = t; Scene.gGen++; Scene.skyKey = ''; Scene.draw(0, D); Scene.draw(0, D); return px(); };
      const fair = () => { S.chaos = { n: 'Fair' }; };
      try {
        DEV.course(0); hideSheet(); let hh = S.hole; while (sigKind(hh)) hh++;
        // ---- snow on the path ----
        { const bright = L => { SEASON_FORCE = L ? 2 : 0; SNOWSET_FORCE = L || null; fair(); Scene.newHole(hh, S.tier); Scene.announce = null; const keepP = Scene.props; Scene.props = [];
            const A = shot(6, 1); let sum = 0, n = 0;
            for (let d = 8; d < 30; d += 0.5) { const p = Scene.proj(d, Scene.cartX(d)), X = Math.round(p.x), Y = Math.round(p.y); if (X < 1 || X >= VW - 1 || Y <= HORIZON || Y >= VH || Y > Scene.clipAt(d) - 1) continue; const j = (Y * VW + X) * 4; sum += A[j] + A[j + 1] + A[j + 2]; n++; }
            Scene.props = keepP; return n ? sum / n : 0; };
          const b = [1, 2, 3].map(bright); o.path = b.map(v => v.toFixed(0)).join('/'); if (!(b[1] > b[0] + 5 && b[2] > b[1] + 5)) f('the path in the snow by level ' + o.path);
          SNOWSET_FORCE = null; SEASON_FORCE = -1; }
        // ---- moonrise ----
        { const keepDD = S.dawnDusk; S.dawnDusk = 1; SEASON_FORCE = 0;
          const moonAt = (hr0) => { HOUR_FORCE = hr0; fair(); Scene.newHole(hh, S.tier); Scene.announce = null; Scene.skyKey = ''; Scene.buildSky(); const cv = Scene.sky, P = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height;
            // where the moon's bright disc is: the mean of its near-white pixels
            let sx = 0, sy = 0, n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = (y * W + x) * 4; if (P[j] > 215 && P[j + 1] > 215 && P[j + 2] > 200) { sx += x; sy += y; n++; } }
            return n > 6 ? { x: sx / n / W, y: sy / n / H, n } : null; };
          const m20 = moonAt(20.95), m21 = moonAt(21.05), m23 = moonAt(23.5); HOUR_FORCE = 19.4; const dd19 = dawnDusk();
          o.moon = [m20, m21, m23].map(m => m ? m.x.toFixed(2) + ',' + m.y.toFixed(2) : '-').join(' ');
          if (!m20 || m20.x > 0.4) f('no moon rising in the east at dusk: ' + o.moon);
          if (!m21 || (m20 && Math.abs(m21.x - m20.x) > 0.08)) f('the moon jumped at nine: ' + o.moon);
          if (!m23 || m23.x < 0.6 || m23.y > m21.y) f('the moon not climbed to its place by half eleven: ' + o.moon);
          if (!dd19 || dd19.stars > 0.35) f('the moon up by 7:24pm (stars ' + (dd19 && dd19.stars) + ')');
          if (keepDD === undefined) delete S.dawnDusk; else S.dawnDusk = keepDD; HOUR_FORCE = 22; fair(); Scene.newHole(hh, S.tier); if (moonRiseF() !== 1) f('the moon rising with Dawn and Dusk off'); SEASON_FORCE = -1; HOUR_FORCE = 14; }
        // ---- petals ----
        { const cnt = [];
          for (const k of [1, 7, 13]) { SEASON_FORCE = 3; fair(); Scene.newHole(hh - holeInRound(hh) + k, S.tier); cnt.push(Scene.leafP && Scene.leafL ? Scene.props.filter(p => p.sp === 'gleaf').length : 0); }
          o.petals = cnt.join('/'); if (!(cnt[0] > 0 && cnt[1] > cnt[0] && cnt[2] > cnt[1])) f('petal drifts by hole ' + o.petals);
          SEASON_FORCE = 0; fair(); Scene.newHole(hh, S.tier); if (Scene.leafL || Scene.leafP) f('petal or leaf drifts in summer');
          SEASON_FORCE = 3; GLEAF_FORCE = 3; fair(); Scene.newHole(hh, S.tier); Scene.announce = null;
          const G0 = Scene.props.filter(p => p.sp === 'gleaf' && p.d > 12 && p.d < 50), cam = G0.length ? G0[G0.length - 1].d - 7 : 12, A = shot(cam, 2);
          const keep = Scene.props; Scene.props = keep.filter(p => p.sp !== 'gleaf'); const B1 = shot(cam, 2); Scene.props = keep;
          let pink = 0; for (let i = 0; i < A.length; i += 4) if ((A[i] !== B1[i] || A[i + 2] !== B1[i + 2]) && A[i] > 200 && A[i + 2] > 150 && A[i + 1] < A[i]) pink++;
          o.pink = pink; if (pink < 20) f('petal drifts drew ' + pink + ' pink pixels'); GLEAF_FORCE = null; SEASON_FORCE = -1; }
        // ---- the mist lifting ----
        { const lift = k => { fair(); Scene.newHole(hh - holeInRound(hh) + k, S.tier); return Scene.mistLift; };
          const v = [1, 5, 9, 13, 18].map(lift); o.lift = v.map(x => x.toFixed(2)).join('/');
          if (!(v[0] === 1 && v[1] > v[2] && v[2] > v[3] && v[3] <= 0.2 && v[4] > 0)) f('the mist by hole 1/5/9/13/18: ' + o.lift);
          // drawn fainter: the same hollows on a late hole, with the mist and
          // without, against an early one
          const keepL = LMIST_FORCE; LMIST_FORCE = true; fair(); Scene.newHole(hh, S.tier); Scene.announce = null; const keepP = Scene.props; Scene.props = [];
          const amt = m => { Scene.mistLift = m; const A = shot(0, 1); Scene.lmist = false; const B1 = shot(0, 1); Scene.lmist = true; let s2 = 0; for (let i = 0; i < A.length; i += 4) s2 += Math.max(0, A[i] + A[i + 1] + A[i + 2] - B1[i] - B1[i + 1] - B1[i + 2]); return s2; };
          const full = amt(1), late = amt(v[3]); Scene.props = keepP; LMIST_FORCE = keepL;
          o.mist = (late / Math.max(1, full)).toFixed(2); if (!(full > 1000 && late < full * 0.4)) f('the mist drawn on the 13th ' + o.mist + ' of the 1st\'s (' + full + ')'); }
      } finally { SNOWSET_FORCE = null; GLEAF_FORCE = null; HOUR_FORCE = keepH; SEASON_FORCE = -1; window.step = keepStep; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const o = r.o;
    return ['the path in the snow by level ' + o.path + ' bright; the moon at 8:57pm, 9:03pm, 11:30pm (x,y of the sky) ' + o.moon,
      'petal drifts by hole 1/7/13 ' + o.petals + ', ' + o.pink + ' pink pixels drawn, none in summer; the mist by hole 1/5/9/13/18 ' + o.lift + ', drawn on the 13th ' + o.mist + ' of the 1st'];
  }
};
