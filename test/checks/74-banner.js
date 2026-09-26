/* The course's banner as a new course begins: its name clear of the readout,
 * the icons and the hole map at every phone size and on its side (at 320
 * the readout wraps to more lines and hid the name; on its side the name at
 * twice the size ran under the icons and the map).
 */
'use strict';
module.exports = {
  name: 'banner',
  async run(page) {
    const rows = [], fails = [];
    for (const [w, h] of [[320, 568], [375, 667], [390, 844], [440, 956], [740, 360], [844, 390], [932, 430]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        try { hideSheet(); } catch (e) {}
        const cv = Scene.cv, cr = cv.getBoundingClientRect(), k = cr.height / VH;
        Scene.announce = { name: 'WILLOW CREEK', sub: 'HOME OF TOUR CARD I', t: 1, dur: 4.2, gold: false };
        Scene.drawAnnounce(0);
        const A = Scene.announce, tw = textW(A.name, A.big);
        const name = { l: cr.left + (A.cx - tw / 2) * k, r: cr.left + (A.cx + tw / 2) * k, t: cr.top + (A.y0 - 2) * k, b: cr.top + (A.y0 + FH * A.big + 2) * k };
        Scene.announce = null;
        const hit = [];
        for (const id of ['readout', 'hudClimb', 'setBtn', 'shopBtn', 'roomBtn', 'perkBtn', 'holeMap']) {
          const e = document.getElementById(id); if (!e || !e.offsetParent) continue;
          const b = e.getBoundingClientRect(); if (!b.width) continue;
          if (b.left < name.r && b.right > name.l && b.top < name.b && b.bottom > name.t) hit.push(id + ' ' + [b.left, b.right, b.top, b.bottom].map(Math.round) + ' against ' + [name.l, name.r, name.t, name.b].map(Math.round));
        }
        return { hit, big: A.big / TSC };
      });
      rows.push(w + 'x' + h + (r.big > 1 ? ' big' : ''));
      if (r.hit.length) fails.push('at ' + w + 'x' + h + ' the course name ran under ' + r.hit.join(', '));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if (fails.length) throw new Error(fails.join('; '));
    return ['the course name clear of the readout, the icons and the map at ' + rows.join(', ')];
  }
};
