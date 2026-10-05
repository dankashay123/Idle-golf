/* The Harvest Moon (the user picked it from the menu): on one autumn night
 * round in four, a huge full orange moon low over the hills, in place of the
 * night's own; the whole round; a Field Guide entry, seen live.
 *
 *   - only on autumn nights (a home course in its autumn; a course as built
 *     from September to November), never by day, in the rain or in a wager
 *   - the same all round, about one round in four
 *   - drawn: orange, larger, lower than the ordinary moon
 *   - spotted, the Guide counts it */
'use strict';
module.exports = {
  name: 'harvestmoon',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), keep = window.courseFor, keepD = DAY_FORCE; let o_glint = null;
      try {
        QUIET = true; const home = courseById('willow'); window.courseFor = () => home;
        // a home course: autumn only
        let rounds = 0, on = 0, mixed = 0;
        for (let rd = 0; rd < 120; rd++) {
          const h0 = rd * B.ROUND + 1, look = seasonLook(home, 1);
          const a = harvestAt(h0, look); rounds++; if (a) on++;
          for (let k = 1; k < B.ROUND; k++) if (harvestAt(h0 + k, look) !== a) { mixed++; break; }
          for (const sn of [0, 2, 3]) if (harvestAt(h0, seasonLook(home, sn))) { f('a Harvest Moon in season ' + sn); break; }
        }
        if (mixed) f(mixed + ' rounds with it on some holes and not others');
        if (on / rounds < 0.12 || on / rounds > 0.4) f(on + ' of ' + rounds + ' autumn rounds');
        // a course as built: by the real month
        const plain = courseById('palmetto'); DAY_FORCE = Math.floor(Date.UTC(2026, 4, 15) / 86400000); let spring = 0;
        for (let rd = 0; rd < 80; rd++) if (harvestAt(rd * B.ROUND + 1, plain)) spring++;
        DAY_FORCE = Math.floor(Date.UTC(2026, 9, 15) / 86400000); let autumn = 0;
        for (let rd = 0; rd < 80; rd++) if (harvestAt(rd * B.ROUND + 1, plain)) autumn++;
        if (spring) f(spring + ' Harvest Moons in May'); if (!autumn) f('none in October');
        // (the courses that are their season all year keep it: no Harvest
        // Moon over the Snowline's snow or the Blossom's trees in October)
        for (const id of ['snowline', 'blossom']) { let n = 0; for (let rd = 0; rd < 80; rd++) if (harvestAt(rd * B.ROUND + 1, courseById(id))) n++; if (n) f(n + ' Harvest Moons over ' + id + ' in October'); }
        DAY_FORCE = keepD;
        // never carried into a wager from the night before it (the cellar's
        // floodlit green showed it, the hole before's moon left set)
        { HARVEST_FORCE = true; SEASON_FORCE = 1; S.chaos = { n: 'Night Round' }; Scene.newHole(S.hole, S.tier); const was = !!Scene.harvest; HARVEST_FORCE = null;
          if (!was) f('no Harvest Moon forced before the wager');
          const R = { id: (B.DGN.find(d => d.id === 'cellar') || B.DGN[0]).id, floor: 1 }, keepT = Scene.themeId;
          try { Scene.newDepthsHole(R); if (Scene.harvest) f('the Harvest Moon carried into a wager'); } finally { Scene.dFloor = null; Scene.newHole(S.hole, S.tier); } }
        // drawn: night only, orange, big and low
        HARVEST_FORCE = true; SEASON_FORCE = 1;
        S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); if (Scene.harvest) f('a Harvest Moon by day');
        S.chaos = { n: 'Crosswind' }; Scene.newHole(S.hole, S.tier); if (Scene.harvest) f('a Harvest Moon in the rain');
        S.chaos = { n: 'Night Round' }; Scene.newHole(S.hole, S.tier); Scene.skyKey = null; Scene.buildSky();
        if (!Scene.harvest) f('no Harvest Moon forced on a night');
        const big = Scene.moonR, low = Scene.moonY, sky = Scene.sky.getContext('2d').getImageData(Scene.moonX + (Scene.skyM || 0) - 1, Scene.moonY - 1, 3, 3).data;
        const orange = sky[0] > sky[2] + 60 && sky[0] > 180;
        HARVEST_FORCE = false; Scene.newHole(S.hole, S.tier); Scene.skyKey = null; Scene.buildSky();
        if (!(big > Scene.moonR * 1.8)) f('the Harvest Moon r ' + big + ' against ' + Scene.moonR);
        if (!(low > Scene.moonY)) f('not lower than the ordinary moon');
        if (!orange) f('its middle is ' + [...sky.slice(0, 3)] + ', not orange');
        // its light on the water orange, not the ordinary moon's pale path
        { const D2 = derive(), raf2 = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
          const orange = on => { HARVEST_FORCE = on; S.chaos = { n: 'Night Round' }; DEV.stones(); hideSheet(); Scene.announce = null; Scene.skyKey = null;
            let n = 0; for (const t of [1, 1.4, 1.8, 2.2]) { Scene.t = t; Scene.camD = Scene.isle.bank - 4; Scene.draw(0, D2); Scene.draw(0, D2);
              const d = Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
              for (let y = Math.round(VH * 0.42); y < VH; y++) for (let x = 0; x < VW; x++) { const i = (y * VW + x) * 4; if (d[i] > 150 && d[i] > d[i + 1] + 30 && d[i] > d[i + 2] + 80) n++; } }
            return n; };
          try { o_glint = [orange(true), orange(false)]; } finally { window.requestAnimationFrame = raf2; STONES_FORCE = 0; HARVEST_FORCE = null; S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); }
          if (!(o_glint[0] >= o_glint[1] + 8)) f('the Harvest Moon\'s light on the water: ' + o_glint[0] + ' orange pixels against ' + o_glint[1] + ' under the ordinary moon'); }
        // the Guide
        if (!GUIDE.find(g => g.id === 'harvest' && g.g === 'n')) f('no entry on the Night shelf');
        QUIET = false; S.guide = S.guide || {}; const n0 = S.guide.harvest || 0; const tw = window.toast; window.toast = () => {};
        try { guideSpot({ hole: S.hole, props: [], harvest: true, night: true }); } finally { window.toast = tw; }
        if ((S.guide.harvest || 0) !== n0 + 1) f('spotted, the Guide counted ' + ((S.guide.harvest || 0) - n0));
        if (!guideUrl('harvest')) f('no picture in the Guide');
        return { fails, on, rounds, glint: o_glint };
      } finally { window.courseFor = keep; DAY_FORCE = keepD; HARVEST_FORCE = null; SEASON_FORCE = -1; QUIET = false; S.chaos = { n: 'Fair' }; }
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['autumn nights only, ' + r.on + ' of ' + r.rounds + ' rounds, the whole round; orange, big and low, its light on the water orange (' + r.glint.join(' against ') + ' pixels); in the Guide'];
  }
};
