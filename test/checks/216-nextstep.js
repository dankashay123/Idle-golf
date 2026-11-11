/* What to do next, the Range's capped rows and the call to retire (the user
 * asked for all three after a review of the first weeks):
 *
 *   - a new player sees one line over the menu naming the next thing worth
 *     doing, in order: the first upgrade once he can pay for it, a better
 *     club waiting, points to spend, an open Tour Card (Auto-Climb off), a
 *     wager never tried, the first heirloom; a tap goes there; nothing after
 *     the first retirement or the first heirloom but what can be missed
 *     for days: an heirloom to discover or raise, a talent tree untouched,
 *     the Trials opening; nothing at all in a wager
 *   - on the Range, rows at their cap fold away under one line after the
 *     rows that can still be bought; a tap opens them
 *   - the call to retire at the top of the Range: when every row that has a cap is at it,
 *     or the highest card has not risen in three days and retiring finds an
 *     heirloom; never before retiring pays anything; said once in a toast */
'use strict';
module.exports = {
  name: 'nextstep',
  async run(page) {
    await page.setViewportSize({ width: 320, height: 640 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {}, RN = Date.now, toast0 = toast;
      const fresh = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); S.t = Date.now() / 1000; initState(); migrate(); startHole(); S.owed = []; renderAll(); setView('upg'); };
      const line = () => { renderNext(true); const e = document.getElementById('nextLine'); return e.hidden ? '' : e.innerText.replace(/\s+/g, ' ').trim(); };
      const said = [];
      try {
        hideSheet(); QUIET = false; DEV_OFF = true; toast = h => said.push(String(h));
        // ---- what to do next ----
        fresh();
        if (line()) f('a new game with nothing to do says "' + line() + '"');
        S.gold = 1e4; if (!/first upgrade/i.test(line())) f('with money and no upgrade: "' + line() + '"');
        document.getElementById('nextLine').click(); if (view !== 'upg') f('the upgrade line did not open the Range');
        buyAllUpg(); if (/first upgrade/i.test(line())) f('an upgrade bought and the line still asks for one');
        S.autoEquip = 0; bagAdd(makeItem(1, 0.5, 1, 'driver')); const worn = S.equip.driver;
        bagAdd(makeItem(30, 0.95, 5, 'driver'));
        if (S.equip.driver !== worn) f('a better club was worn over the one carried, Auto-Equip off');
        if (!/better club/i.test(line())) f('a better club waiting: "' + line() + '"');
        document.getElementById('nextLine').click(); if (view !== 'bag') f('the club line did not open the Bag');
        S.statPts = 2; S.talPts = 0; if (!/Spend your points/i.test(line())) f('points to spend: "' + line() + '"');
        S.statPts = 1; if (!/Spend your point\b/i.test(line())) f('one point: "' + line() + '"');
        document.getElementById('nextLine').click(); if (view !== 'career') f('the points line did not open Career');
        S.statPts = 0; S.autoClimb = false; S.tierMax = 1; S.tier = 0; setView('upg');
        if (!/Tour Card 2 is open/i.test(line())) f('a card open: "' + line() + '"');
        S.autoClimb = true; if (/Tour Card/i.test(line())) f('Auto-Climb on and the line still points at the card');
        S.totalHoles = 40; S.tally.runs = 0; if (!/wager/i.test(line())) f('a wager never tried: "' + line() + '"');
        S.tally.runs = 1; if (/wager/i.test(line())) f('a wager played and the line still asks');
        S.evRun = B.RETIRE_EVENTS; S.tier = 20; S.tierMax = 20; retireWorth._t = -1e9;
        o.worth = retireWorth(); if (!o.worth) f('the setup did not make retiring worth it');
        if (!/first heirloom/i.test(line())) f('retiring worth it: "' + line() + '"');
        document.getElementById('nextLine').click(); if (view !== 'career' || careerSub !== 'leg') f('the heirloom line did not open Legacy');
        setView('upg'); S.retires = 1; S.legacy = 0; if (line()) f('after a retirement with nothing to do the line says "' + line() + '"');
        // ---- and after the first retirement: what can be missed for days ----
        S.statPts = 5; S.gold = 1e9; S.bagNew = 1; if (line()) f('after a retirement the first-hour lines came back: "' + line() + '"');
        S.statPts = 0; S.bagNew = 0;
        S.legacy = discoverCost(); if (!/discover an heirloom/i.test(line())) f('an heirloom in reach: "' + line() + '"');
        document.getElementById('nextLine').click(); if (view !== 'career' || careerSub !== 'leg') f('the heirloom line did not open Legacy');
        if (line()) f('on the Legacy page the line still says "' + line() + '"');
        setView('upg'); discover(); S.legacy = 0; if (line()) f('an heirloom found, no legacy left: "' + line() + '"');
        { B.TROPHY.forEach(t => { S.relic[t.id] = Math.max(1, S.relic[t.id] || 0); }); const t = B.TROPHY.reduce((a, t) => upgradeCost(t) < upgradeCost(a) ? t : a); S.legacy = upgradeCost(t); if (!/can be raised/i.test(line())) f('an heirloom to raise: "' + line() + '"'); S.legacy = 0; }
        S.talPts = 1; { const tr = B.TREES[0]; if (!new RegExp(tr.n + ' has no talents yet', 'i').test(line())) f('an untouched tree: "' + line() + '"');
          document.getElementById('nextLine').click(); if (view !== 'career' || careerSub !== 'tal') f('the talent line did not open Talents');
          setView('upg'); B.TREES.forEach(x => { S.tal[x.t.find(t => !t.req).id] = 1; }); if (/talents yet/i.test(line())) f('every tree begun and the line still names one'); }
        S.talPts = 0; S.tierMax = B.CHAL_TIER[0]; S.chalDone = {}; delete S.chal;
        if (!/Trials are open/i.test(line())) f('the Trials open: "' + line() + '"');
        document.getElementById('nextLine').click(); if (view !== 'upg' || rangeSub !== 'chal') f('the Trials line did not open the Trials');
        rangeSub = 'upg'; renderRangeNav(); S.chalDone = { [B.CHAL[0].id]: 1 }; if (/Trials/i.test(line())) f('a Trial won and the line still says so');
        S.chalDone = {}; S.dgnRun = { id: 'sand' }; if (line()) f('in a wager the line says "' + line() + '"'); S.dgnRun = null;
        S.tierMax = 0; S.retires = 1;
        // (one line, inside the screen)
        S.retires = 0; B.TROPHY.forEach(t => { S.relic[t.id] = 0; }); S.statPts = 3; S.talPts = 2; S.tally.runs = 1; line();
        { const e = document.getElementById('nextLine'), b = e.getBoundingClientRect(); o.h = Math.round(b.height);
          if (!(b.height > 10) || b.height > 40 || e.scrollWidth > e.clientWidth + 1) f('the line is ' + Math.round(b.height) + 'px tall or runs out at 320'); }

        // ---- the Range's capped rows ----
        fresh(); S.gold = 0; S.retires = 0;
        const capped = B.UPG.filter(u => isFinite(capOf(u))).slice(0, 5); capped.forEach(u => { S.upg[u.id] = capOf(u); });
        UPG_CAP_OPEN = false; refreshUpg();
        const fold = document.getElementById('upgCapFold'), vis = e => e.getBoundingClientRect().height > 0;
        const rows = () => [...document.querySelectorAll('#upgRows .urow')];
        o.capped = rows().filter(e => e.classList.contains('capped')).length;
        if (o.capped !== capped.length) f(o.capped + ' rows marked capped of ' + capped.length);
        if (fold.hidden || !/5 Capped/i.test(fold.innerText)) f('the fold reads "' + fold.innerText + '"');
        if (rows().some(e => e.classList.contains('capped') && vis(e))) f('a capped row shows with the fold shut');
        if (rows().some(e => !e.classList.contains('capped') && !vis(e))) f('a row that can be bought is hidden');
        { const open = rows().filter(e => !e.classList.contains('capped')), last = open[open.length - 1].getBoundingClientRect().bottom;
          if (fold.getBoundingClientRect().top < last - 1) f('the fold sits above a row that can be bought'); }
        fold.click();
        if (!rows().every(vis)) f('the fold opened and a row is still hidden');
        if (rows().filter(e => e.classList.contains('capped')).some(e => e.getBoundingClientRect().top < fold.getBoundingClientRect().bottom - 1)) f('a capped row sits above its fold');
        fold.click(); capped.forEach(u => { S.upg[u.id] = 0; }); refreshUpg();
        if (!fold.hidden) f('nothing capped and the fold shows');

        // ---- the call to retire ----
        const call = () => { refreshUpg(); const e = document.getElementById('upgRetire'); return e.hidden ? '' : e.innerText.replace(/\s+/g, ' ').trim(); };
        fresh(); said.length = 0;
        B.UPG.forEach(u => { if (isFinite(capOf(u))) S.upg[u.id] = capOf(u); });
        if (call()) f('everything capped before retiring pays, and it says "' + call() + '"');
        S.evRun = B.RETIRE_EVENTS; S.tier = 20; S.tierMax = 20; S.topT = Date.now() / 1000; retireWorth._t = -1e9;
        { if (!/Every cap reached/i.test(call()) || !/legacy/i.test(call())) f('everything capped: "' + call() + '"');
          if (said.filter(x => /cap reached/i.test(x)).length !== 1) f('the call was toasted ' + said.filter(x => /cap reached/i.test(x)).length + ' times');
          call(); call(); if (said.filter(x => /cap reached/i.test(x)).length !== 1) f('the call was toasted again'); }
        B.UPG.forEach(u => { S.upg[u.id] = 0; }); S.retireSaid = 0; said.length = 0;
        if (call()) f('the card rose just now and it says "' + call() + '"');
        S.topT = Date.now() / 1000 - 3 * 86400 - 60;
        if (!/climb has slowed/i.test(call())) f('three days without a new card: "' + call() + '"');
        document.getElementById('upgRetire').click(); if (view !== 'career' || careerSub !== 'leg') f('the call did not open Legacy');
        setView('upg'); S.evRun = 0; if (call()) f('retiring pays nothing yet and it says "' + call() + '"');
        // (a new highest card stamps its time)
        S.topT = 1; S.tierMax = 3; S.tier = 3; DEV.cards(0);
        S.evRun = B.RETIRE_EVENTS; const t0 = S.topT; retire();
        if (!(S.topT > t0)) f('retiring did not start the three days again');
      } finally {
        Date.now = RN; toast = toast0; DEV_OFF = false; QUIET = false; UPG_CAP_OPEN = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole(); renderAll();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['the next thing to do in one line (' + r.o.h + 'px at 320): upgrade, club, points, card, wager, heirloom, each a tap away; after retiring an heirloom to find or raise, a tree untouched, the Trials; none in a wager; ' + r.o.capped + ' capped rows folded under the rest and opened; the call to retire when all is capped or three days without a new card, once in a toast'];
  }
};
