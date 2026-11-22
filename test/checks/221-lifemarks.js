/* Two things the user picked from the menu:
 *
 *   - the career in numbers, a page of Career (Lifetime): each a word and a
 *     number read from what the game counts; all five pages of Career in
 *     sight at 320, nothing cut
 *   - a club's rarity as a shape as well as a colour: none for Common, then
 *     a shape of its own for each rarity, on every club in the bag and every
 *     slot worn, clear of the slot's name */
'use strict';
module.exports = {
  name: 'lifemarks',
  async run(page) {
    await page.setViewportSize({ width: 320, height: 640 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {};
      try {
        hideSheet();
        // ---- Lifetime ----
        S.totalHoles = 12345; S.aces = 67; S.tally.eagle = 890; S.cups = 4; S.retires = 2; S.bestRound = -31; S.tally.myth = 5;
        setView('career'); careerSub = 'life'; renderCareer();
        const g = document.getElementById('lifeGrid'); if (!g) f('no Lifetime page');
        else { const tiles = [...g.children].map(e => [e.querySelector('.k').innerText.trim(), e.querySelector('.v').innerText.trim()]);
          o.n = tiles.length; const get = k => (tiles.find(t => t[0].toUpperCase() === k.toUpperCase()) || [])[1];
          if (get('Holes') !== fmt(12345, 0)) f('holes read ' + get('Holes'));
          if (get('Aces') !== '67' || get('Cups') !== '4' || get('Retirements') !== '2' || get('Mythics') !== '5') f('the numbers read ' + JSON.stringify(tiles));
          if (get('Best Round') !== '-31') f('the best round read ' + get('Best Round'));
          if (get('Highest Card') !== String(cardNo((S.bestTier || 0) + 1))) f('the highest card read ' + get('Highest Card'));
          for (const e of g.querySelectorAll('.k,.v')) if (e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > innerWidth) f('"' + e.innerText + '" cut at 320');
          delete S.bestRound; renderCareer(); if ([...document.getElementById('lifeGrid').children].some(e => /Best Round/i.test(e.innerText))) f('a best round shown with none played'); }
        const nav = document.getElementById('careerNav'); o.nav = nav.scrollWidth - nav.clientWidth;
        if (o.nav > 0) f('the Career pages run ' + o.nav + 'px past the screen at 320');
        if (![...nav.children].some(b => /Lifetime/i.test(b.innerText))) f('no Lifetime in the Career pages');
        // ---- rarity shapes ----
        S.bag = []; S.autoEquip = 0;
        B.SLOTS.forEach((sl, i) => { const it = makeItem(5, 0.5, Math.min(i, 5), sl.id); it.rar = Math.min(i, 5); S.equip[sl.id] = it; });
        for (let k = 0; k < 6; k++) { const it = makeItem(5, 0.5, k, 'driver'); it.rar = k; S.bag.push(it); }
        S.bagSlot = 'driver'; setView('bag'); renderBag();
        const cards = [...document.querySelectorAll('#bagList .gt')];
        const shapes = new Set();
        for (const c of cards) { const it = [S.equip.driver, ...S.bag].find(x => x.uid === +c.dataset.uid || String(x.uid) === c.dataset.uid); if (!it) continue;
          const m = c.querySelector('.rmk'); if (!it.rar) { if (m) f('a Common club carries a shape'); continue; }
          if (!m || +m.dataset.r !== it.rar) { f('a ' + B.RARITY[it.rar].n + ' club without its shape'); continue; }
          shapes.add(decodeURIComponent(getComputedStyle(m).backgroundImage).replace(/fill="[^"]*"/, '')); }
        o.shapes = shapes.size; if (shapes.size !== 5) f(shapes.size + ' shapes for the five rarities above Common');
        for (const t of document.querySelectorAll('#bagGrid .slot')) { const m = t.querySelector('.rmk'), k = t.querySelector('.sk'); if (!m) continue;
          const a = m.getBoundingClientRect(), b = k.getBoundingClientRect();
          if (a.bottom > b.top + 0.5 && a.top < b.bottom && a.right > b.left && a.left < b.right) f('a slot\'s shape over its name "' + k.innerText + '"');
          if (a.right > t.getBoundingClientRect().right + 0.5) f('a slot\'s shape out of its tile'); }
        o.slots = document.querySelectorAll('#bagGrid .slot .rmk').length; if (o.slots !== 5) f(o.slots + ' slots marked of 5 above Common');
      } finally { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); setView('upg'); renderAll(); }
      return { fl, o };
    });
    await page.setViewportSize({ width: 400, height: 860 });   // (the harness's own)
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['Lifetime: ' + r.o.n + ' numbers, read right, none cut at 320, the five Career pages in sight; ' + r.o.shapes + ' rarity shapes on the clubs, ' + r.o.slots + ' slots marked clear of their names'];
  }
};
