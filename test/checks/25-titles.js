/* Titles are in Title Case: "Climb on Form", "Drop Back to Card II".
 *
 * Every row name, sheet heading, shop tile and shelf across every screen, the
 * shop, the sheets and the stage, plus every name in the data tables. Small
 * words (a, of, on, the, to...) stay lower case unless they open or close the
 * title. Text the stylesheet sets in capitals is skipped; it cannot show the
 * difference. The nine goals are sentences ("An eagle on a par five") read in
 * the goal bar, not titles, so their table is skipped.
 *
 * Written after a sweep found fifteen titles in sentence case, among them
 * "Climb on form", "Drop back to Card VIII" and "Back up your save".
 */
'use strict';
module.exports = { name: 'titles', async run(page) {
  const r = await page.evaluate(() => {
    const SMALL = new Set('a an and as at but by for from in into nor of on or per the to vs via with x'.split(' '));
    const bad = {}; let seen = 0;
    const isTitle = t => {
      const w = t.replace(/[··:—–-]/g, ' ').split(/\s+/).filter(Boolean);
      return w.every((x, i) => {
        const c = x.replace(/^[^A-Za-z0-9]+/, '');
        if (!c || !/^[a-z]/.test(c)) return true;
        return SMALL.has(c.toLowerCase()) && i > 0 && i < w.length - 1;
      });
    };
    const sweep = where => {
      const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tn;
      while ((tn = it.nextNode())) {
        const el = tn.parentElement; const t = tn.nodeValue.trim();
        if (!t || !el || !el.offsetParent || el.closest('#dev')) continue;
        const cs = getComputedStyle(el);
        if (cs.textTransform === 'uppercase') continue;
        const head = /Iowan|Palatino/.test(cs.fontFamily) || el.closest('#sheet h3') || el.closest('.st, .shn, .tn, .chd');
        if (!head) continue;
        if (t.split(/\s+/).length > 8) continue;
        seen++;
        if (!isTitle(t)) bad[t] = where;
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
    for (const [k, v] of Object.entries(B)) if (Array.isArray(v) && k !== 'NINE_GOALS') v.forEach(o => { if (o && typeof o.n === 'string' && !isTitle(o.n)) bad[o.n] = 'B.' + k; });
    return { bad, seen };
  });
  const bad = Object.entries(r.bad);
  if (bad.length) throw new Error(bad.length + ' title(s) not in Title Case: '
    + bad.slice(0, 8).map(([k, v]) => '"' + k + '" (' + v + ')').join('; '));
  if (!(r.seen > 150)) throw new Error('only ' + r.seen + ' titles were read, so the sweep is not reaching the screens it thinks it is');
  return [r.seen + ' titles read across every screen, the shop and the sheets, and every name in the tables: all in Title Case'];
} };
