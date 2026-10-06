/* A broken save never stops the game (the user asked for a save-safety
 * pass): a save played two hours, then each part of it in turn replaced by
 * junk of every kind (gone, nothing, a word, a negative, a huge number, an
 * empty list, an empty table, true), loaded as the game loads one (laid over
 * a new save, then repaired), played a few steps, drawn, and every screen
 * opened: nothing throws and the golfer's numbers stay real. Before the
 * repair put each part back to a new save's when it was of the wrong kind,
 * about sixty of these stopped the game outright. */
'use strict';
module.exports = {
  name: 'savefuzz',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), out = []; let n = 0;
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      try {
        hideSheet();
        Object.keys(S).forEach(q => delete S[q]); Object.assign(S, defaultState()); initState(); migrate(); startHole();
        for (let t = 0; t < 7200; t += B.TICK_MAX) step(B.TICK_MAX, derive());
        // (and the parts a save only has once they are first needed)
        for (const k of ['sigRec', 'seasonsGot', 'guide', 'bond', 'aceAt', 'courseBest', 'chalDone']) if (S[k] === undefined) S[k] = {};
        const GOOD = JSON.stringify(S), keys = Object.keys(S);
        const JUNK = [['gone'], ['nothing', null], ['a word', 'x'], ['negative', -5], ['huge', 1e300], ['a list', []], ['a table', {}], ['true', true]];
        for (const k of keys) for (const [jn, jv] of JUNK) {
          n++;
          const s = JSON.parse(GOOD); if (jn === 'gone') delete s[k]; else s[k] = jv;
          Object.keys(S).forEach(q => delete S[q]); Object.assign(S, defaultState(), JSON.parse(JSON.stringify(s)));
          try {
            migrate(); startHole(); for (let i = 0; i < 40; i++) step(B.TICK_MAX, derive());
            QUIET = false; try { Scene.draw(0.016, derive()); renderAll(); for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) setView(v); } finally { QUIET = true; hideSheet(); }
            const D = derive(); const bad = ['pow', 'spd', 'gold'].find(q => q in D && !isFinite(D[q]));
            if (bad || !isFinite(S.gold)) out.push(k + ' as ' + jn + ': ' + (bad ? 'its ' + bad + ' ' + D[bad] : 'gold ' + S.gold));
          } catch (e) { out.push(k + ' as ' + jn + ': ' + String(e.message).slice(0, 90)); }
        }
      } finally { QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(q => delete S[q]); Object.assign(S, JSON.parse(SNAP)); try { setView('upg'); } catch (e) {} Scene.newHole(S.hole, S.tier); }
      return { n, out };
    });
    if (r.out.length) throw new Error(r.out.length + ' of ' + r.n + ' broken saves stopped the game: ' + r.out.slice(0, 8).join('; '));
    return [r.n + ' broken saves (every part of a played save, eight kinds of junk each) loaded, played, drawn and every screen opened, nothing thrown, every number real'];
  }
};
