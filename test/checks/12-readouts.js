/* The three places the game explains itself.
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

      // the sheet shows it for a spare and not for what you are carrying
      itemSheet(S.bag[0], false);
      out.sheetSpare = !!document.querySelector('#sheet .swap');
      itemSheet(S.equip[B.SLOTS[0].id], true);
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

    return ['preview held the bag over ' + p.tried + ' looks and through a throw, '
      + p.changed + ' moved the carry',
      'away card: ' + a.tiles + ' tiles, ' + a.bands.length + ' bands, '
      + a.lines.length + ' lines and not one of them zero',
      'range line: "' + r.broke.txt.trim().slice(0, 44) + '" / "'
      + r.rich.txt.trim().slice(0, 44) + '"'];
  }
};
