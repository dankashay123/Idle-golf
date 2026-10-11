/* Loadouts (the user picked them from the menu): three saved bags worn with
 * one tap; one can be the wagers' bag, on as a wager starts and the course's
 * clubs back as it ends.
 *
 *   - saved: the club in every slot; worn: each goes back on, the one it
 *     replaced to the locker, nothing lost or doubled; auto-equip off
 *   - a club scrapped since is passed by and said
 *   - the wagers' bag on as one starts (its pay counted with it) and the
 *     course's back as it ends, left part way too; time away in the middle
 *     of a wager is the course's, played with its own bag (the wager's
 *     played it), the wager's back on after
 *   - a broken save repaired */
'use strict';
module.exports = {
  name: 'loadouts',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), tw = window.toast; let said = [];
      try {
        hideSheet(); window.toast = h => said.push(h); QUIET = false;
        S.bag = []; delete S.loads; S.loadWager = -1; S.loadBack = null; S.autoEquip = 1;
        const A = {}, Bk = {};
        for (const sl of B.SLOTS) { A[sl.id] = makeItem(5, 0, 2, sl.id); Bk[sl.id] = makeItem(5, 0, 3, sl.id); S.equip[sl.id] = A[sl.id]; S.bag.push(Bk[sl.id]); }
        const uids = () => B.SLOTS.map(sl => S.equip[sl.id].uid).join();
        const count = () => S.bag.length + B.SLOTS.filter(sl => S.equip[sl.id]).length;
        const n0 = count();
        loadSave(0);
        for (const sl of B.SLOTS) equipItem(Bk[sl.id]);
        loadSave(1);
        if (uids() !== B.SLOTS.map(sl => Bk[sl.id].uid).join()) f('set up wrong');
        loadWear(0);
        if (uids() !== B.SLOTS.map(sl => A[sl.id].uid).join()) f('loadout 1 not worn: ' + uids());
        if (count() !== n0) f('clubs lost or doubled: ' + n0 + ' to ' + count());
        if (S.autoEquip) f('auto-equip left on');
        // ---- a club scrapped since ----
        S.bag = S.bag.filter(x => x.uid !== Bk.driver.uid); said = [];
        const w = loadWear(1);
        if (!w || w.gone !== 1) f('a scrapped club: ' + JSON.stringify(w));
        if (S.equip.driver !== A.driver) f('the driver changed though its club was scrapped');
        if (!said.some(h => /scrapped since/.test(h))) f('not said: ' + said.join(' | '));
        S.bag.push(Bk.driver); loadWear(0);
        // ---- the wagers' bag ----
        S.loadWager = 1; const before = uids(), d = B.DGN.find(x => x.mode === 'drive');
        S.dgnKeys[d.id] = 2; startDgn(d);
        if (uids() !== B.SLOTS.map(sl => Bk[sl.id].uid).join()) f('the wagers\' bag not on as the wager started');
        const R = S.dgnRun; R.t = R.dur + 1; R.settle = 0.01; tickDgn(0.02, derive());
        if (S.dgnRun) f('the wager did not end');
        if (uids() !== before) f('the course\'s bag not back as it ended: ' + uids());
        // (left part way)
        startDgn(d); if (uids() === before) f('not on the second time'); leaveDgn(); leaveDgn();
        if (S.dgnRun) f('could not leave');
        if (uids() !== before) f('the course\'s bag not back after leaving');
        if (count() !== n0) f('clubs lost or doubled through the wagers: ' + count());
        // ---- time away in the middle of a wager: the course's time, its own bag ----
        { const mr = Math.random, seeded = () => { let q = 11; Math.random = () => (q = (q * 16807) % 2147483647) / 2147483647; };
          const keep = JSON.stringify(S), awayGain = wager => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(keep));
            S.dgnKeys[d.id] = 2; if (wager) startDgn(d); seeded(); const g0 = S.gold; S.t = Date.now() / 1000 - 7200; QUIET = true; offline(); QUIET = false; hideSheet(); Math.random = mr; return S.gold - g0; };
          const plain = awayGain(false), mid = awayGain(true), onWager = uids() === B.SLOTS.map(sl => Bk[sl.id].uid).join();
          leaveDgn(); leaveDgn(); const back = uids() === before;
          if (!(plain > 0) || Math.abs(mid / plain - 1) > 0.02) f('two hours away paid ' + mid + ' in a wager, ' + plain + ' on the course: the wager\'s bag played the course');
          if (!onWager) f('after time away the wager\'s bag was not on again'); if (!back) f('the course\'s bag not back at the wager\'s end after time away');
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(keep)); }
        // ---- repair ----
        S.loads = [{ u: { driver: A.driver.uid, nose: 5 } }, 'x', null, { u: {} }]; S.loadWager = 9; S.loadBack = 'y'; migrate();
        if (!Array.isArray(S.loads) || S.loads.length !== 3 || S.loads[1] !== null || S.loads[0].u.nose !== undefined || S.loads[0].u.driver !== A.driver.uid) f('loads repaired to ' + JSON.stringify(S.loads));
        if (S.loadWager !== undefined) f('a wagers\' bag of 9 kept'); if (S.loadBack !== undefined) f('a broken bag to put back kept');
        // ---- the strip ----
        setView('bag'); renderBag(); if (document.querySelectorAll('#loadBar [data-ld]').length !== LOAD_N) f('the strip shows ' + document.querySelectorAll('#loadBar [data-ld]').length);
      } finally { window.toast = tw; hideSheet(); S.dgnRun = null; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); renderBag(); }
      return fails;
    });
    if (r.length) throw new Error(r.join('; '));
    return ['saved and worn, nothing lost or doubled, auto-equip off; a scrapped club passed by and said; the wagers\' bag on and the course\'s back, at the end or left part way; repaired'];
  }
};
