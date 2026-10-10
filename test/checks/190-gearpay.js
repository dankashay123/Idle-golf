/* Gear is earned slowly (the user: clubs went to Mythic too easily; "I want
 * it to have to be earned and take some time"). The Island Green's shards
 * cut by 65% and the grit wagers' by 30%, measured as what an entry buys
 * (club ascensions, full club upgrades) on a good bag at Cards 11 to 101: an
 * Island Green entry under a third of an ascension of a Rare everywhere, under
 * a seventh up to Card 41; and the Check-In's, errands' and the pass's shards
 * and grit 70% of the shop's price their table asks. */
'use strict';
module.exports = {
  name: 'gearpay',
  async run(page) {
    const r = await page.evaluate(() => {
      // (the stake of the day pinned to the Vault: on a day the Island Green was
      // featured it paid more, and a January run failed here)
      const SNAP = JSON.stringify(S), o = { rows: [] }, keepFeat = FEAT_FORCE; FEAT_FORCE = 'vault';
      try {
        for (const [tier, up] of [[10, 30], [25, 60], [40, 120], [60, 200], [100, 300]]) {
          S.tier = tier; S.tierMax = tier; for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), up);
          S.bag = []; let seed = tier; const mr = Math.random; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          try { for (let i = 0; i < 12; i++) bagAdd(makeItem(tier, 2, 4)); } finally { Math.random = mr; }
          S.autoEquip = 1; autoEquipSweep();
          const D = derive(), row = { tier: tier + 1 };
          for (const d of B.DGN) row[d.id] = dgnPayout(d, D).buys;
          o.rows.push(row);
        }
        const r1 = { k: 'grit', v: 0.05 }, r2 = { k: 'shard', v: 0.06 };
        o.ci = [ciAmt(r1) / (shopPrice('grit') * 0.05), ciAmt(r2) / (shopPrice('shard') * 0.06)];
        o.pays = Object.fromEntries(B.DGN.map(d => [d.id, d.pay]));
      } finally { FEAT_FORCE = keepFeat; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); }
      return o;
    });
    const f = [];
    for (const row of r.rows) {
      if (!(row.water < 0.34)) f.push('Card ' + row.tier + ': an Island Green entry buys ' + row.water.toFixed(2) + ' of an ascension');
      if (row.tier <= 41 && !(row.water < 0.2)) f.push('Card ' + row.tier + ': an Island Green entry buys ' + row.water.toFixed(2) + ' of an ascension (under 0.2 wanted)');
    }
    if (!(r.pays.water <= 0.01) || !(r.pays.sand <= 0.033) || !(r.pays.scramble <= 0.036)) f.push('the wagers\' pay: ' + JSON.stringify(r.pays));
    if (r.ci.some(x => Math.abs(x - 0.7) > 0.05)) f.push('the Check-In\'s grit and shards at ' + r.ci.map(x => x.toFixed(2)).join('/') + ' of the price, not 0.7');
    if (f.length) throw new Error(f.join('\n'));
    return ['an Island Green entry buys ' + r.rows.map(x => x.water.toFixed(2)).join('/') + ' of an ascension at Cards ' + r.rows.map(x => x.tier).join('/')
      + '; the grit wagers ' + r.rows.map(x => x.sand.toFixed(2) + '+' + x.scramble.toFixed(2)).join(' ') + ' upgrades; the Check-In\'s at 70%'];
  }
};
