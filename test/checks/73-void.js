/* The Void (the user sent a picture of a dark cosmic sorcerer, "extremely
 * detailed, full body", in place of the Spirit Blossom, which was "just a
 * shirt basically"): the skin, its caddie, driver, trail and ball, Mythic.
 *
 *   - all of him changed, not just his shirt: a hood over his cap with its
 *     peak standing above it, the gold mask of his face with a violet eye,
 *     a black hole on his chest ringed in gold, a gold crescent off his
 *     shoulder, gold at his knees, a cloak of stars from his shoulders to
 *     his heels behind him (down his back, walking away)
 *   - two ghostly hands of cyan light behind him side on, one either side
 *     of him walking away
 *   - all of it close about him: nothing more than two of his widths out
 *     or far over his head, idle, swinging or walking
 *   - its moment on a great hole makes no sound (the user wants no more)
 *   - a save that had bought the Spirit Blossom now has the same pieces of
 *     The Void, and what was worn is worn
 */
'use strict';
module.exports = {
  name: 'void',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = true;
        const set = [B.OUTFITS.find(x => x.id === 'cosmic'), B.CADDIES.find(x => x.id === 'cosmic'), B.CLUBS.find(x => x.id === 'cosmic'),
                     B.TRAILS.find(x => x.id === 'horizon'), B.TRAILS.find(x => x.id === 'singularity')];
        o.set = set.map(x => x ? x.n : 'missing').join(', ');
        if (set.some(x => !x || x.top !== 2) || set[0].n !== 'The Void') f('the set is not all there and Mythic: ' + o.set);
        if (B.OUTFITS.some(x => x.id === 'blossom') || B.TRAILS.some(x => /petal|blossom/.test(x.id))) f('the Spirit Blossom is still in the shop');
        if (STYLEFX.cosmic.wings) f('The Void has wings');
        S.styleOwn['o:cosmic'] = 1; S.outfit = 'cosmic'; buildSprites();
        const H = 58, CW = 240, CH = 170, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
        const c = cv.getContext('2d');
        const draw = (ph, walking, t, fx) => {
          c.clearRect(0, 0, CW, CH);
          const spr = walking ? SPRITE.gBack : ph > 0.6 ? SPRITE.gFinish : SPRITE.gAddr, w = Math.round(H * spr.w / spr.h);
          const bot = 140, x = Math.round(CW / 2 - w * 0.42), y = bot - H, keep = STYLEFX.cosmic;
          if (!fx) STYLEFX.cosmic = undefined;
          try { paintGolfer(c, x, y, w, H, ph, t, bot, walking, 0.2, spr, [], undefined, false, 0); } finally { STYLEFX.cosmic = keep; }
          const g = golferG(x, y, w, H, ph, t, bot, walking, spr);
          return { d: c.getImageData(0, 0, CW, CH).data, x, y, w, bot, g };
        };
        const col = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        // every pixel of him as drawn: [x, y, colour]
        const all = a => { const out = []; for (let i = 0; i < a.d.length; i += 4) if (a.d[i + 3] > 200) out.push([(i >> 2) % CW, (i >> 2) / CW | 0, col(a.d, i)]); return out; };
        const has = (px, cols, test) => px.filter(([x, y, k]) => cols.includes(k) && test(x, y)).length;
        const side = draw(0, false, 50, true), P = all(side), G = side.g, hd = G.head;
        const HOOD = ['#1C1640', '#0B0818', '#2A2158', '#D8B060', '#7A4ED8', '#9A7432', '#F4DC96'];
        o.peak = has(P, HOOD, (x, y) => y < hd.y - 2 && Math.abs(x - hd.x) < hd.w * 1.2);
        if (!(o.peak >= 6)) f('no hood standing over his cap: ' + o.peak + ' pixels above it');
        o.mask = has(P, ['#C9A45C', '#8A6A30'], (x, y) => y > hd.y && y < hd.y + H * 0.2);
        const E = eyeAt(G); o.eye = has(P, ['#B98CFF', '#FFFFFF'], (x, y) => Math.abs(x - E.x) <= 2 && Math.abs(y - E.y) <= 1);
        if (!(o.mask >= 6) || !(o.eye >= 2)) f('the gold mask ' + o.mask + ' pixels, the violet eye ' + o.eye);
        const C = STYLEFX.cosmic.coreAt(G);
        o.orb = [has(P, ['#05030C'], (x, y) => Math.abs(x - C.x) <= 2 && Math.abs(y - C.y) <= 2), has(P, ['#D8B060', '#9A7432'], (x, y) => Math.abs(x - C.x) <= 4 && Math.abs(y - C.y) <= 4)];
        if (!(o.orb[0] >= 3) || !(o.orb[1] >= 4)) f('the black hole on his chest: dark ' + o.orb[0] + ', gold ring ' + o.orb[1]);
        o.crescent = has(P, ['#D8B060', '#9A7432', '#F4DC96'], (x, y) => y < G.y + H * 0.28 && x < hd.x - hd.w * 0.6);
        if (!(o.crescent >= 8)) f('the crescent off his shoulder: ' + o.crescent + ' pixels of gold behind his head');
        // (in his own picture: the gold bands of his greaves at the knee)
        { const sp = SPRITE.gAddr, d = sp.cv.getContext('2d').getImageData(0, 0, sp.w, sp.h).data; o.knee = 0;
          for (let y = 40; y < 46; y++) for (let x = 0; x < sp.w; x++) { const q = (y * sp.w + x) * 4; if (d[q + 3] && ['#D8B060', '#9A7432'].includes(col(d, q))) o.knee++; } }
        if (!(o.knee >= 3)) f('gold at his knees: ' + o.knee);
        const STARS = ['#FFFFFF', '#B98CFF', '#7FE6FF'], CLOAK = ['#0B0818', '#141030', '#1C1640', '#2A3A8A', '#6A2A7A', '#3E2A6E'];
        // (above the galaxy on the grass, which has colours of its own)
        const low = (x, y) => x < G.x + G.w * 0.25 && y > G.y + H * 0.5 && y < G.bot - H * 0.14;
        o.cloak = has(P, CLOAK, low);
        o.cloakStars = has(P, STARS, low);
        if (!(o.cloak >= 60) || !(o.cloakStars >= 2)) f('the cloak of stars behind him to his heels: ' + o.cloak + ' pixels low down, ' + o.cloakStars + ' stars');
        const CYAN = ['#7FE6FF', '#3FA6D8', '#D8FAFF'];
        o.hands = has(P, CYAN, (x) => x < G.x + G.w * 0.2);
        if (!(o.hands >= 40)) f('the ghostly hands behind him: ' + o.hands + ' pixels');
        const back = draw(0, true, 50, true), PB = all(back), GB = back.g;
        o.backCloak = has(PB, CLOAK.concat(STARS, ['#D8B060', '#9A7432']), (x, y) => x > GB.x + GB.w * 0.3 && x < GB.x + GB.w * 0.7 && y > GB.y + H * 0.3 && y < GB.y + H * 0.8);
        const area = (GB.w * 0.4) * (H * 0.5);
        o.backHands = [has(PB, CYAN, x => x < GB.x), has(PB, CYAN, x => x > GB.x + GB.w)];
        if (!(o.backCloak > area * 0.8)) f('walking away, the cloak down his back: ' + o.backCloak + ' of ' + Math.round(area) + ' pixels');
        if (!(o.backHands[0] >= 25 && o.backHands[1] >= 25)) f('walking away, a hand either side of him: ' + o.backHands);
        // ---- close about him ----
        o.far = 0; o.frames = 0;
        for (const [ph, walking] of [[0, false], [0.36, false], [0.62, false], [0.85, false], [0, true]]) for (let k = 0; k < 8; k++) {
          const A = draw(ph, walking, 40 + k * 0.37, true), g = A.g, cx = g.x + g.w * 0.5;
          const off = all(A).filter(([x, y]) => Math.abs(x - cx) > g.w * 2 || y < g.y - H * 0.3);
          // (the club itself goes where it goes)
          const B0 = draw(ph, walking, 40 + k * 0.37, false), plain = new Set(all(B0).map(([x, y]) => x + ',' + y));
          o.far += off.filter(([x, y]) => !plain.has(x + ',' + y)).length; o.frames++;
        }
        if (o.far) f(o.far + ' pixels of the skin drawn far from him across ' + o.frames + ' frames');
        // ---- no sound on its moment ----
        const played = [], keep = Sfx.play; Sfx.play = function (k) { played.push(k); };
        try { QUIET = false; Scene.legend = null; Scene.happyDance(-4); QUIET = true; } finally { Sfx.play = keep; }
        o.legend = !!Scene.legend; o.sounds = played.filter(k => /hellfire|ascend|choir|flourish|legend/.test(k)).join(' ');
        if (!o.legend || o.sounds) f('its moment on an ace: ' + (o.legend ? 'shown' : 'not shown') + ', sounds "' + o.sounds + '"');
        Scene.legend = null;
        // ---- a save with the Spirit Blossom ----
        const saved = JSON.parse(SNAP);
        Object.assign(saved.styleOwn = saved.styleOwn || {}, { 'o:blossom': 1, 'c:blossom': 1, 'k:blossom': 1, 't:petalwake': 1, 't:blossombud': 1 });
        saved.outfit = 'blossom'; saved.caddie = 'blossom'; saved.club = 'blossom'; saved.trail = 'blossombud';
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, saved); initState();
        o.moved = [S.outfit, S.caddie, S.club, S.trail, ['o:cosmic', 'c:cosmic', 'k:cosmic', 't:horizon', 't:singularity'].every(k => S.styleOwn[k]), Object.keys(S.styleOwn).some(k => /blossom|petal/.test(k))].join('/');
        if (o.moved !== 'cosmic/cosmic/cosmic/singularity/true/false') f('a save with the Spirit Blossom became ' + o.moved);
      } finally {
        QUIET = false; Scene.legend = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the set, all Mythic: ' + r.set + '; a save with the Spirit Blossom now wears The Void',
      'all of him: a hood peaked over his cap (' + r.peak + 'px), a gold mask (' + r.mask + ') with a violet eye, a black hole on his chest (' + r.orb.join('/') + '), a crescent off his shoulder (' + r.crescent + '), gold at the knee, a cloak of stars to his heels (' + r.cloak + ', ' + r.cloakStars + ' stars)',
      'ghostly hands behind him (' + r.hands + 'px) and either side walking away (' + r.backHands.join('/') + '), the cloak down his back; nothing far from him across ' + r.frames + ' frames; no sound on its moment'];
  }
};
