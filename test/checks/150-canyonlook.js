/* The canyon looks like a canyon (the user: "instead of just a solid
 * color"): its walls in bands of sandstone that waver and crack along the
 * wall, darker down it, and a narrow river at the bottom.
 *
 * Asks the canyon's own colouring for every depth across every column, on
 * each course whose signature it is, and draws the hole from the bridge. */
'use strict';
module.exports = {
  name: 'canyonlook',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), out = [];
      for (const id of ['mesa', 'highlands', 'willow']) {
        const T = buildTheme(courseById(id), 'day');
        const cols = new Set(); let river = 0, riverOff = 0, rows = 0;
        for (let i = 0; i < HZ_N; i++) for (let k = 1; k < 100; k++) {
          const fz = k / 100, c = P_CANYON.tone(T, fz, HZ_LZ, 0.5, 0.5, i, 0.5); cols.add(c);
          if (fz > 0.95) { rows++; if (c === T._cns.river[0] || c === T._cns.river[1]) river++; }
          if (fz > 0.95 && [T._cns.river[0], T._cns.river[1]].includes(P_CANYON.tone(T, fz, HZ_LZ, 0.5, 0.5, i, 0.3))) riverOff++;
        }
        // a band's colour changes down one column, and along one depth across the wall
        let along = new Set(); for (let i = 0; i < HZ_N; i++) along.add(P_CANYON.tone(T, 0.5, HZ_LZ, 0.5, 0.5, i, 0.5));
        out.push(id + ' ' + cols.size + ' colours, ' + along.size + ' along one depth');
        if (cols.size < 20) f(id + ': its walls in ' + cols.size + ' colours');
        if (along.size < 3) f(id + ': one depth reads ' + along.size + ' colours across the wall');
        if (river !== rows) f(id + ': the river\'s line is not water at its middle');
        if (riverOff) f(id + ': water away from the river\'s line');
      }
      return { fails, out };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.out.join('; ') + '; a river down the middle of the floor only'];
  }
};
