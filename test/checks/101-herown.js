/* The female golfer's own caddie lines and poses (the user asked for "her
 * own caddie lines and a few poses that are hers alone"):
 *
 *   - with her chosen, the caddie says her lines (SAY_HER) on a hole and in
 *     his tips, mixed with the usual ones; with him chosen, never
 *   - as the ball drops she takes a pose of her own: a birdie or eagle the
 *     twirl, an albatross or ace the club held up high, a bogey or worse a
 *     lean on the club with a hand on her hip; a par none; him never (but
 *     for his own on an ace: acecheer); none
 *     in a catch-up or a wager; gone on the next hole
 *   - each pose draws her differently from her standing plain, and puts
 *     nothing below her feet or more than her height above her head
 *   - her figure (the user: "the only difference I see is long hair"): a
 *     skirt wider than his trousers at the hip, bare legs below it on a
 *     plain look and leggings on a skin (the Divine still shows no skin),
 *     a slimmer build than his, and the long cloaks (The Void, The Dread,
 *     the Ascended) drawn in at her waist from behind
 *   - every Legendary and Mythic skin goes on her legs too (the user asked):
 *     her legs in his trousers' colours and pattern, no bare skin
 */
'use strict';
module.exports = {
  name: 'herown',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const rnd = Math.random;
      try {
        hideSheet(); QUIET = false; OFFLINE = false;
        const HER = new Set(Object.values(SAY_HER).flat()), MINE = new Set(Object.values(B.FAIRY_SAY).flat());
        const said = (g) => { S.gender = g; let her = 0, n = 0;
          for (let i = 0; i < 300; i++) { Scene.fairySay = null; Scene.holed(scoreFor([0.2, 0.5, 0.75, 1.3, 2][i % 5]));
            if (Scene.fairySay) { n++; if (HER.has(Scene.fairySay.word) && !MINE.has(Scene.fairySay.word)) her++; } }
          let q = 0; for (let i = 0; i < 200; i++) if (HER.has(Scene.quipLine())) q++;
          return { her, n, q }; };
        const sf = said('f'), sm = said('m');
        o.lines = 'her lines ' + sf.her + ' of ' + sf.n + ', tips ' + sf.q + ' of 200';
        if (sf.her < sf.n * 0.35 || sf.her > sf.n * 0.85) f('with her chosen her lines came ' + sf.her + ' of ' + sf.n);
        if (sf.q < 20) f('her tips came ' + sf.q + ' of 200');
        if (sm.her || sm.q) f('with him chosen her lines came ' + sm.her + ', tips ' + sm.q);
        // poses by the score
        const poseFor = (g, ratio) => { S.gender = g; Scene.herPose = null; Scene.holed(scoreFor(ratio)); return Scene.herPose && Scene.herPose.kind; };
        const want = [[0.2, 'aloft'], [0.45, 'twirl'], [0.75, 'twirl'], [1.0, null], [1.4, 'hip'], [2.2, 'hip']];
        o.by = [];
        for (const [ratio, k] of want) { const d = scoreFor(ratio).d, got = poseFor('f', ratio); o.by.push(d + ':' + got);
          if (k !== (herPoseOf(d))) {} if (got !== herPoseOf(d)) f('score ' + d + ' gave her ' + got);
          if (poseFor('m', ratio)) f('he took a pose on ' + d); }
        if (!o.by.some(x => x.endsWith('aloft')) || !o.by.some(x => x.endsWith('twirl')) || !o.by.some(x => x.endsWith('hip'))) f('not every pose came up: ' + o.by.join(' '));
        S.gender = 'f'; QUIET = true; Scene.herPose = null; Scene.holed(scoreFor(0.3)); if (Scene.herPose) f('a pose in a catch-up'); QUIET = false;
        S.gender = 'f'; Scene.holed(scoreFor(0.3)); startHole(); if (Scene.herPose) f('her pose carried into the next hole');
        // each pose drawn: differs from her standing, and stays near her
        for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites();
        const h = 60, spr = SPRITE.gFinish, w = Math.round(h * spr.w / spr.h), W = 200, H = 220, X = 70, Y = 120;
        const draw = (P) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
          HER_POSE = P; try { paintGolfer(c, X, Y, w, h, 0, 1, Y + h, false, 0, spr, [], undefined, true, 0); } finally { HER_POSE = null; }
          return c.getImageData(0, 0, W, H).data; };
        const plain = draw(null);
        for (const kind of ['twirl', 'aloft', 'hip']) for (const t of [0.05, 0.2, 0.6]) {
          const d = draw({ kind, t }); let diff = 0, below = 0, above = 0;
          for (let i = 0; i < d.length; i += 4) { const y = (i >> 2) / W | 0;
            if (d[i + 3] !== plain[i + 3] || d[i] !== plain[i]) diff++;
            if (d[i + 3] && y > Y + h + 1) below++;
            if (d[i + 3] && y < Y - h) above++; }
          if (diff < 25) f(kind + ' at ' + t + 's draws only ' + diff + ' pixels unlike her standing');
          if (below || above) f(kind + ' at ' + t + 's: ' + below + ' pixels below her feet, ' + above + ' far over her head');
        }
        // her figure
        const KEEP = { o: S.outfit, own: S.styleOwn };
        const sk = PX.skin.toLowerCase(), hex = d => '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        const legsSkin = spr => { const d = spr.cv.getContext('2d').getImageData(0, 0, spr.w, spr.h).data; let n = 0;
          for (let y = 36; y < spr.h; y++) for (let x = 0; x < spr.w; x++) { const i = (y * spr.w + x) * 4; if (d[i + 3] && hex([d[i], d[i + 1], d[i + 2]]) === sk) n++; } return n; };
        const rowW = (spr, y) => { const d = spr.cv.getContext('2d').getImageData(0, y, spr.w, 1).data; let a = -1, b = -1; for (let x = 0; x < spr.w; x++) if (d[x * 4 + 3]) { if (a < 0) a = x; b = x; } return b - a + 1; };
        S.outfit = 'classic';
        S.gender = 'm'; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); const mLeg = legsSkin(SPRITE.gAddr), mHip = rowW(SPRITE.gAddr, 31), mBulk = bulkOf(60, false);
        S.gender = 'f'; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); const fLeg = legsSkin(SPRITE.gAddr), fHip = rowW(SPRITE.gAddr, 31), fBulk = bulkOf(60, false);
        o.fig = 'bare leg pixels his ' + mLeg + ' hers ' + fLeg + '; at the hip his ' + mHip + ' hers ' + fHip + '; built out at the chest his ' + mBulk.chest + ' hers ' + fBulk.chest;
        if (fLeg < 40 || mLeg) f('her bare legs: ' + o.fig);
        if (fHip <= mHip) f('her skirt no wider than his trousers: ' + o.fig);
        if (!(fBulk.chest < mBulk.chest) || fBulk.legs >= mBulk.legs) f('her build no slimmer than his: ' + o.fig);
        S.styleOwn = Object.assign({}, S.styleOwn, { 'o:divine': 1 }); S.outfit = 'divine'; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites();
        const dSkin = ['gAddr', 'gFinish', 'gBack'].map(k => legsSkin(SPRITE[k]));
        if (dSkin.some(n => n)) f('the Divine shows skin on her legs: ' + dSkin.join('/'));
        // every Legendary and Mythic skin on her legs too (the user asked):
        // her legs in the colours of his trousers, pattern and all, no skin
        const legCols = spr => { const d = spr.cv.getContext('2d').getImageData(0, 0, spr.w, spr.h).data, m = new Map();
          for (let y = 38; y < 54; y++) for (let x = 0; x < spr.w; x++) { const i = (y * spr.w + x) * 4; if (d[i + 3]) { const k = hex([d[i], d[i + 1], d[i + 2]]); m.set(k, (m.get(k) || 0) + 1); } } return m; };
        o.skinLegs = [];
        for (const fit of B.OUTFITS.filter(q => q.cat === 'skin')) {
          S.styleOwn = Object.assign({}, S.styleOwn, { ['o:' + fit.id]: 1 }); S.outfit = fit.id;
          S.gender = 'm'; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); const his = legCols(SPRITE.gAddr);
          S.gender = 'f'; for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); const hers = legCols(SPRITE.gAddr);
          let all = 0, like = 0; for (const [k, n] of hers) { all += n; if (his.has(k)) like += n; }
          const bare = legsSkin(SPRITE.gAddr) + legsSkin(SPRITE.gFinish) + legsSkin(SPRITE.gBack);
          o.skinLegs.push(fit.n + ' ' + like + '/' + all);
          if (all < 20 || like < all * 0.9 || bare) f(fit.n + ': her legs ' + like + ' of ' + all + ' pixels in his trousers\' colours, ' + bare + ' bare');
          if (fit.pantPattern && his.size > 2 && [...hers.keys()].filter(k => his.has(k)).length < 3) f(fit.n + ': her legs miss the trousers\' pattern (' + hers.size + ' colours)');
        }
        // the cloaks from behind, at her waist and at his
        const waist = (fn, sex) => { S.gender = sex; const C = fn(40, 58, 2, 0), cv = C.cv || C, d = cv.getContext('2d').getImageData(0, Math.round(58 * 0.45), cv.width, 1).data; let n = 0; for (let x = 0; x < cv.width; x++) if (d[x * 4 + 3] > 128) n++; return n; };
        o.cloaks = [];
        for (const [nm, fn] of [['Void', voidCloak], ['Dread', dreadCloak], ['Ascended', galaxyCape]]) { const m = waist(fn, 'm'), w2 = waist(fn, 'f'); o.cloaks.push(nm + ' ' + m + '/' + w2);
          if (w2 >= m) f('the ' + nm + ' cloak is no narrower at her waist: his ' + m + ', hers ' + w2); }
        S.outfit = KEEP.o; S.styleOwn = KEEP.own;
      } finally {
        Math.random = rnd; HER_POSE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return [r.lines + '; with him none', 'poses by score: ' + r.by.join(' ') + '; none for him, in a catch-up, or on the next hole',
      'each pose draws her anew and stays about her', r.fig + '; cloaks at the waist (his/hers) ' + r.cloaks.join(', '),
      'skins on her legs (pixels in his trousers\' colours): ' + r.skinLegs.join(', ')];
  }
};
