/* Every look is bulkier than the sprite he is drawn from (the user asked:
 * "make the skins bulkier like the void skin", then the other skins, then
 * the plain outfits and the Majors' jackets, "so everyone's broader"):
 *
 *   - drawn on the course, each one's outline is built out behind him
 *     (bulkPlate), and his arms are a pixel thicker (bulk)
 *   - built out for real: at his chest, with the plate, he is at least two
 *     pixels wider each side than his own sprite
 */
'use strict';
module.exports = {
  name: 'bulk',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], wide: {} }, keep = window.bulkPlate;
      const f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = true;
        const skins = B.OUTFITS;
        if (skins.filter(x => x.fx && STYLEFX[x.fx]).length < 15) f('fewer than 15 skins with an effect');
        const cv = document.createElement('canvas'); cv.width = 160; cv.height = 120;
        const c = cv.getContext('2d');
        // the width of what is drawn on one row
        const span = y => { const d = c.getImageData(0, y, cv.width, 1).data; let a = -1, b = -1;
          for (let x = 0; x < cv.width; x++) if (d[x * 4 + 3] >= 128) { if (a < 0) a = x; b = x; } return [a, b]; };
        for (const O of skins) {
          S.styleOwn['o:' + O.id] = 1; S.outfit = O.id; buildSprites();
          startHole(); Scene.announce = null; Scene.swingT = 0; Scene.walkOn = false;
          // on the course: the plate is laid, and not for his caddie alone
          let him = 0;
          window.bulkPlate = function (cx, g) { if (!g.minor) him++; return keep.apply(this, arguments); };
          Scene.draw(0, derive());
          window.bulkPlate = keep;
          if (!him) f(O.n + ': not built out on the course');
          if (O.fx && STYLEFX[O.fx] && !outfitNow().bulk) f(O.n + ': his arms are not thicker');
          // alone: his sprite, then the plate under it, measured at his chest
          const spr = SPRITE.gAddr, h = 58, w = Math.round(h * spr.w / spr.h), x = 50, y = 40;
          const g = golferG(x, y, w, h, 0, 1, y + h, false, spr);
          const row = Math.round(y + h * 0.4);
          c.clearRect(0, 0, cv.width, cv.height); c.drawImage(spr.cv, x, y, w, h);
          const [a0, b0] = span(row);
          c.clearRect(0, 0, cv.width, cv.height); keep(c, g, '#101010', '#303030', '#202020'); c.drawImage(spr.cv, x, y, w, h);
          const [a1, b1] = span(row);
          o.wide[O.id] = (a0 - a1) + '/' + (b1 - b0);
          if (a0 - a1 < 2 || b1 - b0 < 2) f(O.n + ': at his chest the plate adds ' + (a0 - a1) + ' and ' + (b1 - b0) + ' pixels');
        }
      } finally {
        window.bulkPlate = keep; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [Object.keys(r.wide).length + ' looks, every one built out behind him (the skins thicker in the arm too); at his chest, pixels added either side: '
      + Object.entries(r.wide).map(([k, v]) => k + ' ' + v).join(', ')];
  }
};
