/* The caddie's blessing in the look of the caddie who gives it. First the
 * user asked that it "match the skin that the caddie is wearing"; then
 * that it be "unique per skin (only mythic and legendary skins). Make all
 * other skin have a basic, faint light beam":
 *
 *   - the Divine, the Demonic, the Ascended and The Void each give a
 *     blessing of their own: their colours, none alike, each unlike the
 *     plain one; the Demonic's hellfire rises from his feet, not out of
 *     the sky
 *   - every other caddie, plain or with a look of its own, gives the same
 *     plain beam in the perk's colour, and it is faint: under half the
 *     pixels of the least of the four
 *   - all of it in solid pixels (a wash of colour over the grass went grey,
 *     red went khaki), close about him: no wider than twice his width either
 *     side, and gone after its time
 */
'use strict';
module.exports = {
  name: 'blessings',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = true;
        const CW = 90, CH = 110, cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const c = cv.getContext('2d');
        const X = 38, W = 14, BOT = 100, PERK = '#12AB34';
        // everything the blessing draws over three moments, as a set of colours
        const shoot = id => { S.styleOwn['c:' + id] = 1; S.caddie = id;
          const cols = new Map(); let soft = 0, wide = 0;
          for (const q of [0.12, 0.2, 0.35, 0.5, 0.8, 1.2]) {
            c.clearRect(0, 0, CW, CH); Scene.bless = { col: PERK, lv: 1, t0: 10 }; Scene.t = 10 + q; Scene.drawBless(c, X, 60, W, 40, BOT);
            const d = c.getImageData(0, 0, CW, CH).data;
            for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; if (d[i + 3] < 250) soft++;
              const x = (i >> 2) % CW; if (Math.abs(x - (X + W / 2)) > W * 2.2) wide++;
              const k = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); cols.set(k, (cols.get(k) || 0) + 1); }
          }
          c.clearRect(0, 0, CW, CH); Scene.bless = { col: PERK, lv: 1, t0: 10 }; Scene.t = 12; Scene.drawBless(c, X, 60, W, 40, BOT);
          const after = c.getImageData(0, 0, CW, CH).data.some((v, i) => i % 4 === 3 && v) || !!Scene.bless;
          return { cols, soft, wide, after };
        };
        const LEG = ['divine', 'demonic', 'ascended', 'cosmic'];
        const looks = B.CADDIES.filter(x => x.fx).map(x => x.id), legs = looks.filter(id => LEG.includes(B.CADDIES.find(x => x.id === id).fx));
        const plain = shoot('bib'), total = R => [...R.cols.values()].reduce((a, b) => a + b, 0), key = R => [...R.cols.entries()].sort().join(';');
        o.plainPerk = plain.cols.get(PERK) || 0; o.plainN = total(plain);
        if (!(o.plainPerk > 50)) f('a plain caddie\'s blessing shows ' + o.plainPerk + ' pixels of its perk\'s colour');
        if (legs.length !== 4) f('the Legendary and Mythic caddies: ' + legs.join(', '));
        const sig = {}; o.rows = []; o.same = 0;
        for (const id of ['bib'].concat(looks)) {
          const R = id === 'bib' ? plain : shoot(id), fx = (B.CADDIES.find(x => x.id === id) || {}).fx, TH = BLESS_FX[fx];
          if (R.soft) f('the ' + id + ' blessing has ' + R.soft + ' see-through pixels');
          if (R.wide) f('the ' + id + ' blessing reaches ' + R.wide + ' pixels beyond twice his width');
          if (R.after) f('the ' + id + ' blessing is still there after its time');
          if (id === 'bib') continue;
          if (!legs.includes(id)) {
            // the plain beam, pixel for pixel
            if (TH || key(R) !== key(plain)) f('the ' + id + ' caddie\'s blessing is not the plain beam'); else o.same++;
            continue;
          }
          if (!TH) { f(id + ' has no blessing of its own'); continue; }
          const own = R.cols.get(TH.col.toUpperCase()) || 0, perk = R.cols.get(PERK) || 0, n = total(R);
          if (!(own > 40) || perk) f('the ' + id + ' blessing: ' + own + ' pixels of its own colour, ' + perk + ' of the perk\'s');
          if (!(o.plainN * 2 < n)) f('the plain beam is not faint beside the ' + id + '\'s: ' + o.plainN + ' pixels to ' + n);
          // its signature: its five commonest colours
          sig[id] = [...R.cols.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]).sort().join(',');
          o.rows.push(id + ' ' + n);
        }
        const seen = {};
        for (const id in sig) { if (seen[sig[id]]) f('the ' + id + ' and ' + seen[sig[id]] + ' blessings look alike'); seen[sig[id]] = id; }
        o.n = Object.keys(sig).length;
        // the Demonic's fire rising from his feet: early on, none of it high
        { const id = legs.find(id => B.CADDIES.find(x => x.id === id).fx === 'demonic');
          S.styleOwn['c:' + id] = 1; S.caddie = id; c.clearRect(0, 0, CW, CH); Scene.bless = { col: PERK, lv: 1, t0: 10 }; Scene.t = 10.1; Scene.drawBless(c, X, 60, W, 40, BOT);
          const d = c.getImageData(0, 0, CW, CH).data; o.riseLow = 0; o.riseHigh = 0;
          for (let i = 3; i < d.length; i += 4) if (d[i]) { if (((i >> 2) / CW | 0) < BOT * 0.5) o.riseHigh++; else o.riseLow++; }
          if (!(o.riseLow > 30 && !o.riseHigh)) f('the Demonic\'s fire does not rise from his feet: ' + o.riseLow + ' pixels low, ' + o.riseHigh + ' high, a moment in'); }
      } finally {
        QUIET = false; Scene.bless = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['a blessing of its own for each of the ' + r.n + ' Legendary and Mythic caddies, none alike (' + r.rows.join(', ') + ' pixels), the Demonic\'s rising from his feet (' + r.riseLow + 'px low, none high a moment in)',
      'every other caddie (' + r.same + ' looks and the plain one) the same faint beam of the perk\'s colour (' + r.plainN + ' pixels, ' + r.plainPerk + ' of them its colour)',
      'all in solid pixels, within twice his width, gone after its time'];
  }
};
