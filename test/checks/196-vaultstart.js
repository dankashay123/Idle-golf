/* The Vault starts no deeper than a floor the golfer clears in half the run
 * (a wager sweep found it: it starts three below the deepest floor reached,
 * which only ever grows, so after a retirement, the range work gone, every
 * run began on a floor he could not clear and paid nothing):
 *   - a weak golfer whose deepest floor is 400 starts on a floor he clears,
 *     and the run pays prize money; the card's projection agrees
 *   - a golfer whose start was in reach keeps it, floor for floor */
'use strict';
module.exports = {
  name: 'vaultstart',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), tw = window.toast, fails = [], o = {};
      window.toast = () => {};
      try {
        hideSheet();
        const d = B.DGN.find(x => x.id === 'vault'), dur = () => d.run * (career().sharp ? 1.4 : 1);
        // deep and weak
        S.dgnFloor.vault = 400; S.dgnKeys.vault = entryCap(d); S.dgnRun = null;
        let D = derive(); const g0 = S.gold;
        o.proj = dgnPayout(d, D).floors; if (!(o.proj > 0)) fail('from floor 400 the Vault card projects ' + o.proj + ' floors for a run that pays');
        startDgn(d); const R = S.dgnRun;
        o.deep = R.floor; o.work = floorWork(R.floor) / (D.dps * dur());
        if (!(o.work <= 0.5)) fail('from floor 400 the Vault started on ' + R.floor + ', taking ' + o.work.toFixed(1) + ' runs to clear');
        let t = 0; while (S.dgnRun && t < d.run * 2) { step(0.05, derive()); t += 0.05; } hideSheet();
        o.paid = S.gold - g0; if (!(o.paid > 0)) fail('the run from floor 400 paid ' + o.paid);
        // in reach: kept
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = true; DEV.tierSet(59); DEV.lv(40); DEV.upg(400); QUIET = false; hideSheet();
        D = derive(); let f = 0; while (floorWork(f + 4) < D.dps * dur() * 0.2) f++;
        S.dgnFloor.vault = f + 3; S.dgnKeys.vault = entryCap(d); S.dgnRun = null;
        const want = dgnStartFloor('vault'); if (!(want >= 5)) fail('the strong golfer\'s start floor only ' + want); startDgn(d); o.kept = S.dgnRun.floor + '/' + want;
        if (S.dgnRun.floor !== want) fail('a start floor in reach (' + want + ') became ' + S.dgnRun.floor);
        let t2 = 0; while (S.dgnRun && t2 < d.run * 2) { step(0.05, derive()); t2 += 0.05; } hideSheet();
        function fail(m) { fails.push(m); }
      } finally { QUIET = false; window.toast = tw; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['from floor 400 a weak golfer starts on floor ' + r.o.deep + ' (' + Math.round(r.o.work * 100) + '% of a run to clear) and is paid, the card projecting ' + r.o.proj + ' floors; a start in reach kept (' + r.o.kept + ')'];
  }
};
