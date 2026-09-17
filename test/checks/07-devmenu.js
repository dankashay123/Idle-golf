/* The dev menu writes straight to state with no cost and no undo. It must not
 * be reachable by a tap -- the course name is the most prominent text on the
 * screen and the easiest thing on it to hit by accident. */
'use strict';
module.exports = {
  name: 'devmenu',
  async run(page) {
    const open = () => page.evaluate(() => {
      const v = document.getElementById('veil');
      return !!v && getComputedStyle(v).display !== 'none' && v.classList.contains('on');
    });
    const shown = () => page.evaluate(() => (document.getElementById('sheet').textContent || '').includes('Developer'));

    await page.click('#eventLine');
    await page.waitForTimeout(400);
    if (await shown()) throw new Error('a single tap on the course name opened the dev menu');

    // a press that moves is a scroll, not a summon
    const b = await page.$eval('#eventLine', e => { const r = e.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2]; });
    await page.mouse.move(b[0], b[1]);
    await page.mouse.down();
    await page.waitForTimeout(400);
    await page.mouse.move(b[0] + 60, b[1] + 40);
    await page.waitForTimeout(1400);
    await page.mouse.up();
    if (await shown()) throw new Error('a press that moved away still opened the dev menu');

    // held still, it opens
    await page.mouse.move(b[0], b[1]);
    await page.mouse.down();
    await page.waitForTimeout(1800);
    await page.mouse.up();
    if (!await shown()) throw new Error('holding the course name did not open the dev menu');

    return ['tap ignored, drag ignored, 1.5s hold opens it'];
  }
};
