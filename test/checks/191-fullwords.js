/* No shortened words anywhere a player reads (the user: "don't ever
 * shorten words. use the full word, minutes. look everywhere"): every
 * screen, the shop and the sheets are read for a figure with a cut-down unit
 * ("2 min", "10s", "1d 23h") and for words like "Lv", "xp" and "yds".
 * Left as they are, at the user's word: the hole's bar across the top of the
 * field (the yards and the clock) and "purse/sec". "par 5s" is the holes,
 * not seconds. */
'use strict';
const BAD = /\b\d[\d.,]*\s?(s|m|h|d|min|mins|sec|secs|hr|hrs)\b|\b(Lv|LV|Lvl|lvl|LVL|xp|XP|yds|yd|pts|avg|Avg|approx|mins?|secs?|hrs?|qty|info|pct)\b/;
const OK = /\bpar \d+s\b|purse\/sec/g;
module.exports = { name: 'fullwords', async run(page) {
  const r = await page.evaluate(([BADs, OKs]) => {
    const BAD = new RegExp(BADs), OK = new RegExp(OKs, 'g');
    const bad = {}; let seen = 0;
    const sweep = where => {
      const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tn;
      while ((tn = it.nextNode())) {
        const el = tn.parentElement; let t = tn.nodeValue.replace(/ /g, ' ').trim();
        if (!t || !el || !el.offsetParent || el.closest('#dev, #readout, #rate, script, style')) continue;
        seen++; t = t.replace(OK, '');
        const m = t.match(BAD); if (m) bad[t.slice(0, 70)] = where + ' [' + m[0] + ']';
      }
      for (const el of document.querySelectorAll('[aria-label], [title]')) {
        if (!el.offsetParent || el.closest('#dev')) continue;
        const t = (el.getAttribute('aria-label') || el.getAttribute('title') || '').replace(OK, '');
        const m = t.match(BAD); if (m) bad[t.slice(0, 70)] = where + ' (label) [' + m[0] + ']';
      }
    };
    try { hideSheet(); } catch (e) {}
    QUIET = true; DEV.gold(20); DEV.lv(40); DEV.tierSet(8); DEV.skills(); DEV.keys(); DEV.relics(3); DEV.cards(2); QUIET = false;
    S.perm = { contract: 3, locker: 2, teetime: 1, irons: 2 };
    try { hideSheet(); } catch (e) {}
    sweep('stage');
    for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) { setView(v); sweep(v); }
    for (const sub of ['upg', 'cad', 'chal']) { setView('upg'); rangeSub = sub; renderRangeNav(); sweep('range/' + sub); }
    try { S.grit = 1e9; S.shard = 1e9; errSend(B.ERRANDS[0].id); setView('upg'); rangeSub = 'cad'; renderRangeNav(); sweep('range/errand'); } catch (e) {}
    rangeSub = 'upg';
    for (const d of B.DGN) { wagerGuide(d.id); sweep('wager guide ' + d.id); hideSheet(); }
    setView('bag'); bagSub = 'sets'; renderBagNav(); sweep('bag/sets'); bagSub = 'shots'; renderBagNav(); sweep('bag/shots'); bagSub = 'gear'; renderBagNav();
    for (const s of ['card', 'season', 'maj', 'sig']) { setView('tour'); tourSub = s; renderTour(); sweep('tour/' + s); } tourSub = 'card'; renderTour();
    setView('career');
    for (const sub of ['stat', 'tal', 'para', 'leg']) { const b = [...document.querySelectorAll('#careerNav button')].find(x => x.dataset.s === sub); if (b) { b.click(); sweep('career/' + sub); } }
    for (const sub of ['offers', 'bags', 'perm', 'pass', 'style']) { openShop(sub); sweep('shop/' + sub); }
    for (const cat of ['caddie', 'clubs', 'balls']) { styleCat = cat; openShop('style'); sweep('shop/style/' + cat); } styleCat = 'golfer';
    settingsSheet(); sweep('settings');
    S.freeT = B.FREE_EVERY; S.cups = Math.max(S.cups || 0, 6);
    for (const t of ['today', 'case', 'hon', 'guide']) { try { trophyRoom(t); sweep('room/' + t); } catch (e) {} }
    perksSheet(); sweep('perks');
    for (let r = 0; r < B.RARITY.length; r++) { const it = makeItem(S.tier, 0, r); it.rar = r; S.bag.push(it); }
    scrapSheet(); sweep('scrap');
    try { hideSheet(); } catch (e) {}
    try { setView('career'); careerSub = 'leg'; renderLegacy(); $('retireBtn').onclick(); sweep('retire'); hideSheet(); } catch (e) {}
    try { itemSheet(S.bag[S.bag.length - 1], false); sweep('item'); hideSheet(); } catch (e) {}
    try { QUIET = true; S.t = Date.now() / 1000 - 2 * 3600 - 125; catchUp(); QUIET = false; sweep('away'); hideSheet(); } catch (e) { QUIET = false; }
    return { bad, seen };
  }, [BAD.source, OK.source]);
  const bad = Object.entries(r.bad);
  if (bad.length) throw new Error(bad.length + ' piece(s) of text with a shortened word: '
    + bad.slice(0, 40).map(([k, v]) => '"' + k + '" (' + v + ')').join('; '));
  if (!(r.seen > 300)) throw new Error('only ' + r.seen + ' pieces of text were read, so the sweep is not reaching the screens');
  return [r.seen + ' pieces of text across every screen, the shop and the sheets: no shortened words (the hole\'s bar and purse/sec aside)'];
} };
