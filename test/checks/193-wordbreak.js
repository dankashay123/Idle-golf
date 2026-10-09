/* No word broken across two lines at 320 wide (the Trophy Room's jackets
 * read "Sovereig / n" there): every screen, the shop, the Trophy Room and
 * the sheets are read word by word, and a word whose letters land on two
 * lines fails. */
'use strict';
module.exports = { name: 'wordbreak', async run(page) {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const bad = {}; let words = 0;
    const sweep = where => {
      const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let tn;
      while ((tn = it.nextNode())) {
        const el = tn.parentElement, t = tn.nodeValue;
        if (!t.trim() || !el || !el.offsetParent || el.closest('#dev, script, style')) continue;
        const re = /[^\s ·\/–—-]+/g; let m;
        while ((m = re.exec(t))) {
          if (m[0].length < 4) continue;
          const rg = document.createRange(); rg.setStart(tn, m.index); rg.setEnd(tn, m.index + m[0].length);
          const rs = [...rg.getClientRects()].filter(q => q.width > 0.5);
          words++;
          if (rs.length > 1 && Math.abs(rs[0].top - rs[rs.length - 1].top) > 2) bad[m[0] + ' in "' + t.trim().slice(0, 40) + '"'] = where;
        }
      }
    };
    try { hideSheet(); } catch (e) {}
    QUIET = true; DEV.gold(20); DEV.lv(40); DEV.tierSet(8); DEV.skills(); DEV.keys(); DEV.relics(3); DEV.cards(2); QUIET = false;
    try { hideSheet(); } catch (e) {}
    $('app').classList.add('big');
    sweep('stage');
    for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) { setView(v); sweep(v); }
    for (const sub of ['cad', 'chal']) { setView('upg'); rangeSub = sub; renderRangeNav(); sweep('range/' + sub); } rangeSub = 'upg';
    for (const s of ['card', 'season', 'maj', 'sig']) { setView('tour'); tourSub = s; renderTour(); sweep('tour/' + s); } tourSub = 'card'; renderTour();
    setView('career');
    for (const sub of ['stat', 'tal', 'para', 'leg']) { const b = [...document.querySelectorAll('#careerNav button')].find(x => x.dataset.s === sub); if (b) { b.click(); sweep('career/' + sub); } }
    for (const sub of ['offers', 'bags', 'perm', 'pass', 'style']) { openShop(sub); sweep('shop/' + sub); }
    settingsSheet(); sweep('settings');
    for (const t of ['today', 'case', 'hon', 'guide']) { try { trophyRoom(t); sweep('room/' + t); } catch (e) {} }
    perksSheet(); sweep('perks');
    for (const d of B.DGN) { wagerGuide(d.id); sweep('wager guide ' + d.id); }
    try { const it = makeItem(S.tier, 0, 4, 'driver'); S.bag.push(it); itemSheet(it, false); sweep('item'); } catch (e) {}
    try { hideSheet(); } catch (e) {}
    $('app').classList.remove('big');
    return { bad, words };
  });
  await page.setViewportSize({ width: 400, height: 860 });
  const bad = Object.entries(r.bad);
  if (bad.length) throw new Error(bad.length + ' word(s) broken across two lines at 320 wide: ' + bad.slice(0, 30).map(([k, v]) => k + ' (' + v + ')').join('; '));
  if (!(r.words > 1000)) throw new Error('only ' + r.words + ' words were read');
  return [r.words + ' words across every screen, the shop, the Trophy Room and the sheets at 320 wide: none broken across two lines'];
} };
