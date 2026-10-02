/* What the Legendary skins wear on their heads (the user asked them brought
 * up toward the Mythic sets' detail): Frostborn's crown of ice, Inferno's
 * crown of flame, Stormcaller's circlet of lightning, Void Walker's broken
 * halo, Glitch's visor, Midas's laurel and Disco's star shades.
 *
 *   - each drawn alone at address and at the finish, his piece adds pixels
 *     of its own, all of them within a head's height of his cap (worn, not
 *     floating off), and none below his shoulders
 *   - from behind, the pieces over his eyes are not drawn
 */
'use strict';
module.exports = {
  name: 'legendwear',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], adds: {} }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const keepW = Object.assign({}, LEGEND_WEAR);
      try {
        hideSheet(); QUIET = true;
        const cv = document.createElement('canvas'); cv.width = 200; cv.height = 160; const c = cv.getContext('2d');
        const ids = { frost: 'frostborn', inferno: 'inferno', storm: 'stormcaller', void: 'void', glitch: 'glitch', midas: 'midas', disco: 'disco' };
        for (const id in ids) {
          S.styleOwn['o:' + id] = 1; S.outfit = id; buildSprites();
          for (const [pose, walking] of [[0, false], [0.8, false], [0, true]]) {
            const draw = on => { LEGEND_WEAR[ids[id]] = on ? keepW[ids[id]] : () => {};
              c.clearRect(0, 0, 200, 160);
              const spr = walking ? SPRITE.gBack : pose > 0.6 ? SPRITE.gFinish : SPRITE.gAddr, h = 80, w = Math.round(h * spr.w / spr.h), x = 60, bot = 140, y = bot - h;
              paintGolfer(c, x, y, w, h, pose, 4.2, bot, walking, 0.2, spr, [], undefined, true);
              return { d: c.getImageData(0, 0, 200, 160).data, g: golferG(x, y, w, h, pose, 4.2, bot, walking, spr) }; };
            const A = draw(false), B = draw(true); LEGEND_WEAR[ids[id]] = keepW[ids[id]];
            let n = 0, low = 0;
            const H = B.g.head, lim = H.y + H.hh + B.g.h * 0.16;
            for (let i = 0; i < A.d.length; i += 4) { if (A.d[i] === B.d[i] && A.d[i + 1] === B.d[i + 1] && A.d[i + 2] === B.d[i + 2] && A.d[i + 3] === B.d[i + 3]) continue;
              n++; const yy = Math.floor(i / 4 / 200); if (yy > lim) low++; }
            const where = id + (walking ? ' from behind' : ' at ' + pose);
            o.adds[where] = n;
            if (!walking && n < 8) f(where + ': his piece adds only ' + n + ' pixels');
            if (low) f(where + ': ' + low + ' pixels of his piece below his shoulders');
            if (walking && (id === 'glitch' || id === 'disco') && n) f(where + ': his shades are drawn from behind (' + n + ' pixels)');
          }
        }
      } finally {
        Object.assign(LEGEND_WEAR, keepW);
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['pixels each piece adds: ' + Object.entries(r.adds).map(([k, v]) => k + ' ' + v).join(', ')];
  }
};
