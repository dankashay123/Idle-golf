/* Heirlooms with a top (the user maxed the Gilded Card and "it breaks the
 * game": at 250 levels it paid 1e44 times the purse, the Range went free,
 * Drive Power ran past two thousand levels and printed its multiplier as
 * x2.055640197382958e+39).
 *
 * Every heirloom was free to 250 levels and every multiplying one compounded
 * all the way. Measured on a golfer with everything else maxed, ten of them
 * alone moved the highest playable card by 20 to 130 cards, and all thirty
 * together walked past Card 400. The Founder's Locker SET every ladder to its
 * kept levels, Drive Power included, so at 250 it handed out 12,500 levels of
 * Drive Power each retirement; the Chronoglass put a fresh golfer on Card 250
 * whatever he had reached.
 *
 *   - every heirloom has a top of its own under TR_MAX; no multiplying one
 *     passes x100K at its top, and every stat's heirlooms together stay under
 *     their ceiling (prize money x150 for all three)
 *   - a ladder never gets cheaper than it pays (cost outruns gain)
 *   - a save at 250 everywhere comes back at each top, every heirloom kept,
 *     and nothing reads past a top even if a level slips through
 *   - a golfer with everything maxed (Mythic gear at +15 with every star,
 *     talents, attributes, 5,000 paragon in each open line, the bench, a
 *     membership, eight hours of each card's purse spent on the Range, all
 *     thirty heirlooms at their tops) gets about x100 purse from the room and
 *     walls well short of Card 400
 *   - the Locker keeps what you had, up to its levels; the Chronoglass never
 *     lands past the best card reached
 *   - nothing on the Range, in the Heirlooms or across the tabs shows an "e+"
 *     with that golfer, Drive Power at 2,308 levels included
 */
