/* The five places the game explains itself.
 *
 * The equip preview answers the only question the item sheet gets opened to
 * ask. It works by putting the club in, asking derive(), and putting the old
 * one back, so the thing that matters most here is that it puts the old one
 * back: a leak would silently equip clubs you only looked at.
 *
 * The away card is what earns the next session. It used to be a flat list with
 * a purse figure at the top and six zeroes under it; it now shows only the
 * lines that have something on them, so a row on that card means something
 * happened.
 *
 * The Range line turns a wall of grey into a next step, and it has to be right
 * about which rung that is -- naming one you cannot afford, or claiming
 * nothing is in reach when something is, is worse than saying nothing.
 *
 * The retirement screen showed the legacy figure in exactly one place, on the
 * button, and only once the first event was in the book. Every term in the
 * formula is something you actively control and none of them was visible as a
 * rate, so the only question worth asking -- one more Tour Card, or sign now --
 * could not be answered off the screen. It now shows the figure as it grows,
 * what one more card and one more cup would each add, and what the result buys
 * in the trophy room, where the price is exponential in how full the room
 * already is.
 *
 * The honours list sorted on one key, done against not done, and left the rest
 * in the order the table happened to be typed. Every row already works out how
 * far along it is to draw its own bar; the list is now ordered on it, and the
 * nearest few are named at the top and on the button.
 */
