/* The Cyber-Drive (the user's character sheet, the Tour Pass's skin):
 *
 *   - never sold: none of its five pieces owned or bought for sovereigns, the
 *     set not worn or bought from the Sets rack; on the Tour Pass shelves,
 *     not the Skins, Clubs, Balls or Ball Trails
 *   - the paid row's last tier gives all five; then worn whole it is a full
 *     set; once he has it that tier pays sovereigns instead; the month's
 *     own look comes at tier 20
 *   - drawn alone at 30, 60 and 90 in every pose: the purple visor side on
 *     (none from behind), lime on him, his pack's vents, the pad under him;
 *     its wake and core in every table a ball look is drawn from, and each
 *     draws something */
'use strict';
module.exports = {
  name: 'cyber',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 14) fails.push(m); }, o = { rows: [] }, SNAP = JSON.stringify(S), tw = window.toast;
      window.toast = () => {}; QUIET = true;
      try {
        hideSheet();
        const pcs = setPieces('cyber');
        if (pcs.length !== 5) f('the set has ' + pcs.length + ' pieces');
        S.styleOwn = {}; S.sov = 99999;
        for (const [k, id] of pcs) { if (!styleDef(k, id)) { f('no ' + k + ':' + id); continue; } if (styleOwned(k, id)) f(id + ' owned free'); styleBuy(k, id); if (styleOwned(k, id) || S.sov !== 99999) f(k + ':' + id + ' bought'); }
        setBuy('cyber'); if (S.outfit === 'cyber' || setOwned('cyber') || S.sov !== 99999) f('the set bought or worn from the Sets rack');
        if (SET_ORDER.includes('cyber')) f('the pass set among the six sold');
        // the shelves
        shopSub = 'style'; for (const [cat, sel] of [['golfer', 'Skins'], ['caddie', 'Caddie Skins'], ['clubs', 'Clubs'], ['balls', 'Balls']]) {
          styleCat = cat; QUIET = false; renderShop(); QUIET = true; const html = document.getElementById('sheet').innerHTML, i = html.indexOf('Tour Pass'), j = html.indexOf('>' + sel + '<');
          if (i < 0 || html.indexOf('Cyber', i) < 0) f('no Cyber-Drive on a Tour Pass shelf on ' + cat);
          if (j >= 0 && html.slice(j, j + 4000).slice(1).split('srib')[0].includes('Cyber')) f('the Cyber-Drive on the ' + sel + ' shelf'); }
        hideSheet();
        // the pass
        delete S.pass; const P = passNow(); P.paid = 1; P.pts = PASS.TIERS * PASS.PER;
        const mo = passMonth();
        if (passReward('p', PASS.TIERS).k !== 'cyber') f('the last tier is not the Cyber-Drive');
        if (!(passReward('p', 20).k === 'look' && passReward('p', 20).v === mo)) f('tier 20 not the month\'s look');
        for (let t = 1; t <= PASS.TIERS; t++) passGive('p', t, true);
        if (!setOwned('cyber')) f('the last tier did not give all five'); if (!styleOwned('o', 'pass' + mo)) f('the month\'s look not given');
        setBuy('cyber'); if (fullSet() !== 'cyber') f('worn whole, not a full set (' + fullSet() + ')');
        delete S.pass; const P2 = passNow(); P2.paid = 1; P2.pts = PASS.TIERS * PASS.PER; const s0 = S.sov;
        const rr = passReward('p', PASS.TIERS); passGive('p', PASS.TIERS, true);
        if (rr.k !== 'sov' || S.sov - s0 !== PASS.CYBER_SOV) f('owned already, the last tier paid ' + (S.sov - s0) + ' (' + rr.k + ')');
        // drawn: alone, every pose, three sizes
        S.outfit = 'cyber'; S.club = 'cyber'; buildSprites(); Scene.night = false;
        const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
        const cnt = (d, h) => { const [R, G, B0] = hex(h); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] === R && d[i + 1] === G && d[i + 2] === B0) n++; return n; };
        const poses = [['addr', 0, false, 'gAddr'], ['top', 0.45, false, 'gAddr'], ['fin', 0.92, false, 'gFinish'], ['walk', 0, true, 'gBack']];
        for (const hgt of [30, 60, 90]) for (const [n, ph, walking, sp] of poses) {
          const spr = SPRITE[sp], w = Math.max(4, Math.round(hgt * spr.w / spr.h)), W = hgt * 4, H = hgt * 2;
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
          paintGolfer(c, Math.round(W / 2 - w / 2), H - 10 - hgt, w, hgt, ph, 1.3, H - 10, walking, walking ? 0.3 : 0, spr, [], undefined, false);
          const d = c.getImageData(0, 0, W, H).data, vis = cnt(d, '#7A3CFF') + cnt(d, '#3A1A80'), lime = cnt(d, '#C8F23A'), pad = cnt(d, '#141826');
          o.rows.push(hgt + n + ':' + vis + '/' + lime);
          if (walking ? vis > 0 : vis < Math.max(2, hgt * hgt / 900)) f(hgt + ' ' + n + ': ' + vis + ' visor pixels');
          if (lime < hgt) f(hgt + ' ' + n + ': only ' + lime + ' lime pixels');
          if (pad < hgt * 2) f(hgt + ' ' + n + ': no pad under him (' + pad + ')');
          if (hgt >= 60 && cnt(d, '#262D45') < hgt * 0.8) f(hgt + ' ' + n + ': no pack');
        }
        // the wake and the core in every table
        for (const fx of ['tCyber', 'cyberball']) {
          for (const [nm, T] of [['flight', BALLFX], ['lying', LB_ORBIT], ['ace colours', ACE_COL], ['ace', ACE_EXTRA], ['cup', CUP_FX], ['cup flash', CUP_FX2]]) if (!T[fx]) f(fx + ' missing from ' + nm);
          const cv = document.createElement('canvas'); cv.width = 120; cv.height = 120; const c = cv.getContext('2d');
          const path = Array.from({ length: 14 }, (_, i) => ({ x: 60 - i * 3, y: 60 + i * 2 }));
          if (!BALLFX[fx] || !CUP_FX[fx]) continue;
          BALLFX[fx](c, { seed: 0.3 }, path, 2, 1.2, 0.5); const a = c.getImageData(0, 0, 120, 120).data; let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 200) n++;
          if (n < 30) f(fx + ' in flight drew ' + n + ' pixels');
          c.clearRect(0, 0, 120, 120); CUP_FX[fx](c, 60, 80, 3, 40, 0.5, 1); const b = c.getImageData(0, 0, 120, 120).data; let m = 0; for (let i = 3; i < b.length; i += 4) if (b[i] > 200) m++;
          if (m < 30) f(fx + ' at the cup drew ' + m + ' pixels');
        }
      } finally { window.toast = tw; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); hideSheet(); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the Cyber-Drive: never sold, on the Tour Pass shelves, all five at the paid row\'s top and then sovereigns, a full set worn whole; drawn in every pose (visor/lime ' + r.o.rows.join(' ') + '); its wake and core in every table'];
  }
};
