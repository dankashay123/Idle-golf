/* Named club sets: Heritage, Stormforge, Twinline and Caddie's Kit.
 *
 * The three older sets count any clubs at a rarity. These count clubs that
 * dropped as part of the set, and pay in things the rarity sets do not touch.
 *
 *   - a Rare or better club drops as part of a set at SET_CHANCE for its
 *     rarity, and nothing below Rare ever does
 *   - a set piece carries its maker's name
 *   - each tier pays exactly what the table says, through the same gear stats
 *     every other bonus goes through, and nothing below the first tier
 *   - a save with a set this build does not know loses the tag, not the club
 */
'use strict';
module.exports = {
  name: 'sets',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {};
      // ---- drop rates, by rarity ----------------------------------------
      const N = 4000, got = {}, tot = {};
      for (let i = 0; i < N * 3; i++) {
        const it = makeItem(5, 2.5, i % 6);
        tot[it.rar] = (tot[it.rar] || 0) + 1;
        if (it.set) got[it.rar] = (got[it.rar] || 0) + 1;
        if (it.set && it.name.indexOf(setDef(it.set).mk) !== 0) o.badName = it.name + ' / ' + it.set;
      }
      o.rates = Object.keys(tot).map(r2 => ({ rar: +r2, n: tot[r2], share: (got[r2] || 0) / tot[r2],
                                             want: B.SET_CHANCE[r2] || 0 }));
      // ---- bonuses ------------------------------------------------------
      const keep = {}; B.SLOTS.forEach(sl => keep[sl.id] = S.equip[sl.id]);
      const base = () => { B.SLOTS.forEach(sl => { const it = makeItem(10, 0, 2, sl.id); delete it.set; S.equip[sl.id] = it; }); };
      o.tiers = [];
      for (const set of B.SETS.filter(x => x.named)) {
        base();
        const g0 = gearStats();
        for (let k = 1; k <= 6; k++) {
          S.equip[B.SLOTS[k - 1].id].set = set.id;
          const g = gearStats();
          const tier = set.tiers.filter(t => t.n <= k).pop();
          for (const key of ['gld', 'spd', 'mst', 'drp', 'dgn']) {
            const want = tier && tier[key] ? tier[key] : 0;
            const d = g[key] - g0[key];
            if (Math.abs(d - want) > 1e-9) o.tiers.push(set.id + ' with ' + k + ': ' + key + ' +' + d + ', want +' + want);
          }
        }
      }
      B.SLOTS.forEach(sl => S.equip[sl.id] = keep[sl.id]);
      // ---- save repair --------------------------------------------------
      S.bag.push(Object.assign(makeItem(5, 0, 3, 'wedge'), { set: 'aSetThatNeverWas', uid: 777777 }));
      migrate();
      const ghost = S.bag.find(x => x.uid === 777777);
      o.ghostKept = !!ghost; o.ghostTag = ghost && ghost.set;
      S.bag = S.bag.filter(x => x.uid !== 777777);
      o.named = B.SETS.filter(x => x.named).length;
      return o;
    });
    if (r.badName) throw new Error('a set piece is not named for its maker: ' + r.badName);
    for (const x of r.rates) {
      if (x.want === 0) {
        if (x.share > 0) throw new Error(Math.round(x.share * 100) + '% of rarity ' + x.rar
          + ' clubs dropped as set pieces; nothing below Rare should');
        continue;
      }
      if (x.n < 200) continue;
      const sd = Math.sqrt(x.want * (1 - x.want) / x.n);
      if (Math.abs(x.share - x.want) > 4 * sd)
        throw new Error('rarity ' + x.rar + ' clubs dropped as set pieces ' + (x.share * 100).toFixed(1)
          + '% of the time over ' + x.n + ', not ' + (x.want * 100) + '%');
    }
    if (r.tiers.length)
      throw new Error('set tiers pay the wrong amount: ' + r.tiers.slice(0, 4).join('; '));
    if (!r.ghostKept || r.ghostTag)
      throw new Error('a club tagged with an unknown set ' + (r.ghostKept ? 'kept the tag' : 'was lost'));
    return [r.named + ' named sets: drop rates match SET_CHANCE by rarity, pieces carry the maker\'s name',
      'every tier of every set pays exactly its table, from 1 to 6 pieces; an unknown set loses the tag, not the club'];
  }
};
