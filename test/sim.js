// A simulated player, an hour a day through the real game, to set the pace
// before changing anything that pays (CLAUDE.md). It plays as a real player
// does: buys the cheapest Range upgrade, spends attribute and talent points,
// upgrades and ascends the clubs it wears, retires when the climb stalls and
// buys and levels heirlooms with the legacy. (The old one never retired and
// stalled at Card 40; a real player climbs a card every two days or so.)
//
//   node test/serve.js &   then   node test/sim.js <free|pass|member|both> <seed> [days]
//   SCALE='{"hon":0.6}' node test/sim.js free 1 84    tries a cut by earnSov key
//
// Prints one line of JSON: the day a full Mythic set is affordable
// (reached), weekly rows (sovereigns, card, highest card, retirements,
// heirlooms found) and sovereigns by source. Runs differ a lot (a set at day
// 44 to 63 for one setting): run several seeds and compare the means.
// Three at once ran past two hours here; one or two at a time.
const { chromium } = require('playwright');
(async () => {
  const [variant, seedS, daysS] = process.argv.slice(2), DAYS = +(daysS || 72);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript((sc) => { window.__sovAuto = 1; window.__noShimmer = 1; window.__SCALE = sc; }, JSON.parse(process.env.SCALE || '{}'));
  await p.goto('http://localhost:8080/index.html'); await p.waitForTimeout(1500);
  const out = await p.evaluate(async ([variant, seedN, DAYS]) => {
    hideSheet();
    const RN = Date.now; let SIMT = Date.UTC(2026, 9, 1, 18, 0, 0); Date.now = () => SIMT;
    window.toast = () => {}; window.showSheet = () => {}; window.hideSheet = () => {};
    Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); S.t = SIMT / 1000;
    initState(); migrate(); startHole();
    let seed = seedN * 7919 + 1; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    S.autoEquip = 1; S.autoClimb = true;
    const SCALE = window.__SCALE || {}; const SRC = {}; const es = earnSov, gs = grantSov;
    window.earnSov = function(n, place, key, label){ const k = String(key || label || '?').split(':')[0]; if (SCALE[k] !== undefined) { n = Math.round(n * SCALE[k]); arguments[0] = n; } SRC[k] = (SRC[k] || 0) + (n || 0); window.__inE = 1; try { return es.apply(this, arguments); } finally { window.__inE = 0; } };
    window.grantSov = function(n, why){ if (window.__inE) return gs.apply(this, arguments); const k = 'grant:' + String(why || '').slice(0, 24); SRC[k] = (SRC[k] || 0) + (n || 0); return gs.apply(this, arguments); };
    const SET = setCost('divine') || 9500;
    const shop = () => {
      for (let g = 0; g < 400; g++) { let best = null, bc = Infinity;
        for (const u of B.UPG) { const lv = upgLv(u.id); if (lv >= capOf(u)) continue; const c = costBulk(u.base, u.r, lv, 1); if (c < bc) { bc = c; best = u; } }
        if (!best || S.gold < bc) break; S.gold -= bc; S.upg[best.id] = upgLv(best.id) + 1; }
      if (S.statPts > 0) { S.stat.drive = (S.stat.drive || 0) + S.statPts; S.statPts = 0; }
    };
    const tal = () => { for (let g = 0; g < 300 && S.talPts > 0; g++) { let did = false;
        for (const tr of B.TREES) { const spent = tr.t.reduce((x, t) => x + (S.tal[t.id] || 0), 0);
          for (const t of tr.t) { const n = S.tal[t.id] || 0; if (n < t.max && spent >= t.req) { S.tal[t.id] = n + 1; S.talPts--; did = true; break; } }
          if (did) break; }
        if (!did) break; } };
    const gear = () => { for (const it of Object.values(S.equip || {})) { if (!it) continue;
        for (let g = 0; g < 30 && it.enh < B.ENH_MAX && (S.grit || 0) >= enhCost(it); g++) enhance(it);
        if (it.rar < B.RARITY.length - 1 && (S.shard || 0) >= ascendCost(it) * 1.5) ascendItem(it); } };
    let topAt = 0, topDay = 0, retires = 0;
    const heir = () => { for (let g = 0; g < 40; g++) { if (trophiesFound() < B.TROPHY.length && S.legacy >= discoverCost()) { discover(); continue; }
        let best = null, bc = Infinity; for (const t of B.TROPHY) { if (!found(t.id) || (S.relic[t.id] || 0) >= trTop(t)) continue; const c = upgradeCost(t); if (c < bc) { bc = c; best = t; } }
        if (best && S.legacy >= bc) { S.legacy -= bc; S.relic[best.id]++; } else break; } };
    const take = () => { try { collect(); } catch (e) {} if (variant === 'pass' || variant === 'both' || true) { try { for (let t = 1; t <= PASS.TIERS; t++) for (const row of ['f', 'p']) passGive(row, t, true); } catch (e) {} } };
    const rows = []; let reached = -1, live = 0;
    for (let day = 0; day < DAYS; day++) {
      SIMT = Date.UTC(2026, 9, 1, 18, 0, 0) + day * 86400000;
      QUIET = false; OFFLINE = false;
      catchUp(); QUIET = false; OFFLINE = false;
      try { checkinClaim(); } catch (e) {}
      if ((variant === 'pass' || variant === 'both') && !passNow().paid) passBuy();
      if ((variant === 'member' || variant === 'both') && !isMember()) buyMember();
      take();
      for (let t = 0; t < 3600; t += B.TICK_MAX) {
        step(B.TICK_MAX, derive()); SIMT += B.TICK_MAX * 1000;
        if ((t % 20) < B.TICK_MAX) shop();
        if ((t % 300) < B.TICK_MAX) { tal(); gear(); }
        if ((t % 600) < B.TICK_MAX) take();
      }
      take(); shop(); tal(); gear(); heir();
      if ((S.tierMax || 0) > topAt) { topAt = S.tierMax; topDay = day; }
      if (day - topDay >= 3 && legacyGain() > 0) { const P = legacyPreview(); if (P.after > P.held || day - topDay >= 6) { retire(); retires++; heir(); topAt = S.tierMax || 0; topDay = day; } }
      S.t = SIMT / 1000;
      if (reached < 0 && S.sov >= SET) reached = day + 1;
      if (day % 7 === 6 || day === DAYS - 1) rows.push({ day: day + 1, sov: S.sov, card: S.tier + 1, top: Math.max(S.tierMax || 0, S.bestTier || 0) + 1, ret: retires, heir: trophiesFound() });
      await new Promise(r => setTimeout(r, 0));
    }
    Date.now = RN;
    return { variant, seed: seedN, set: SET, reached, rows, src: SRC };
  }, [variant, +seedS, DAYS]);
  out.errs = errs.slice(0, 3);
  console.log(JSON.stringify(out));
  await b.close();
})();
