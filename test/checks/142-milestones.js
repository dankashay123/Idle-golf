/* Range milestones (the user picked them from the menu, "remember not to
 * break the game with the multipliers"): at Lv 10, 25, 50, 75, 100 and every
 * 50 after (every 25 with no cap), and at the cap, a rung pays a step.
 *
 *   - at every milestone and at the cap a rung is worth just what it was
 *     before milestones (g^lv, or lv times its step); between, a little less,
 *     never more; so nothing is stronger and the wall stands (heirlooms)
 *   - the step at a milestone is the quarter held back
 *   - each row shows its next milestone; one bought past says so */
'use strict';
module.exports = {
  name: 'milestones',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), tw = window.toast; let said = [];
      try {
        hideSheet(); window.toast = h => said.push(h);
        let worst = 0, steps = 0;
        for (const u of B.UPG) {
          const cap = capOf(u), top = isFinite(cap) ? cap : 600;
          for (let lv = 0; lv <= top; lv++) {
            S.upg[u.id] = lv; const e = upgEff(u.id), m = msLast(u, lv);
            if (e > lv + 1e-9) f(u.id + ' Lv ' + lv + ' counts ' + e);
            const isM = [10, 25, 50, 75].includes(lv) || (lv >= 100 && (lv - 100) % (isFinite(cap) ? 50 : 25) === 0) || lv === cap;
            if (isM && Math.abs(e - lv) > 1e-9) f(u.id + ' at milestone ' + lv + ' counts ' + e);
            if (isM && m !== lv) f(u.id + ' Lv ' + lv + ': last milestone ' + m);
            worst = Math.max(worst, lv - e);
            if (lv > 0) { S.upg[u.id] = lv - 1; const e0 = upgEff(u.id); if (isM && lv - 1 >= 0 && e - e0 > 1 + 1e-9) steps++; }
          }
          S.upg[u.id] = 0;
        }
        if (!steps) f('no milestone paid a step');
        // ---- the multiplier as it was at a milestone ----
        const dr = B.UPG.find(u => u.id === 'drive'); S.upg.drive = 200;
        if (Math.abs(upgMult('pow') / Math.pow(dr.g, 200) - 1) > 1e-9) f('Drive Power at 200 is x' + upgMult('pow') + ', was x' + Math.pow(dr.g, 200));
        S.upg.drive = 0;
        // ---- shown, and said ----
        setView('upg'); S.upg.tempo = 368; refreshUpg();
        const row = UPGREF.find(x => x.u.id === 'tempo'); if (!/Lv\u00a0400/.test(row.ms.textContent)) f('Pace of Play at 368 shows ' + row.ms.textContent);
        // (and its bar: filled as far as it is from the last to the next, the
        // levels to go and what the rung will be there)
        { const bar = row.ms.querySelector('.msbar i'), w = parseFloat(bar.style.width), want = Math.round((368 - 350) / 50 * 100);
          if (row.ms.hidden || Math.abs(w - want) > 1) f('Pace of Play\'s bar at 368: ' + w + '%, want ' + want + '%');
          const tx = row.ms.textContent; if (!/Lv\u00a0400 \(32 more\)/.test(tx) || !tx.includes(effectLabel(B.UPG.find(u => u.id === 'tempo'), 400))) f('its bar reads ' + tx); }
        S.upg.tempo = 399; S.gold = 1e300; S.mult = 1; said = []; buyUpg(B.UPG.find(u => u.id === 'tempo'));
        if (!said.some(h => /Milestone/.test(h) && /400/.test(h))) f('Pace of Play to 400 said ' + JSON.stringify(said));
        said = []; buyUpg(B.UPG.find(u => u.id === 'tempo')); if (said.some(h => /Milestone/.test(h))) f('a milestone said at 401');
        // ---- a rung at its stat's cap: said, and Buy All passes it ----
        // (Face Milling and the Swing Simulator at 500 take a pure strike to its cap)
        S.upg.face = 500; S.upg.simul = 400; refreshUpg();
        if (!upgDead(B.UPG.find(u => u.id === 'simul'))) f('the Swing Simulator not at the cap (pure strike ' + derive().crit + ')');
        else { const rm = UPGREF.find(x => x.u.id === 'simul'); if (!/at the cap/.test(rm.mt.textContent)) f('the Swing Simulator at the cap reads ' + rm.mt.textContent);
          S.gold = 1e30; const m0 = S.upg.simul; buyAllUpg(); if (S.upg.simul !== m0) f('Buy All bought the Swing Simulator past its cap: ' + m0 + ' to ' + S.upg.simul); }
        if (fails.length) return { err: fails.join("; ") };
        return { worst };
      } finally { window.toast = tw; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); refreshUpg(); }
    }).then(x => x, e => ({ err: e.message }));
    if (r.err) throw new Error(r.err);
    return ['every rung at every level: never more than it was, just what it was at each milestone and the cap; most held back ' + r.worst.toFixed(1) + ' levels; shown and said'];
  }
};
