/* Every icon id a list asks for exists, and no two things in the game share a
 * drawing. Icons used to be keyed off the stat each thing moved, which meant
 * one golf ball stood for seventeen different things. Adding a new upgrade or
 * trophy without giving it its own icon should fail here, not ship.
 *
 * And the colour reaches the drawing. Icons are rasterised on a canvas, and a
 * canvas cannot read "var(--r4)": handed one it paints black. Every Gold trophy
 * in the room had a black icon for exactly that reason, and the bug is
 * invisible in the source because the string looks like a colour. */
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
        shop:     [['Pro shop', 'proshop'], ['Starter Pack', 'starter'],
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
    return [r.total + ' things, ' + r.distinct + ' distinct icons, ' + r.drawn
      + ' drawn, no reuse, every tier colour reaches the canvas'];
  }
};
