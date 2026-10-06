/* The course's banner as a new course begins: its name clear of the readout,
 * the icons and the hole map at every phone size and on its side (at 320
 * the readout wraps to more lines and hid the name; on its side the name at
 * twice the size ran under the icons and the map). In the hole's call's
 * lettering, smaller (the user asked): painted, the name and the line under
 * it clear of them, gone when it ends.
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
        Scene.announce = { name: 'WILLOW CREEK', sub: 'HOME OF TOUR CARD 1', label: 'Willow Creek', subLabel: 'Home of Tour Card 1', t: 1, dur: 4.2, gold: false };
        Scene.drawAnnounce(0);
        // (the lettering on its canvas, inside the margin left for its glow;
        // and painted: none at all was the hole's call's fault on the phone)
        const el = document.getElementById('annCall'), ec = el.querySelector('canvas'), q = ec.getBoundingClientRect();
        const name = { l: q.left + 8, r: q.right - 8, t: q.top + 8, b: q.bottom - 8 };
        const d = ec.getContext('2d').getImageData(0, 0, ec.width, ec.height).data; let ink = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) ink++;
        const shown = !el.hidden && +el.style.opacity > 0.9;
        Scene.announce = null; Scene.drawAnnounce(0);
        const gone = el.hidden;
        const hit = [];
        for (const id of ['readout', 'hudClimb', 'setBtn', 'calBtn', 'shopBtn', 'roomBtn', 'perkBtn', 'holeMap']) {
          const e = document.getElementById(id); if (!e || !e.offsetParent) continue;
          const b = e.getBoundingClientRect(); if (!b.width) continue;
          if (b.left < name.r && b.right > name.l && b.top < name.b && b.bottom > name.t) hit.push(id + ' ' + [b.left, b.right, b.top, b.bottom].map(Math.round) + ' against ' + [name.l, name.r, name.t, name.b].map(Math.round));
        }
        return { hit, ink: ink / Math.max(1, d.length / 4), shown, gone };
      });
      rows.push(w + 'x' + h);
      if (!r.shown) fails.push('at ' + w + 'x' + h + ' the course name not shown');
      if (!(r.ink > 0.1)) fails.push('at ' + w + 'x' + h + ' the course name barely painted (' + (r.ink * 100).toFixed(1) + '%)');
      if (!r.gone) fails.push('at ' + w + 'x' + h + ' the course name still up after it ended');
      if (r.hit.length) fails.push('at ' + w + 'x' + h + ' the course name ran under ' + r.hit.join(', '));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if (fails.length) throw new Error(fails.join('; '));
    return ['the course name and its line, painted, clear of the readout, the icons and the map and gone after, at ' + rows.join(', ')];
  }
};
