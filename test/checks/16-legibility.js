/* Every button can be hit and every word can be read, on a phone.
 *
 * Measured, not assumed. The grey used for every caption, unit and inactive
 * tab stood at 3.4:1 against the panel and 2.5:1 on a raised button, where
 * small text wants 4.5:1 to be read in daylight -- and it is most of the text
 * in the game. The "?" help buttons were 17px square and the multiplier row,
 * the small action buttons, the auto-equip toggle and the menu handle all came
 * in under 24px tall, the smallest target WCAG will call tappable.
 *
 * Three rules, over every screen, the shop and the stage:
 *   - no button or tap target under 24 x 24 CSS pixels
 *   - no button without a name a screen reader can say
 *   - no visible text under 4.5:1 against what is actually behind it
 */
'use strict';
module.exports = {
  name: 'legibility',
  async run(page) {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const small = {}, noname = {}, lowc = {};
      let buttons = 0, texts = 0;
      const lum = c => {
        const m = c.match(/[\d.]+/g).map(Number);
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
      };
      // the first background behind the text that is solid enough to read against
      const bgOf = el => {
        for (let n = el; n; n = n.parentElement) {
          const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
          if (m && (m.length < 4 || +m[3] > 0.5)) return getComputedStyle(n).backgroundColor;
        }
        return getComputedStyle(document.body).backgroundColor;
      };
      const tag = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')
        + (typeof e.className === 'string' && e.className
           ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
      const sweep = where => {
        for (const e of document.querySelectorAll('button, [onclick], .tab, a')) {
          const bx = e.getBoundingClientRect();
          if (!bx.width || !bx.height || getComputedStyle(e).visibility === 'hidden') continue;
          if (e.closest('#dev')) continue;             // the dev menu is not for players
          buttons++;
          if (bx.width < 23.5 || bx.height < 23.5)
            small[tag(e) + ' ' + Math.round(bx.width) + 'x' + Math.round(bx.height)] = where;
          const name = (e.getAttribute('aria-label') || e.textContent || '').trim()
            || (e.querySelector('img[alt]:not([alt=""])') ? 'img' : '');
          if (!name) noname[tag(e)] = where;
        }
        const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let tn;
        while ((tn = it.nextNode())) {
          const el = tn.parentElement;
          if (!/\S/.test(tn.nodeValue) || !el || !el.offsetParent || el.closest('#dev')) continue;
          const cs = getComputedStyle(el);
          if (+cs.opacity < 0.9) continue;             // deliberately faded, e.g. a locked row
          texts++;
          const L1 = lum(cs.color), L2 = lum(bgOf(el));
          const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          if (cr < 4.5) {
            const k = cs.color + ' on ' + bgOf(el) + ' = ' + cr.toFixed(2) + ':1';
            (lowc[k] = lowc[k] || []);
            if (lowc[k].length < 3) lowc[k].push(where + ' "' + tn.nodeValue.trim().slice(0, 20) + '"');
          }
        }
      };
      try { hideSheet(); } catch (e) {}
      QUIET = true; DEV.gold(20); DEV.lv(40); DEV.tierSet(8); DEV.skills(); DEV.keys();
      DEV.relics(3); DEV.cards(2); QUIET = false;
      try { hideSheet(); } catch (e) {}
      sweep('stage');
      for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) { setView(v); sweep(v); }
      setView('bag'); bagSub = 'shots'; renderBagNav(); sweep('bag/shots');
      bagSub = 'gear'; renderBagNav();
      setView('career');
      for (const sub of ['stat', 'tal', 'para', 'leg']) {
        const b = [...document.querySelectorAll('#careerNav button')].find(x => x.dataset.s === sub);
        if (b) { b.click(); sweep('career/' + sub); }
      }
      for (const sub of ['offers', 'buy', 'bags', 'perm']) { openShop(sub); sweep('shop/' + sub); }
      settingsSheet(); sweep('settings');
      importSheet(); sweep('settings/import');
      try { hideSheet(); } catch (e) {}
      setView('upg');
      return { small, noname, lowc, buttons, texts };
    });
    await page.setViewportSize({ width: 400, height: 860 });

    if (!(r.buttons > 150) || !(r.texts > 800))
      throw new Error('only ' + r.buttons + ' buttons and ' + r.texts + ' pieces of text were '
        + 'looked at, so the sweep is not reaching the screens it thinks it is');
    const sm = Object.entries(r.small);
    if (sm.length)
      throw new Error(sm.length + ' tap target(s) under 24px: '
        + sm.slice(0, 5).map(([k, v]) => k + ' on ' + v).join('; '));
    const nn = Object.entries(r.noname);
    if (nn.length)
      throw new Error(nn.length + ' button(s) with nothing a screen reader can say: '
        + nn.slice(0, 5).map(([k, v]) => k + ' on ' + v).join('; '));
    const lc = Object.entries(r.lowc);
    if (lc.length)
      throw new Error(lc.length + ' colour pairing(s) under 4.5:1: '
        + lc.slice(0, 4).map(([k, v]) => k + ' (' + v.join(', ') + ')').join('; '));
    return [r.buttons + ' buttons, all at least 24px and all named; ' + r.texts
      + ' pieces of text, all at least 4.5:1 against what is behind them'];
  }
};
