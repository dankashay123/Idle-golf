/* No bunker and no pond may touch the putting surface. Bunkers are drawn out to
 * 0.92 of the hole and ponds to three quarters of it, both with radii big enough
 * to reach the green from there, so this is a rejection that has to keep
 * working -- and it has to keep working without starving a hole of hazards.
 *
 * The one exception is a home course's island green, whose lake is meant to
 * run right round the green. That lake is held to the opposite rule: water
 * in front of the green, behind it and on both sides of it. */
'use strict';
module.exports = {
  name: 'hazards',
  async run(page) {
    const r = await page.evaluate(() => {
      let holes = 0, hazards = 0, onGreen = 0, worst = 0, noBunker = 0, withWater = 0, islands = 0;
      const notIsland = [];
      const wet = (d, x) => { const w = Scene.water, sp = w && Scene.hazSpan(w, d);
        return !!sp && x > w.x - sp.l && x < w.x + sp.r; };
      for (let ci = 0; ci < B.COURSE.length; ci++) {
        // Forty holes of THAT course: DEV.course pins it to one event, and a
        // hole number outside that event is on whatever the calendar says.
        // Walking holes 1 to 40 checked the first event's course 32 times.
        DEV.course(ci); hideSheet();
        const base = S.hole;
        for (let h = 0; h < 40; h++) {
          S.hole = base + h; startHole(); holes++;
          if (Scene.course.id !== B.COURSE[ci].id) throw new Error('hole ' + S.hole + ' is not on ' + B.COURSE[ci].id);
          if (!Scene.bunkers.length) noBunker++;
          if (Scene.water) withWater++;
          if (Scene.water && Scene.water.lake) {
            islands++;
            const miss = [[LEN - 10, 0], [LEN + 10, 0], [LEN, -3.6], [LEN, 3.6]].filter(([d, x]) => !wet(d, x));
            if (miss.length) notIsland.push(Scene.course.id + ' hole ' + S.hole + ' dry at ' + JSON.stringify(miss));
          }
          for (const z of [].concat(Scene.water && !Scene.water.lake ? Scene.water : [], Scene.bunkers)) {
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
      return { holes, hazards, onGreen, worst: +worst.toFixed(3), noBunker, withWater, islands, notIsland };
    });
    if (r.onGreen) throw new Error(r.onGreen + ' hazard samples land on a green (worst depth ' + r.worst + ')');
    if (r.noBunker) throw new Error(r.noBunker + ' holes ended up with no bunker at all');
    if (!r.islands) throw new Error('forty holes of every home course and not one island green');
    if (r.notIsland.length) throw new Error('an island green with dry ground by it: ' + r.notIsland.slice(0, 3).join('; '));
    return [r.holes + ' holes, ' + r.hazards + ' hazards, none on a green, water on ' + r.withWater
      + '; ' + r.islands + ' island greens, water all round each'];
  }
};
