/* A Mythic set worn in full (the user asked, from the menu): its look, its
 * caddie, its driver and its wake or its ball.
 *
 *   - one piece off and it is not a full set; all on and it is
 *   - every piece of it in the Style shop is rimmed in gold and badged
 *     "Full Set" (its wake and its ball both), and no other tile
 *   - said once, the first time; the Record's Mythic Sets row counts it
 *   - a broken value in a save is cleared on load
 */
'use strict';
module.exports = {
  name: 'fullset',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => o.fails.push(m), toasts = [], keepT = window.toast;
      try {
        hideSheet(); QUIET = true; window.toast = h => toasts.push(h.replace(/<[^>]+>/g, ''));
        S.fullSets = {};
        for (const k of ['o:cosmic', 'c:cosmic', 'k:cosmic', 't:horizon', 't:singularity']) S.styleOwn[k] = 1;
        styleBuy('o', 'cosmic'); styleBuy('k', 'cosmic'); styleBuy('t', 'horizon'); styleBuy('c', 'bib');
        o.part = fullSet(); o.saidPart = toasts.length;
        styleBuy('c', 'cosmic'); o.full = fullSet(); o.said = toasts.slice();
        styleBuy('t', 'singularity'); o.withBall = fullSet(); o.saidAgain = toasts.length;
        // the shop's tiles (the sheets open only when the game is not quiet)
        QUIET = false; o.tiles = {};
        for (const cat of ['golfer', 'caddie', 'clubs', 'balls']) { styleCat = cat; openShop('style');
          o.tiles[cat] = [...document.querySelectorAll('#sheet .card.full, .card.full')].filter((e, i, a) => a.indexOf(e) === i)
            .map(e => e.querySelector('.chd').textContent + ':' + (e.querySelector('.badge') || {}).textContent).join(','); }
        hideSheet();
        // the Record
        trophyRoom('case');
        const row = [...document.querySelectorAll('#statRows .lb')].find(e => e.children[1].textContent === 'Mythic Sets');
        o.record = row ? row.children[2].textContent.replace(/ /g, ' ') : 'missing';
        hideSheet(); QUIET = true;
        if (o.part || o.saidPart) f('with the plain caddie it counted as a full set (' + o.part + ', said ' + o.saidPart + ')');
        if (o.full !== 'cosmic' || o.withBall !== 'cosmic' || o.said.length !== 1 || o.said[0] !== 'Full Set · The Void' || o.saidAgain !== 1)
          f('the full set: ' + o.full + ', with its ball ' + o.withBall + ', said ' + JSON.stringify(o.said) + ' then ' + o.saidAgain + ' times');
        const want = { golfer: 'The Void:FULL SET', caddie: 'The Void Caddie:FULL SET', clubs: 'Eclipse Driver:FULL SET', balls: 'Singularity:FULL SET,Event Horizon:FULL SET' };
        for (const k in want) if (o.tiles[k] !== want[k]) f('the ' + k + ' rack rims ' + JSON.stringify(o.tiles[k]) + ' (want ' + want[k] + ')');
        if (o.record !== '1 of 2 worn') f('the Record reads "' + o.record + '"');
        // a broken save
        const saved = JSON.parse(JSON.stringify(S)); saved.fullSets = { cosmic: 1, blossom: 1, ascended: 'x' };
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, saved); initState();
        o.repaired = JSON.stringify(S.fullSets);
        if (o.repaired !== '{"cosmic":1}') f('a broken save kept ' + o.repaired);
      } finally {
        window.toast = keepT; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['one piece off, no set; all on, The Void worn in full (with its wake or its ball), said once: "' + r.said[0] + '"',
      'rimmed in gold: ' + Object.values(r.tiles).join(', ') + '; the Record: Mythic Sets ' + r.record + '; a broken save repaired'];
  }
};
