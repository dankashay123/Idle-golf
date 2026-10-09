/* Wager medals (the user asked for the wagers to be more fun): bronze,
 * silver and gold for a run's own score, each paid once; the Island Green's
 * Leave says Bank, as leaving banks its pot.
 *
 *   - each wager's medal from its score, the Long Drive's against the bag's
 *     usual best (the same on any card)
 *   - a new medal pays once (a ticket; 5 and 10 sovereigns waiting on
 *     Today), a medal again pays nothing, a lower one takes none away
 *   - the end sheet and the wager's card show them; a broken save repaired */
'use strict';
module.exports = {
  name: 'medals',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), was = SOV_AUTO, tw = window.toast;
      try {
        hideSheet(); window.toast = () => {}; SOV_AUTO = false; S.owed = []; delete S.wgMedal;
        const D = derive(), dw = B.DGN.find(x => x.id === 'water');
        let M = wgMedal(dw, { mode: 'island', made: 2 }, D); if (M.got) f('2 greens a medal');
        const t0 = S.tickets || 0; M = wgMedal(dw, { mode: 'island', made: 5 }, D);
        if (M.got !== 2 || M.fresh.join() !== '0,1') f('5 greens: ' + JSON.stringify(M));
        if ((S.tickets || 0) !== t0 + 1) f('bronze paid ' + ((S.tickets || 0) - t0) + ' tickets');
        if (owedSum('today') !== 3) f('silver waiting ' + owedSum('today'));
        M = wgMedal(dw, { mode: 'island', made: 5 }, D); if (M.fresh.length || owedSum('today') !== 3) f('silver paid twice');
        M = wgMedal(dw, { mode: 'island', made: 3 }, D); if (S.wgMedal.water !== 2) f('a lower run took a medal away');
        M = wgMedal(dw, { mode: 'island', made: 9 }, D); if (M.got !== 3 || owedSum('today') !== 8) f('gold: ' + JSON.stringify(M) + ' waiting ' + owedSum('today'));
        // the Long Drive: against its usual best, so the same on any card
        const ds = B.DGN.find(x => x.id === 'sand'); const e = wgScore({ mode: 'drive', best: 1 }, D);
        const g1 = wgMedal(ds, { mode: 'drive', best: 1.5 / e }, D).got; if (g1 !== 2) f('a drive 1.5x its usual best: ' + g1);
        S.wgMedal.sand = 0; const tier0 = S.tier; S.tier = 80; const D2 = derive(); const e2 = wgScore({ mode: 'drive', best: 1 }, D2);
        if (wgMedal(ds, { mode: 'drive', best: 1.5 / e2 }, D2).got !== 2) f('the same drive medal on Card 81 differs'); S.tier = tier0;
        // the end sheet and the card
        S.wgMedal = {}; const dv = B.DGN.find(x => x.id === 'scramble'); S.dgnKeys[dv.id] = 2; startDgn(dv);
        const R = S.dgnRun; R.made = 5; R.shot = B.SCRAMBLE_HOLES; R.t = R.dur + 1; endDgn(dv, R, derive());
        const sh = document.getElementById('sheet').textContent; if (!/Medal/.test(sh) || !/Silver/.test(sh)) f('the end sheet: ' + sh.slice(0, 200));
        hideSheet(); setView('dgn'); renderDgn(); if (document.querySelectorAll('#dgnRows .medals').length !== B.DGN.length) f('medals on ' + document.querySelectorAll('#dgnRows .medals').length + ' cards');
        // Bank
        const di = B.DGN.find(x => x.id === 'water'); S.dgnKeys.water = 2; startDgn(di); renderLeave();
        if (document.getElementById('leaveTxt').textContent !== 'Bank') f('the Island Green\'s button reads ' + document.getElementById('leaveTxt').textContent);
        leaveDgn(); leaveDgn(); hideSheet();
        const dc = B.DGN.find(x => x.id === 'cellar'); S.dgnKeys.cellar = 2; startDgn(dc); renderLeave();
        if (document.getElementById('leaveTxt').textContent !== 'Leave') f('the Floodlit Green\'s button reads ' + document.getElementById('leaveTxt').textContent);
        leaveDgn(); leaveDgn(); hideSheet();
        // the Spotted tag in a wager: above the corner's words, never over them
        { const dv2 = B.DGN.find(x => x.id === 'vault'); S.dgnKeys.vault = 2; startDgn(dv2); QUIET = false; Scene.draw(0, derive());
          spotShow(['squirrel'], 0, null, 'Wager Book'); const tg = document.getElementById('spotTag'), hole = document.getElementById('hole');
          const bot = tg.offsetTop + tg.offsetHeight, wt = Scene.wgTop * hole.clientHeight / VH + hole.offsetTop;
          if (!(bot <= wt + 1)) f('in a wager the tag reaches ' + bot + ', the corner\'s words start at ' + wt);
          tg.style.display = 'none'; leaveDgn(); leaveDgn(); hideSheet(); }
        // repair
        S.wgMedal = { water: 7, nope: 1, sand: 0 }; migrate(); if (JSON.stringify(S.wgMedal) !== '{"water":3}') f('repaired to ' + JSON.stringify(S.wgMedal));
      } finally { window.toast = tw; SOV_AUTO = was; S.dgnRun = null; hideSheet(); const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); renderLeave(); }
      return fails;
    });
    if (r.length) throw new Error(r.join('; '));
    return ['medals from each run\'s score, the drive\'s the same on any card; paid once, never taken; shown on the sheet and the cards; Bank on the Island Green; repaired'];
  }
};
