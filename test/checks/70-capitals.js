/* Short pieces of text start with a capital (the user asked, after seeing
 * "next entry 5m 30s" and "[locked]"): not every word, as a title is, but
 * the first letter of each line, note or label on every screen and sheet,
 * and of each item after a middle dot ("Best run 1 green · 70s · Next
 * entry 6m 40s").
 * A piece that carries on a sentence (it follows other words in the same
 * box, "Playing <b>Card I</b> · highest ...") is not a start. Written after
 * the band notes read "event 1 of 6", "new in 1d 23h" and the like.
 */
'use strict';
const OK = /^(iLv|mph|x\d|vs\b)/;
module.exports = { name: 'capitals', async run(page) {
  const r = await page.evaluate((OKs) => {
    const OK = new RegExp(OKs);
    const bad = {}; let seen = 0;
    const blockOf = el => { let e = el; while (e && getComputedStyle(e).display === 'inline') e = e.parentElement; return e || el; };
    const sweep = where => {
      const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tn;
      while ((tn = it.nextNode())) {
        const el = tn.parentElement; const t = tn.nodeValue.trim();
        if (!t || !el || !el.offsetParent || el.closest('#dev')) continue;
        const cs = getComputedStyle(el);
        if (cs.textTransform === 'uppercase') continue;
        const blk = blockOf(el);
        if (getComputedStyle(blk).textTransform === 'uppercase') continue;
        // where it starts its box, and each item after a middle dot
        const starts = blk.textContent.trim().indexOf(t) === 0 ? [t] : [];
        t.split('\u00b7').slice(1).forEach(x => { x = x.trim(); if (x) starts.push(x); });
        for (const x of starts) { seen++; if (/^[a-z]/.test(x) && !OK.test(x)) bad[x.slice(0, 60)] = where; }
      }
    };
    try { hideSheet(); } catch (e) {}
    QUIET = true; DEV.gold(20); DEV.lv(40); DEV.tierSet(8); DEV.skills(); DEV.keys(); DEV.relics(3); DEV.cards(2); QUIET = false;
    try { hideSheet(); } catch (e) {}
    sweep('stage');
    for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) { setView(v); sweep(v); }
    setView('bag'); bagSub = 'sets'; renderBagNav(); sweep('bag/sets'); bagSub = 'shots'; renderBagNav(); sweep('bag/shots'); bagSub = 'gear'; renderBagNav();
    for (const s of ['card', 'season', 'maj', 'sig']) { setView('tour'); tourSub = s; renderTour(); sweep('tour/' + s); } tourSub = 'card'; renderTour();
    setView('career');
    for (const sub of ['stat', 'tal', 'para', 'leg']) { const b = [...document.querySelectorAll('#careerNav button')].find(x => x.dataset.s === sub); if (b) { b.click(); sweep('career/' + sub); } }
    for (const sub of ['offers', 'bags', 'perm', 'style']) { openShop(sub); sweep('shop/' + sub); }
    for (const cat of ['caddie', 'clubs', 'balls']) { styleCat = cat; openShop('style'); sweep('shop/style/' + cat); } styleCat = 'golfer';
    settingsSheet(); sweep('settings'); importSheet(); sweep('import');
    S.freeT = B.FREE_EVERY; S.cups = Math.max(S.cups || 0, 6);
    for (const t of ['today', 'case', 'hon']) { trophyRoom(t); sweep('room/' + t); }
    perksSheet(); sweep('perks');
    for (let r = 0; r < B.RARITY.length; r++) { const it = makeItem(S.tier, 0, r); it.rar = r; S.bag.push(it); }
    scrapSheet(); sweep('scrap');
    try { hideSheet(); } catch (e) {}
    try { setView('career'); careerSub = 'leg'; renderLegacy(); $('retireBtn').onclick(); sweep('retire'); hideSheet(); } catch (e) {}
    try { itemSheet(S.bag[0] || Object.values(S.equip)[0], false); sweep('item'); hideSheet(); } catch (e) {}
    return { bad, seen };
  }, OK.source);
  const bad = Object.entries(r.bad);
  if (bad.length) throw new Error(bad.length + ' piece(s) of text start with a small letter: '
    + bad.slice(0, 40).map(([k, v]) => '"' + k + '" (' + v + ')').join('; '));
  if (!(r.seen > 300)) throw new Error('only ' + r.seen + ' pieces of text were read, so the sweep is not reaching the screens');
  return [r.seen + ' pieces of text across every screen, the shop and the sheets: each starts with a capital'];
} };
