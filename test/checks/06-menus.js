/* The five tabs, the two sub navs, the pull tab, and the folds. The shot book
 * and the trophy room no longer have tabs of their own, so the old view names
 * have to keep routing; and the skill cooldown bars are driven off the view
 * name, which is exactly how they stopped ticking when the shot book moved. */
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
    return ['5 tabs, both sub navs, folds, cooldowns; pull tab gains ' + grew + 'px'];
  }
};
