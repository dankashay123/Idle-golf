/* Every icon id a list asks for exists, and no two things in the game share a
 * drawing. Icons used to be keyed off the stat each thing moved, which meant
 * one golf ball stood for seventeen different things. Adding a new upgrade or
 * trophy without giving it its own icon should fail here, not ship. */
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
        perk:     (B.PERKS || []).map(p => [p.n, p.ic])
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
      return { total, distinct: Object.keys(seen).length, missing, shared, malformed,
               drawn: Object.keys(B.PX12).length };
    });
    if (r.missing.length) throw new Error('icon ids with no drawing:\n      ' + r.missing.join('\n      '));
    if (r.malformed.length) throw new Error('not 12x12: ' + r.malformed.join(', '));
    if (r.shared.length) throw new Error('shared icons:\n      ' + r.shared.join('\n      '));
    return [r.total + ' things, ' + r.distinct + ' distinct icons, ' + r.drawn + ' drawn, no reuse'];
  }
};
