/* Trees swaying in a gale, cloud shadows and the ponds thawing (the user
 * picked all three).
 *
 *   - trees: straight in a breeze, in a gale leaning downwind a pixel or two
 *     of their own and swaying between the two, never upwind, trunk planted
 *     (its picture's bottom row unmoved); only two leaning copies of a tree
 *   - cloud shadows: on about three clear holes in five, never at night, in
 *     the rain or the fog; drawn darker on the ground, never in the sky, and
 *     moving with the clock
 *   - the thaw: in a course's spring only, floes on the water that shrink as
 *     the morning goes on (more ice at 6 than at 8, none at 11 or 3pm);
 *     drawn paler, only on the water */
'use strict';
module.exports = {
  name: 'galethaw',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true; const keepH = HOUR_FORCE;
      const D = derive(), px = () => Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
      const shot = (cam, t) => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = cam; Scene.draw(0, D); } return px(); };
      try {
        // ---- trees ----
        DEV.course(0); hideSheet(); S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier);
        const p = { d: 30, x: 6 }, lean = (w, t) => { Scene.wind = w; Scene.t = t; return Scene.treeLean(p); };
        if (lean(0.5, 1) || lean(-0.5, 2)) f('trees lean in a breeze');
        const vals = new Set(); for (let t = 0; t < 8; t += 0.1) { const b = lean(1.2, t); vals.add(b); if (b <= 0) f('a tree leans upwind or stands in a gale'); }
        o.trees = [...vals].sort().join(','); if (vals.size !== 2) f('a tree in a gale takes ' + o.trees + ', not a sway between two');
        { const T = Scene.treeSpr.oak, L = leanSprite(T, 2), first = row => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') return i; return -1; };
          if (first(L.rows[L.h - 1]) !== first(T.rows[T.h - 1])) f('a swaying tree trunk moved'); const top = T.rows.findIndex(row => first(row) >= 0); if (!(first(L.rows[top]) - first(T.rows[top]) >= 1)) f('a swaying tree crown did not move'); }
        { Scene.wind = 1.2; for (let t = 0; t < 20; t += 0.25) { Scene.t = t; Scene.camD = 10; Scene.draw(0, D); } const n = (Scene.treeSpr.oak._lean || new Map()).size + (Scene.treeSpr.pine._lean || new Map()).size;
          o.copies = n; if (n > 4) f(n + ' leaning copies of the trees kept'); }
        // ---- cloud shadows ----
        let clear = 0, on = 0;
        for (let h = 1; h <= 400; h++) for (const ch of ['Fair', 'Crosswind', 'Night Round']) { S.chaos = { n: ch }; Scene.newHole(h, S.tier);
          if (Scene.cshadow && (Scene.night || Scene.rain || Scene.fog)) { f('cloud shadows at night, in rain or fog'); break; }
          if (ch === 'Fair' && !Scene.fog && !Scene.golden) { clear++; if (Scene.cshadow) on++; } }
        o.shadows = on + ' of ' + clear; if (on / clear < 0.5 || on / clear > 0.7) f('cloud shadows on ' + o.shadows + ' clear holes');
        { CSHADOW_FORCE = true; S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); Scene.announce = null; let best = 0, sky = 0, moved = 0;
          for (const t of [5, 15, 25, 35]) { const a = shot(0, t); Scene.cshadow = false; const b = shot(0, t); Scene.cshadow = true;
            let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] < b[i] + b[i + 1] + b[i + 2] - 6) { n++; if (Math.floor(i / 4 / VW) < HORIZON) sky++; }
            if (n > 0 && best > 0 && n !== best) moved++; best = Math.max(best, n); }
          CSHADOW_FORCE = null; o.spx = best; if (best < 400) f('the cloud shadows darkened ' + best + ' pixels'); if (sky) f(sky + ' pixels of cloud shadow in the sky'); if (!moved) f('the cloud shadows never moved'); }
        // ---- the thaw ----
        const ice = hrs => { HOUR_FORCE = hrs; Scene.newHole(S.hole, S.tier); return Scene.thaw; };
        for (const sn of [0, 1, 2]) { SEASON_FORCE = sn; if (ice(6) > 0) f('a thaw in season ' + sn); }
        SEASON_FORCE = 3; const i6 = ice(6), i8 = ice(8), i11 = ice(11), i15 = ice(15);
        o.thaw = [i6, i8, i11, i15].map(v => v.toFixed(2)).join('/'); if (!(i6 > i8 && i8 > 0 && i11 === 0 && i15 === 0)) f('the thaw by the hour ' + o.thaw);
        { HOUR_FORCE = 7; DEV.stones(); hideSheet(); Scene.announce = null; const cam = Scene.isle.bank - 4, a = shot(cam, 3), wat = Scene.waterAt(Scene.b, Scene.theme);
          const keep = Scene.thaw; Scene.thaw = 0; const b = shot(cam, 3); Scene.thaw = keep;
          let n = 0, off = 0; for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] > b[i] + b[i + 1] + b[i + 2] + 20) { const y = Math.floor(i / 4 / VW); n++; if (!wat((i / 4) % VW, y)) off++; }
          o.ipx = n; if (n < 150) f('the floes drew ' + n + ' pixels'); if (off > n * 0.02) f(off + ' pixels of ice off the water'); STONES_FORCE = 0; }
        SEASON_FORCE = -1;
      } finally { CSHADOW_FORCE = null; HOUR_FORCE = keepH; SEASON_FORCE = -1; STONES_FORCE = 0; QUIET = false; window.requestAnimationFrame = raf; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['trees straight in a breeze, swaying ' + r.o.trees + ' downwind in a gale, the trunk planted, ' + r.o.copies + ' leaning copies; cloud shadows on ' + r.o.shadows + ' clear holes, none at night, in rain or fog, ' + r.o.spx + 'px darker, none in the sky, moving; the thaw ' + r.o.thaw + ' at 6/8/11/15 in spring, none in other seasons, ' + r.o.ipx + 'px of floes on the water'];
  }
};
