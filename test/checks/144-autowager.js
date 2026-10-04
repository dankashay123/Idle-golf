/* Auto-wagers (the user picked them from the menu, only from a high card):
 * from Card 100 a wager can play itself, started between holes once its
 * entries are full; never before Card 100, quietly or away; one at a time,
 * the day's featured wager first. */
'use strict';
module.exports = {
  name: 'autowager',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), tw = window.toast;
      try {
        hideSheet(); window.toast = () => {}; QUIET = false; OFFLINE = false; S.dgnRun = null;
        const all = {}; B.DGN.forEach(d => { all[d.id] = 1; S.dgnKeys[d.id] = entryCap(d); });
        S.autoWg = all;
        S.tierMax = AUTO_WAGER_TIER - 1; if (autoWager() || S.dgnRun) f('played itself below Card ' + cardNo(AUTO_WAGER_TIER));
        S.tierMax = AUTO_WAGER_TIER;
        QUIET = true; if (autoWager() || S.dgnRun) f('played itself quietly'); QUIET = false;
        OFFLINE = true; if (autoWager() || S.dgnRun) f('played itself away'); OFFLINE = false;
        // not full: not played
        B.DGN.forEach(d => S.dgnKeys[d.id] = entryCap(d) - 1);
        if (autoWager() || S.dgnRun) f('played with its entries not full');
        // full: the featured one first, one at a time
        B.DGN.forEach(d => S.dgnKeys[d.id] = entryCap(d));
        const d = autoWager(); if (!d || !S.dgnRun) f('did not play itself with its entries full');
        else { if (d.id !== featWager().id) f('played ' + d.id + ' before the featured ' + featWager().id);
          if (S.dgnKeys[d.id] !== entryCap(d) - 1) f('an entry not spent');
          if (autoWager()) f('a second started while one runs'); }
        leaveDgn(); leaveDgn();
        // off: never
        S.autoWg = {}; B.DGN.forEach(d => S.dgnKeys[d.id] = entryCap(d)); if (autoWager()) f('played itself switched off');
        // the switch on the tab
        S.autoWg = {}; setView('dgn'); renderDgn();
        const btns = [...document.querySelectorAll('#dgnRows button')].filter(b => /^Auto/.test(b.textContent));
        if (btns.length !== B.DGN.length) f(btns.length + ' auto switches');
        else { btns[0].click(); if (!S.autoWg[B.DGN[0].id]) f('the switch did not turn it on'); }
        S.tierMax = 0; renderDgn(); if ([...document.querySelectorAll('#dgnRows button')].some(b => /^Auto/.test(b.textContent))) f('the switch shown below Card 100');
        if (!/Card 100/.test(document.getElementById('dgnNote').textContent)) f('the tab does not say when they open');
        // repair
        S.autoWg = { sand: 1, nope: 1, water: 'x' }; migrate(); if (JSON.stringify(S.autoWg) !== '{"sand":1}') f('repaired to ' + JSON.stringify(S.autoWg));
      } finally { window.toast = tw; S.dgnRun = null; QUIET = false; OFFLINE = false; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); renderDgn(); }
      return fails;
    });
    if (r.length) throw new Error(r.join('; '));
    return ['from Card 100 only; live only; only with its entries full; the featured first, one at a time; the switch; repaired'];
  }
};
