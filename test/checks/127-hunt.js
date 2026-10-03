/* The Field Guide's weekly hunt (the user picked it from the menu): three of
 * the Guide's commoner animals to spot in a week, one of them out at night,
 * all three spotted live paying a few sovereigns once.
 *
 *   - the three are the same all week (from its number), differ from week
 *     to week, are three different entries, each in the Guide, and one is
 *     a night one; over a hundred weeks every one of the pool comes up
 *   - spotting one of them live counts it; something else does not; one
 *     spotted again counts once; on a card below what his bag suits, away,
 *     in a wager or quietly nothing counts
 *   - the third pays B.HUNT_SOV once, never again that week; a new week
 *     starts again from none
 *   - every hunt animal can be seen: holes swept by day and night lay each
 *   - the Guide tab shows the three first, found or where to look
 *   - a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'hunt',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0;
        // ---- the three ----
        const seen = new Set(); let same = 0;
        for (let wk = 2900; wk < 3000; wk++) {
          const a = huntOf(wk), b = huntOf(wk);
          if (a.join() !== b.join()) f('week ' + wk + ' gave two hunts');
          if (new Set(a).size !== 3) f('week ' + wk + ': ' + a.join());
          if (a.filter(id => HUNT_NIGHT.includes(id)).length !== 1) f('week ' + wk + ' has not one night animal: ' + a.join());
          if (a.some(id => !GUIDE.find(g => g.id === id))) f('week ' + wk + ': not in the Guide: ' + a.join());
          if (wk > 2900 && a.join() === huntOf(wk - 1).join()) same++;
          a.forEach(id => seen.add(id));
        }
        if (same > 3) f(same + ' weeks the same as the week before');
        const miss = HUNT_DAY.concat(HUNT_NIGHT).filter(id => !seen.has(id)); if (miss.length) f('never hunted in 100 weeks: ' + miss.join(', '));
        // ---- counting ----
        DAY_FORCE = 20000; const wk = weekNow(), want = huntOf(wk); delete S.hunt; S.tier = S.tierMax || 0;
        const sov = () => S.sov || 0, other = HUNT_DAY.concat(HUNT_NIGHT).find(id => !want.includes(id));
        QUIET = false; const tw = window.toast; window.toast = () => {};
        try {
          guideAdd([other]); if (huntNow().got.length) f('spotting ' + other + ' (not hunted) counted');
          guideAdd([want[0]]); guideAdd([want[0]]); if (huntNow().got.join() !== want[0]) f('one spotted twice: ' + huntNow().got.join());
          // (on a card below what his bag suits)
          { const fc = window.fairCard; window.fairCard = () => false; try { guideAdd([want[1]]); } finally { window.fairCard = fc; }
            if (huntNow().got.includes(want[1])) f('counted on an easy card'); }
          // (quietly, away and in a wager: the hole's own spotting is skipped)
          { const h0 = S.hole; let hh = h0; const night = HUNT_NIGHT.includes(want[1]);
            const ways = [['quietly', () => { QUIET = true; }, () => { QUIET = false; }], ['away', () => { OFFLINE = true; }, () => { OFFLINE = false; }],
              ['in a wager', () => { S.dgnRun = { id: B.DGN[0].id }; }, () => { S.dgnRun = null; }]];
            for (const [n, on, off] of ways) { on(); guideSpotAny(want[1], night); off(); if (huntNow().got.includes(want[1])) { f('counted ' + n); huntNow().got = huntNow().got.filter(x => x !== want[1]); } }
            QUIET = false; void hh; }
          const s0 = sov(); guideAdd([want[1]]); if (sov() !== s0 + (S.guide[want[1]] === 1 ? B.GUIDE_SOV : 0)) f('the second paid ' + (sov() - s0));
          const s1 = sov(), firstSight = !S.guide[want[2]]; guideAdd([want[2]]);
          const paid = sov() - s1 - (firstSight ? B.GUIDE_SOV : 0);
          if (paid !== B.HUNT_SOV) f('all three paid ' + paid + ', not ' + B.HUNT_SOV);
          const s2 = sov(); guideAdd([want[0], want[1], want[2]]); if (sov() !== s2) f('paid again the same week: ' + (sov() - s2));
          // (and the pay is kept apart from the three: a third again, once paid, pays nothing)
          huntNow().got = want.slice(0, 2); const s3 = sov(); guideAdd([want[2]]); if (sov() !== s3) f('a week paid twice: ' + (sov() - s3));
          DAY_FORCE += 7; if (huntNow().got.length || huntNow().paid) f('a new week kept ' + JSON.stringify(huntNow()));
          o.want = want;
        } finally { window.toast = tw; QUIET = true; }
        // ---- every hunt animal can be seen ----
        function guideSpotAny(id, night) { const h0 = S.hole; for (let h = h0; h < h0 + 400; h++) { S.hole = h; S.chaos = { n: night ? 'Night Round' : 'Fair' }; Scene.newHole(h, S.tier);
          if (Scene.props.some(p => (p.kind === 15 && p.an === id) || (id === 'firefly' && p.kind === 5) || (id === 'glowworm' && p.kind === 22) || (id === 'moth' && p.moth)
            || (p.kind === 9 && ['sparrow', 'robin', 'blackbird'][birdKind(h, p.g)] === id))) { S.hole = h0; return h; } } S.hole = h0; return 0; }
        const where = {};
        for (const id of HUNT_DAY.concat(HUNT_NIGHT)) { where[id] = guideSpotAny(id, HUNT_NIGHT.includes(id)); if (!where[id]) f('no ' + id + ' in 400 ' + (HUNT_NIGHT.includes(id) ? 'night' : 'day') + ' holes'); }
        // ---- the tab ----
        DAY_FORCE = 20000; delete S.hunt; huntNow().got = [want[0]]; QUIET = false; trophyRoom('guide');
        const tiles = [...document.querySelectorAll('#roomBody .guide.hunt .gtile')];
        if (tiles.length !== 3) f(tiles.length + ' hunt tiles');
        else { if (!tiles[0].classList.contains('found') || !/Found/.test(tiles[0].textContent)) f('the found one is not shown found');
          if (tiles[1].classList.contains('found')) f('one not found shown found');
          if (!tiles.every(t => { const i = t.querySelector('img'); return i && i.getAttribute('src').startsWith('data:image'); })) f('a hunt tile without its picture'); }
        const eb = document.querySelectorAll('#roomBody .eyebrow')[1]; if (!eb || !/Weekly Hunt/.test(eb.textContent) || !/1\/3/.test(eb.textContent)) f('the hunt\'s line reads ' + (eb && eb.textContent));
        hideSheet(); QUIET = true;
        // ---- repair ----
        S.hunt = { wk: 'x', got: 3 }; migrate(); if (S.hunt !== undefined) f('a broken hunt kept');
        S.hunt = { wk: 5, got: ['fox'] }; migrate(); if (!S.hunt) f('a good hunt dropped');
      } finally {
        DAY_FORCE = null; HOUR_FORCE = null; FROST_FORCE = null; OFFLINE = false; window.step = keep; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['three a week, the same all week, one at night; every one of the pool in 100 weeks',
      'counted live on a fair card only, once each; all three pay ' + 15 + ' once a week, and a new week starts again',
      'every hunt animal laid somewhere by day or night; the Guide tab shows the three first (this week ' + r.want.join(', ') + ')'];
  }
};
