/* Ember's burn: every burn laid is dealt.
 *
 * A strike that takes the ember affinity lays 65% of itself as burn, spent
 * over the next three seconds ("Cinders burn the fairway for 65% of the strike
 * over 3s"). Each burn used to replace the one already burning, so at a quick
 * tempo most of every burn was thrown away, and a provisional's small burn
 * could wipe out a pure strike's big one. An ember ball played at about half
 * the carry derive() credits it with, auto-equip still chose it on those
 * numbers, and the pacing player sat on doubles for half an hour (seed 177 of
 * a 200 seed sweep: 0% par or better for twenty minutes).
 *
 *   - at a quick tempo, with every strike and every provisional taking the
 *     affinity, all the burn laid is dealt once the last has had its three
 *     seconds, and it is dealt over time, not at once
 *   - an ember ball deals what derive() credits it with: against a plain ball
 *     rated the same, swinging for five minutes on a hole that never ends, within
 *     7% (with the burns replacing each other it dealt about a quarter less)
 *
 * The affinity cap check (economy) swings once and measures at once, so it
 * never saw a burn at all.
 */
'use strict';
module.exports = {
  name: 'ember',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {}, mr = Math.random;
      const ogA = window.applyAffinity, ogD = window.damage;
      const seed = n => { let s = n; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; };
      try {
        QUIET = true;
        // ---- every burn laid is dealt ----
        S.equip.ball = { uid: 991, slot: 'ball', rar: 3, ilvl: 0, enh: 0, aff: [], el: 'ember' };
        startNine(); startHole();
        // the golfer's own numbers with the strike rate and the affinity pinned:
        // four strikes a second, every one (and every provisional) taking it
        const D = Object.assign({}, derive(), { proc: 1, spd: 4, mst: 1.5 });
        const HUGE = D.pow * 1e7;
        S.yardsMax = HUGE; S.yards = HUGE; S.armor = 0; S.burn = 0; S.burnT = 0;
        let laid = 0, dealt = 0, strikes = 0, atOnce = 0;
        window.applyAffinity = function (D2, dmg) {
          if (D2.ball && D2.ball.el === 'ember') { laid += dmg * B.ELEM_VAL.ember * D2.elemEff; strikes++; }
          return ogA.apply(this, arguments);
        };
        window.damage = function (amt, D2, soft) {
          const y0 = S.yards, out = ogD.apply(this, arguments);
          if (soft) dealt += y0 - S.yards;
          return out;
        };
        seed(7);
        const dt = 1 / 30;
        // one strike on its own first: none of its burn is dealt with it
        { const l0 = laid, d0 = dealt; oneSwing(D, false); atOnce = laid > l0 ? (dealt - d0) / (laid - l0) : -1; }
        for (let i = 0; i < 30 * 20; i++) step(dt, D);           // twenty seconds of it
        o.midway = dealt / laid;
        const D0 = Object.assign({}, D, { spd: 0 });              // then no more strikes
        for (let i = 0; i < 30 * 4; i++) step(dt, D0);
        Object.assign(o, { strikes, laid, dealt, ratio: dealt / laid, atOnce, left: S.burn, leftT: S.burnT });
        window.applyAffinity = ogA; window.damage = ogD;

        // ---- an ember ball deals what it is credited with ----
        // A quick golfer with a fair chance of the affinity (the pacing
        // player's, about when it stalled), once with an ember ball and once
        // with a plain one given the carry derive() credits the ember with.
        // Each swings for five minutes on a hole that never ends, the burns are
        // let run out, and what each dealt is compared.
        const kit = el => {
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
          S.autoEquip = 0;
          S.equip.ball = { uid: 992, slot: 'ball', rar: 3, ilvl: 0, enh: 0, aff: [], el };
          Object.assign(S.upg, { tempo: 400, groove: 200, infuse: 100, provis: 150 });
          startNine(); startHole();
        };
        kit('ember');
        const De = derive();
        kit('');
        const u = B.UPG.find(x => x.k === 'pow' && !x.cap);
        let lo = upgLv(u.id), hi = lo + 2000;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; S.upg[u.id] = m; if (derive().dps < De.dps) lo = m; else hi = m; }
        const lvl = hi;
        const swingFor = el => {
          kit(el); if (!el) S.upg[u.id] = lvl;
          const D2 = derive(), BIG = D2.pow * 1e9;
          S.yardsMax = BIG; S.yards = BIG; S.armor = 0; S.burn = 0; S.burnT = 0;
          seed(11);
          for (let i = 0; i < 30 * 300; i++) step(1 / 30, D2);
          const D3 = Object.assign({}, D2, { spd: 0 });
          for (let i = 0; i < 30 * 4; i++) step(1 / 30, D3);
          return { dps: D2.dps, dealt: BIG - S.yards, spd: D2.spd, proc: D2.proc, elemDmg: D2.elemDmg };
        };
        o.ember = swingFor('ember'); o.plain = swingFor('');
      } finally {
        window.applyAffinity = ogA; window.damage = ogD; Math.random = mr; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (!(r.strikes > 100)) f('only ' + r.strikes + ' strikes took the affinity in twenty seconds');
    if (Math.abs(r.ratio - 1) > 1e-6)
      f('of the burn laid by ' + r.strikes + ' strikes, ' + (r.ratio * 100).toFixed(1) + '% was dealt (' + r.dealt.toExponential(3)
        + ' of ' + r.laid.toExponential(3) + '): each burn is meant to burn for its three seconds, added to any already burning');
    if (r.atOnce !== 0) f('a strike dealt ' + (r.atOnce * 100).toFixed(0) + '% of its own burn at once: it is meant to burn over three seconds');
    if (!(r.midway < 1)) f('the burn was all dealt while the strikes were still coming (' + r.midway + '), so it is not burning over time');
    if (Math.abs(r.left) > 1e-6 * r.laid || r.leftT > 0) f('burn left over after it ran out: ' + r.left + ' over ' + r.leftT + 's');
    const e = r.ember, p = r.plain, x = e.dealt / p.dealt;
    if (Math.abs(e.dps / p.dps - 1) > 0.02) f('the plain ball could not be matched to the ember ball\'s carry: ' + e.dps + ' against ' + p.dps);
    if (!(e.elemDmg > 0.5)) f('the ember ball was credited with only +' + Math.round(e.elemDmg * 100) + '% for its affinity, too little to test');
    if (Math.abs(x - 1) > 0.07)
      f('an ember ball rated the same as a plain one dealt ' + x.toFixed(2) + ' times as much in five minutes ('
        + Math.round(e.spd * 300) + ' swings, ' + Math.round(e.proc * 100) + '% taking the affinity, credited +' + Math.round(e.elemDmg * 100) + '%)');
    return ['every burn laid is dealt, over time: ' + r.strikes + ' strikes at four a second, ' + (r.ratio * 100).toFixed(2) + '% of their burn',
      'an ember ball credited with +' + Math.round(r.ember.elemDmg * 100) + '% deals it: ' + (r.ember.dealt / r.plain.dealt).toFixed(3)
        + 'x a plain ball rated the same, over five minutes of ' + r.ember.spd.toFixed(1) + ' swings a second'];
  }
};
