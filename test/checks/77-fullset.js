/* A top set worn in full (the user asked, from the menu): its look, its
 * caddie, its driver and its wake or its ball. The two Mythic sets first;
 * the Divine and the Demonic count too (the user asked, from the menu).
 *
 *   - one piece off and it is not a full set; all on and it is (its wake
 *     and its ball both, each in its own place: the user found the Sets
 *     rack left the ball off)
 *   - every piece of it in the Style shop is rimmed in gold and badged
 *     "Full Set" (its wake and its ball both), and no other tile
 *   - said once, the first time; the Record's Full Sets row counts it
 *   - the Divine, with its ball, is a full set too
 *   - the score box is edged in the set's colour while it is worn whole
 *   - a broken value in a save is cleared on load
 *   - the four sets keep one order on every rack (the Ascended was first on
 *     one and second on the next: the user saw it)
 *   - Sets (the user asked): one tap buys what of a set is missing, for what
 *     those pieces cost, and wears it whole; too few sovereigns buys
 *     nothing; owned, it is worn for nothing
 *   - Unequip (the user asked): worn, a look's button reads UNEQUIP and
 *     takes it off, back to the plain one; a worn set's takes all of it off
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
        // (its wake and its ball both, each in its own place: the user found
        // the Sets rack left the ball off)
        styleBuy('c', 'cosmic'); o.noBall = fullSet(); o.saidNoBall = toasts.length;
        styleBuy('t', 'singularity'); o.full = fullSet(); o.said = toasts.slice(); o.both = S.trail + '+' + (ballNow() || {}).id;
        o.withBall = o.full; o.saidAgain = toasts.length;
        // the Divine, worn whole with its wake and its ball; then back to The Void for the shop
        for (const k of ['o:divine', 'c:divine', 'k:divine', 't:godlight', 't:seraph']) S.styleOwn[k] = 1;
        for (const [k, id] of [['o', 'divine'], ['c', 'divine'], ['k', 'divine'], ['t', 'seraph'], ['t', 'godlight']]) styleBuy(k, id);
        o.divine = fullSet(); o.saidDivine = toasts[toasts.length - 1];
        for (const [k, id] of [['o', 'cosmic'], ['c', 'cosmic'], ['k', 'cosmic'], ['t', 'horizon'], ['t', 'singularity']]) styleBuy(k, id);
        // the score box, edged in the set's colour; plain again with a piece off
        const ro = document.getElementById('readout'), edge = () => { renderLive(); return getComputedStyle(ro).borderTopColor + '/' + getComputedStyle(ro).boxShadow; };
        o.edge = edge(); styleBuy('c', 'bib'); o.edgeOff = edge(); styleBuy('c', 'cosmic');
        // the shop's tiles (the sheets open only when the game is not quiet)
        QUIET = false; o.tiles = {};
        for (const cat of ['golfer', 'caddie', 'clubs', 'balls']) { styleCat = cat; openShop('style');
          o.tiles[cat] = [...document.querySelectorAll('#sheet .card.full, .card.full')].filter((e, i, a) => a.indexOf(e) === i)
            .map(e => e.querySelector('.chd').textContent + ':' + (e.querySelector('.badge') || {}).textContent).join(','); }
        hideSheet();
        // the Record
        trophyRoom('case');
        const row = [...document.querySelectorAll('#statRows .lb')].find(e => e.children[1].textContent === 'Full Sets');
        o.record = row ? row.children[2].textContent.replace(/ /g, ' ') : 'missing';
        hideSheet(); QUIET = true;
        if (o.part || o.saidPart) f('with the plain caddie it counted as a full set (' + o.part + ', said ' + o.saidPart + ')');
        if (o.noBall || o.saidNoBall) f('without its ball it counted as a full set');
        if (o.both !== 'horizon+singularity') f('its wake and its ball are not worn together: ' + o.both);
        if (o.full !== 'cosmic' || o.withBall !== 'cosmic' || o.said.length !== 1 || o.said[0] !== 'Full Set · The Void' || o.saidAgain !== 1)
          f('the full set: ' + o.full + ', with its ball ' + o.withBall + ', said ' + JSON.stringify(o.said) + ' then ' + o.saidAgain + ' times');
        if (o.divine !== 'divine' || o.saidDivine !== 'Full Set · Divine') f('the Divine worn whole: ' + o.divine + ', said "' + o.saidDivine + '"');
        if (!/201, 176, 255/.test(o.edge) || !/201, 176, 255/.test(o.edge.split('/')[1]) || /201, 176, 255/.test(o.edgeOff))
          f('the score box: ' + o.edge + ' worn whole, ' + o.edgeOff + ' with a piece off');
        const want = { golfer: 'The Void:FULL SET', caddie: 'The Void Caddie:FULL SET', clubs: 'Eclipse Driver:FULL SET', balls: 'Singularity:FULL SET,Event Horizon:FULL SET' };
        for (const k in want) if (o.tiles[k] !== want[k]) f('the ' + k + ' rack rims ' + JSON.stringify(o.tiles[k]) + ' (want ' + want[k] + ')');
        if (o.record !== '2 of 4 worn') f('the Record reads "' + o.record + '"');
        // one order on every rack: the four sets' pieces, as the racks show them
        QUIET = false; o.orders = {};
        for (const cat of ['golfer', 'caddie', 'clubs', 'balls']) { styleCat = cat; openShop('style');
          const names = [...document.querySelectorAll('#sheet .card .chd')].map(e => e.textContent);
          o.orders[cat] = names.filter(n => /Ascend|Void|Eclipse|Horizon|Singularity|Divin|Seraph|Godlight|Demon|Hellfire/.test(n)).slice(0, 4).join(', '); }
        hideSheet();
        const setOf = n => /Ascend/.test(n) ? 'A' : /Void|Eclipse|Horizon|Singularity/.test(n) ? 'V' : /Divin|Seraph|Godlight/.test(n) ? 'D' : 'M';
        for (const cat in o.orders) { const seq = o.orders[cat].split(', ').map(setOf).join('');
          if (seq !== 'AVDM') f('the ' + cat + ' rack puts the sets ' + o.orders[cat]); }
        // Sets: buy the Divine whole with one piece already owned, too poor first
        QUIET = true;
        for (const k of ['o:divine', 'c:divine', 'k:divine', 't:seraph', 't:godlight']) delete S.styleOwn[k];
        S.styleOwn['c:divine'] = 1; S.outfit = 'classic'; S.caddie = 'bib'; S.club = 'steel'; S.trail = 'plain';
        const need = ['o:divine', 'k:divine', 't:seraph', 't:godlight'].map(k => styleDef(k[0], k.slice(2)).cost).reduce((a, b) => a + b, 0);
        o.cost = setCost('divine');
        S.sov = need - 1; setBuy('divine'); o.poor = S.sov + ' ' + S.outfit + ' ' + !!S.styleOwn['o:divine'];
        S.sov = need + 100; setBuy('divine'); o.paid = need + 100 - S.sov;
        o.worn = fullSet() + ' ' + S.trail + ' ' + (ballNow() || {}).id;
        S.outfit = 'classic'; const sov0 = S.sov; setBuy('divine'); o.again = (sov0 - S.sov) + ' ' + fullSet();
        if (o.cost !== need) f('the Divine set, the caddie owned, costs ' + o.cost + ' (its missing pieces are ' + need + ')');
        if (o.poor !== (need - 1) + ' classic false') f('too few sovereigns: ' + o.poor);
        if (o.paid !== need || o.worn !== 'divine seraph godlight') f('bought whole it took ' + o.paid + ' (need ' + need + ') and wore ' + o.worn + ' (want its wake and its ball both)');
        if (o.again !== '0 divine') f('owned, wearing it again took ' + o.again);
        // Unequip (the user asked): a worn set's button takes it all off,
        // back to the plain look; a worn piece's takes it off alone; the
        // plain ones can't be taken off
        const lab = () => { QUIET = false; renderShop(); QUIET = true; const B2 = [...document.querySelectorAll('#sheet .price[data-do]')];
          return Object.fromEntries(B2.map(b => [b.dataset.do, b.textContent.trim()])); };
        shopSub = 'style'; styleCat = 'sets'; let L = lab();
        o.unq = [L['set:divine'], L['set:cosmic']].join('/');
        setBuy('divine'); o.off = [S.outfit, S.caddie, S.club, S.trail, fullSet()].join(' ');
        setBuy('divine'); styleCat = 'golfer'; L = lab();
        o.unq2 = [L['style:o.divine'], L['style:o.classic']].join('/');
        styleBuy('o', 'divine'); o.off2 = [S.outfit, S.caddie, S.club, S.trail].join(' ');
        styleBuy('o', 'classic'); o.plain = S.outfit;
        for (const k of ['c', 'k', 't']) { const id = k === 't' ? 'seraph' : 'divine'; styleCat = { c: 'caddie', k: 'clubs', t: 'balls' }[k]; L = lab();
          if (!/^UNEQUIP/.test(L['style:' + k + '.' + id] || '')) f('a worn ' + id + ' (' + k + ') reads ' + L['style:' + k + '.' + id]); }
        hideSheet();
        if (!/^UNEQUIP/.test(o.unq.split('/')[0]) || /UNEQUIP/.test(o.unq.split('/')[1])) f('the Sets buttons read ' + o.unq + ' (want UNEQUIP on the worn one only)');
        if (o.off !== 'classic bib steel plain ') f('the set taken off left ' + o.off);
        if (!/^UNEQUIP/.test(o.unq2.split('/')[0]) || /UNEQUIP/.test(o.unq2)  && !/^UNEQUIP/.test(o.unq2)) f('the golfer rack reads ' + o.unq2);
        if (o.off2 !== 'classic divine divine seraph') f('the look taken off alone left ' + o.off2);
        if (o.plain !== 'classic') f('the plain look was taken off: ' + o.plain);
        // a broken save
        const saved = JSON.parse(JSON.stringify(S)); saved.fullSets = { cosmic: 1, blossom: 1, ascended: 'x', demonic: 1 };
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, saved); initState();
        o.repaired = JSON.stringify(S.fullSets);
        if (o.repaired !== '{"cosmic":1,"demonic":1}') f('a broken save kept ' + o.repaired);
      } finally {
        window.toast = keepT; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['one piece off, no set; all on, The Void worn in full (its wake and its ball together), said once: "' + r.said[0] + '"',
      'rimmed in gold: ' + Object.values(r.tiles).join(', ') + '; one set order on every rack (' + r.orders.golfer + '); Sets buys the missing pieces (' + r.cost + ') and wears them whole; the Divine too; the score box edged in its colour; the Record: Full Sets ' + r.record + '; Unequip on a worn set (' + r.unq + ') takes it all off, on a worn look (' + r.unq2 + ') just that; a broken save repaired'];
  }
};
