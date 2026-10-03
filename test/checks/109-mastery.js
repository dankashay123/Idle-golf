/* Club mastery, the caddie bond and Golden Hour (the user picked all three
 * from the menu):
 *
 *   - mastery: every club carried gains a hole for each hole played, live
 *     or away; a star at each of B.MASTER, each lifting its own primary by
 *     B.MASTER_STEP, ten of them: five gold, then each turning purple in
 *     its place (the user asked); the tile wears a trim, its stars, the
 *     holes to the next and a bar; the club's window has the same and what
 *     the next star lifts; junk in a save is mended
 *   - the bond: the caddie he has gains a hole for each one played, and
 *     only that caddie; each step adds lines and from Friendly a move,
 *     none before it; the Caddie rack shows the step and the holes to the
 *     next; junk in a save is mended
 *   - Golden Hour: about one hole in B.GOLDEN_P, lit gold and paying all it
 *     earned twice; never at night, in the rain or with Dawn and Dusk's
 *     night on
 */
'use strict';
module.exports = {
  name: 'mastery',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const keepH = HOUR_FORCE;
      try {
        hideSheet(); QUIET = true;
        // ---- mastery ----
        const dr = S.equip.driver || (S.equip.driver = makeItem(S.tier, 0, 1, 'driver'));
        delete dr.mh; const p0 = itemPrimary(dr);
        const h0 = S.totalHoles; S.t = Date.now() / 1000 - 3600; offline(); hideSheet();
        const played = S.totalHoles - h0;
        if (!(played > 0) || dr.mh !== played) f('away ' + played + ' holes gave the driver ' + dr.mh);
        for (const sl of B.SLOTS) { const it = S.equip[sl.id]; if (it && it !== dr && it.mh !== played) f(sl.n + ' carried gained ' + it.mh + ' of ' + played); }
        for (const it of S.bag) if (it.mh) f('a club in the locker gained ' + it.mh + ' holes');
        const stars = [];
        for (const [n, want] of [[B.MASTER[0] - 1, 0], [B.MASTER[0], 1], [B.MASTER[2], 3], [B.MASTER[4] + 5, 5], [B.MASTER[9], 10]]) {
          dr.mh = n; stars.push(masterStars(dr));
          if (masterStars(dr) !== want) f(n + ' holes is ' + masterStars(dr) + ' stars, not ' + want);
          const lift = itemPrimary(dr) / p0;
          if (Math.abs(lift - (1 + B.MASTER_STEP * want)) > 1e-9) f(want + ' stars lift the primary x' + lift.toFixed(4));
        }
        o.stars = stars.join('/');
        const mid = (B.MASTER[1] + B.MASTER[2]) / 2; dr.mh = mid; QUIET = false;
        // the tile: two gold stars, the holes to the next, a bar part way
        const tile = gearTile(dr, true), tx = tile.querySelector('.gmx'), bar = tile.querySelector('.gxbar i');
        o.tile = tx ? tx.textContent : '';
        if (!tile.querySelector('.thumb.mast') || tile.querySelectorAll('.gmx .mstars b').length !== 2 || tile.querySelector('.gmx .mstars b.pu')
            || !o.tile.includes(fmt(mid, 0) + '/' + fmt(B.MASTER[2], 0)) || !bar || !(parseFloat(bar.style.width) > 0 && parseFloat(bar.style.width) < 100))
          f('the tile reads "' + o.tile + '" with a bar at ' + (bar && bar.style.width));
        if (gearTile(Object.assign({}, dr, { mh: 0 }), false).querySelector('.mast, .mstars b')) f('a club with no stars wears the trim');
        // past five the stars turn purple in their places
        const t7 = gearTile(Object.assign({}, dr, { mh: B.MASTER[6] }), false);
        if (t7.querySelectorAll('.mstars b.pu').length !== 2 || t7.querySelectorAll('.mstars b:not(.pu)').length !== 3 || !t7.querySelector('.thumb.mast.pu'))
          f('seven stars show ' + t7.querySelectorAll('.mstars b.pu').length + ' purple and ' + t7.querySelectorAll('.mstars b:not(.pu)').length + ' gold');
        const tMax = gearTile(Object.assign({}, dr, { mh: B.MASTER[9] }), false);
        if (tMax.querySelectorAll('.mstars b.pu').length !== 5 || !/Max/.test(tMax.querySelector('.gmx').textContent)) f('ten stars read ' + tMax.querySelector('.gmx').textContent);
        // the window: the stars, the holes, a bar, and what the next star lifts
        itemSheet(dr, true);
        const mb = document.querySelector('#sheet .mastbox'); o.sheet = mb ? mb.textContent : '';
        const now = '+' + fmt(itemPrimary(dr) * 100) + '%', nxt = '+' + fmt(itemPrimary(dr) * (1 + B.MASTER_STEP * 3) / (1 + B.MASTER_STEP * 2) * 100) + '%';
        if (!mb || !mb.querySelector('.gxbar i') || !o.sheet.includes(fmt(B.MASTER[2], 0)) || !o.sheet.includes(now) || !o.sheet.includes(nxt)) f('the window\'s mastery reads "' + o.sheet + '"');
        if (B.MASTER.length !== 10 || B.MASTER.some((v, i) => i && v <= B.MASTER[i - 1]) || B.MASTER[9] < B.MASTER[4] * 20) f('the stars are set at ' + B.MASTER.join(', '));
        hideSheet(); QUIET = true;
        for (const v of [-5, 'x', NaN, 1e12]) { dr.mh = v; initState(); migrate(); const d2 = S.equip.driver; if (d2.mh !== undefined) f('mastery ' + v + ' in a save loaded as ' + d2.mh); }
        S.equip.driver.mh = 12.7; initState(); migrate(); if (S.equip.driver.mh !== 12) f('mastery 12.7 loaded as ' + S.equip.driver.mh);

        // ---- the bond ----
        S.caddie = 'bib'; S.bond = {};
        const b0 = S.totalHoles; S.t = Date.now() / 1000 - 1800; offline(); hideSheet();
        if (bondOf('bib') !== S.totalHoles - b0) f('away ' + (S.totalHoles - b0) + ' holes gave the bond ' + bondOf('bib'));
        if (Object.keys(S.bond).length !== 1) f('holes went to a caddie he did not have: ' + Object.keys(S.bond).join(', '));
        const ids = () => fairyMoves().map(m => m.id);
        const lv = [];
        for (let k = 0; k <= B.BOND.length; k++) {
          S.bond.bib = k ? B.BOND[k - 1].v : 0; lv.push(bondLv('bib'));
          const has = ids();
          if (has.includes('salute') !== (k >= 2) || has.includes('jig') !== (k >= 4) || has.includes('worthy') !== (k >= 5)) f('at bond ' + k + ' his moves are ' + has.join(','));
          if ((bondSay('quip').length > 0) !== (k >= 1) || (bondSay('cheer').length > 0) !== (k >= 3)) f('at bond ' + k + ' he has ' + bondSay('quip').length + ' lines and ' + bondSay('cheer').length + ' cheers');
        }
        o.bond = lv.join('/');
        S.bond.bib = 1500; QUIET = false; rangeSub = 'cad'; renderRangeNav();
        const row = document.querySelector('#cadRows .bondrow');
        o.row = row ? row.textContent : '';
        if (!row || !/Friendly/.test(o.row) || !o.row.includes(fmt(B.BOND[2].v, 0)) || row !== document.querySelector('#cadRows').firstElementChild) f('the bond row reads "' + o.row + '"');
        rangeSub = 'upg'; renderRangeNav(); QUIET = true;
        S.bond = { bib: -3, nope: 50, classic: 7.9 }; initState(); migrate(); if (JSON.stringify(S.bond) !== '{"classic":7}') f('a mangled bond loaded as ' + JSON.stringify(S.bond));

        // ---- Golden Hour ----
        let n = 0; const N = 60000; for (let h = 0; h < N; h++) if (goldenHole(h)) n++;
        o.rate = (N / n).toFixed(0);
        if (Math.abs(n / N - B.GOLDEN_P) > B.GOLDEN_P * 0.2) f('Golden Hour on 1 hole in ' + o.rate);
        let h = S.hole; while (!goldenHole(h)) h++;
        S.hole = h; S.dawnDusk = 1; HOUR_FORCE = 14; startHole();
        const look = ch => { S.chaos = { n: ch }; Scene.newHole(h, S.tier); return Scene.golden && /\|gold$/.test(Scene.themeId); };
        if (!look('Fair')) f('a Golden Hour hole by day is not lit gold (' + Scene.themeId + ')');
        if (look('Night Round') || look('Crosswind')) f('Golden Hour at night or in the rain');
        HOUR_FORCE = 23; if (look('Fair')) f('Golden Hour in Dawn and Dusk\'s night');
        HOUR_FORCE = 14; let g = h + 1; while (goldenHole(g)) g++;
        S.hole = g; S.chaos = { n: 'Fair' }; Scene.newHole(g, S.tier); if (Scene.golden || /\|gold$/.test(Scene.themeId)) f('an ordinary hole lit gold');
        // paid twice: the same hole finished golden and not
        const fin = clockN => { HOUR_FORCE = clockN; S.hole = h; startHole(); S.chaos = { n: 'Fair' }; S.holeGold = 0; S.elapsed = S.parTime * 0.8; S.doneT = null;
          const g0 = S.gold; finishHole(derive()); return S.gold - g0; };
        const plain = fin(23), gold = fin(14);
        o.pay = (gold / plain).toFixed(3);
        if (!(plain > 0) || Math.abs(gold / plain - 2) > 1e-6) f('a Golden Hour hole paid x' + o.pay + ' what it would have');
      } finally {
        HOUR_FORCE = keepH; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['mastery: a hole on every club carried, away too; stars ' + r.stars + ' lift the primary 2% each, gold to five then purple; the tile reads "' + r.tile + '", the window "' + r.sheet + '"',
      'bond: holes to the caddie he has only; steps ' + r.bond + ' bring lines, cheers and the salute, jig and bow in turn; the Caddie rack reads "' + r.row + '"',
      'Golden Hour on 1 hole in ' + r.rate + ', lit gold by day only, and paid x' + r.pay + '; junk in a save mended'];
  }
};
