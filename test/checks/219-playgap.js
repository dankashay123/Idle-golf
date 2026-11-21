/* What pays by the hole, spaced by live play (the user asked for the full
 * Mythic set at nine to ten weeks; three simulated players had it in eight:
 * late on a hole is an ace from the tee in about a second, and finds by the
 * tee, Golden Hour's sovereigns and the repeating honours came eight times
 * as often as on the middle cards).
 *
 *   - live play is counted in seconds of steps, never away or in a catch-up
 *   - a find by the tee is laid only when PLAY_GAP.find seconds of play
 *     have passed since the last one was picked up
 *   - Golden Hour's sovereigns come at most once in PLAY_GAP.gold; the
 *     hole's gold is paid again all the same
 *   - a repeating honour pays one at a time, at most once in PLAY_GAP.hon
 *     each, and the count goes on from where it stood
 *   - a broken save is repaired (these marks and the first hour's line) */
'use strict';
module.exports = {
  name: 'playgap',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {}, FC = fairCard;
      try {
        hideSheet(); o.gap = PLAY_GAP.find; HOUR_FORCE = 14; S.totalHoles = Math.max(5, S.totalHoles || 0);
        // ---- the clock ----
        { const D = derive(), t0 = S.playT || 0; QUIET = false; OFFLINE = false;
          for (let i = 0; i < 40; i++) step(0.25, D);
          o.live = +((S.playT || 0) - t0).toFixed(2); if (Math.abs(o.live - 10) > 0.01) f('ten seconds live counted ' + o.live);
          const t1 = S.playT; OFFLINE = true; for (let i = 0; i < 40; i++) step(0.25, D); OFFLINE = false;
          QUIET = true; for (let i = 0; i < 40; i++) step(0.25, D); QUIET = false;
          if (S.playT !== t1) f('away or in a catch-up counted ' + (S.playT - t1) + ' seconds'); }
        // ---- finds by the tee ----
        { QUIET = false; OFFLINE = false; const lay = h => { Scene.drawnN = Scene.stepN; S.hole = h; S.chaos = { n: 'Fair' }; S.findHole = 0; Scene.newHole(h, S.tier); return Scene.props.find(p => p.kind === 19); };
          const hs = []; for (let h = S.hole + 1; hs.length < 4; h++) if (hr(h, 700) < 1 / FIND_ODDS) hs.push(h);
          S.playT = 5000; delete S.findT;
          if (!lay(hs[0])) f('no find on a hole the hash gives, nothing found before');
          payFind(hs[0], findOf(hs[0]));
          if (lay(hs[1])) f('a second find straight after the first');
          S.playT += PLAY_GAP.find - 1; if (lay(hs[2])) f('a find ' + (PLAY_GAP.find - 1) + ' seconds of play after the last');
          S.playT += 2; if (!lay(hs[3])) f('no find ' + (PLAY_GAP.find + 1) + ' seconds of play after the last'); }
        // ---- Golden Hour ----
        { const golds = []; for (let h = 1; golds.length < 3 && h < 200000; h++) if (goldenOn(h, 'Fair') && h % B.ROUND) golds.push(h);
          const fin = h => { S.hole = h; startHole(); S.chaos = { n: 'Fair' }; S.holeGold = 0; S.elapsed = S.parTime * 0.8; S.doneT = null; S.goldPaid = null;
            QUIET = false; OFFLINE = false; const s0 = S.sov || 0, g0 = S.gold; finishHole(derive()); QUIET = true; return { sv: (S.sov || 0) - s0, gold: S.gold - g0 }; };
          const keepW = Scene.watched; Scene.watched = () => true;
          try { S.playT = 9000; delete S.goldT;
            const a = fin(golds[0]); if (a.sv < B.GOLDEN_SOV) f('the first Golden Hour paid ' + a.sv + ' sovereigns');
            const b = fin(golds[1]); if (b.sv >= B.GOLDEN_SOV) f('a second Golden Hour straight after paid ' + b.sv);
            if (!(b.gold > 0)) f('a Golden Hour without sovereigns paid no gold');
            S.playT += PLAY_GAP.gold + 1; const c = fin(golds[2]); if (c.sv < B.GOLDEN_SOV) f('Golden Hour ' + (PLAY_GAP.gold + 1) + ' seconds of play later paid ' + c.sv);
            o.gold = [a.sv, b.sv, c.sv].join('/'); }
          finally { Scene.watched = keepW; } }
        // ---- the repeating honours ----
        { const rep = B.ACH_REP.find(a => a.id === 'rHoles'); QUIET = false; OFFLINE = false;
          fairCard = () => true;
          S.playT = 20000; S.achRepT = {}; checkAch();
          const base = S.achRep.rHoles, s0 = S.sov || 0;
          S.achRep.rHoles = base - 3; checkAch(); o.three = (S.sov || 0) - s0;
          if (o.three !== rep.sov) f('three Steady Hands at once paid ' + o.three + ', not one');
          if (S.achRep.rHoles !== base) f('the count did not go on from where it stood');
          const s1 = S.sov || 0; S.achRep.rHoles = base - 1; checkAch(); if ((S.sov || 0) !== s1) f('a Steady Hand straight after the last paid');
          S.playT += PLAY_GAP.hon - 1; S.achRep.rHoles = base - 1; checkAch(); if ((S.sov || 0) !== s1) f('a Steady Hand ' + (PLAY_GAP.hon - 1) + ' seconds of play later paid');
          S.playT += 2; S.achRep.rHoles = base - 1; checkAch(); if ((S.sov || 0) - s1 !== rep.sov) f('a Steady Hand ' + (PLAY_GAP.hon + 1) + ' seconds of play later paid ' + ((S.sov || 0) - s1));
          QUIET = true; }
        // ---- the Honours list says so, one line ----
        { QUIET = false; trophyRoom('hon'); const e = document.getElementById('honGap');
          if (!e || e.innerText.trim() !== Math.round(PLAY_GAP.hon / 60) + ' minutes apart at most') f('the Honours list: "' + (e ? e.innerText : '') + '"');
          else if (e.getBoundingClientRect().height > parseFloat(getComputedStyle(e).fontSize) * 1.9) f('the Honours note on more than one line');
          hideSheet(); }
        // ---- a broken save is repaired ----
        { S.playT = 'x'; S.findT = 5; S.goldT = -3; S.achRepT = { rHoles: 1e15, rAce: 0 }; migrate();
          if (S.playT !== 0) f('a broken play clock repaired to ' + S.playT);
          if (S.findT !== undefined || S.goldT !== undefined) f('marks past the clock kept: ' + S.findT + ', ' + S.goldT);
          if (S.achRepT.rHoles !== undefined || S.achRepT.rAce !== 0) f('the honours\' marks repaired to ' + JSON.stringify(S.achRepT));
          S.achRepT = [1]; migrate(); if (S.achRepT !== undefined) f('a list for the honours\' marks kept');
          S.bagNew = 'y'; S.bagTold = 99; S.autoTold = 'z'; S.retireSaid = -1; migrate();
          if (S.bagNew !== 0 || S.bagTold !== undefined || S.autoTold !== undefined || S.retireSaid !== undefined) f('the first hour\'s marks repaired to ' + [S.bagNew, S.bagTold, S.autoTold, S.retireSaid].join(', '));
          S.playT = 100; S.findT = 50; S.bagTold = 2; S.autoTold = 1; migrate();
          if (S.findT !== 50 || S.bagTold !== 2 || S.autoTold !== 1) f('sound marks changed by the repair'); }
      } finally { fairCard = FC; HOUR_FORCE = null; QUIET = false; OFFLINE = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); Scene.newHole(S.hole, S.tier); }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['ten seconds live counted ' + r.o.live + ', none away; a find, then none for ' + r.o.gap + ' seconds of play; Golden Hour sovereigns ' + r.o.gold + ' (the second straight after); three Steady Hands at once paid one, the next only after the gap'];
  }
};
