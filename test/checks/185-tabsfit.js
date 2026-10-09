/* Every row of tabs fits the screen (the user asked for a sweep of every
 * screen at phone sizes): at 320 the Tour tab's Signature, Career's Paragon
 * and the Style racks' Sets ran off the edge, cut mid-word. At 320, 360 and
 * 390 wide and on its side (740x360, 844x390: Paragon ran off there too), on every page with tabs (each of the five tabs' own tabs, the
 * shop's, the Style racks and the Trophy Room's), every tab's words lie
 * wholly inside the screen and its row; and the Cabinet's names never run
 * into the next (Sovereign and Starfall met at 320). */
'use strict';
module.exports = {
  name: 'tabsfit',
  async run(page) {
    const bad = [], seen = [];
    for (const [W, H] of [[320, 740], [360, 740], [390, 740], [740, 360], [844, 390]]) {
      await page.setViewportSize({ width: W, height: H });
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const out = [], n0 = { n: 0 };
        const look = (where) => {
          for (const b of document.querySelectorAll('.sub, .shopnav button, .catnav button')) {
            const q = b.getBoundingClientRect(); if (!q.width || b.offsetParent === null) continue;
            const row = b.parentElement.getBoundingClientRect(), rg = document.createRange(); rg.selectNodeContents(b); const t = rg.getBoundingClientRect();
            n0.n++;
            if (t.right > Math.min(innerWidth, row.right) + 1 || t.left < Math.max(0, row.left) - 1 || t.right > q.right + 1) out.push(where + ' ' + b.textContent.trim() + ' ' + Math.round(t.left) + '-' + Math.round(t.right));
          }
        };
        hideSheet(); document.getElementById('app').classList.add('big');
        for (const [v, k, subs] of [['upg', 'rangeSub', ['upg', 'cad', 'chal']], ['bag', 'bagSub', ['gear', 'shots']], ['tour', 'tourSub', ['card']], ['career', 'careerSub', ['leg']]])
          for (const s of subs) { window[k] = s; if (k === 'rangeSub') rangeSub = s; if (k === 'bagSub') bagSub = s; if (k === 'tourSub') tourSub = s; if (k === 'careerSub') careerSub = s; setView(v); look(v + ':' + s); }
        for (const t of ['today', 'case']) { trophyRoom(t); look('room:' + t); }
        { const cn = [...document.querySelectorAll('#sheet .ci .cn')];
          for (let i = 1; i < cn.length; i++) { const a = cn[i - 1].getBoundingClientRect(), b2 = cn[i].getBoundingClientRect();
            if (Math.abs(a.top - b2.top) < 4 && a.right > b2.left - 1 && b2.left > a.left) out.push('cabinet names meet: ' + cn[i - 1].textContent + '|' + cn[i].textContent);
            if (cn[i].scrollWidth > cn[i].clientWidth + 1) out.push('cabinet name cut: ' + cn[i].textContent); } }
        for (const t of ['offers', 'pass']) { openShop(t); look('shop:' + t); }
        shopSub = 'style'; styleCat = 'sets'; renderShop(); look('style');
        hideSheet();
        return { out, n: n0.n };
      });
      bad.push(...r.out.map(x => W + 'x' + H + ': ' + x)); seen.push(W + 'x' + H + ' ' + r.n);
    }
    if (bad.length) throw new Error('tabs off the screen or cut: ' + bad.slice(0, 8).join('; '));
    return ['every tab inside its row and the screen, the Cabinet\'s names apart (' + seen.join(', ') + ' tabs)'];
  }
};
