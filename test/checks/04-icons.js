/* Every icon id a list asks for exists, and no two things in the game share a
 * drawing. Icons used to be keyed off the stat each thing moved, which meant
 * one golf ball stood for seventeen different things. Adding a new upgrade or
 * trophy without giving it its own icon should fail here, not ship.
 *
 * And the colour reaches the drawing. Icons are rasterised on a canvas, and a
 * canvas cannot read "var(--r4)": handed one it paints black. Every Gold trophy
 * in the room had a black icon for exactly that reason, and the bug is
 * invisible in the source because the string looks like a colour.
 *
 * And every drawing reaches the screen at the size it was drawn. They are all
 * 12x12, so a box of 12, 24, 36 or 48 gives every source pixel the same number
 * of screen pixels and anything else does not: at 13 one column in twelve is
 * doubled, at 46 two are, at 22 two are dropped. Measured across the interface
 * there were seven such sizes in use, and two of them were not even square --
 * the locker's equip button squeezed its sprite to 7.8 wide by 13 tall, because
 * the button is a flex row and the image had nothing holding its width. A 12x12
 * drawing two thirds as wide as it is tall is not a rendering subtlety. */
'use strict';
module.exports = {
  name: 'icons',
  async run(page) {
    const r = await page.evaluate(() => {
      const byStat = k => STAT_IC[String(k || '').replace(/^\*/, '')] || 'ball';
      const pick = (map, id, k) => (map && map[id]) || byStat(k);
      const lists = {
        upgrade:  B.UPG.map(u => [u.n, pick(UPG_IC, u.id, u.k)]),
        depths:   B.DGN.map(d => [d.n, d.ic || byStat(d.cur)]),
        attribute:B.STATS.map(s => [s.n, s.ic]),
        trophy:   B.TROPHY.map(t => [t.n, pick(TROPHY_IC, t.id, t.k)]),
        skill:    B.SKILL.map(k => [k.n, k.ic]),
        slot:     B.SLOTS.map(s => [s.n, s.ic]),
        element:  B.ELEM.map(e => [e.n, e.ic]),
        set:      B.SETS.map(s => [s.n, s.ic]),
        perk:     (B.PERKS || []).map(p => [p.n, p.ic]),
        sovpack:  (B.SOV_PACKS || []).map(p => [p.n, p.ic]),
        bag:      (B.BAGS || []).map(b2 => [b2.n, b2.ic]),
        bench:    (B.PERM || []).map(u => [u.n, u.ic]),
        // the shop button and the three offers, which have no table of their own
        shop:     [['Settings', 'gear'], ['Pro shop', 'proshop'], ['Starter Pack', 'starter'],
                   ['Club Membership', 'member'], ['Double Purse', 'boost'],
                   ['Free gift', 'freegift'], ['Members daily', 'freeday'],
                   ['Tour Card bounty', 'freecard']]
      };
      const seen = {}, missing = [], shared = [];
      let total = 0;
      for (const [list, rows] of Object.entries(lists))
        for (const [n, id] of rows) {
          total++;
          if (!B.PX12[id]) missing.push(list + ':' + n + ' wants "' + id + '"');
          (seen[id] = seen[id] || []).push(list + ':' + n);
        }
      for (const [id, who] of Object.entries(seen))
        if (who.length > 1) shared.push(id + ' -> ' + who.join(', '));
      // and every drawing is a square twelve rows of twelve
      const malformed = Object.entries(B.PX12)
        .filter(([, rows]) => rows.length !== 12 || rows.some(r => r.length !== 12))
        .map(([id]) => id);
      // every palette entry the UI hands an icon has to resolve to a real colour
      const vars = [];
      for (const r2 of B.RARITY) vars.push([r2.n, r2.v, cssVar(r2.v)]);
      for (const k in B.TR_TIER) vars.push([B.TR_TIER[k].n, B.TR_TIER[k].v, cssVar(B.TR_TIER[k].v)]);
      const unresolved = vars.filter(([, , hex]) => !/^#|^rgb/.test(hex))
                             .map(([n, v]) => n + ' (' + v + ')');

      // and a tier coloured icon actually comes out in that colour
      const ink = col => {
        const o = pixIcon('trophy', 12, col);
        const g = o.cv.getContext('2d').getImageData(0, 0, o.w, o.h).data;
        let lit = 0;
        for (let i = 0; i < g.length; i += 4)
          if (g[i+3] > 40 && (g[i] + g[i+1] + g[i+2]) > 120) lit++;
        return lit;
      };
      const black = [];
      for (const k in B.TR_TIER)
        if (ink(cssVar(B.TR_TIER[k].v)) < 4) black.push(B.TR_TIER[k].n);

      return { total, distinct: Object.keys(seen).length, missing, shared, malformed,
               drawn: Object.keys(B.PX12).length, unresolved, black };
    });
    if (r.missing.length) throw new Error('icon ids with no drawing:\n      ' + r.missing.join('\n      '));
    if (r.malformed.length) throw new Error('not 12x12: ' + r.malformed.join(', '));
    if (r.shared.length) throw new Error('shared icons:\n      ' + r.shared.join('\n      '));
    if (r.unresolved.length)
      throw new Error('these palette entries do not resolve to a colour: ' + r.unresolved.join(', ')
        + '. Handed to the canvas as written, they paint black.');
    if (r.black.length)
      throw new Error('a ' + r.black.join(' and ') + ' trophy icon rasterises to nothing but '
        + 'dark pixels, which is what a CSS var looks like once a canvas has had it.');
    // ---- every sprite box is square and a whole multiple of 12 ----------
    const boxes = await page.evaluate(() => {
      QUIET = true; DEV.gold(400); DEV.skills(); DEV.keys(); DEV.tierSet(12);
      DEV.relics(2); QUIET = false;
      try { hideSheet(); } catch (e) {}
      // The locker shows one slot at a time, and the equip button -- the thing
      // this rule exists for -- is only drawn on a club you are NOT carrying.
      // Three bags and whatever slot the save happened to be left on is a coin
      // toss: auto-equip takes the drops, that slot ends up holding nothing but
      // the club on your back, and the sweep finds no equip button at all. Seen
      // failing about one run in ten. Open enough bags to be sure of a spare,
      // then turn the locker to the slot that has the most of them.
      S.sov = 99999; for (let i = 0; i < 8; i++) openBag(B.BAGS[1]);
      try { hideSheet(); } catch (e) {}
      const spares = {};
      for (const it of S.bag) spares[it.slot] = (spares[it.slot] || 0) + 1;
      const fullest = Object.keys(spares).sort((a, b) => spares[b] - spares[a])[0];
      if (fullest) S.bagSlot = fullest;
      const seen = {};
      const where = e => { const a = []; let n = e;
        while (n && n !== document.body) {
          a.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '')
            + (typeof n.className === 'string' && n.className.trim()
               ? '.' + n.className.trim().split(/\s+/).join('.') : ''));
          n = n.parentElement; }
        return a.slice(-3).join(' > '); };
      const sweep = () => {
        for (const img of document.querySelectorAll('img')) {
          const b = img.getBoundingClientRect();
          if (!b.width || !b.height) continue;
          if (!/pixelated|crisp/.test(getComputedStyle(img).imageRendering)) continue;
          const w = +b.width.toFixed(2), h = +b.height.toFixed(2);
          if (Math.abs(w - h) < 0.01 && w % 12 === 0) continue;
          seen[where(img) + '|' + w + 'x' + h] = { w, h, at: where(img) };
        }
      };
      let looked = 0;
      for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) {
        setView(v); sweep(); looked += document.querySelectorAll('img').length;
      }
      for (const sub of ['offers', 'buy', 'bags', 'perm']) { openShop(sub); sweep(); }
      try { hideSheet(); } catch (e) {}
      if (S.bag[0]) { itemSheet(S.bag[0], false); sweep(); try { hideSheet(); } catch (e) {} }
      setView('upg'); sweep();
      return { bad: Object.values(seen), looked, spares,
               equip: document.querySelectorAll('.equipbtn img').length };
    });
    // the sweep has to have had something to look at, or it passes by seeing nothing
    if (!(boxes.looked > 100))
      throw new Error('the sprite sweep only saw ' + boxes.looked + ' images, so it is not '
        + 'reaching the screens it thinks it is');
    if (!(boxes.equip > 0))
      throw new Error('the locker had no equip buttons in it, which is where the squashed '
        + 'sprite was, so this proves nothing. Spare clubs by slot: '
        + (JSON.stringify(boxes.spares) || '{}'));
    if (boxes.bad.length) {
      const squashed = boxes.bad.filter(b => Math.abs(b.w - b.h) >= 0.01);
      throw new Error(boxes.bad.length + ' sprite box(es) are not a square whole multiple of 12: '
        + boxes.bad.slice(0, 5).map(b => b.w + 'x' + b.h + ' at ' + b.at).join('; ')
        + (squashed.length ? ' -- ' + squashed.length + ' of them NOT SQUARE, a 12x12 drawing '
            + 'stretched out of shape' : '')
        + '. Every drawing is 12x12, so only 12, 24, 36 and 48 give each source pixel the '
        + 'same number of screen pixels.');
    }

    // The home screen icon: 180 square, an actual picture, and crisp. It is
    // painted on a 36 grid and scaled by exactly 5, so every 5x5 block is one
    // colour; smoothing, or a size that is not a whole multiple, blends the
    // edges and every block stops being flat.
    const home = await page.evaluate(async () => {
      const l = [...document.querySelectorAll('link[rel="apple-touch-icon"]')].pop();
      if (!l) return null;
      const img = new Image(); img.src = l.href; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const c = cv.getContext('2d'); c.drawImage(img, 0, 0);
      const d = c.getImageData(0, 0, img.width, img.height).data, W = img.width;
      const cols = new Set(); let mixed = 0;
      for (let by = 0; by < img.height; by += 5) for (let bx = 0; bx < W; bx += 5) {
        const at = (x, y) => { const i = (y * W + x) * 4; return d[i] + ',' + d[i + 1] + ',' + d[i + 2]; };
        const first = at(bx, by); cols.add(first);
        let flat = true;
        for (let y = by; y < by + 5 && flat; y++) for (let x = bx; x < bx + 5; x++) if (at(x, y) !== first) { flat = false; break; }
        if (!flat) mixed++;
      }
      return { w: img.width, h: img.height, colours: cols.size, mixed };
    });
    if (!home) throw new Error('there is no home screen icon');
    if (home.w !== 180 || home.h !== 180)
      throw new Error('the home screen icon is ' + home.w + 'x' + home.h + ', not 180x180');
    if (home.colours < 12)
      throw new Error('the home screen icon has ' + home.colours + ' colours in it: that is not a picture');
    if (home.mixed)
      throw new Error(home.mixed + ' of the icon\'s 5x5 pixel blocks are blended: it has been smoothed '
        + 'or scaled by something other than a whole multiple of its 36 pixel grid');

    return [r.total + ' things, ' + r.distinct + ' distinct icons, ' + r.drawn
      + ' drawn, no reuse, every tier colour reaches the canvas',
      'every sprite box square and on the 12px grid, across five screens and four shop tabs',
      'home screen icon 180x180, ' + home.colours + ' colours, every pixel square'];
  }
};
