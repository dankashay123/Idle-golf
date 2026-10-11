/* The Radiant (the user's own picture, "The Radiant"), a Mythic skin sold
 * on the Skins rack, and a set of five:
 *
 *   - a Mythic look at 3,500 sovereigns, bought and worn like the others;
 *     on the Skins rack once
 *   - drawn alone at 30, 48 and 60 in every pose, his and hers: the gold
 *     of his crown over his head, his pale face side on (none from
 *     behind), the eyes of his plumes, the eye in its spiral under him;
 *     her picture her own, not his
 *   - a Mythic set of five: bought whole on Sets and worn whole it is a
 *     full set; his caddie (the cherub) has a blessing and a trick of its
 *     own and wears the Mythic Favour; the Holy Lance draws more than its
 *     colours; the Bloom Wake and the Peacock Eye are in every table a
 *     ball is drawn from, and each draws
 *   - waving to a train his crown is on his head */
'use strict';
module.exports = {
  name: 'radiant',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 14) fails.push(m); }, o = { rows: [] }, SNAP = JSON.stringify(S), tw = window.toast;
      window.toast = () => {}; QUIET = true;
      try {
        hideSheet();
        const O = styleDef('o', 'radiant');
        if (!O) { f('no Radiant'); return { fails, o }; }
        if (O.top !== 2 || O.cost !== 3500 || O.passSet || O.usd) f('not a Mythic at 3,500 sovereigns: ' + JSON.stringify({ top: O.top, cost: O.cost }));
        S.styleOwn = {}; S.sov = 5000; styleBuy('o', 'radiant');
        if (!styleOwned('o', 'radiant') || S.sov !== 1500) f('bought for ' + (5000 - S.sov));
        shopSub = 'style'; styleCat = 'golfer'; QUIET = false; renderShop(); QUIET = true;
        const html = document.getElementById('sheet').innerHTML, n = html.split('The Radiant').length - 1;
        if (n !== 1) f('on the Skins rack ' + n + ' times');
        hideSheet();
        S.outfit = 'radiant'; Scene.night = false; Scene.legend = null;
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
            const hd = (x, y) => y < top + hgt * 0.12, gold = ['#B07C3C', '#D5A354', '#6C574E', '#F5E8BA'].reduce((t, h) => t + cnt(d, W, h, hd), 0);
            const L0 = Math.round(W / 2 - w / 2), face = cnt(d, W, '#F4C2B5', (x, y) => y > top + hgt * 0.02 && y < top + hgt * 0.3 && x >= L0 && x < L0 + w), eyes = cnt(d, W, '#1A1430'), plume = cnt(d, W, '#4EB1BB');
            const sigil = cnt(d, W, '#2A1E48', (x, y) => y > H - 10 - hgt * 0.2) + cnt(d, W, '#3B2C66', (x, y) => y > H - 10 - hgt * 0.2);
            o.rows.push(nm + ':' + gold + '/' + face + '/' + eyes + '/' + plume + '/' + sigil);
            if (gold < hgt * 0.4) f(nm + ': ' + gold + ' gold pixels of his crown over his head');
            if (walking ? face > 2 : face < Math.max(2, hgt * hgt / 600)) f(nm + ': ' + face + ' pixels of his face');
            if (eyes < 4) f(nm + ': ' + eyes + ' pixels of the eyes of his plumes');
            if (plume < hgt * 0.5) f(nm + ': ' + plume + ' teal pixels');
            if (sigil < hgt * 1.5) f(nm + ': no eye in its spiral under him (' + sigil + ')');
            if (hgt === 60) { if (gnd === 'm') HIS[n0] = d; else { let df = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] !== HIS[n0][i + 3] || d[i] !== HIS[n0][i]) df++; if (df < 25) f('her ' + n0 + ' is his picture (' + df + ' pixels differ)'); } }
          } }
        // the set
        const pcs = setPieces('radiant');
        if (pcs.length !== 5) f('the set has ' + pcs.length + ' pieces');
        if (!SET_ORDER.includes('radiant')) f('not among the sets sold');
        S.styleOwn = {}; S.sov = 99999; setBuy('radiant');
        if (fullSet() !== 'radiant') f('bought on Sets, not worn whole (' + fullSet() + ')');
        o.setCost = 99999 - S.sov; hideSheet();
        if (!BLESS_FX.radiant) f('his caddie has no blessing');
        if (!FAIRY_MOVES.some(m => m.only === 'radiant')) f('his caddie has no trick');
        if (!MYTH_CADDIES.includes('radiant')) f('his caddie does not wear the Mythic Favour');
        if (!CLUBFX.radiant) f('the Holy Lance draws nothing of its own');
        for (const fx of ['tBloom', 'peaeye']) {
          for (const [nm, T] of [['flight', BALLFX], ['lying', LB_ORBIT], ['ace colours', ACE_COL], ['ace', ACE_EXTRA], ['cup', CUP_FX], ['cup flash', CUP_FX2]]) if (!T[fx]) f(fx + ' missing from ' + nm);
          if (!BALLFX[fx] || !CUP_FX[fx]) continue;
          const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120; const c = cv.getContext('2d');
          const path = Array.from({ length: 14 }, (_, i) => ({ x: 60 - i * 3, y: 60 + i * 2 }));
          BALLFX[fx](c, { seed: 0.3 }, path, 2, 1.2, 0.5); const a = c.getImageData(0, 0, 120, 120).data; let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 200) n++;
          if (n < 30) f(fx + ' in flight drew ' + n + ' pixels');
          c.clearRect(0, 0, 120, 120); CUP_FX[fx](c, 60, 80, 3, 40, 0.5, 1); const b = c.getImageData(0, 0, 120, 120).data; let m = 0; for (let i = 3; i < b.length; i += 4) if (b[i] > 200) m++;
          if (m < 30) f(fx + ' at the cup drew ' + m + ' pixels');
        }
        // waving to a train: his crown over his head, not off to one side
        { S.outfit = 'radiant'; S.gender = 'm'; buildSprites(); const spr = SPRITE.gWave, hgt = 60, w = Math.round(hgt * spr.w / spr.h), W = 200, H = 120, x0 = 70;
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
          paintGolfer(c, x0, H - 10 - hgt, w, hgt, 0, 1.3, H - 10, true, 0, spr, [], undefined, true, 1);
          const d = c.getImageData(0, 0, W, H).data; let sx = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) { const px = (i >> 2) % W, py = (i >> 2) / W | 0; if (py > H - 10 - hgt * 0.85) continue; if (d[i + 3] > 200 && d[i] === 0xD5 && d[i + 1] === 0xA3 && d[i + 2] === 0x54) { sx += px; n++; } }
          const mid = x0 + w * CAP_BACK.x, at = n ? sx / n : -1; o.wave = n + 'px at ' + (at - mid).toFixed(1);
          if (n < 20 || Math.abs(at - mid) > w * 0.12) f('waving, his crown is ' + (n ? (at - mid).toFixed(1) + 'px from his head' : 'not drawn')); }
      } finally { window.toast = tw; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); hideSheet(); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the Radiant: a Mythic at 3,500, once on the Skins rack; a set of five, ' + r.o.setCost + ' on Sets, worn whole; its caddie\'s blessing, trick and Favour; its wake and ball in every table; waving, his crown on his head (' + r.o.wave + '); drawn his and hers in every pose at 30, 48 and 60 (crown/face/eyes/teal/eye under him ' + r.o.rows.join(' ') + ')'];
  }
};
