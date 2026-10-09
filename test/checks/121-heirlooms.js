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
 * Then the user wanted the wall "more than 200-250", levels past 30 not "so
 * exponential", and plain card numbers:
 *
 *   - every heirloom has a top of its own under TR_MAX; to Lv 30 a level
 *     compounds as before, past it each level adds the same step and costs
 *     the same amount more; no multiplier passes x10M at its top, and every
 *     stat's heirlooms together stay under their ceiling (prize money x1,500
 *     for all three)
 *   - a ladder never gets cheaper than it pays (cost outruns gain)
 *   - a save at 250 everywhere comes back at each top, every heirloom kept,
 *     and nothing reads past a top even if a level slips through
 *   - holes grow x4 a card to Card 101 and gentler past it; a length reads
 *     back as its own card
 *   - a golfer with everything maxed (Mythic gear at +15 with every star,
 *     talents, attributes, 5,000 paragon in each open line, the bench, a
 *     membership, eight hours of each card's purse spent on the Range, all
 *     thirty heirlooms at their tops) walls between Card 200 and 250, and
 *     near Card 83 with no heirlooms, as before
 *   - no card is shown in Roman numerals anywhere
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
        const CEIL = { gld: 1500, pow: 1e13, cpw: 1e5, spd: 2e4, dgn: 5e3 };
        const per = {};
        for (const t of B.TROPHY) {
          const top = trTop(t);
          if (!(t.max > 0 && t.max <= B.TR_MAX)) f(t.n + ' has no top of its own (' + t.max + ')');
          if (!t.g) continue;
          const at = trophyMultAt(t, top);
          if (!(at <= 1e7)) f(t.n + ' reaches x' + fmt(at) + ' at its top of ' + top);
          // to the knee it compounds as it always did; past it, the same step
          // a level and the same rise in price a level
          if (Math.abs(trophyMultAt(t, 10) / Math.pow(t.g, 10) - 1) > 1e-9) f(t.n + ' at Lv 10 is not x' + t.g + ' a level');
          if (top > B.TR_KNEE + 2) {
            const K = B.TR_KNEE, step = trophyMultAt(t, K + 1) - trophyMultAt(t, K);
            const step2 = trophyMultAt(t, top) - trophyMultAt(t, top - 1);
            if (!(Math.abs(step2 / step - 1) < 1e-6)) f(t.n + ' past ' + K + ' steps ' + fmt(step) + ' then ' + fmt(step2) + ': it still compounds');
            const pr = lv => { S.relic[t.id] = lv; return upgradeCost(t); };
            // the price: the first levels as they always were, steeper late,
            // a steady rise a level past the knee, and always more than it pays
            const raw = lv => trophyPriceAt(t, lv);
            if (Math.abs(raw(10) / Math.pow(trophyRatio(t), 10) - 1) > 1e-9) f(t.n + ' at Lv 10 costs ' + fmt(raw(10)) + ', not what it did');
            const q1 = raw(K + 1) / raw(K), q2 = raw(top - 1) / raw(top - 2);
            if (!(Math.abs(q1 / q2 - 1) < 1e-9)) f(t.n + ' price past ' + K + ' rises x' + q1.toFixed(3) + ' then x' + q2.toFixed(3) + ' a level');
            if (!(q1 > trophyMultAt(t, K + 1) / trophyMultAt(t, K))) f(t.n + ' past ' + K + ' costs x' + q1.toFixed(3) + ' a level for x' + (trophyMultAt(t, K + 1) / trophyMultAt(t, K)).toFixed(3));
            if (!(raw(K) / raw(K - 1) > trophyRatio(t))) f(t.n + ' is no steeper at Lv ' + K + ' than at Lv 10');
            o.lin = o.lin || {}; if (t.id === 'heart' || t.id === 'gilded')
              o.lin[t.id] = [K, Math.min(2 * K, top), top].map(lv => fmt(trophyMultAt(t, lv)) + '/' + fmt(pr(lv))); S.relic[t.id] = 0;
          }
          if (!(trophyRatio(t) > t.g)) f(t.n + ' costs x' + trophyRatio(t).toFixed(3) + ' a level and pays x' + t.g);
          const k = t.k.slice(1); per[k] = (per[k] || 1) * at;
        }
        for (const k in per) if (!(per[k] <= (CEIL[k] || 1e12)))
          f('the ' + k + ' heirlooms together reach x' + fmt(per[k]) + ', over x' + fmt(CEIL[k] || 1e12));
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

        // ---- how long the room lasts ------------------------------------------
        // a career that retires every ten cups on about the card it would
        // reach, Legacy, Collector and Curator paragon full, every legacy spent
        // on a discovery, then the cheapest raise
        const fillAt = () => { const keepP = Object.assign({}, S.paraSpent), keepC = S.cups;
          S.paraSpent['long.plegacy'] = 500; S.paraSpent['long.pcurate'] = 500; S.paraSpent['long.pdisc'] = 500;
          B.TROPHY.forEach(t => S.relic[t.id] = 0);
          let L = 0, nd = 0, fill = 0;
          for (let N = 10; N <= 800 && !fill; N += 10) {
            S.cups = N; L += legacyFor(Math.min(220, 80 + N), N);
            while (nd < B.TROPHY.length && L >= discoverCostAt(nd)) { L -= discoverCostAt(nd); S.relic[B.TROPHY[nd].id] = 1; nd++; }
            for (let it = 0; it < 100000; it++) { let best = null, bc = Infinity;
              for (const t of B.TROPHY) { if (!S.relic[t.id] || S.relic[t.id] >= trTop(t) || t.k === '@chrono') continue;
                const c = upgradeCost(t); if (c < bc) { bc = c; best = t; } }
              if (!best || bc > L) break; L -= bc; S.relic[best.id]++; }
            if (B.TROPHY.every(t => t.k === '@chrono' || S.relic[t.id] >= trTop(t))) fill = N;
          }
          Object.assign(S.paraSpent, keepP); S.cups = keepC; B.TROPHY.forEach(t => S.relic[t.id] = 0); return fill; };
        o.fill = fillAt();
        if (!(o.fill >= 270 && o.fill <= 330)) f('the room is at its tops after ' + (o.fill || 'more than 800') + ' cups, not about 300');
        // the first three retirements of a new career (Cards 8, 15 and 22 with
        // 1, 5 and 10 cups, no paragon): a discovery and raises from them
        { const keepP = Object.assign({}, S.paraSpent); B.PARAGON.forEach(c => c.a.forEach(a => S.paraSpent[c.id + '.' + a.id] = 0));
          B.TROPHY.forEach(t => S.relic[t.id] = 0);
          let L = 0, nd = 0, raises = 0; o.early = [];
          for (const [tier, cups] of [[7, 1], [14, 5], [21, 10]]) {
            L += legacyFor(tier, cups); const d0 = nd, r0 = raises;
            while (nd < B.TROPHY.length && L >= discoverCostAt(nd) && (nd < 1 || raises >= nd)) { L -= discoverCostAt(nd); S.relic[B.TROPHY[(nd * 7) % B.TROPHY.length].id] = 1; nd++; }
            for (let it = 0; it < 1000; it++) { let best = null, bc = Infinity;
              for (const t of B.TROPHY) { if (!S.relic[t.id] || S.relic[t.id] >= trTop(t)) continue; const c = upgradeCost(t); if (c < bc) { bc = c; best = t; } }
              if (!best || bc > L) break; L -= bc; S.relic[best.id]++; raises++; }
            o.early.push(legacyFor(tier, cups) + ' legacy: ' + (nd - d0) + ' found, ' + (raises - r0) + ' raised');
          }
          if (!(nd >= 1 && raises >= 3)) f('the first three retirements buy ' + nd + ' discoveries and ' + raises + ' raises');
          Object.assign(S.paraSpent, keepP); B.TROPHY.forEach(t => S.relic[t.id] = 0); }

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
        if (!(o.gldRoom <= 1500)) f('the room multiplies the purse by ' + fmt(o.gldRoom) + ' with everything maxed');
        // the user: a wall "more than 200-250", and still a wall
        if (!(o.wallMax + 1 >= 200 && o.wallMax + 1 <= 250)) f('a golfer with everything maxed plays to Card ' + (o.wallMax + 1) + ', not 200 to 250 (no heirlooms: ' + (o.wall0 + 1) + ')');
        if (!(o.wall0 + 1 >= 75 && o.wall0 + 1 <= 95)) f('with no heirlooms he plays to Card ' + (o.wall0 + 1) + ', not about 83 as before');
        // the ladder up to Card TIER_K + 1 is the one he knew: x4 a card
        for (const c of [0, 1, 40, 99]) if (Math.abs(cardLen(c + 1) / cardLen(c) - 4) > 1e-9) f('Card ' + (c + 2) + ' is x' + (cardLen(c + 1) / cardLen(c)).toFixed(2) + ' Card ' + (c + 1));
        for (const c of [0, 7, 55, 99, 100, 180, 399]) { const back = Math.floor(cardOfLen(cardLen(c) * 1.0001));
          if (back !== c) f('the card a hole of Card ' + (c + 1) + "'s length matches reads back as " + (back + 1)); }

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
        if (!o.rows.slice(1).every(t => /Level \d+\/\d+/.test(t))) f('an heirloom row does not show its top: ' + o.rows.slice(1).find(t => !/Level \d+\/\d+/.test(t)));
        setView('upg');
        if (seen.length) f('shown raw: ' + seen.slice(0, 3).join(' | '));

        // ---- cards are plain numbers ------------------------------------------
        if (cardNo(0) !== '1' || cardNo(11) !== '12' || cardNo(399) !== '400') f('cards read ' + [cardNo(0), cardNo(11), cardNo(399)].join(', ') + ', not 1, 12, 400');
        const roman = [];
        const rlook = where => { const m = document.body.innerText.match(/[^\n]{0,20}\bCards? [IVXL]+\b[^\n]{0,10}/); if (m) roman.push(where + ': ' + m[0]); };
        for (const t0 of [0, 3, 11]) {
          S.tier = t0; S.tierMax = t0 + 1; S.bestTier = t0 + 1; startHole(); hideSheet(); renderAll(); renderVitals();
          if ($('cardRoman').textContent !== String(t0 + 1)) f('the header reads Tour Card ' + $('cardRoman').textContent + ' on Card ' + (t0 + 1));
          renderAll(); for (const v of ['upg', 'bag', 'dgn', 'tour']) { setView(v); rlook(v + ' on ' + (t0 + 1)); }
          for (const s2 of ['stat', 'leg']) { careerSub = s2; setView('career'); renderCareer(); rlook('career ' + s2); }
          S.eventsPlayed = 9; careerSub = 'leg'; renderCareer();
          if ($('retireBtn')) { $('retireBtn').click(); rlook('retire sheet'); } else if (legacyGain() > 0) f('no retire button to open the sheet with');
          hideSheet();
        }
        DEV.open(); rlook('developer menu'); hideSheet();
        QUIET = false; trophyRoom('hon'); rlook('honours'); trophyRoom('case'); rlook('cabinet'); hideSheet(); QUIET = true;
        for (const a of B.ACH) if (/Card [IVXL]+\b/.test(a.d)) roman.push('honour ' + a.n + ': ' + a.d);
        o.chronoTxt = trophyEff(trophyDef('chrono'), 12);
        if (/Card [IVXL]+\b/.test(o.chronoTxt)) roman.push('Chronoglass: ' + o.chronoTxt);
        setView('upg');
        if (roman.length) f('a card in Roman numerals: ' + roman.slice(0, 3).join(' | '));

        // ---- the Locker and the Chronoglass -------------------------------
        S.relic.vault = trTop(trophyDef('vault')); S.relic.chrono = trTop(trophyDef('chrono'));
        B.UPG.forEach(u => S.upg[u.id] = 0); S.upg.drive = 30; S.upg.tempo = 700;
        S.tier = 20; S.tierMax = 20; S.bestTier = 20; S.eventsPlayed = 9; S.retires = 0;
        o.land = retireCard();
        if (o.land > 20) f('the Chronoglass landed on Card ' + (o.land + 1) + ', past the best card reached (21)');
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
      + '; past 30 (multiplier/price at 30, 60 or top, top): Heart ' + r.lin.heart.join(' ') + ', Gilded ' + r.lin.gilded.join(' ')
      + '; the room fills at ' + r.fill + ' cups; first retirements ' + r.early.join(', ')
      + '; the Locker kept ' + r.keptDrive + ' Drive and ' + r.keptTempo + ' Pace'];
  }
};
