/* The Penitent (the user's own sprite sheet, "The Penitent Choir"), a
 * Mythic skin sold on the Skins rack:
 *
 *   - a Mythic look at 3,500 sovereigns, bought and worn like the others;
 *     on the Skins rack once, never a set piece
 *   - drawn alone at 30, 48 and 60 in every pose, his and hers: the gold
 *     of his halo over his head, the black of his face under his veil side
 *     on (none from behind), his crimson stole, the dais under him and a
 *     candle's flame; her picture her own, not his */
'use strict';
module.exports = {
  name: 'penitent',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 14) fails.push(m); }, o = { rows: [] }, SNAP = JSON.stringify(S), tw = window.toast;
      window.toast = () => {}; QUIET = true;
      try {
        hideSheet();
        const O = styleDef('o', 'penitent');
        if (!O) { f('no Penitent'); return { fails, o }; }
        if (O.top !== 2 || O.cost !== 3500 || O.passSet || O.usd) f('not a Mythic at 3,500 sovereigns: ' + JSON.stringify({ top: O.top, cost: O.cost }));
        S.styleOwn = {}; S.sov = 5000; styleBuy('o', 'penitent');
        if (!styleOwned('o', 'penitent') || S.sov !== 1500) f('bought for ' + (5000 - S.sov));
        shopSub = 'style'; styleCat = 'golfer'; QUIET = false; renderShop(); QUIET = true;
        const html = document.getElementById('sheet').innerHTML, n = html.split('The Penitent').length - 1;
        if (n !== 1) f('on the Skins rack ' + n + ' times');
        hideSheet();
        S.outfit = 'penitent'; Scene.night = false; Scene.legend = null;
        const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
        const cnt = (d, W, h, test) => { const [R, G, B0] = hex(h); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] === R && d[i + 1] === G && d[i + 2] === B0 && (!test || test((i >> 2) % W, (i >> 2) / W | 0))) n++; return n; };
        const poses = [['addr', 0, false, 'gAddr'], ['top', 0.45, false, 'gAddr'], ['fin', 0.92, false, 'gFinish'], ['walk', 0, true, 'gBack']];
        const HIS = {};
        for (const gnd of ['m', 'f']) { S.gender = gnd; buildSprites();
          for (const hgt of [30, 48, 60]) for (const [n0, ph, walking, sp] of poses) { const nm = hgt + (gnd === 'f' ? ' her ' : ' ') + n0;
            const spr = SPRITE[sp], w = Math.max(4, Math.round(hgt * spr.w / spr.h)), W = hgt * 4, H = hgt * 2, top = H - 10 - hgt;
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
            paintGolfer(c, Math.round(W / 2 - w / 2), top, w, hgt, ph, 1.3, H - 10, walking, walking ? 0.3 : 0, spr, [], undefined, false);
            const d = c.getImageData(0, 0, W, H).data;
            const hd = (x, y) => y < top + hgt * 0.12, gold = ['#D8A848', '#F4D27A', '#A8782E', '#6E4E1E'].reduce((t, h) => t + cnt(d, W, h, hd), 0);
            const face = cnt(d, W, '#0A0608', (x, y) => y < top + hgt * 0.3), stole = cnt(d, W, '#7A1828'), dais = cnt(d, W, '#4E0E18', (x, y) => y > H - 10 - hgt * 0.2);
            const flame = cnt(d, W, '#FF9A2A') + cnt(d, W, '#FFF2C0');
            o.rows.push(nm + ':' + gold + '/' + face + '/' + stole + '/' + dais + '/' + flame);
            if (gold < hgt * 0.4) f(nm + ': ' + gold + ' gold pixels of his halo over his head');
            if (walking ? face > 0 : face < Math.max(2, hgt * hgt / 600)) f(nm + ': ' + face + ' pixels of his face');
            if (stole < hgt * 0.8) f(nm + ': ' + stole + ' crimson pixels');
            if (dais < hgt * 1.5) f(nm + ': no dais under him (' + dais + ')');
            if (flame < 4) f(nm + ': ' + flame + ' pixels of flame');
            if (hgt === 60) { if (gnd === 'm') HIS[n0] = d; else { let df = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] !== HIS[n0][i + 3] || d[i] !== HIS[n0][i]) df++; if (df < 25) f('her ' + n0 + ' is his picture (' + df + ' pixels differ)'); } }
          } }
      } finally { window.toast = tw; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); hideSheet(); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the Penitent: a Mythic at 3,500, once on the Skins rack; drawn his and hers in every pose at 30, 48 and 60 (halo/face/crimson/dais/flame ' + r.o.rows.join(' ') + ')'];
  }
};
