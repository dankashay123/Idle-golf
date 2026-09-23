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
      const ratioOn = c => B.Y0 * Math.pow(B.TIER_Y, c) / (derive().dps * B.PAR_TIME[4]);
      QUIET = true;
      try {
        // a strong bag, a best card of 30, and a full range that will reset
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(40, 0, 4, sl.id); it.el = null; S.equip[sl.id] = it; });
        B.UPG.forEach(u => S.upg[u.id] = Math.min(capOf(u), 300));
        S.tier = 30; S.tierMax = 30; S.bestTier = 30; S.eventsPlayed = 3; startHole();
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
        S.tier = 3; S.tierMax = 3; S.bestTier = 3; S.eventsPlayed = 3; startHole();
        o.capped = retireCard();
        // the Chronoglass floor
        fresh(); S.relic.chrono = 12; S.tier = 20; S.tierMax = 20; S.bestTier = 20; startHole();
        o.floor = retireCard(); o.chrono = relLv('chrono');
        // the sheet names the card
        fresh();
        B.SLOTS.forEach(sl => { const it = makeItem(30, 0, 3, sl.id); it.el = null; S.equip[sl.id] = it; });
        S.tier = 25; S.tierMax = 25; S.bestTier = 25; S.eventsPlayed = 3; startHole();
        QUIET = false; setView('career'); careerSub = 'leg'; renderLegacy();
        const btn = document.getElementById('retireBtn');
        if (btn) { btn.onclick(); o.sheet = document.getElementById('sheet').textContent; }
        o.sheetWant = 'Card ' + roman(retireCard());
        hideSheet();
      } finally {
        QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    if (!(r.gain > 0)) throw new Error('the retirement setup has nothing to bank, so it tests nothing');
    if (r.landed !== r.want || r.open !== r.want)
      throw new Error('retireCard() said Card ' + (r.want + 1) + ' but retiring landed on Card ' + (r.landed + 1)
        + ' with Card ' + (r.open + 1) + ' open');
    if (!(r.here <= 0.77))
      throw new Error('landed on a card where a fresh par four takes ' + r.here.toFixed(2) + ' of par: not a birdie');
    if (r.landed < 30 && !(r.above > 0.77))
      throw new Error('the card above the landing is still a birdie (' + r.above.toFixed(2) + ' of par): it landed too low');
    if (r.capped !== 3) throw new Error('a golfer far past their best card (Card IV) would land on Card ' + (r.capped + 1));
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
      delete S.holesFixed;
      S.tier = 8; S.tierMax = 8; S.bestTier = 8; S.hole = 7 + 72 * 2;   // mid-way through the third event
      B.SLOTS.forEach(sl => { const it = makeItem(12, 0, 3, sl.id); it.el = null; S.equip[sl.id] = it; });
      save();
    });
    const moved = await boot();
    await page.evaluate(() => { S.hole += 5; save(); });
    const again = await boot();
    // a reset to the defaults mid-session, then a hole played, then a reload
    await page.evaluate(() => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState());
      initState(); migrate(); S.hole = 40; startHole(); save(); });
    const reset = await boot();
    await page.evaluate(() => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState());
      initState(); migrate(); startHole(); save(); });
    await boot();
    if (moved.tier !== moved.matched || moved.max !== moved.matched || moved.fixed !== 1)
      throw new Error('an old Card IX save loaded onto Card ' + (moved.tier + 1) + ' with Card ' + (moved.max + 1)
        + ' open; its golfer matches Card ' + (moved.matched + 1));
    if (moved.tier === 8) throw new Error('the old-save setup matches Card IX already, so it tests nothing');
    if (moved.hole !== 1 + 72 * 2) throw new Error('an old save moved to hole ' + moved.hole + ', not the start of its event (' + (1 + 72 * 2) + ')');
    if (again.tier !== moved.tier || again.hole !== moved.hole + 5)
      throw new Error('a second load moved a fixed save again: Card ' + (moved.tier + 1) + ' hole ' + (moved.hole + 5)
        + ' became Card ' + (again.tier + 1) + ' hole ' + again.hole);
    if (reset.hole !== 40) throw new Error('a save written after a reset reloaded on hole ' + reset.hole + ', not 40');

    return ['an old Card IX save moves once to Card ' + (moved.tier + 1) + ', the card its golfer matches; '
      + 'the next load and a save after a reset stay put',
      'retiring lands on Card ' + (r.landed + 1) + ' (a fresh par four at ' + r.here.toFixed(2)
      + ' of par, ' + r.above.toFixed(2) + ' on the card above), with it open',
      'capped at the best card reached, floored at the Chronoglass, named on the sheet'];
  }
};
