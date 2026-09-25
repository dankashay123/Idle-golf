/* The five tabs, the two sub navs, the pull tab, and the folds. The shot book
 * and the trophy room no longer have tabs of their own, so the old view names
 * have to keep routing; and the skill cooldown bars are driven off the view
 * name, which is exactly how they stopped ticking when the shot book moved.
 *
 * And the locker is tabbed by club. It used to be one run of everything, best
 * first, so finding the wedge you picked up two holes ago meant reading past
 * nine drivers. There is a tile per slot which both shows what you are
 * carrying there and picks what the list below shows, and the list shows that
 * slot and nothing else, carried club at the top.
 *
 * And the Tour tab flashes when a card you have not seen is unlocked, and
 * stops when you go and look. The marker is the highest card SEEN rather than
 * a timer, so it has to survive a reload and it has to come back if another
 * card unlocks after that. */
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
    // Queried and read inside one evaluate. renderDgn() replaces these rows on
    // every slow tick, and $eval resolves the selector in one round trip and
    // reads the style in the next: land a redraw between the two and the style
    // comes off a node that is no longer in the document, which reads as the
    // empty string rather than as a display. That is what "( -> block)" was.
    const foldDisplay = () => page.evaluate(() => {
      const e = document.querySelector('.dgn .fold');
      return e ? getComputedStyle(e).display : 'no fold in the wager book';
    });
    const shut = await foldDisplay();
    await page.click('.dgn .qm'); await page.waitForTimeout(1400);
    const open = await foldDisplay();
    if (shut !== 'none' || open === 'none') throw new Error('the Depths fold does not open (' + shut + ' -> ' + open + ')');

    // the pull tab takes the menu (its top is the tabs now the vitals live in the
    // Range) to the underside of the scorecard and back
    const box = () => page.evaluate(() => {
      const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
      return { nine: r('nineBar'), vitals: r('tabs'), panel: r('panel'), buf: [Scene.buf.width, Scene.buf.height] };
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
        // (the clubs are tiles now, two to a row; each carries its club's id)
        const rows = [...document.getElementById('bagList').children].filter(e => e.classList.contains('gt'));
        if (!rows.length) { out.bad = out.bad || (sl.n + ' tab drew nothing'); continue; }
        for (const r of rows) {
          const it = findItem(+r.dataset.uid);
          if (!it || it.slot !== sl.id) out.bad = out.bad || (sl.n + ' tab listed ' + (it ? 'a ' + it.slot : 'nothing it knows'));
        }
        const carried = rows[0].classList.contains('worn');
        if (sl.id === 'wedge' && !carried)
          out.bad = out.bad || 'the carried wedge is not at the top of its own tab';
        if (rows.slice(sl.id === 'wedge' ? 1 : 0).some(r => r.classList.contains('worn')))
          out.bad = out.bad || (sl.n + ' says it is carrying something it is not');
        if (sl.id === 'wedge') out.wornBtn = (rows[0].querySelector('.wtag') || { textContent: '' }).textContent.trim();
        // two to a row
        if (rows.length > 1) { const a = rows[0].getBoundingClientRect(), b = rows[1].getBoundingClientRect();
          if (Math.abs(a.top - b.top) > 1 || b.left <= a.right - 1) out.bad = out.bad || (sl.n + ': the first two clubs are not side by side'); }
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
      throw new Error('the carried club says "' + lk.wornBtn + '" rather than that it is equipped');
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

    // ---- the Tour tab flashes for a card you have not seen ---------------
    const tourState = () => page.evaluate(() => {
      const t = document.querySelector('.tab[data-v="tour"]');
      return { flash: t.classList.contains('flash'), dot: t.classList.contains('alert'),
               seen: S.cardSeen, max: S.tierMax,
               anim: getComputedStyle(t).animationName };
    });
    await page.click('.tab[data-v="upg"]');
    await page.evaluate(() => { S.tierMax = 4; S.cardSeen = 4; renderTourTab(); });
    const quiet = await tourState();
    if (quiet.flash || quiet.dot)
      throw new Error('the Tour tab is flashing with nothing new unlocked');

    await page.evaluate(() => { S.tierMax = 5; renderTourTab(); });
    const lit = await tourState();
    if (!lit.flash || !lit.dot)
      throw new Error('a newly unlocked card does not light the Tour tab');
    if (lit.anim === 'none')
      throw new Error('the Tour tab carries the class but no animation, so nothing flashes');

    // going to look is what clears it
    await page.click('.tab[data-v="tour"]');
    await page.waitForTimeout(150);
    const looked = await tourState();
    if (looked.flash || looked.dot)
      throw new Error('the Tour tab is still flashing after the Tour screen was opened');
    if (looked.seen !== 5)
      throw new Error('opening the Tour screen left the seen marker at ' + looked.seen
        + ' rather than the unlocked card 5, so it would flash again on reload');

    // and it comes back for the next one
    await page.click('.tab[data-v="upg"]');
    await page.evaluate(() => { S.tierMax = 6; renderTourTab(); });
    if (!(await tourState()).flash)
      throw new Error('the Tour tab does not light again for the card after that');
    await page.click('.tab[data-v="tour"]');
    await page.waitForTimeout(150);

    // ---- the first cards open sooner ---------------------------------------
    // Five events a card had a new player looking at "0 of 5" for 47-49 minutes
    // before the first one opened. 2, 3 and 4 for the first three, then 5.
    const doors = await page.evaluate(() => {
      const o = { need: [0, 1, 2, 3, 10].map(t => eventsToUnlock(t)) };
      S.tier = 0; S.tierMax = 0; S.tierEvents = {}; S.hole = 72; S.cardSeen = 0;
      QUIET = true;
      try {
        S.hole = 73; endTournament(); o.after1 = S.tierMax;
        S.hole = 145; endTournament(); o.after2 = S.tierMax;
      } finally { QUIET = false; }
      setView('tour');
      o.line = (document.getElementById('tierBox').textContent.match(/Events on Card [IVXL]+\s*\d+ of \d+/) || [''])[0];
      try { hideSheet(); } catch (e) {}
      return o;
    });
    if (doors.need.join() !== '2,3,4,5,5')
      throw new Error('events to open the next card read ' + doors.need.join('/') + ', not 2/3/4/5/5');
    if (doors.after1 !== 0 || doors.after2 !== 1)
      throw new Error('Card II opened after ' + (doors.after1 ? 1 : doors.after2 ? 2 : 'more than 2')
        + ' events on Card I, not 2');
    // tier 0 is "Card I", so the first card to open is Card II
    if (!/Card II\s*0 of 3/.test(doors.line))
      throw new Error('with Card II open the Tour panel reads "' + doors.line + '", not "Card II 0 of 3"');

    return ['the first three cards open after 2, 3 and 4 events, then 5',
      '5 tabs, both sub navs, folds, cooldowns; pull tab gains ' + grew + 'px',
      'tour tab flashes on a new card and clears on the visit',
      'locker tabbed ' + lk.tabs.join('/') + ', ' + lk.held + '/' + lk.cap + ' held',
      'six identical tiles, ' + lk.geom[0].h + 'px, centred'];
  }
};
