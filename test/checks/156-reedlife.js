/* Fireflies over the reeds and ripples on the water (the user picked both
 * from the menu).
 *
 *   - fireflies: on a summer night (pinned to July), dry, not on ice, two or
 *     three swarms at the reeds on most holes with reeds, the same each time;
 *     none by day, in November or in the rain; drawn, their lights doubled
 *     in the water; they count for the Guide's Fireflies
 *   - ripples: a ring spreads where a dragonfly dips and round the frog's
 *     pad; drawn only on water (a ring set on dry ground draws nothing) */
'use strict';
module.exports = {
  name: 'reedlife',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = { reedy: 0, lit: 0 };
      const JULY = Math.round(Date.UTC(2026, 6, 15) / 86400000), NOV = Math.round(Date.UTC(2026, 10, 15) / 86400000);
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      const wetFF = () => (Scene.props || []).filter(p => p.kind === 5 && p.wet);
      try {
        for (const [day, sea, summer] of [[JULY, 0, true], [NOV, 1, false]]) {
          DAY_FORCE = day; SEASON_FORCE = sea;
          for (let ci = 0; ci < B.COURSE.length; ci++) {
            DEV.course(ci); hideSheet();
            for (let k = 0; k < 24; k++) for (const ch of ['Night', 'Fair']) {
              const h = S.hole + k; S.chaos = { n: ch }; Scene.newHole(h, S.tier);
              const P = Scene.props || [], reeds = P.filter(p => p.kind === 26 && p.sp === 'reed'), ff = wetFF(), id = B.COURSE[ci].id + ' h' + h + ' ' + ch;
              if (ff.length && (!summer || !Scene.night || Scene.rain || Scene.ice)) f(id + ': fireflies over the reeds ' + (summer ? 'by day, in the rain or on ice' : 'in November'));
              if (ff.length > 3) f(id + ': ' + ff.length + ' swarms');
              for (const q of ff) if (!reeds.some(b => b.d === q.d && b.x === q.x)) f(id + ': a swarm not at the reeds');
              if (summer && Scene.night && !Scene.rain && !Scene.ice && reeds.length) { o.reedy++; if (ff.length) o.lit++; }
              const again = JSON.stringify(ff.map(p => [p.d, p.x, p.k])); Scene.newHole(h, S.tier);
              if (JSON.stringify(wetFF().map(p => [p.d, p.x, p.k])) !== again) f(id + ': laid differently a second time');
            }
          }
        }
        if (!o.reedy) f('no summer night with reeds');
        else if (o.lit / o.reedy < 0.55 || o.lit / o.reedy > 0.95) f('fireflies at the reeds on ' + o.lit + ' of ' + o.reedy + ' summer nights');
        DAY_FORCE = JULY; SEASON_FORCE = 0; DEV.course(0); hideSheet();
        const D = derive(), px = () => Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
        const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n; };
        const shot = (cam, t) => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = Math.max(0, cam); Scene.draw(0, D); } return px(); };
        // fireflies drawn, and their doubles in the water
        RFLY_FORCE = true; S.chaos = { n: 'Night' }; DEV.stones(); hideSheet(); Scene.announce = null;
        const ff = wetFF();
        if (!ff.length || !Scene.night) f('pinned on a night, no fireflies at the reeds');
        else {
          const keep = Scene.props, cam = ff[0].d - 6; let lit = 0, dbl = 0;
          for (const t of [0.5, 1.7, 2.9, 4.1]) {
            const a = shot(cam, t); Scene.props = keep.filter(p => !(p.kind === 5 && p.wet)); const b = shot(cam, t); Scene.props = keep;
            lit += diff(a, b);
            for (const q of ff) q.wet = 0; const c = shot(cam, t); for (const q of ff) q.wet = 1; dbl += diff(a, c);
          }
          o.ffpx = lit; o.dbl = dbl;
          if (lit < 20) f('the fireflies at the reeds drew ' + lit + ' pixels');
          if (dbl < 4) f('their lights doubled in the water ' + dbl + ' pixels');
        }
        RFLY_FORCE = null;
        // the frog's ring: a frame at its ring's start against the ring held back
        S.chaos = { n: 'Fair' }; LILYFROG_FORCE = true; DFLY_FORCE = true; DEV.stones(); hideSheet(); Scene.announce = null;
        const fr = (Scene.props || []).find(p => p.frog), rip = Scene.ripple;
        if (!fr) f('pinned, no frog');
        else {
          const t0 = 4.7 * 20 + 0.4 - hr(fr.k + Scene.hole, 875) * 4.7;
          const a = shot(fr.d - 6, t0); Scene.ripple = () => {}; const b = shot(fr.d - 6, t0); Scene.ripple = rip;
          o.frog = diff(a, b); if (o.frog < 8) f('the ring round the frog drew ' + o.frog + ' pixels');
        }
        // a dragonfly's dip: over a stretch, rings drawn
        const df = (Scene.props || []).filter(p => p.sp === 'dfly');
        if (!df.length) f('pinned, no dragonflies');
        else { let n = 0; for (let t = 0; t < 26 && n < 8; t += 0.37) { const a = shot(df[0].d - 6, t); Scene.ripple = () => {}; const b = shot(df[0].d - 6, t); Scene.ripple = rip; n += diff(a, b) > 0 ? 1 : 0; }
          o.dips = n; if (n < 2) f('the dragonflies dipped and rang the water in ' + n + ' frames of 70'); }
        // never on dry ground: a ring on the fairway by the tee draws nothing
        const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; const g = cv.getContext('2d');
        // (a spot in view whose whole ring is dry)
        const anyWet = (d, x) => { for (let i = 0; i < 48; i++) { const t = i / 48 * Math.PI * 2; if (Scene.wetSpot(d + Math.sin(t) * 0.45, x + Math.cos(t) * 0.55)) return true; } return Scene.wetSpot(d, x); };
        let sd = Scene.camD + 2.5, sx = 0; for (let k = 0; k < 60 && anyWet(sd, sx); k++) sd += 0.25;
        if (anyWet(sd, sx)) f('no dry ground in view to try a ring on');
        Scene.ripple(g, sd, sx, 0.5, 0.9, false); const dp = g.getImageData(0, 0, VW, VH).data; let dry = 0; for (let i = 3; i < dp.length; i += 4) if (dp[i]) dry++;
        if (dry) f('a ring on dry ground drew ' + dry + ' pixels');
        // the Guide
        S.guide = S.guide || {}; QUIET = false; const n0 = S.guide.firefly || 0, tw = window.toast; window.toast = () => {};
        try { guideSpot({ hole: S.hole, night: 1, props: [{ kind: 5, wet: 1 }] }); } finally { window.toast = tw; }
        if ((S.guide.firefly || 0) !== n0 + 1) f('fireflies at the reeds: the Guide counted ' + ((S.guide.firefly || 0) - n0));
      } finally { RFLY_FORCE = null; DFLY_FORCE = null; LILYFROG_FORCE = null; DAY_FORCE = null; SEASON_FORCE = -1; STONES_FORCE = 0; QUIET = false; window.requestAnimationFrame = raf; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['fireflies at the reeds on ' + r.o.lit + ' of ' + r.o.reedy + ' summer nights, none by day, in November, the rain or on ice; drawn ' + r.o.ffpx + 'px, doubled in the water ' + r.o.dbl + 'px; the frog\'s ring ' + r.o.frog + 'px, the dragonflies\' dips in ' + r.o.dips + ' frames; none on dry ground'];
  }
};
