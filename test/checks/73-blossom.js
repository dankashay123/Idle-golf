/* The Spirit Blossom set (the user asked for a new Mythic set, "immaculate",
 * no wings): the skin, its caddie, driver, wake and ball, all Mythic.
 *
 *   - a haori off his shoulders: side on it streams out behind him, its rose
 *     hem trimmed in gold; walking away it hangs down his back with a
 *     blossom crest between his shoulders
 *   - blossoms pinned in his hair on a gold pin, at his head
 *   - no wings, and all of it close about him: nothing drawn more than two
 *     of his widths to either side or over his head, idle or swinging
 *     (a first draft scattered petals and a ribbon like a wire)
 *   - its moment on a great hole makes no sound (the user wants no more)
 */
'use strict';
module.exports = {
  name: 'blossom',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = true;
        const set = [B.OUTFITS.find(x => x.id === 'blossom'), B.CADDIES.find(x => x.id === 'blossom'), B.CLUBS.find(x => x.id === 'blossom'),
                     B.TRAILS.find(x => x.id === 'petalwake'), B.TRAILS.find(x => x.id === 'blossombud')];
        o.set = set.map(x => x ? x.n + ' ' + x.top : 'missing').join(', ');
        if (set.some(x => !x || x.top !== 2)) f('the set is not all there and Mythic: ' + o.set);
        const FX = STYLEFX.blossom;
        if (FX.wings) f('the Spirit Blossom has wings');
        S.styleOwn['o:blossom'] = 1; S.outfit = 'blossom'; buildSprites();
        const H = 48, CW = 200, CH = 150, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
        const c = cv.getContext('2d');
        // him in a pose, with or without the skin's effect
        const draw = (ph, walking, t, fx) => {
          c.clearRect(0, 0, CW, CH);
          const spr = walking ? SPRITE.gBack : ph > 0.6 ? SPRITE.gFinish : SPRITE.gAddr, w = Math.round(H * spr.w / spr.h);
          const bot = 120, x = Math.round(CW / 2 - w * 0.42), y = bot - H, keep = STYLEFX.blossom;
          if (!fx) STYLEFX.blossom = undefined;
          try { paintGolfer(c, x, y, w, H, ph, t, bot, walking, 0.2, spr, [], undefined, false, 0); } finally { STYLEFX.blossom = keep; }
          return { d: c.getImageData(0, 0, CW, CH).data, x, y, w, bot, head: golferG(x, y, w, H, ph, t, bot, walking, spr).head };
        };
        const col = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        // the pixels the effect adds or changes: [x, y, colour]
        const added = (ph, walking, t) => { const a = draw(ph, walking, t, true), b = draw(ph, walking, t, false), out = [];
          for (let i = 0; i < a.d.length; i += 4) if (a.d[i + 3] && (a.d[i] !== b.d[i] || a.d[i + 1] !== b.d[i + 1] || a.d[i + 2] !== b.d[i + 2] || !b.d[i + 3]))
            out.push([(i >> 2) % CW, (i >> 2) / CW | 0, col(a.d, i)]);
          return { px: out, g: a }; };
        // ---- the haori, side on: rose and gold behind him ----
        const side = added(0, false, 50), g0 = side.g;
        o.hem = side.px.filter(([x, , k]) => (k === '#E07FA6' || k === '#B04A78') && x < g0.x + g0.w * 0.4).length;
        o.trim = side.px.filter(([x, , k]) => k === '#E8C45A' && x < g0.x + g0.w * 0.4).length;
        if (!(o.hem >= 8) || !(o.trim >= 8)) f('side on, the haori behind him: ' + o.hem + ' pixels of its rose hem, ' + o.trim + ' of its gold trim');
        // ---- walking away: down his back, a crest on it ----
        const back = added(0, true, 50), gb = back.g;
        const onBack = back.px.filter(([x, y]) => x >= gb.x && x < gb.x + gb.w && y > gb.y + H * 0.2 && y < gb.y + H * 0.8);
        o.back = onBack.length; o.crest = onBack.filter(([, y, k]) => k === '#E07FA6' && y < gb.y + H * 0.6).length;
        if (!(o.back >= 150) || !(o.crest >= 6)) f('walking away, the haori down his back: ' + o.back + ' pixels, its crest ' + o.crest);
        // ---- the pins in his hair ----
        const hd = g0.head, near = ([x, y]) => x > hd.x - H * 0.15 && x < hd.x + hd.w + 2 && y > hd.y - H * 0.15 && y < hd.y + hd.hh + H * 0.12;
        o.pinGold = side.px.filter(p => near(p) && (p[2] === '#E8C45A' || p[2] === '#B8923A')).length;
        o.pinPink = side.px.filter(p => near(p) && (p[2] === '#F2A7C3' || p[2] === '#FFD6E4')).length;
        if (!(o.pinGold >= 4) || !(o.pinPink >= 6)) f('the blossoms pinned in his hair: gold ' + o.pinGold + ', blush ' + o.pinPink + ' pixels at his head');
        // ---- close about him, idle and through a swing ----
        o.far = 0; o.frames = 0;
        for (const [ph, walking] of [[0, false], [0.36, false], [0.62, false], [0.85, false], [0, true]]) for (let k = 0; k < 8; k++) {
          const A = added(ph, walking, 40 + k * 0.37), G = A.g, cx = G.x + G.w * 0.5;
          o.far += A.px.filter(([x, y]) => Math.abs(x - cx) > G.w * 2 || y < G.y - H * 0.3).length; o.frames++;
        }
        if (o.far) f(o.far + ' pixels of the skin drawn far from him across ' + o.frames + ' frames');
        // ---- no sound on its moment ----
        const played = [], keep = Sfx.play; Sfx.play = function (k) { played.push(k); };
        try { QUIET = false; Scene.legend = null; Scene.happyDance(-4); QUIET = true; } finally { Sfx.play = keep; }
        o.legend = !!Scene.legend; o.sounds = played.filter(k => /hellfire|ascend|choir|flourish|bloom|legend/.test(k)).join(' ');
        if (!o.legend || o.sounds) f('its moment on an ace: ' + (o.legend ? 'shown' : 'not shown') + ', sounds "' + o.sounds + '"');
        Scene.legend = null;
      } finally {
        QUIET = false; Scene.legend = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the set, all Mythic: ' + r.set,
      'a haori streaming behind him (' + r.hem + ' px of rose hem, ' + r.trim + ' of gold trim) and down his back walking away (' + r.back + ' px, a crest of ' + r.crest + '); blossoms on a gold pin in his hair (' + r.pinGold + '/' + r.pinPink + ')',
      'no wings, nothing far from him across ' + r.frames + ' frames, and no sound on its moment'];
  }
};
