/* Umbrellas in the rain (the user asked, from the menu): most of the gallery
 * round the green put one up, and the grandstand's front two rows, out from
 * under its roof; none on a dry day; at night in the night's own colours.
 */
'use strict';
module.exports = {
  name: 'umbrellas',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => o.fails.push(m), keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        const dayCols = new Set(UMB_COLS.filter(c => c !== '#F2F2F2')), nightCols = new Set(UMB_COLS.filter(c => c !== '#F2F2F2').map(c => mixC(c, '#0B1118', 0.45).toUpperCase()));
        const count = (d, set, y0, y1, W) => { let n = 0; for (let i = 0; i < d.length; i += 4) { const y = (i >> 2) / W | 0; if (d[i + 3] && y >= (y0 || 0) && y < (y1 === undefined ? 1e9 : y1) && set.has(hex(d, i))) n++; } return n; };
        // ---- the gallery round the last green ----
        const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
        const gallery = (rain, night) => {
          S.hole = first + B.ROUND - 2; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === (rain ? 'Crosswind' : 'Fair')));
          Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.night = !!night;
          const c = Scene.b; Scene.camD = LEN - 10; Scene.walkTo = Scene.camD; Scene.draw(0, derive());
          const gal = Scene.props.filter(p => p.kind === 1);
          c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH);
          const was = Scene.props; Scene.props = gal; Scene.drawProps(); Scene.props = was;
          return { d: c.getImageData(0, 0, VW, VH).data, n: gal.length, rain: Scene.rain };
        };
        const dry = gallery(false), wet = gallery(true), wetN = gallery(true, true);
        o.gal = [count(dry.d, dayCols, 0, VH, VW), count(wet.d, dayCols, 0, VH, VW), count(wetN.d, dayCols, 0, VH, VW), count(wetN.d, nightCols, 0, VH, VW), wet.n].join('/');
        const [gd, gw, gnd, gnn] = o.gal.split('/').map(Number);
        if (!wet.rain || gd || !(gw > 60) || gnd || !(gnn > 60)) f('umbrellas in the gallery (dry/rain/rain at night by day\'s colours/by the night\'s, of ' + wet.n + '): ' + o.gal);
        // ---- the grandstand ----
        const st = (rain, night) => { const cv = standCv(20, 1, !!night, 5, 0, false, rain); return { d: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, W: cv.width, H: cv.height }; };
        const s0 = st(false), s1 = st(true), s2 = st(true, true);
        o.stand = [count(s0.d, dayCols, 0, s0.H, s0.W), count(s1.d, dayCols, 0, s1.H, s1.W), count(s1.d, dayCols, 0, Math.round(s1.H * 0.45), s1.W), count(s2.d, nightCols, 0, s2.H, s2.W)].join('/');
        const [sd, sw, sTop, sn] = o.stand.split('/').map(Number);
        if (sd || !(sw > 40) || sTop || !(sn > 40)) f('umbrellas in the stand (dry/rain/in its upper rows/at night): ' + o.stand);
        // and the course's grandstand is drawn with the rain
        S.hole = first + B.ROUND - 1; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Crosswind')); Scene.newHole(S.hole, S.tier); Scene.announce = null;
        // (close: further off, on the harness's small stage, its fans are too small for one)
        Scene.camD = LEN - 1; Scene.walkTo = Scene.camD; Scene.draw(0, derive());
        const sp = Scene.props.find(p => p.kind === 10);
        if (sp) { const c = Scene.b; c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); const was = Scene.props; Scene.props = [sp]; Scene.drawProps(); Scene.props = was;
          o.onCourse = count(c.getImageData(0, 0, VW, VH).data, dayCols, 0, VH, VW);
          const pr = Scene.proj(sp.d, sp.x); if (!(o.onCourse > 5)) f('the grandstand on the course in the rain showed ' + o.onCourse + ' pixels of umbrella (its size ' + Math.round(12 * pr.s * US) + ', rain ' + Scene.rain + ', hole ' + S.hole + ', ' + VW + 'x' + VH + ')'); }
      } finally {
        window.step = keep; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the gallery\'s umbrellas (dry/rain/rain at night in the day\'s colours/in the night\'s, and the gallery): ' + r.gal,
      'the grandstand\'s (dry/rain/in its upper rows/at night): ' + r.stand + '; ' + r.onCourse + ' pixels on the course\'s stand in the rain'];
  }
};
