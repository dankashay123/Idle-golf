/* Everything standing on the ground reaches it (the oak's picture had five
 * empty rows under its trunk: every oak on the course and in the woods
 * stood a little above the ground, its shadow on the grass below it).
 *
 *   - the pictures of the trees, the scenery in the rough and the gallery,
 *     on every course and in every look (day, night, rain, frost), each
 *     have something in their bottom row, where they are stood on the
 *     ground; and so does each shrunk for the woods far off
 */
'use strict';
module.exports = {
  name: 'grounded',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = { fails: [], n: 0 };
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const low = (spr, what) => { o.n++;
        const row = spr.rows[spr.rows.length - 1];
        if (!/[^. ]/.test(row)) f(what + ' has nothing in its bottom row: it stands above the ground'); };
      for (const cs of B.COURSE) for (const mode of ['day', 'night', 'rain', 'frost']) {
        const TS = courseTrees(cs, mode);
        for (const k of ['pine', 'oak', 'bush', 'tuft', 'rock']) {
          low(TS[k], cs.id + ' ' + mode + ' ' + k);
          if (k === 'pine' || k === 'oak') for (let h = 4; h < TS[k].h; h += 3) {
            const w = Math.max(1, Math.round(h * TS[k].w / TS[k].h)), s = shrinkSprite(TS[k], w, h);
            if (s) low(s, cs.id + ' ' + mode + ' ' + k + ' shrunk to ' + h + 'px');
          }
        }
      }
      for (let ci = 0; ci < 8; ci++) for (const pose of [0, 1]) for (const night of [false, true]) {
        const s = spectSpr(ci, pose, night); if (s) low(s, 'a spectator ' + ci + '/' + pose + (night ? ' at night' : ''));
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.n + ' pictures of trees, scenery and the gallery, every one with its foot on its bottom row'];
  }
};
