/* A shot's name (THUNDER for a Thunder Drive) rising up the left of the
 * course stays clear of the buttons down the left: on its side the course
 * is short, and it rose straight across them (seen in a first hour played
 * on its side). Upright it keeps its place at the left edge. */
'use strict';
module.exports = {
  name: 'castclear',
  async run(page) {
    const out = [], fails = [];
    for (const [W, H] of [[844, 390], [740, 360], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width: W, height: H }); await page.waitForTimeout(400);
      const r = await page.evaluate(() => {
        hideSheet(); Scene.announce = null; Scene.casts.length = 0;
        const cr = Scene.cv.getBoundingClientRect(), k = cr.height / VH;
        const btns = [...document.querySelectorAll('#hudLeft button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
        // where the game drew the word over its rise, in the page's pixels
        let worst = 0; const D = derive();
        for (const t of [0.02, 0.3, 0.6, 0.9]) {
          Scene.casts.length = 0; Scene.cast('THUNDER'); Scene.casts[0].t = t; Scene.draw(0, D);
          const C = Scene.casts[0]; if (!C || C.x === undefined) return { worst: -1, n: btns.length };
          const w = textW('THUNDER', TSC), top = C.y - LH * TSC;
          const L = cr.left + C.x * k, R = cr.left + (C.x + w) * k, T = cr.top + top * k, Bm = cr.top + C.y * k;
          for (const b of btns) { const ox = Math.min(R, b.right) - Math.max(L, b.left), oy = Math.min(Bm, b.bottom) - Math.max(T, b.top); if (ox > 0 && oy > 0) worst = Math.max(worst, ox * oy); }
        }
        Scene.casts.length = 0;
        return { worst: Math.round(worst), n: btns.length };
      });
      out.push(W + 'x' + H + ':' + r.worst);
      if (r.worst < 0) fails.push(W + 'x' + H + ': the shot\'s name not drawn');
      if (r.worst > 0) fails.push(W + 'x' + H + ': the shot\'s name over the buttons (' + r.worst + ' square pixels)');
      if (!r.n) fails.push(W + 'x' + H + ': no buttons found');
    }
    if (fails.length) throw new Error(fails.join('; '));
    return ['a shot\'s name rising up the left clear of the buttons at 844x390, 740x360, 390x844 and 320x568 (' + out.join(' ') + ')'];
  }
};
