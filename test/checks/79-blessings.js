/* The caddie's blessing in the look of the caddie who gives it (the user
 * asked: "the caddie buff visual effect should match the skin that the
 * caddie is wearing"):
 *
 *   - every caddie look with an effect of its own has a blessing of its own:
 *     its colours in the column, and what it drops or raises in it; no two
 *     alike, and each unlike the plain one
 *   - a plain caddie's keeps the colour of the perk it gives
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
        const looks = B.CADDIES.filter(x => x.fx).map(x => x.id);
        const plain = shoot('bib');
        o.plainPerk = plain.cols.get(PERK) || 0;
        if (!(o.plainPerk > 50)) f('a plain caddie\'s blessing shows ' + o.plainPerk + ' pixels of its perk\'s colour');
        const sig = {}; o.rows = [];
        for (const id of [ 'bib'].concat(looks)) {
          const R = id === 'bib' ? plain : shoot(id), fx = (B.CADDIES.find(x => x.id === id) || {}).fx, TH = BLESS_FX[fx];
          if (R.soft) f('the ' + id + ' blessing has ' + R.soft + ' see-through pixels');
          if (R.wide) f('the ' + id + ' blessing reaches ' + R.wide + ' pixels beyond twice his width');
          if (R.after) f('the ' + id + ' blessing is still there after its time');
          if (id === 'bib') continue;
          if (!TH) { f(id + ' has no blessing of its own'); continue; }
          const own = R.cols.get(TH.col.toUpperCase()) || 0, perk = R.cols.get(PERK) || 0;
          if (!(own > 40 || TH.rainbow) || perk) f('the ' + id + ' blessing: ' + own + ' pixels of its own colour, ' + perk + ' of the perk\'s');
          // its signature: its five commonest colours
          sig[id] = [...R.cols.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]).sort().join(',');
          o.rows.push(id + ' ' + own);
        }
        const seen = {};
        for (const id in sig) { if (seen[sig[id]]) f('the ' + id + ' and ' + seen[sig[id]] + ' blessings look alike'); seen[sig[id]] = id; }
        o.n = Object.keys(sig).length;
      } finally {
        QUIET = false; Scene.bless = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['a blessing of its own for each of the ' + r.n + ' caddie looks with an effect, none alike (' + r.rows.join(', ') + ' pixels of its own colour); the plain caddie\'s in its perk\'s colour (' + r.plainPerk + ')',
      'all in solid pixels, within twice his width, gone after its time'];
  }
};
