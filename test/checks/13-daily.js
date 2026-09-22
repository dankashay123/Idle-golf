/* Two things that run on their own, so both have to be provably conservative.
 *
 * Auto-equip is the one that can quietly ruin a build. itemScore is a sort
 * key -- it discounts the affixes it cannot price and it knows nothing about
 * sets -- so the obvious implementation swaps into a higher number and off a
 * set tier. This one asks derive() and takes a swap only when it is better on
 * the carry or the purse and worse on neither, which is checked here against
 * clubs built specifically to be a trade-off. It also has to be genuinely off
 * when it is off, and it must never lose a club: what comes out of the bag
 * goes on, what comes off goes back in the bag.
 *
 * The stake of the day has to be the same stake all day. Read off anything in
 * the save and a reload is a reroll, which is the one thing a daily cannot be.
 * It rotates strictly, so every contest comes round on a date you can plan
 * for, and it pays its multiplier on the money and on nothing else -- doubling
 * the gear roll as well would make the other three days not worth opening.
 */
'use strict';
module.exports = {
  name: 'daily',
  async run(page) {
    const r = await page.evaluate(() => {
      const out = {};
      const ids = () => B.SLOTS.map(s => S.equip[s.id] && S.equip[s.id].uid).join(',');
      const held = () => S.bag.length + B.SLOTS.filter(s => !!S.equip[s.id]).length;

      // ---- 1. off means off -------------------------------------------
      DEV.tierSet(10);
      S.bag = []; B.SLOTS.forEach(s => S.equip[s.id] = null);
      S.autoEquip = 0;
      for (let i = 0; i < 30; i++) bagAdd(makeItem(S.tier, 0.4, 1));
      out.offEquipped = B.SLOTS.filter(s => !!S.equip[s.id]).length;
      out.offSwept = autoEquipSweep().length;

      // ---- 2. on, and it never loses a club ---------------------------
      S.autoEquip = 1;
      const before = held();
      const took = autoEquipSweep();
      out.firstSweep = took.length;
      out.heldSame = held() === before;
      out.noDup = new Set(S.bag.map(x => x.uid)).size === S.bag.length
        && B.SLOTS.every(s => !S.equip[s.id] || !S.bag.some(x => x.uid === S.equip[s.id].uid));
      out.settled = autoEquipSweep().length;

      // ---- 3. never a regression on either axis ------------------------
      // a hundred and twenty drops, one at a time, the way a round delivers
      S.bag = []; B.SLOTS.forEach(s => S.equip[s.id] = null);
      const a0 = derive();
      let worse = 0, moves = 0, greedyMoves = 0;
      for (let i = 0; i < 120; i++) {
        const it = makeItem(S.tier, 0.3, 0);
        const cur = S.equip[it.slot];
        if (!cur || itemScore(it) > itemScore(cur)) greedyMoves++;
        const was = ids(), pre = derive();
        bagAdd(it);
        if (ids() !== was) {
          moves++;
          const post = derive();
          if (post.dps < pre.dps * 0.99999 || post.gold < pre.gold * 0.99999) worse++;
        }
      }
      const a1 = derive();
      out.moves = moves; out.greedyMoves = greedyMoves; out.worse = worse;
      out.carryGain = a1.dps / Math.max(1e-9, a0.dps);
      out.purseGain = a1.gold / Math.max(1e-9, a0.gold);

      // what the greedy version would have done from the same locker
      const snapEq = Object.assign({}, S.equip), snapBag = S.bag.slice();
      for (const sl of B.SLOTS) {
        let best = S.equip[sl.id];
        for (const it of S.bag) if (it.slot === sl.id && (!best || itemScore(it) > itemScore(best))) best = it;
        if (best) S.equip[sl.id] = best;
      }
      const g = derive();
      S.equip = snapEq; S.bag = snapBag;
      out.greedyCarry = g.dps / a1.dps;
      out.greedyPurse = g.gold / a1.gold;

      // ---- 4. a straight trade-off stays on the bench -------------------
      let trades = 0, tookTrade = 0;
      for (let i = 0; i < 500 && trades < 60; i++) {
        const it = makeItem(S.tier + 2, 0.6, 1);
        const had = S.equip[it.slot], base = derive();
        S.equip[it.slot] = it; const af = derive(); S.equip[it.slot] = had;
        const isTrade = (af.dps > base.dps * 1.0001 && af.gold < base.gold * 0.9999)
                     || (af.gold > base.gold * 1.0001 && af.dps < base.dps * 0.9999);
        if (!isTrade) continue;
        trades++;
        S.bag.push(it);
        if (autoEquipSweep().some(x => x.uid === it.uid)) tookTrade++;
        S.bag = S.bag.filter(x => x.uid !== it.uid);
      }
      out.trades = trades; out.tookTrade = tookTrade;
      S.autoEquip = 0;

      // ---- 5. the rotation ---------------------------------------------
      FEAT_FORCE = null;
      const cycle = [];
      for (let d = 0; d < B.DGN.length * 3; d++) cycle.push(featOf(d).id);
      out.cycleLen = B.DGN.length;
      out.everyOne = new Set(cycle.slice(0, B.DGN.length)).size === B.DGN.length;
      out.repeats = cycle.slice(0, B.DGN.length).join(',')
        === cycle.slice(B.DGN.length, B.DGN.length * 2).join(',');
      // the same all day: a whole day's worth of milliseconds from a day
      // boundary has to land on one contest
      const day0 = Math.floor(Date.now() / 86400000) * 86400000;
      const sameAllDay = [0, 1, 3600e3, 43200e3, 86399999]
        .map(ms => featOf(Math.floor((day0 + ms) / 86400000)).id);
      out.stableAcrossDay = new Set(sameAllDay).size === 1;
      out.rollsOver = featOf(Math.floor((day0 + 86400e3) / 86400000)).id !== sameAllDay[0];
      out.savesNothing = Object.keys(S).some(k => /feat/i.test(k)) === false;
      out.live = featWager().id;
      out.leftSane = featLeft() > 0 && featLeft() <= 86400;

      // ---- 6. the multiplier lands on the money and nowhere else --------
      // The same run twice off the same state and the same random sequence, so
      // the only difference between the pair is the stake. Anything the
      // multiplier is touching that it should not -- the gear roll, the ticket,
      // the experience -- shows up as a difference here rather than as noise.
      DEV.tierSet(10); S.relic = {}; S.autoEquip = 0;
      const rnd = Math.random;
      const seeded = () => { let x = 123456789;
        return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; };
      const snap = () => JSON.parse(JSON.stringify(S));
      // deep on the way back in as well as on the way out: assigning the
      // snapshot's nested objects straight across hands the run the very
      // objects the snapshot is made of, and the second run of a pair then
      // starts from whatever the first one did to them
      const restore = w => { const c = JSON.parse(JSON.stringify(w));
                             for (const k in S) if (!(k in c)) delete S[k];
                             for (const k in c) S[k] = c[k]; };
      const runOnce = (id, feat, w) => {
        restore(w);
        FEAT_FORCE = feat ? id : B.DGN.find(d => d.id !== id).id;
        Math.random = seeded();
        const d = B.DGN.find(x => x.id === id);
        S.dgnRun = null; S.dgnKeys[d.id] = 1;
        const g0 = S.gold, s0 = S.scroll, b0 = S.bag.length,
              t0 = S.tickets || 0, x0 = S.xp, l0 = S.lv;
        startDgn(d);
        const D = derive();
        for (let i = 0; i < 4000 && S.dgnRun; i++) tickDgn(0.1, D);
        Math.random = rnd;
        try { hideSheet(); } catch (e) {}
        return { gold: S.gold - g0, scroll: S.scroll - s0, gear: S.bag.length - b0,
                 tickets: (S.tickets || 0) - t0, lv: S.lv - l0,
                 xp: S.lv === l0 ? S.xp - x0 : null };
      };
      const w0 = snap();
      const v0 = runOnce('vault', false, w0), v1 = runOnce('vault', true, w0);
      out.vaultPlain = v0.gold; out.vaultFeat = v1.gold;
      out.vaultRatio = v0.gold > 0 ? v1.gold / v0.gold : 0;
      out.vaultGear = [v0.gear, v1.gear];
      out.vaultTick = [v0.tickets, v1.tickets];
      out.vaultXp = [v0.xp, v1.xp];

      const c0 = runOnce('cellar', false, w0), c1 = runOnce('cellar', true, w0);
      out.cellarRatio = c0.scroll > 0 ? c1.scroll / c0.scroll : 0;
      out.cellarGear = [c0.gear, c1.gear];

      restore(w0);
      FEAT_FORCE = null;
      out.featMult = B.DGN_FEAT_MULT;

      // and the shared pricing function stays blind to it, or the chip pot,
      // which accumulates through yieldAt one drop at a time, would double the
      // multiplier in and then double it again at the till
      const dd = B.DGN.find(x => x.id === 'cellar'), DD = derive();
      const y0 = yieldAt(5, DD, dd);
      FEAT_FORCE = 'cellar';
      const y1 = yieldAt(5, DD, dd);
      FEAT_FORCE = null;
      out.yieldBlind = y0 === y1;

      // ---- 7. the screen says which one --------------------------------
      DEV.feat('vault');
      setView('dgn'); renderDgn();
      out.bar = ($('dgnFeat') || {}).innerText || '';
      const cards = [...document.querySelectorAll('.dgn')];
      out.marked = cards.filter(e => e.classList.contains('feat')).length;
      out.markedName = (cards.find(e => e.classList.contains('feat')) || {})
        .querySelector ? cards.find(e => e.classList.contains('feat')).querySelector('.dn').textContent : '';
      out.badges = document.querySelectorAll('.dgn .fstar').length;
      DEV.feat(null);

      // ---- 8. the toggle is on the locker head -------------------------
      setView('bag'); renderBag();
      const btn = $('autoEqBtn');
      out.hasBtn = !!btn;
      out.btnText = btn ? btn.textContent : '';
      out.btnInHead = !!(btn && btn.closest('#lkHead'));
      return out;
    });

    const f = m => { throw new Error(m); };
    if (r.offEquipped !== 0) f('auto-equip was off and still equipped ' + r.offEquipped);
    if (r.offSwept !== 0) f('the sweep ran with the toggle off, taking ' + r.offSwept);
    if (!(r.firstSweep > 0)) f('the first sweep of a full locker took nothing');
    if (!r.heldSame) f('the sweep changed how many clubs are held');
    if (!r.noDup) f('a club ended up worn and in the bag at the same time');
    if (r.settled !== 0) f('the sweep never settles: a second pass took ' + r.settled);
    if (r.worse !== 0) f(r.worse + ' of ' + r.moves + ' auto swaps left a stat lower');
    if (!(r.moves > 0)) f('120 drops and auto-equip never moved');
    if (!(r.carryGain > 2)) f('120 drops only moved the carry ' + r.carryGain.toFixed(2) + 'x');
    if (!(r.trades >= 10)) f('only ' + r.trades + ' trade-off clubs to test against');
    if (r.tookTrade !== 0) f('auto-equip took ' + r.tookTrade + ' of ' + r.trades
      + ' clubs that bought one stat with another');

    if (!r.everyOne) f('the rotation does not reach every contest in one cycle');
    if (!r.repeats) f('the rotation is not a fixed cycle');
    if (!r.stableAcrossDay) f('the stake changes inside a single day');
    if (!r.savesNothing) f('the stake of the day is stored in the save, so a reload rerolls it');
    if (!r.rollsOver) f('the stake does not change at the day boundary');
    if (!r.leftSane) f('the countdown reads ' + r.leftSane);
    if (!r.yieldBlind) f('yieldAt knows about the stake of the day, so the chip pot doubles twice');

    const want = r.featMult;
    if (!(r.vaultPlain > 0)) f('the plain Vault run paid nothing, so there is nothing to compare');
    if (Math.abs(r.vaultRatio - want) > 0.02) f('a featured Vault paid ' + r.vaultRatio.toFixed(3)
      + 'x, not ' + want + 'x (' + r.vaultPlain.toExponential(2) + ' -> ' + r.vaultFeat.toExponential(2) + ')');
    if (r.cellarRatio && Math.abs(r.cellarRatio - want) > 0.02)
      f('a featured Floodlit Green paid ' + r.cellarRatio.toFixed(3) + 'x, not ' + want + 'x');
    if (r.vaultGear[0] !== r.vaultGear[1]) f('a featured Vault dropped '
      + r.vaultGear[1] + ' clubs against ' + r.vaultGear[0] + ': the gear roll is not untouched');
    if (r.cellarGear[0] !== r.cellarGear[1]) f('a featured Floodlit Green dropped '
      + r.cellarGear[1] + ' clubs against ' + r.cellarGear[0]);
    if (r.vaultTick[0] !== r.vaultTick[1]) f('a featured run paid ' + r.vaultTick[1]
      + ' tickets against ' + r.vaultTick[0]);
    if (r.vaultXp[0] !== null && r.vaultXp[0] !== r.vaultXp[1])
      f('a featured run paid different experience');

    if (!/2/.test(r.bar) || !/Vault/.test(r.bar)) f('the bar does not name the stake: "' + r.bar + '"');
    if (r.marked !== 1) f(r.marked + ' contests are marked as the stake of the day');
    if (!/Vault/.test(r.markedName)) f('the marked contest is ' + r.markedName);
    if (r.badges !== 1) f(r.badges + ' badges on the wager cards');

    if (!r.hasBtn) f('no auto-equip toggle in the locker');
    if (!r.btnInHead) f('the auto-equip toggle is not in the locker head');
    if (!/auto/i.test(r.btnText)) f('the toggle reads "' + r.btnText + '"');

    return [
      'auto took ' + r.moves + ' of 120 drops where the sort key would take '
        + r.greedyMoves + ', carry x' + r.carryGain.toFixed(1)
        + ' purse x' + r.purseGain.toFixed(2),
      'greedy from the same locker: carry ' + ((r.greedyCarry - 1) * 100).toFixed(0)
        + '% purse ' + ((r.greedyPurse - 1) * 100).toFixed(0) + '%, and '
        + r.trades + ' trade-offs all left on the bench',
      'rotation of ' + r.cycleLen + ' reaches all four, today is ' + r.live
        + ', Vault paid ' + r.vaultRatio.toFixed(2) + 'x featured'
    ];
  }
};
