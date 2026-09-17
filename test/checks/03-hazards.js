/* No bunker and no pond may touch the putting surface. Bunkers are drawn out to
 * 0.92 of the hole and ponds to three quarters of it, both with radii big enough
 * to reach the green from there, so this is a rejection that has to keep
 * working -- and it has to keep working without starving a hole of hazards. */
'use strict';
module.exports = {
  name: 'hazards',
  async run(page) {
    const r = await page.evaluate(() => {
      let holes = 0, hazards = 0, onGreen = 0, worst = 0, noBunker = 0, withWater = 0;
      for (let ci = 0; ci < B.COURSE.length; ci++) {
        DEV.course(ci); hideSheet();
        for (let h = 1; h <= 40; h++) {
          S.hole = h; startHole(); holes++;
          if (!Scene.bunkers.length) noBunker++;
          if (Scene.water) withWater++;
          for (const z of [].concat(Scene.water || [], Scene.bunkers)) {
            hazards++;
            for (let k = 0; k <= 40; k++) {
              const d = z.d - z.rd + (z.rd * 2) * k / 40;
              const sp = Scene.hazSpan(z, d);
              if (!sp) continue;
              for (const x of [z.x - sp.l, z.x, z.x + sp.r]) {
                // the green as it is actually drawn: an ellipse at LEN, 8.6 long
                const gd = (d - LEN) / 8.6, gx = x / 3.31;
                const inside = 1 - (gd * gd + gx * gx);
                if (inside > 0) { onGreen++; worst = Math.max(worst, inside); }
              }
            }
          }
        }
      }
      return { holes, hazards, onGreen, worst: +worst.toFixed(3), noBunker, withWater };
    });
    if (r.onGreen) throw new Error(r.onGreen + ' hazard samples land on a green (worst depth ' + r.worst + ')');
    if (r.noBunker) throw new Error(r.noBunker + ' holes ended up with no bunker at all');
    return [r.holes + ' holes, ' + r.hazards + ' hazards, none on a green, water on ' + r.withWater];
  }
};
