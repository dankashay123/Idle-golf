/* Where retiring puts you.
 *
 * Retiring used to send every golfer back to Card I (or the Chronoglass card),
 * to blaze back up through cards they outdrove by miles -- tolerable only
 * while the course stretched every hole to the golfer. Holes are fixed to
 * their card now, so a retirement lands you on the highest card where a fresh
 * par four still comes in at RETIRE_FIT of par time (a birdie), measured on
 * the golfer you are once the range resets, never above the best card you had
 * reached, and never below the Chronoglass.
 *
 *   - the landing card is a birdie and the one above it is not (unless the
 *     best card reached is the ceiling)
 *   - a golfer far stronger than their best card lands on their best card
 *   - the Chronoglass is a floor
 *   - a second retirement asks an event of its own career first (the count
 *     was a whole life's: after the first event ever, Retire could be tapped
 *     again at once and each paid the cups again); the nine starts afresh
 *     on hole 1 (it read "Front 4/9"); none from inside a wager, nor a
 *     move of card; a save
 *     from before the count keeps its Retire
 *   - retire() itself lands where retireCard() said, with that card open,
 *     and the retirement sheet names it
 *   - a save from before holes were fixed (no holesFixed in it) is moved once,
 *     on load, to the card that matches its golfer, at the start of its event;
 *     the next load leaves it where it is, and so does a save written after a
 *     reset to the defaults (the flag once lived only on S, a wipe dropped it,
 *     and the next reload threw a golfer back to hole 1)
 */
