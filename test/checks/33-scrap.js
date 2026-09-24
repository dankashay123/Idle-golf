/* Scrapping clubs from the locker, in bulk and as they drop.
 *
 * The Scrap button on the locker opens one sheet: auto-scrap for what drops
 * from now on, chosen by rarity, and the locker cleared by rarity now.
 *
 *   - auto-scrap is off on a new save, and a save carrying junk loads it off
 *   - on, a club that drops at or under the rarity chosen is broken up on
 *     arrival and paid in shards, and one above it is kept
 *   - it never takes a piece of a named set, a Mythic, or the best club in
 *     the locker for its slot when that beats the one worn: the first version
 *     kept every club for an empty slot, since each of them beats nothing, and
 *     the sheet read "7 clubs, 7 kept" all the way down
 *   - auto-equip goes first, so an upgrade it puts on is worn, not scrapped
 *   - away, the drops are scrapped as they land and the card says so
 *   - scrapping a rarity now takes every club of it the rules above do not
 *     keep and pays what the rows said; Legendary and Mythic take a second
 *     tap; the spares past the best two in each slot keep set pieces
 */
'use strict';
module.exports = {
  name: 'scrap',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {};
      // a club of just this rarity, plain or a set piece, and no affixes: the
      // roll can come out a rarity higher with that rarity's affixes, and a
      // purse affix on the worn glove made a glove thirty levels better a
      // trade-off auto-equip rightly left on the bench, on one run in three
      const mk = (slot, rar, ilvl, set) => {
        const it = makeItem(ilvl, 0, rar, slot); it.rar = rar; it.aff = []; delete it.set;
        if (set) it.set = B.SETS.find(x => x.named).id;
        return it;
      };
      const strong = () => B.SLOTS.forEach(sl => { S.equip[sl.id] = mk(sl.id, 3, S.tier + 40); });
      try {
        hideSheet(); QUIET = true; S.autoEquip = 0;
        o.def = defaultState().autoScrap;

        // ---- as they drop ----------------------------------------------------
        strong(); S.bag = []; S.autoScrap = -1;
        let c = mk('driver', 0, S.tier);
        o.offKept = bagAdd(c) && S.bag.includes(c);
        S.autoScrap = 0; S.bag = [];
        c = mk('driver', 0, S.tier); let sh0 = S.shard || 0;
        o.comGone = !bagAdd(c) && !S.bag.includes(c);
        o.comPaid = (S.shard || 0) - sh0 === scrapValue(c);
        o.uncKept = bagAdd(mk('driver', 1, S.tier));
        // one that beats what he carries is kept, the best of them only
        S.equip.irons = mk('irons', 0, 0);
        o.upKept = bagAdd(mk('irons', 0, S.tier + 20));
        o.up2Gone = !bagAdd(mk('irons', 0, S.tier + 10));
        // nothing worn: the best one is kept, a worse one after it is not
        S.equip.wedge = null;
        o.emptyFirst = bagAdd(mk('wedge', 0, S.tier + 5));
        o.emptySecond = !bagAdd(mk('wedge', 0, S.tier));
        // set pieces and Mythics are never taken
        S.autoScrap = 2;
        o.setKept = bagAdd(mk('putter', 2, S.tier, true));
        o.rareGone = !bagAdd(mk('putter', 2, S.tier));
        S.autoScrap = autoScrapTop(); o.top = B.RARITY[autoScrapTop()].n;
        o.mythKept = bagAdd(mk('ball', 5, 0));
        // auto-equip first
        S.autoEquip = 1; S.autoScrap = 0; S.equip.glove = mk('glove', 0, 0);
        const g = mk('glove', 0, S.tier + 30); bagAdd(g);
        o.sweptWorn = S.equip.glove === g; o.sweptWhere = S.bag.includes(g) ? 'left on the bench' : 'scrapped';
        S.autoEquip = 0;

        // ---- away ------------------------------------------------------------
        strong(); S.bag = []; S.autoScrap = 1;
        const shA = S.shard || 0; QUIET = false;
        // half an hour: few enough drops that the locker never fills, so what
        // is gone went to auto-scrap and not to the overflow (six hours filled
        // it, and the overflow cleared the low clubs with auto-scrap off)
        S.t = Date.now() / 1000 - 1800; offline();
        const card = document.getElementById('sheet').textContent;
        o.awayLine = (card.match(/Auto-scrapped \d+/) || [''])[0];
        o.awayLow = S.bag.filter(x => x.rar <= 1).length; o.awayHeld = S.bag.length + '/' + bagCap();
        o.awayPaid = (S.shard || 0) > shA;
        hideSheet(); QUIET = true;

        // ---- the sheet -------------------------------------------------------
        strong(); S.autoScrap = -1; S.bag = [];
        for (const sl of B.SLOTS) S.bag.push(mk(sl.id, 0, S.tier), mk(sl.id, 0, S.tier + 1));
        S.bag.push(mk('driver', 4, S.tier), mk('driver', 4, S.tier + 1));
        // six putters for the spares: a set piece, and five ten levels past it
        // (at a level or two apart its random affixes put it in the best two
        // on some runs, and then only one other putter stays)
        S.bag.push(mk('putter', 2, 0, true));
        for (let i = 0; i < 5; i++) S.bag.push(mk('putter', 1, S.tier + 10 + i));
        QUIET = false; setView('bag'); bagSub = 'gear'; renderBag();
        document.getElementById('scrapBtn').click();
        const sheet = () => document.getElementById('sheet');
        o.opened = /Scrap Clubs/.test(sheet().textContent);
        o.pills = [...sheet().querySelectorAll('[data-auto]')].map(b => b.textContent).join(',');
        sheet().querySelector('[data-auto="2"]').click();
        o.pick = S.autoScrap + '/' + sheet().querySelector('[data-auto="2"]').classList.contains('on')
          + '/' + document.getElementById('scrapBtn').textContent;
        // the spares past the best two, set piece kept
        const putters = () => S.bag.filter(x => x.slot === 'putter');
        sheet().querySelector('[data-scrap="spare"]').click();
        o.spares = putters().length + '/' + putters().some(x => x.set);
        // the commons: what the row said, paid
        const row = [...sheet().querySelectorAll('.row')].find(e => /^Common/.test(e.textContent));
        const said = +(row.querySelector('.ds').textContent.match(/\+(\d+)/) || [0, -1])[1];
        const shB = S.shard || 0; sheet().querySelector('[data-scrap="0"]').click();
        o.commons = S.bag.filter(x => x.rar === 0).length + '/' + ((S.shard || 0) - shB) + '/' + said;
        // a Legendary takes two taps
        const nL = () => S.bag.filter(x => x.rar === 4).length, L0 = nL();
        const lb = sheet().querySelector('[data-scrap="4"]'); lb.click();
        o.legOne = nL() === L0 && /again/i.test(lb.textContent);
        lb.click(); o.legTwo = L0 + '->' + nL();
        hideSheet();

        // ---- a save with junk in it -------------------------------------------
        o.repair = [];
        for (const [v, want] of [['x', -1], [9, -1], [2.5, -1], [-3, -1], [2, 2], [-1, -1]]) {
          S.autoScrap = v; initState(); if (S.autoScrap !== want) o.repair.push(JSON.stringify(v) + ' loaded as ' + S.autoScrap);
        }
      } finally {
        QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); setView('upg'); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.def !== -1) f('auto-scrap starts ' + r.def + ' on a new save, not off');
    if (!r.offKept) f('with auto-scrap off a Common drop did not reach the locker');
    if (!r.comGone || !r.comPaid) f('auto-scrap on Commons left a Common drop in the locker (' + r.comGone + ') or paid wrong (' + r.comPaid + ')');
    if (!r.uncKept) f('auto-scrap on Commons took an Uncommon');
    if (!r.upKept || !r.up2Gone) f('the best upgrade for a slot was ' + (r.upKept ? 'kept' : 'scrapped')
      + ' and a lesser one ' + (r.up2Gone ? 'scrapped' : 'kept') + ' (want kept, then scrapped)');
    if (!r.emptyFirst || !r.emptySecond) f('with nothing worn in a slot the first club was ' + (r.emptyFirst ? 'kept' : 'scrapped')
      + ' and a worse one after it ' + (r.emptySecond ? 'scrapped' : 'kept') + ': every club for an empty slot beats nothing');
    if (!r.setKept || !r.rareGone) f('on Rare a set piece was ' + (r.setKept ? 'kept' : 'scrapped') + ' and a plain Rare ' + (r.rareGone ? 'scrapped' : 'kept'));
    if (!r.mythKept) f('auto-scrap at its top setting (' + r.top + ') took a Mythic');
    if (!r.sweptWorn) f('an upgrade auto-equip should have put on was ' + r.sweptWhere);
    if (!r.awayLine || r.awayLow || !r.awayPaid) f('away with auto-scrap on Uncommons: card says "' + r.awayLine + '", '
      + r.awayLow + ' Common or Uncommon clubs left (locker ' + r.awayHeld + '), paid ' + r.awayPaid);
    if (!r.opened) f('the Scrap button did not open the scrap sheet');
    if (r.pills !== 'Off,Common,Uncommon,Rare,Epic,Legendary') f('the auto-scrap choices read ' + r.pills);
    if (r.pick !== '2/true/Scrap · auto') f('choosing Rare left auto-scrap/lit/button at ' + r.pick);
    if (r.spares !== '3/true') f('scrapping the spares left ' + r.spares + ' putters/set piece (want the best two and the set piece)');
    const [left, paid, said] = r.commons.split('/').map(Number);
    if (left !== 0 || paid !== said || !(paid > 0)) f('scrapping the Commons left ' + left + ' and paid ' + paid + ' where the row said +' + said);
    if (!r.legOne) f('one tap on the Legendary row scrapped them, or did not ask again');
    if (r.legTwo !== '2->0') f('two taps on the Legendary row went ' + r.legTwo);
    if (r.repair.length) f('a save with junk in its auto-scrap: ' + r.repair.join('; '));
    return ['off to start; on, drops at or under the rarity are scrapped on arrival and paid; set pieces, Mythics and the best upgrade kept',
      'auto-equip goes first; away, the drops are scrapped as they land and the card says ' + r.awayLine,
      'the sheet: six choices, the Commons scrapped for what the row said, Legendaries on a second tap, spares keep set pieces'];
  }
};
