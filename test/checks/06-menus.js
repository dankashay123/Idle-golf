/* The five tabs, the two sub navs, the pull tab, and the folds. The shot book
 * and the trophy room no longer have tabs of their own, so the old view names
 * have to keep routing; and the skill cooldown bars are driven off the view
 * name, which is exactly how they stopped ticking when the shot book moved.
 *
 * And the locker is tabbed by club. It used to be one run of everything, best
 * first, so finding the wedge you picked up two holes ago meant reading past
 * nine drivers. There is a tile per slot which both shows what you are
 * carrying there and picks what the list below shows, and the list shows that
 * slot and nothing else, carried club at the top. */
'use strict';
module.exports = {
  name: 'menus',
  async run(page) {
    await page.evaluate(() => { QUIET = true; DEV.gold(400); DEV.skills(); DEV.keys();
      QUIET = false; hideSheet(); });
    await page.waitForTimeout(300);

    const tabs = await page.$$eval('.tab', a => a.map(t => t.textContent.trim()));
    if (tabs.length !== 5) throw new Error('expected 5 tabs, found ' + tabs.length + ': ' + tabs);

    for (const t of ['upg', 'bag', 'dgn', 'tour', 'career']) {
      await page.click('.tab[data-v="' + t + '"]');
      await page.waitForTimeout(150);
      if (!await page.$('#v-' + t + '.on')) throw new Error('tab ' + t + ' did not open its view');
    }

    // the retired names still land somewhere sensible
    const skl = await page.evaluate(() => { setView('skl'); return [view, bagSub, !$('bagShots').hidden]; });
    if (skl[0] !== 'bag' || skl[1] !== 'shots' || !skl[2]) throw new Error('setView("skl") went to ' + skl);
    const leg = await page.evaluate(() => { setView('leg'); return [view, careerSub, !$('legWrap').hidden]; });
    if (leg[0] !== 'career' || leg[1] !== 'leg' || !leg[2]) throw new Error('setView("leg") went to ' + leg);

    // cooldown bars tick in the shot book's new home
    await page.evaluate(() => setView('skl'));
    await page.waitForTimeout(300);
    const read = () => page.$$eval('#sklRows .cd', a => a.map(e => e.style.height).join('|'));
    const a = await read(); await page.waitForTimeout(2600); const b = await read();
    if (a === b) throw new Error('skill cooldown bars are frozen: ' + a);

    // the Depths notes fold, and survive the redraw the key timer forces
    await page.evaluate(() => setView('dgn'));
    await page.waitForTimeout(200);
    const shut = await page.$eval('.dgn .fold', e => getComputedStyle(e).display);
    await page.click('.dgn .qm'); await page.waitForTimeout(1400);
    const open = await page.$eval('.dgn .fold', e => getComputedStyle(e).display);
    if (shut !== 'none' || open === 'none') throw new Error('the Depths fold does not open (' + shut + ' -> ' + open + ')');

    // the pull tab takes the menu to the underside of the scorecard and back
    const box = () => page.evaluate(() => {
      const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
      return { nine: r('nineBar'), vitals: r('vitals'), panel: r('panel'), buf: [Scene.buf.width, Scene.buf.height] };
    });
    const before = await box();
    await page.click('#drawer'); await page.waitForTimeout(400);
    const up = await box();
    if (up.vitals[0] !== up.nine[1])
      throw new Error('menu top ' + up.vitals[0] + ' is not the nine bottom ' + up.nine[1]);
    await page.click('#drawer'); await page.waitForTimeout(500);
    const back = await box();
    if (String(back.buf) !== String(before.buf))
      throw new Error('the render buffer changed over the pull tab: ' + before.buf + ' -> ' + back.buf);

    const grew = (up.panel[1] - up.panel[0]) - (before.panel[1] - before.panel[0]);
    // the locker, tabbed by club
    const lk = await page.evaluate(() => {
      S.bag = []; S.equip = {};
      // two of every slot, deliberately out of order, and one carried
      for (const sl of [...B.SLOTS].reverse())
        for (const rar of [1, 4]) S.bag.push(makeItem(10, 0, rar, sl.id));
      S.equip.wedge = makeItem(10, 0, 2, 'wedge');
      S.bagSlot = B.SLOTS[0].id;
      renderBag();

      const tabs = [...document.getElementById('bagGrid').children];
      const out = { tabs: tabs.map(t => t.querySelector('.sk').textContent),
                    want: B.SLOTS.map(s2 => s2.n), bad: null, badges: {} };
      for (const t of tabs) {
        const c = t.querySelector('.sct');
        out.badges[t.querySelector('.sk').textContent] = c ? +c.textContent : 0;
      }

      // every tab shows its own slot and nothing else
      for (let i = 0; i < B.SLOTS.length; i++) {
        tabs[i].onclick();
        const sl = B.SLOTS[i];
        const rows = [...document.getElementById('bagList').children]
          .filter(e => e.classList.contains('card2'));
        if (!rows.length) { out.bad = out.bad || (sl.n + ' tab drew nothing'); continue; }
        for (const r of rows) {
          const t = r.querySelector('.ib').textContent;
          if (t.indexOf(sl.n) !== 0) out.bad = out.bad || (sl.n + ' tab listed "' + t + '"');
        }
        const first = rows[0].querySelector('.ib').textContent;
        const carried = /carrying/.test(first);
        if (sl.id === 'wedge' && !carried)
          out.bad = out.bad || 'the carried wedge is not at the top of its own tab';
        if (sl.id !== 'wedge' && carried)
          out.bad = out.bad || (sl.n + ' says it is carrying something it is not');
        if (sl.id === 'wedge') out.wornBtn = rows[0].querySelector('.equipbtn').textContent.trim();
      }
      // every tile is the same tile, whatever is or is not in that slot. The
      // modifier used to be called "empty", which is also the class on the
      // full width "nothing here yet" placeholder, declared later in the sheet
      // at the same specificity: it won, and put 26px of padding on every slot
      // with nothing in it while the ones with a club kept 5.
      S.equip = {}; S.equip.driver = makeItem(10, 0, 3, 'driver');
      setView('bag'); bagSub = 'gear'; renderBagNav(); renderBag();
      out.geom = [...document.getElementById('bagGrid').children].map(t => {
        const b = t.getBoundingClientRect();
        const i = t.querySelector('.sic').getBoundingClientRect();
        const l = t.querySelector('.sk').getBoundingClientRect();
        return { n: t.querySelector('.sk').textContent, h: Math.round(b.height),
                 icon: Math.round(i.top - b.top), lab: Math.round(l.top - b.top),
                 mid: Math.round((i.top + l.bottom)/2 - b.top - b.height/2) };
      });

      // the header counts the whole locker against the cap
      out.head = document.getElementById('lkHead').textContent;
      out.cap = bagCap(); out.held = S.bag.length;
      return out;
    });
    if (lk.bad) throw new Error('the locker is filtering wrong: ' + lk.bad);
    if (lk.tabs.join() !== lk.want.join())
      throw new Error('locker tabs read ' + lk.tabs.join('/') + ', bag order is ' + lk.want.join('/'));
    for (const n in lk.badges)
      if (lk.badges[n] !== 2)
        throw new Error(n + ' tab badges ' + lk.badges[n] + ' spares, there are 2');
    if (lk.wornBtn !== 'Equipped')
      throw new Error('the carried club offers "' + lk.wornBtn + '" rather than saying it is worn');
    const g0 = lk.geom[0];
    if (!(g0.h > 20))
      throw new Error('the slot tiles measured ' + g0.h + 'px tall, so nothing below was '
        + 'actually measured');
    for (const g of lk.geom) {
      if (g.h !== g0.h || g.icon !== g0.icon || g.lab !== g0.lab)
        throw new Error('the ' + g.n + ' tile is laid out differently from the ' + g0.n
          + ' one: height ' + g.h + ' v ' + g0.h + ', icon at ' + g.icon + ' v ' + g0.icon
          + ', label at ' + g.lab + ' v ' + g0.lab
          + '. Every slot tile is the same tile whatever is in it.');
      if (Math.abs(g.mid) > 3)
        throw new Error('the ' + g.n + ' tile sits ' + g.mid + 'px off centre');
    }

    if (lk.head.indexOf(lk.held + ' / ' + lk.cap) < 0)
      throw new Error('the locker header does not say ' + lk.held + ' / ' + lk.cap
        + ': "' + lk.head + '"');

    return ['5 tabs, both sub navs, folds, cooldowns; pull tab gains ' + grew + 'px',
      'locker tabbed ' + lk.tabs.join('/') + ', ' + lk.held + '/' + lk.cap + ' held',
      'six identical tiles, ' + lk.geom[0].h + 'px, centred'];
  }
};