'use strict';
module.exports = {
  name: 'retire',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}; const SNAP = JSON.stringify(S);
      const fresh = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); initState(); migrate(); };
      // (in still weather, as retireCard judges it: the hole it landed on had
      // its own weather, and a slow one read 1.01 of par in a full run)
      const ratioOn = c => B.Y0 * Math.pow(B.TIER_Y, c) / (deriveStill(4).dps * B.PAR_TIME[4]);
      QUIET = true;
      try {
        // a strong bag, a best card of 30, and a full range that will reset
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(40, 0, 4, sl.id); it.el = null; S.equip[sl.id] = it; });
        B.UPG.forEach(u => S.upg[u.id] = Math.min(capOf(u), 300));
        S.tier = 30; S.tierMax = 30; S.bestTier = 30; S.eventsPlayed = 3; S.evRun = 3; startHole();
        const want = retireCard();
        o.want = want;
        // what the sheet says before signing
        QUIET = false;
        const gain = legacyGain(); o.gain = gain;
        // sign
        QUIET = true; hideSheet(); retire(); hideSheet();
        o.landed = S.tier; o.open = S.tierMax;
        o.here = ratioOn(S.tier); o.above = ratioOn(S.tier + 1);
        // far stronger than the best card reached: capped at the best
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(200, 0, 5, sl.id); it.el = null; S.equip[sl.id] = it; });
        S.tier = 3; S.tierMax = 3; S.bestTier = 3; S.eventsPlayed = 3; S.evRun = 3; startHole();
        o.capped = retireCard();
        // the Chronoglass floor
        fresh(); S.relic.chrono = 12; S.tier = 20; S.tierMax = 20; S.bestTier = 20; startHole();
        o.floor = retireCard(); o.chrono = relLv('chrono');
        // the sheet names the card
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(30, 0, 3, sl.id); it.el = null; S.equip[sl.id] = it; });
        S.tier = 25; S.tierMax = 25; S.bestTier = 25; S.eventsPlayed = 3; S.evRun = 3; startHole();
        QUIET = false; setView('career'); careerSub = 'leg'; renderLegacy();
        const btn = document.getElementById('retireBtn');
        if (btn) { btn.onclick(); o.sheet = document.getElementById('sheet').textContent; }
        o.sheetWant = 'Card ' + cardNo(retireCard());
        hideSheet();
        // twice running (the second asks an event of its own first), the
        // nine afresh, and not from inside a wager
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(30, 0, 3, sl.id); it.el = null; S.equip[sl.id] = it; });
        S.tier = 25; S.tierMax = 25; S.bestTier = 25; S.eventsPlayed = 3; S.evRun = 3; S.cups = 4; startHole();
        while (holeInRound(S.hole) !== 5) S.hole++; startHole(); startNine(); S.nine.n = 4; S.nine.birdie = 3;
        const r0 = S.retires, l0 = S.legacy; retire(); hideSheet();
        o.nine = { hir: holeInRound(S.hole), n: S.nine.n, birdie: S.nine.birdie };
        const l1 = S.legacy; o.again = legacyGain(); retire(); hideSheet(); o.twice = { retires: S.retires - r0, second: S.legacy - l1, first: l1 - l0 };
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(30, 0, 3, sl.id); it.el = null; S.equip[sl.id] = it; });
        S.tier = 25; S.tierMax = 25; S.bestTier = 25; S.eventsPlayed = 3; S.evRun = 3; startHole();
        const d = B.DGN[0]; S.dgnKeys[d.id] = 3; startDgn(d); const r1 = S.retires; retire(); hideSheet();
        o.wager = { inIt: !!S.dgnRun, retired: S.retires - r1, tier: S.tier };
        { const t1 = S.tier; climb(-1); o.wager.climbed = S.tier - t1; }
        S.dgnRun = null;
        // an old save, written before careers counted their events, keeps its Retire
        fresh(); delete S.evRun; S.eventsPlayed = 7; initState(); o.old = S.evRun;
      } finally {
        QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    if (!(r.gain > 0)) throw new Error('the retirement setup has nothing to bank, so it tests nothing');
    if (!(r.twice.first > 0) || r.again !== 0 || r.twice.retires !== 1 || r.twice.second !== 0)
      throw new Error('a second retirement at once, with no event of its own: ' + JSON.stringify(r.twice) + ', worth ' + r.again + ' (each paid the cups again)');
    if (r.nine.hir !== 1 || r.nine.n !== 0 || r.nine.birdie !== 0) throw new Error('after retiring, the nine part way through carried on: ' + JSON.stringify(r.nine));
    if (!r.wager.inIt || r.wager.retired !== 0 || r.wager.tier !== 25) throw new Error('retired from inside a wager: ' + JSON.stringify(r.wager));
    if (r.wager.climbed !== 0) throw new Error('moved card from inside a wager: ' + JSON.stringify(r.wager));
    if (r.old !== 7) throw new Error('a save from before careers counted their events lost its Retire (' + r.old + ')');
    if (r.landed !== r.want || r.open !== r.want)
      throw new Error('retireCard() said Card ' + (r.want + 1) + ' but retiring landed on Card ' + (r.landed + 1)
        + ' with Card ' + (r.open + 1) + ' open');
    if (!(r.here <= 0.77))
      throw new Error('landed on a card where a fresh par four takes ' + r.here.toFixed(2) + ' of par: not a birdie');
    if (r.landed < 30 && !(r.above > 0.77))
      throw new Error('the card above the landing is still a birdie (' + r.above.toFixed(2) + ' of par): it landed too low');
    if (r.capped !== 3) throw new Error('a golfer far past their best card (Card 4) would land on Card ' + (r.capped + 1));
    if (!(r.floor >= r.chrono)) throw new Error('a Chronoglass of ' + r.chrono + ' landed below it, on Card ' + (r.floor + 1));
    if (!r.sheet || r.sheet.indexOf(r.sheetWant) < 0)
      throw new Error('the retirement sheet does not name the card it lands on (' + r.sheetWant + '): ' + (r.sheet || '(no sheet)').slice(0, 120));

    // ---- an old save moves once ----------------------------------------------
    const boot = async () => {
      await page.reload();
      await page.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
      return page.evaluate(() => ({ tier: S.tier, max: S.tierMax, hole: S.hole, fixed: S.holesFixed,
        matched: matchedCard(derive()) }));
    };
    // planted on S itself: a reload saves S on its way out, over anything
    // written straight to storage
    await page.evaluate(() => {
      window.step = () => {};
      delete S.holesFixed;
      S.tier = 8; S.tierMax = 8; S.bestTier = 8; S.hole = 7 + 72 * 2;   // mid-way through the third event
      B.SLOTS.forEach(sl => { const it = makeItem(12, 0, 3, sl.id); it.el = null; S.equip[sl.id] = it; });
      save();
    });
    const moved = await boot();
    // (play paused till the reload: a hole finished in the gap now and then
    // and the save came back one hole on, on whichever date it fell)
    await page.evaluate(() => { window.step = () => {}; S.hole += 5; save(); });
    const again = await boot();
    // a reset to the defaults mid-session, then a hole played, then a reload
    await page.evaluate(() => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState());
      initState(); migrate(); S.hole = 40; startHole(); save(); });
    const reset = await boot();
    await page.evaluate(() => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState());
      initState(); migrate(); startHole(); save(); });
    await boot();
    if (moved.tier !== moved.matched || moved.max !== moved.matched || moved.fixed !== 1)
      throw new Error('an old Card 9 save loaded onto Card ' + (moved.tier + 1) + ' with Card ' + (moved.max + 1)
        + ' open; its golfer matches Card ' + (moved.matched + 1));
    if (moved.tier === 8) throw new Error('the old-save setup matches Card 9 already, so it tests nothing');
    // (the game plays on once it has loaded, and on this bag a hole can end in
    // the moment before these are read: one hole on is that, not a move; a
    // move goes back to the start of the event)
    const gap = (h, want) => h - want === 0 || h - want === 1;
    if (!gap(moved.hole, 1 + 72 * 2)) throw new Error('an old save moved to hole ' + moved.hole + ', not the start of its event (' + (1 + 72 * 2) + ')');
    if (again.tier !== moved.tier || !gap(again.hole, moved.hole + 5))
      throw new Error('a second load moved a fixed save again: Card ' + (moved.tier + 1) + ' hole ' + (moved.hole + 5)
        + ' became Card ' + (again.tier + 1) + ' hole ' + again.hole);
    if (!gap(reset.hole, 40)) throw new Error('a save written after a reset reloaded on hole ' + reset.hole + ', not 40');

    return ['an old Card 9 save moves once to Card ' + (moved.tier + 1) + ', the card its golfer matches; '
      + 'the next load and a save after a reset stay put',
      'retiring lands on Card ' + (r.landed + 1) + ' (a fresh par four at ' + r.here.toFixed(2)
      + ' of par, ' + r.above.toFixed(2) + ' on the card above), with it open',
      'capped at the best card reached, floored at the Chronoglass, named on the sheet',
      'a second retirement asks an event of its own first (+' + r.twice.first + ', then nothing); the nine starts afresh; none from inside a wager; an old save keeps its Retire'];
  }
};
