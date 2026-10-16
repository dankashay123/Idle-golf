/* What the honours, a talent, an heirloom's top and a wager's card pay and
 * say (the user asked for each of the audit's findings done):
 *
 *   - an honour's "+N% swing power" is that much more power, on its own: it
 *     was added in with the clubs', which run to thousands of percent, and
 *     bought half a percent at Card 13
 *   - Sunday Nerve pays on every Sunday hole and no other (it paid on the
 *     armoured last hole of each round, as Marshal's Bane does)
 *   - the climb up the cards pays a step at a time (Card 25 under Card 50,
 *     Paragon 25 under Paragon 250), and Card 100 and Card 200 are honours
 *   - Chronoglass stops at Card 221, the highest that can be played, and a
 *     save past it is put back with the legacy those levels cost
 *   - each wager's card shows the level it has reached */
'use strict';
module.exports = {
  name: 'honourpay',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {};
      try {
        hideSheet(); QUIET = true;
        // ---- honours' swing power ----
        // (on a bag from Card 40, whose clubs give thousands of percent)
        for (const sl of B.SLOTS) { const it = makeItem(40, 0, 4, sl.id); it.rar = 4; S.equip[sl.id] = it; }
        o.gear = gearStats().pow - career().pow;
        if (!(o.gear > 20)) f('the test bag gives only +' + Math.round(o.gear * 100) + '% swing power');
        S.achDone = {}; const p0 = derive().pow;
        const pw = B.ACH.filter(a => a.r.k === 'pow'); pw.forEach(a => S.achDone[a.id] = 1);
        const sum = pw.reduce((t, a) => t + a.r.v, 0), p1 = derive().pow;
        o.hon = [sum, p1 / p0];
        if (Math.abs(p1 / p0 - (1 + sum)) > 0.001) f('every swing power honour (+' + Math.round(sum * 100) + '%) made power x' + (p1 / p0).toFixed(3) + ', not x' + (1 + sum).toFixed(2));
        S.achDone = {};
        // ---- Sunday Nerve ----
        const nerve = B.TREES.flatMap(t => t.t).find(t => t.id === 'nerve'); Object.keys(S.tal).forEach(k => S.tal[k] = 0);
        let sun = 0; while (!isSunday(sun + 1)) sun++; sun++; let mon = 1; while (isSunday(mon)) mon++;
        const at = (h, n) => { S.tal.nerve = n; const keep = S.hole; S.hole = h; const v = derive().pow; S.hole = keep; return v; };
        const rs = at(sun, 5) / at(sun, 0), rm = at(mon, 5) / at(mon, 0);
        o.nerve = [rs, rm];
        if (Math.abs(rs - (1 + nerve.v * 5)) > 0.001 || Math.abs(rm - 1) > 0.001) f('Sunday Nerve at rank 5: x' + rs.toFixed(3) + ' on a Sunday hole, x' + rm.toFixed(3) + ' on another');
        S.tal.nerve = 0;
        // ---- the climb's steps ----
        const A = id => B.ACH.find(a => a.id === id);
        if (!(A('t10').sov <= A('t25').sov && A('t25').sov < A('t50').sov && A('t50').sov <= A('t100').sov && A('t100').sov <= A('t200').sov)) f('the cards pay ' + ['t10', 't25', 't50', 't100', 't200'].map(i => A(i) && A(i).sov).join(', '));
        if (!(A('p25').sov < A('p250').sov)) f('Paragon 25 pays ' + A('p25').sov + ', Paragon 250 ' + A('p250').sov);
        S.bestTier = 99; if (achMetric('tier') < A('t100').v || achAmt(A('t100'), A('t100').v) !== '100') f('Card 100 reads ' + achAmt(A('t100'), A('t100').v));
        // ---- Chronoglass ----
        const ch = trophyDef('chrono');
        if (cardNo(trTop(ch)) > 221 || cardNo(trTop(ch)) < 215) f('Chronoglass stops at Card ' + cardNo(trTop(ch)));
        const keepS = JSON.stringify(S); S.relic.chrono = trTop(ch) + 5; S.legacy = 0; initState();
        o.refund = S.legacy; o.chrono = S.relic.chrono;
        if (S.relic.chrono !== trTop(ch) || !(S.legacy > 0)) f('a save at Chronoglass ' + (trTop(ch) + 5) + ' loaded at ' + S.relic.chrono + ' with ' + S.legacy + ' legacy back');
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(keepS));
        // ---- a wager's level on its card ----
        QUIET = false; B.DGN.forEach((d, i) => S.dgnFloor[d.id] = i * 3 + 4); setView('dgn'); renderDgn();
        const cards = [...document.querySelectorAll('.dgn')];
        o.cards = cards.length;
        B.DGN.forEach((d, i) => { const c = cards.find(e => e.querySelector('.dn') && e.querySelector('.dn').textContent === d.n);
          if (!c || !new RegExp('Level\\u00a0' + (i * 3 + 5) + '\\b').test(c.textContent)) f(d.n + "'s card does not show Level " + (i * 3 + 5)); });
      } finally { QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole(); }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['with clubs at +' + Math.round(r.o.gear * 100) + '% swing power, every swing power honour (+' + Math.round(r.o.hon[0] * 100) + '%) makes power x' + r.o.hon[1].toFixed(2) + '; Sunday Nerve x' + r.o.nerve[0].toFixed(2) + ' on Sunday, x' + r.o.nerve[1].toFixed(2) + ' otherwise',
      'the cards and Paragon pay a step at a time, Card 100 and 200 honours; Chronoglass to its top with ' + r.o.refund.toExponential(1) + ' legacy back for five levels past it; ' + r.o.cards + ' wager cards show their level'];
  }
};
