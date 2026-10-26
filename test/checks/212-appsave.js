/* The save kept by the app too (the iPhone can clear a web view's storage
 * when it runs short of room; the user chose to guard against it before the
 * app is built). With a stand-in for the app's storage:
 *
 *   - before the app's copy is read at launch, a save leaves it alone
 *   - every save writes the same save there as to the browser's storage
 *   - at launch, with the browser's save gone (a fresh game started) and the
 *     app's copy ahead, the app's copy is taken up in place: his holes and
 *     sovereigns back, the time away played out (the clock
 *     on), the browser's storage holding it again
 *   - the app's copy behind the browser's changes nothing; an empty one is
 *     filled with this save
 *   - erasing the save erases the app's copy, so it cannot come back
 *   - on the web (not the app) none of it: nothing is written there */
'use strict';
module.exports = {
  name: 'appsave',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {};
      const tick = () => new Promise(res => setTimeout(res, 0));
      const store = new Map(); let writes = 0;
      const stub = { get: k => Promise.resolve(store.has(k) ? store.get(k) : null), set: (k, v) => { writes++; store.set(k, v); return Promise.resolve(); }, remove: k => { store.delete(k); return Promise.resolve(); } };
      try {
        hideSheet(); QUIET = true;
        // ---- the web: untouched --------------------------------------------
        window.MMSave = stub; delete window.__inApp;
        save(); if (writes) f('on the web the save was written to the app\'s storage');
        // ---- the app: written alongside ------------------------------------
        window.__inApp = 1; vaultRead = false;
        // ---- before the app's copy is read at launch, nothing is written over it
        store.set(KEY, '{"ver":1,"saveSeq":99,"keep":1}'); writes = 0;
        save(); await tick();
        if (writes || JSON.parse(store.get(KEY)).keep !== 1) f('a save before the launch\'s read wrote over the app\'s copy');
        store.clear(); await vaultCheck(); await tick();
        S.totalHoles = 4321; S.sov = 777; const tier0 = S.tier;
        save(); await tick();
        const kept = store.get(KEY);
        if (!kept || kept !== localStorage.getItem(KEY)) f('in the app a save is not the same in both places');
        if (!kept) throw new Error('in the app a save was not written to the app\'s storage');
        const played = JSON.parse(kept); o.seq = played.saveSeq;
        // ---- the browser's save gone, a fresh game, the app's copy ahead -----
        played.t = Date.now() / 1000 - 3600;   // (an hour away)
        played.saveSeq = 50; store.set(KEY, JSON.stringify(played));
        localStorage.removeItem(KEY);
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); initState(); migrate(); S.saveSeq = 2;
        const took = await vaultCheck(); await tick();
        o.took = took;
        if (!took) f('the app\'s copy ahead was not taken up');
        if (S.totalHoles < 4321 || S.tier < tier0 || S.sov < 777) f('taken up, the save reads ' + S.totalHoles + ' holes, ' + S.sov + ' sovereigns');
        o.away = S.totalHoles - 4321;
        if (!(o.away > 0)) f('his hour away was not played out (' + o.away + ' holes)');
        { const back = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!back || back.totalHoles < 4321) f('the browser\'s storage does not hold the save again'); }
        // ---- the app's copy behind: nothing changes --------------------------
        const behind = JSON.parse(store.get(KEY)); behind.saveSeq = 1; behind.totalHoles = 5; store.set(KEY, JSON.stringify(behind));
        const h0 = S.totalHoles; const took2 = await vaultCheck();
        if (took2 || S.totalHoles !== h0) f('an app copy behind the browser\'s was taken up');
        // ---- an empty one is filled ------------------------------------------
        store.clear(); await vaultCheck(); await tick();
        if (!store.get(KEY)) f('an empty app copy was not filled');
        // ---- erasing erases it -----------------------------------------------
        reallyWipe(); await tick();
        const after = store.get(KEY); const a = after ? JSON.parse(after) : null;
        if (a && a.totalHoles >= 4321) f('the erased save is still kept by the app');
        hideSheet();
      } finally {
        delete window.MMSave; delete window.__inApp; QUIET = false; WIPED = false; vaultRead = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); save(); hideSheet();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['in the app every save kept in both places; the browser\'s gone and the app\'s ahead, taken up in place, its hour away played (' + r.o.away + ' holes); behind, nothing; empty, filled; erased, erased; on the web untouched'];
  }
};