'use strict';
module.exports = {
  name: 'readouts',
  async run(page) {
    const r = await page.evaluate(() => {
      const out = {};

      DEV.tierSet(12); S.sov = 99999;
      for (let i = 0; i < 3; i++) openBag(B.BAGS[1]);
      try { hideSheet(); } catch (e) {}

      // ---- 1. the preview puts back what it borrowed --------------------
      // worst club in every slot, so every spare is an upgrade
      for (const sl of B.SLOTS) {
        const c = S.bag.filter(x => x.slot === sl.id)
          .sort((a, b) => itemScore(a) - itemScore(b))[0];
        if (c) equipItem(c);
      }
      const snap = () => B.SLOTS.map(sl => (S.equip[sl.id] || {}).uid).join(',');
      const bagSnap = () => S.bag.map(x => x.uid).join(',');
      const beforeEquip = snap(), beforeBag = bagSnap();
      let moved = 0, changed = 0, nulls = 0;
      for (const it of S.bag) {
        const sw = previewSwap(it);
        if (snap() !== beforeEquip) moved++;
        if (sw && sw.after.dps !== sw.before.dps) changed++;
        if (!sw) nulls++;
      }
      // and a club already in the bag has nothing to preview
      for (const sl of B.SLOTS) {
        const w = S.equip[sl.id];
        if (w && previewSwap(w) !== null) nulls--;
      }
      // even when it throws mid swap, the club goes back
      let threw = false;
      const og = window.activeSets;
      try {
        window.activeSets = () => { throw new Error('boom'); };
        previewSwap(S.bag[0]);
      } catch (e) { threw = true; } finally { window.activeSets = og; }
      out.preview = { moved, changed, nulls, tried: S.bag.length, threw,
                      equipHeld: snap() === beforeEquip, bagHeld: bagSnap() === beforeBag };

      // The sheet shows it for a spare and not for what you are carrying.
      // Which slot is being carried is not something the setup above decides:
      // it equips the worst club in each slot THAT THE BAGS HAPPENED TO DROP,
      // and three bags is fifteen clubs over six slots, so the driver comes up
      // empty about one run in fifteen -- (5/6)^15. Asking for B.SLOTS[0] by
      // position was a one-in-fifteen crash inside the check dressed up as a
      // flake. Take a slot that is actually worn, and say so if none is.
      if (!S.bag.length) throw new Error('the bags dropped nothing, so there is no spare to open');
      itemSheet(S.bag[0], false);
      out.sheetSpare = !!document.querySelector('#sheet .swap');
      const wornSlot = B.SLOTS.find(sl => S.equip[sl.id]);
      if (!wornSlot) throw new Error('no club is being carried in any slot, so the sheet '
        + 'for a worn club cannot be tested');
      out.wornSlot = wornSlot.id;
      itemSheet(S.equip[wornSlot.id], true);
      out.sheetWorn = !!document.querySelector('#sheet .swap');
      try { hideSheet(); } catch (e) {}

      // ---- 2. the away card -------------------------------------------
      DEV.maxCapped(); DEV.set(2); DEV.lv(40); DEV.tierSet(9); S.bag = [];
      try { hideSheet(); } catch (e) {}
      S.t = Date.now()/1000 - 9*3600;
      offline();
      const sheet = document.getElementById('sheet');
      out.away = {
        tiles: sheet.querySelectorAll('.awst').length,
        bands: [...sheet.querySelectorAll('.awband')].map(e => e.textContent),
        lines: [...sheet.querySelectorAll('.lb')].map(e => e.textContent),
        best: !!sheet.querySelector('.awbest'),
        text: sheet.textContent
      };
      try { hideSheet(); } catch (e) {}

      // ---- 3. the Range line ------------------------------------------
      DEV.clearUpg(); try { hideSheet(); } catch (e) {}
      const step = () => { refreshUpg(); const e = document.getElementById('upgStep');
        return { cls: e.className, txt: e.textContent }; };
      S.gold = 0;    out.broke = step();
      S.gold = 1e6;  out.rich  = step();
      // and what it names has to be a real rung at a price you can meet
      const names = B.UPG.map(u => u.n);
      out.richNames = names.filter(n => out.rich.txt.indexOf(n) >= 0);
      let cheapest = null;
      for (const u of B.UPG) {
        const lv = upgLv(u.id);
        if (lv >= capOf(u)) continue;
        const c = costOf(u.base, u.r, lv);
        if (c <= S.gold && (!cheapest || c < cheapest.c)) cheapest = { n: u.n, c };
      }
      out.trueCheapest = cheapest;

      // ---- 4. the retirement preview -----------------------------------
      S.cups = 4; S.legacy = 400; S.eventsPlayed = 0; S.relic = {};
      renderLegacy();
      const legTxt = () => $('legBox').textContent;
      out.legBefore = legTxt();
      out.legEarlyBtn = !!$('retireBtn');
      out.legPreview = legacyPreview();
      out.legHand = {
        now:  legacyFor(S.tier, S.cups),
        card: legacyFor(S.tier + 1, S.cups) - legacyFor(S.tier, S.cups),
        cup:  legacyFor(S.tier, S.cups + 1) - legacyFor(S.tier, S.cups)
      };
      // the discovery price climbs with every trophy found, so a purse of
      // legacy has to buy fewer of them the further in you are
      out.discSteps = [0, 1, 2, 3, 4].map(n => discoverCostAt(n));
      out.buys = [0, 10, 100, 1000, 100000].map(v => discoveriesFor(v));
      S.eventsPlayed = 9; renderLegacy();
      out.legAfter = legTxt();
      out.legHasBtn = !!$('retireBtn');

      // ---- 5. honours read nearest first -------------------------------
      checkAch();
      S.achDone[B.ACH[0].id] = 1;               // the FIRST row in table order
      const hw = document.createElement('div');
      honRows(hw);
      const hrows = Array.from(hw.querySelectorAll('.row'));
      out.honLocked = hrows.map(e => e.classList.contains('locked'));
      out.honPct = hrows.map(e => { const b = e.querySelector('.hbar i');
                                    return b ? parseFloat(b.style.width) : null; });
      out.honFirstName = hrows.length
        ? hrows[0].querySelector('.nm').textContent.replace(/^\u2713 /, '') : '';
      out.honDoneAt = out.honLocked.indexOf(false);
      out.honTableFirst = B.ACH[0].n;
      out.honHints = Array.from(hw.querySelectorAll('.hint')).map(e => e.textContent);
      out.honNear = achNear(3).map(a => a.n);
      renderHonBtn();
      out.honBtnLabel = $('honBtn').getAttribute('aria-label');
      return out;
    });

    const p = r.preview;
    if (p.moved)
      throw new Error('the preview left a club equipped on ' + p.moved + ' of ' + p.tried
        + ' looks. It swaps a club in to ask derive() what it would do; it has to swap the '
        + 'old one back every single time.');
    if (!p.equipHeld || !p.bagHeld)
      throw new Error('the bag or the equipped set changed while previewing');
    if (!p.threw || !p.equipHeld)
      throw new Error('a throw mid preview left the wrong club equipped');
    if (!(p.changed > 0))
      throw new Error('no preview moved the carry at all, so it is not reading the swap');
    if (p.nulls !== 0)
      throw new Error('a club already being carried should have nothing to preview, '
        + (p.nulls > 0 ? p.nulls + ' spare clubs returned nothing' : 'and ' + (-p.nulls)
          + ' carried ones offered a preview'));
    if (!r.sheetSpare) throw new Error('the item sheet shows no preview for a spare club');
    if (!r.wornSlot) throw new Error('the check never found a worn slot to test');
    if (r.sheetWorn) throw new Error('the item sheet previews the club you are already carrying');

    const a = r.away;
    if (a.tiles !== 3)
      throw new Error('the away card has ' + a.tiles + ' headline tiles, expected purse, holes, clubs');
    if (a.bands.indexOf('Back on the tee') < 0)
      throw new Error('the away card does not say where you are back on the tee');
    const zero = a.lines.filter(l => /\s(0|\+0)$/.test(l.trim()));
    if (zero.length)
      throw new Error('the away card lists ' + zero.length + ' row(s) that did not happen: '
        + zero.join(' / ') + '. A row on that card should mean something happened.');
    if (!a.best)
      throw new Error('nine hours away found no club worth showing, so the best-of block '
        + 'never rendered and this check is not testing it');

    for (const [k, v] of [['broke', r.broke], ['rich', r.rich]]) {
      if (!/^nextstep (go|wait|done)$/.test(v.cls))
        throw new Error('the Range line is in no state at all when ' + k + ': "' + v.cls + '"');
      if (!v.txt.trim()) throw new Error('the Range line is blank when ' + k);
    }
    if (r.broke.cls !== 'nextstep wait')
      throw new Error('with no purse the Range says "' + r.broke.txt + '"');
    if (r.rich.cls !== 'nextstep go')
      throw new Error('with a purse in hand the Range says "' + r.rich.txt + '"');
    if (!r.trueCheapest)
      throw new Error('nothing was affordable in the rich case, so it proves nothing');
    if (r.rich.txt.indexOf(r.trueCheapest.n) < 0)
      throw new Error('the Range calls the cheapest rung "' + r.richNames.join('/')
        + '" when it is ' + r.trueCheapest.n);

    // ---- the retirement preview ---------------------------------------
    const P = r.legPreview, H = r.legHand;
    if (P.now !== H.now) throw new Error('the preview says the card is worth ' + P.now
      + ' where legacyFor says ' + H.now);
    if (P.card !== H.card || P.cup !== H.cup)
      throw new Error('the slopes read +' + P.card + '/+' + P.cup + ' against a hand '
        + 'calculation of +' + H.card + '/+' + H.cup);
    if (!(P.card > 0 && P.cup > 0))
      throw new Error('one more card adds ' + P.card + ' and one more cup ' + P.cup
        + '. Both move the formula, so both have to show as moving it.');
    if (r.legEarlyBtn) throw new Error('the Retire button is live before the first event');
    if (!r.legHasBtn) throw new Error('the Retire button never appears once the first '
      + 'event is in the book');
    if (!/[1-9]/.test(r.legBefore))
      throw new Error('the screen shows no figure at all before retirement opens: "'
        + r.legBefore.slice(0, 90) + '"');
    for (const want of ['One more Tour Card', 'One more cup', 'It buys'])
      if (r.legBefore.indexOf(want) < 0)
        throw new Error('the retirement screen never says "' + want + '" before the first '
          + 'event, which is exactly when the decision is being made');
    if (r.legAfter.indexOf('It buys') < 0)
      throw new Error('the retirement screen stops saying what the legacy buys once '
        + 'retirement opens');
    for (let i = 1; i < r.discSteps.length; i++)
      if (!(r.discSteps[i] > r.discSteps[i - 1]))
        throw new Error('trophy ' + i + ' costs ' + r.discSteps[i] + ' against '
          + r.discSteps[i - 1] + ' for the one before. "It buys N" only means something '
          + 'while the price climbs.');
    for (let i = 1; i < r.buys.length; i++)
      if (r.buys[i] < r.buys[i - 1])
        throw new Error('more legacy bought fewer trophies: ' + r.buys.join(', '));
    if (!(r.buys[r.buys.length - 1] > 0))
      throw new Error('a hundred thousand legacy buys nothing, so the figure is not wired');

    // ---- honours, nearest first ---------------------------------------
    const lockedPct = r.honPct.filter((v, i) => r.honLocked[i]);
    for (let i = 1; i < lockedPct.length; i++)
      if (lockedPct[i] > lockedPct[i - 1] + 1e-6)
        throw new Error('the honours list goes ' + lockedPct[i - 1].toFixed(1) + '% then '
          + lockedPct[i].toFixed(1) + '% at row ' + i + '. The one you are closest to '
          + 'should be the one at the top.');
    if (r.honDoneAt >= 0 && r.honLocked.slice(r.honDoneAt).some(Boolean))
      throw new Error('a locked honour sits below a finished one, so the chase is '
        + 'buried under the shelf');
    if (!r.honNear.length) throw new Error('nothing is locked, so the ordering proves nothing');
    if (r.honFirstName !== r.honNear[0])
      throw new Error('the list opens on "' + r.honFirstName + '" when the nearest is "'
        + r.honNear[0] + '"');
    if (r.honFirstName === r.honTableFirst)
      throw new Error('the list still opens on the first row of the table');
    if (!r.honHints.some(h => h.indexOf('Closest') === 0 && h.indexOf(r.honNear[0]) > 0))
      throw new Error('the honours sheet never names the nearest one: '
        + JSON.stringify(r.honHints));
    if (r.honBtnLabel.indexOf(r.honNear[0]) < 0)
      throw new Error('the honours button says "' + r.honBtnLabel + '" instead of naming '
        + 'the nearest honour');

    return ['preview held the bag over ' + p.tried + ' looks and through a throw, '
      + p.changed + ' moved the carry',
      'away card: ' + a.tiles + ' tiles, ' + a.bands.length + ' bands, '
      + a.lines.length + ' lines and not one of them zero',
      'range line: "' + r.broke.txt.trim().slice(0, 44) + '" / "'
      + r.rich.txt.trim().slice(0, 44) + '"',
      'retirement before the first event: ' + P.now + ' legacy, +' + P.card + ' a card, +'
      + P.cup + ' a cup, buys ' + r.buys.join('/') + ' at ' + r.discSteps.join('/'),
      'honours open on "' + r.honFirstName + '" at ' + (r.honPct[0] || 0).toFixed(0)
      + '%, not "' + r.honTableFirst + '"; ' + lockedPct.length + ' locked in order'];
  }
};
