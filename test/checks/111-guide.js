/* The Field Guide (the user picked it from the menu): the wildlife, the
 * season's touches and the course's moments, each filled in the first time
 * it is seen on a hole played live, with a few sovereigns for the first.
 *
 *   - everything in it can be seen: holes swept over the seasons, the
 *     weather, night and the signature holes fill every entry (the golden
 *     animals forced over the same holes)
 *   - a first sighting pays once; seeing it again only counts; nothing is
 *     spotted away, in a wager, or on a hole other than the one played
 *   - the Guide tab shows every entry with its picture, seen or not
 *   - a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'guide',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); HOUR_FORCE = 14; S.guide = {};
        const play = (h, ch) => { S.hole = h; S.chaos = { n: ch || 'Fair' }; Scene.newHole(h, S.tier); };
        // a first sighting pays, a second only counts
        DECOR_FORCE = 'winter'; const sov0 = S.sov || 0; play(S.hole);
        if (S.guide.snowman !== 1) f('a snowman on the hole was not spotted (' + S.guide.snowman + ')');
        const paid = (S.sov || 0) - sov0, firsts = Object.keys(S.guide).length;
        if (paid !== B.GUIDE_SOV * firsts) f('the first sightings paid ' + paid + ' for ' + firsts);
        const sov1 = S.sov; play(S.hole);
        if (S.guide.snowman !== 2) f('a second sighting did not count (' + S.guide.snowman + ')');
        if (S.sov !== sov1) f('a second sighting paid ' + (S.sov - sov1));
        // not away, not in a wager, not on another hole
        const was = JSON.stringify(S.guide); DECOR_FORCE = 'spring';
        OFFLINE = true; play(S.hole); OFFLINE = false;
        S.dgnRun = { id: B.DGN[0].id }; play(S.hole); S.dgnRun = null;
        Scene.newHole(S.hole + 1, S.tier);
        if (JSON.stringify(S.guide) !== was) f('spotted away, in a wager or on another hole: ' + JSON.stringify(S.guide));
        // everything can be seen
        S.guide = {}; const h0 = S.hole;
        for (const k of DECOR_KINDS) { DECOR_FORCE = k; SEASON_FORCE = { autumn: 1, halloween: 1, winter: 2, spring: 3, summer: 0 }[k];
          for (let h = h0; h < h0 + 30; h++) play(h); }
        DECOR_FORCE = null; SEASON_FORCE = -1;
        for (let h = h0; h < h0 + 20; h++) play(h, 'Night');
        for (let h = h0; h < h0 + 3; h++) play(h, 'Crosswind');
        FROST_FORCE = 1; SEASON_FORCE = 2; play(h0); FROST_FORCE = null; SEASON_FORCE = -1;
        // (every signature hole a few times: the sea's life is by the sea stack)
        for (const k of SIG_KINDS) for (let h = h0, m = 0; m < 12 && h < h0 + 20000; h++) if (sigKind(h) === k) { play(h); m++; }
        // (and a dry course, for its lizards and hawks)
        { DEV.course(B.COURSE.findIndex(c => c.id === CRIT_DRY[0])); hideSheet(); const d0 = S.hole; for (let h = d0; h < d0 + 40; h++) play(h); }
        // (the golden animals, forced: every kind there golden, over the
        // same holes)
        GOLD_FORCE = -1;
        for (const s of [0, 1, 2, 3]) { SEASON_FORCE = s; for (let h = h0; h < h0 + 30; h++) play(h); for (let h = h0; h < h0 + 20; h++) play(h, 'Night'); }
        SEASON_FORCE = -1;
        { DEV.course(B.COURSE.findIndex(c => c.id === CRIT_DRY[0])); hideSheet(); const d0 = S.hole; for (let h = d0; h < d0 + 40; h++) play(h); }
        GOLD_FORCE = null;
        { let h = h0; while (!goldenOn(h, 'Fair') && h < h0 + 50000) h++; play(h); }
        // (geese go over now and then in autumn and winter: watched a while)
        SEASON_FORCE = 1; play(h0); for (let i = 0; i < 4000 && !S.guide.geese; i++) { Scene.t += 0.5; Scene.drawFlock(); } SEASON_FORCE = -1;
        // the rare weather: a rainbow and a fog bank as the hole is laid, a
        // shooting star as it is drawn
        RAINBOW_FORCE = 1; GOLDBOW_FORCE = 0; play(h0); GOLDBOW_FORCE = 1; play(h0); GOLDBOW_FORCE = 0; DBLBOW_FORCE = 1; play(h0); DBLBOW_FORCE = null; GOLDBOW_FORCE = null; RAINBOW_FORCE = null; FOG_FORCE = 1; play(h0); FOG_FORCE = null;
        play(h0, 'Night'); Scene.draw(0, derive()); Scene.meteorT = Scene.t - 0.2; Scene.drawMeteor(Scene.b); Scene.meteorT = undefined;
        // the Wager Book's own: one in each wager, there one time in two,
        // counted and never paid
        { const sv = S.sov || 0, there = {};
          for (const d of B.DGN.filter(x => WAGER_WILD[x.id])) { there[d.id] = 0;
            for (let i = 0; i < 20; i++) { S.dgnRun = null; S.dgnKeys[d.id] = i + 1; startDgn(d); Scene.newDepthsHole(S.dgnRun);
              if (Scene.props.some(q => q.wg === 'wg_' + d.id && q.an === WAGER_WILD[d.id][0])) there[d.id]++; }
            S.dgnRun = null; if (!(there[d.id] >= 4 && there[d.id] <= 16)) f(d.n + '\'s animal there ' + there[d.id] + ' times in 20'); }
          if ((S.sov || 0) !== sv) f('a wager\'s animal paid ' + ((S.sov || 0) - sv));
          o.wagerWild = there; S.dgnRun = null; startHole(); }
        const miss = GUIDE.filter(g => !S.guide[g.id]).map(g => g.n);
        if (miss.length) f('never spotted: ' + miss.join(', '));
        o.spotted = GUIDE.length - miss.length;
        // the tab: every entry, a picture each, seen and not
        S.guide = { doe: 2, robin: 7 }; trophyRoom('guide');
        const tiles = [...document.querySelectorAll('#roomBody .gtile')].filter(t => !t.closest('.hunt'));    // (the week's hunt shows three of them again first)
        if (tiles.length !== GUIDE.length) f(tiles.length + ' tiles for ' + GUIDE.length + ' entries');
        const pics = tiles.filter(t => { const i = t.querySelector('img'); return i && i.getAttribute('src').startsWith('data:image') && i.width * i.height >= 400; }).length;
        if (pics !== tiles.length) f('only ' + pics + ' of ' + tiles.length + ' tiles have a picture');
        const seen = tiles.filter(t => !t.classList.contains('un')).length;
        if (seen !== 2) f(seen + ' tiles shown as seen, not 2');
        if (!tiles.some(t => /Seen\s7/.test(t.textContent))) f('the robin\'s count is not shown');
        // (a hundred sightings: the tile's badge and the count in the heading)
        hideSheet(); S.guide = { doe: 99, robin: 100, fox: 140 }; trophyRoom('guide');
        const t100 = [...document.querySelectorAll('#roomBody .gtile.g100')].filter(t => !t.closest('.hunt'));
        if (t100.length !== 2 || !t100.every(t => t.querySelector('em') && /^\u2605100$/.test(t.querySelector('em').textContent.trim()))) f(t100.length + ' tiles wear the badge for a hundred');
        if (!/\u2605\s*2/.test(document.querySelector('#roomBody .eyebrow').textContent)) f('the heading reads ' + document.querySelector('#roomBody .eyebrow').textContent);
        hideSheet();
        // save repair
        S.guide = { doe: 'x', robin: -2, stag: 3.7, nope: 4 }; migrate();
        if (JSON.stringify(S.guide) !== '{"stag":3}') f('repaired to ' + JSON.stringify(S.guide));
        S.guide = [1]; migrate(); if (S.guide !== undefined) f('a list for the guide was kept');
      } finally {
        DECOR_FORCE = null; SEASON_FORCE = -1; FROST_FORCE = null; HOUR_FORCE = null; OFFLINE = false;
        RAINBOW_FORCE = null; FOG_FORCE = null; GOLD_FORCE = null; GOLDBOW_FORCE = null; DBLBOW_FORCE = null; LUNA_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['all ' + r.spotted + ' entries spotted over the seasons, the weather, night and the signature holes',
      'each wager\'s own animal there ' + Object.values(r.wagerWild).join('/') + ' times in 20, counted and never paid',
      'a first sighting pays once, a second only counts; none away, in a wager or on another hole',
      'the Guide tab: every entry with its picture, the seen ones with their count; a broken save repaired'];
  }
};