'use strict';
module.exports = {
  name: 'heirlooms',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const SNAP = JSON.stringify(S), RND = Math.random;
      let sd = 99;
      Math.random = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      try {
        QUIET = true; hideSheet();
        // ---- the table ------------------------------------------------------
        // yardage and the purse are what climb; payoff, pace and wagers have
        // no cap of their own; provisional, pure strike, affinity and drops
        // stop at the game's own caps whatever multiplies them
        const CEIL = { gld: 150, pow: 1e10, cpw: 100, spd: 50, dgn: 50 };
        const per = {};
        for (const t of B.TROPHY) {
          const top = trTop(t);
          if (!(t.max > 0 && t.max <= B.TR_MAX)) f(t.n + ' has no top of its own (' + t.max + ')');
          if (!t.g) continue;
          const at = Math.pow(t.g, top);
          if (!(at <= 1e5)) f(t.n + ' reaches x' + fmt(at) + ' at its top of ' + top);
          if (!(trophyRatio(t) > t.g)) f(t.n + ' costs x' + trophyRatio(t).toFixed(3) + ' a level and pays x' + t.g);
          const k = t.k.slice(1); per[k] = (per[k] || 1) * at;
        }
        for (const k in per) if (!(per[k] <= (CEIL[k] || 1e4)))
          f('the ' + k + ' heirlooms together reach x' + fmt(per[k]) + ', over x' + fmt(CEIL[k] || 1e4));
        o.gldAll = per.gld; o.powAll = per.pow;

        // ---- a save at 250 ---------------------------------------------------
        B.TROPHY.forEach(t => S.relic[t.id] = 250);
        initState();
        for (const t of B.TROPHY) {
          if (S.relic[t.id] !== trTop(t)) f(t.n + ' loaded at ' + S.relic[t.id] + ', not its top ' + trTop(t));
        }
        if (trophiesFound() !== B.TROPHY.length) f('a save at 250 lost heirlooms: ' + trophiesFound() + ' found');
        B.TROPHY.forEach(t => S.relic[t.id] = 250);       // slipped past the load
        for (const k of ['gld', 'pow', 'cpw', 'spd', 'dgn'])
          if (!(relMult(k) <= per[k] * 1.0001)) f(k + ' read x' + fmt(relMult(k)) + ' from levels past the tops');
        if (relLv('vault') !== trTop(trophyDef('vault'))) f('the Locker read level ' + relLv('vault'));
        if (relLv('rift') !== trTop(trophyDef('rift'))) f('the Invitation read level ' + relLv('rift'));
        initState();

        // ---- the strongest golfer ---------------------------------------------
        S.lv = B.LV_MAX; S.retires = 20; S.buff = {}; S.perkOn = {}; S.member = 1;
        S.chaos = Object.assign({}, B.CHAOS[0]);
        S.stat = { drive: 60, tempo: 0, touch: 60, fortune: 60 };
        let pts = 60;
        B.TREES.forEach(t => t.t.forEach(x => S.tal[x.id] = 0));
        for (const tr of B.TREES.slice(0, 2)) for (const x of tr.t) { const k = Math.min(x.max, pts); S.tal[x.id] = k; pts -= k; }
        B.PARAGON.forEach(c => c.a.forEach(a => S.paraSpent[c.id + '.' + a.id] = a.cap || 5000));
        B.PERM.forEach(u => S.perm[u.id] = B.PERM_MAX);
        const gear = c => { B.SLOTS.forEach(sl => { const it = makeItem(c, 0, 5, sl.id); it.aff = it.aff.slice(0, 5);
          it.enh = B.ENH_MAX; it.mh = B.MASTER[B.MASTER.length - 1]; S.equip[sl.id] = it; });
          let bd = -1, be = null; for (const e of B.ELEM) { S.equip.ball.el = e.id; const d = derive().dps; if (d > bd) { bd = d; be = e.id; } }
          S.equip.ball.el = be; };
        const goldHr = c => { const D = derive(); let sum = 0, n = B.ROUND * B.DAYS;
          for (let h = 49 * n + 1, i = 0; i < n; i++, h++) sum += purseFor(h, c, D.gold);
          return sum / n * 0.1 * 3600; };
        const buy = gold => { B.UPG.forEach(u => S.upg[u.id] = 0);
          for (let it = 0; it < 30000; it++) {
            let best = null, bc = Infinity, bc2 = Infinity;
            for (const u of B.UPG) { const lv = S.upg[u.id]; if (lv >= capOf(u)) continue;
              const c = costOf(u.base, u.r, lv); if (c < bc) { bc2 = bc; bc = c; best = u; } else if (c < bc2) bc2 = c; }
            if (!best || bc > gold) break;
            const lv = S.upg[best.id];
            let k = isFinite(bc2) ? Math.max(1, Math.floor(Math.log(bc2 / bc) / Math.log(best.r)) + 1) : 1e9;
            k = Math.min(k, capOf(best) - lv, maxAffordable(best.base, best.r, lv, gold));
            if (k < 1) break;
            gold -= costBulk(best.base, best.r, lv, k); S.upg[best.id] += k;
          } };
        const at = c => { S.tier = c; gear(c); B.UPG.forEach(u => S.upg[u.id] = 0);
          for (let i = 0; i < 3; i++) buy(goldHr(c) * 8);
          return matchedCard(derive()); };
        const wall = () => { if (at(B.TIER_MAX) >= B.TIER_MAX) return B.TIER_MAX;
          let lo = 0, hi = B.TIER_MAX;
          while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at(m) >= m) lo = m; else hi = m; }
          return lo; };
        B.TROPHY.forEach(t => S.relic[t.id] = 0);
        o.wall0 = wall(); at(60); const g0 = derive().gold;
        B.TROPHY.forEach(t => S.relic[t.id] = trTop(t));
        o.wallMax = wall(); at(60); o.gldRoom = derive().gold / g0;
        if (!(o.gldRoom <= 150)) f('the room multiplies the purse by ' + fmt(o.gldRoom) + ' with everything maxed');
        if (!(o.wallMax < 160)) f('a golfer with everything maxed plays to Card ' + o.wallMax + ' (no heirlooms: ' + o.wall0 + ')');
        if (!(o.wallMax > o.wall0 + 15)) f('the room at its tops adds only ' + (o.wallMax - o.wall0) + ' cards');

        // ---- nothing shows an e+ ---------------------------------------------
        S.tier = Math.min(B.TIER_MAX, o.wallMax); gear(S.tier); S.upg.drive = 2308; S.gold = 1e300; S.legacy = 1e300;
        startHole(); hideSheet();
        const seen = [];
        const look = where => { const txt = document.body.innerText;
          const m = txt.match(/[^\n]{0,30}\de[+-]?\d{2,}[^\n]{0,10}/); if (m) seen.push(where + ': ' + m[0]); };
        o.driveLabel = effectLabel(B.UPG.find(u => u.id === 'drive'));
        if (/e[+-]/.test(o.driveLabel)) f('Drive Power at 2,308 levels reads ' + o.driveLabel);
        renderAll(); setView('upg'); refreshUpg(); look('Range');
        setView('bag'); look('Bag');
        setView('dgn'); look('Wagers');
        setView('tour'); look('Tour');
        for (const s of ['stat', 'tal', 'para', 'leg']) { careerSub = s; setView('career'); renderCareer(); look('Career ' + s); }
        careerSub = 'leg'; renderCareer();
        o.rows = [...document.querySelectorAll('#relicRows .row .mt')].map(e => e.textContent);
        if (o.rows.length < B.TROPHY.length) f('only ' + o.rows.length + ' heirloom rows');
        if (!o.rows.slice(1).every(t => /Lv \d+\/\d+/.test(t))) f('an heirloom row does not show its top: ' + o.rows.slice(1).find(t => !/Lv \d+\/\d+/.test(t)));
        setView('upg');
        if (seen.length) f('shown raw: ' + seen.slice(0, 3).join(' | '));

        // ---- the Locker and the Chronoglass -------------------------------
        S.relic.vault = trTop(trophyDef('vault')); S.relic.chrono = trTop(trophyDef('chrono'));
        B.UPG.forEach(u => S.upg[u.id] = 0); S.upg.drive = 30; S.upg.tempo = 700;
        S.tier = 20; S.tierMax = 20; S.bestTier = 20; S.eventsPlayed = 9; S.retires = 0;
        o.land = retireCard();
        if (o.land > 20) f('the Chronoglass landed on Card ' + (o.land + 1) + ', past the best card reached (XXI)');
        retire(); hideSheet();
        o.keptDrive = S.upg.drive; o.keptTempo = S.upg.tempo; o.keptFace = S.upg.face;
        if (S.upg.drive !== 30) f('the Locker left Drive Power at ' + S.upg.drive + ' levels, from 30');
        if (S.upg.face !== 0) f('the Locker gave ' + S.upg.face + ' levels of a ladder never bought');
        if (S.upg.tempo !== Math.min(capOf(B.UPG.find(u => u.id === 'tempo')), 500)) f('the Locker kept ' + S.upg.tempo + ' of 700 Pace levels');
      } finally {
        Math.random = RND;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; try { hideSheet(); } catch (e) {} startHole(); setView('upg');
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['prize money x' + r.gldAll.toFixed(0) + ' and yardage x' + r.powAll.toExponential(1)
      + ' at the tops; everything maxed walls at Card ' + (r.wallMax + 1) + ' (none: ' + (r.wall0 + 1)
      + '), the room x' + r.gldRoom.toFixed(0) + ' purse; Drive Power at 2,308 reads ' + r.driveLabel
      + '; the Locker kept ' + r.keptDrive + ' Drive and ' + r.keptTempo + ' Pace'];
  }
};
