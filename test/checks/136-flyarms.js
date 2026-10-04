/* Flying over the lake on the spinning club, seen from behind, his arms go
 * up in front of him to the grip: his head and back are nearer than they
 * are, so no pixel of an arm lies over them. Drawn over his back, they read
 * as arms bent behind it (the user saw it, him and her alike).
 *
 * Draws the pose twice, alone at real size: once as it is, once with the
 * arms' lines left out; wherever the second has his own pixels from his
 * shoulders up, the first must be the same there (the club, spinning flat
 * over his head, is drawn last in both, so it is the same in both). */
'use strict';

module.exports = {
  name: 'flyarms',
  async run(page) {
    const r = await page.evaluate(() => {
      const was = S.gender, out = [];
      try {
        for (const gen of ['m', 'f']) {
          S.gender = gen; buildSprites();
          for (const t of [0.1, 0.3, 0.7]) {
            const draw = noArms => {
              const cv = document.createElement('canvas'); cv.width = 60; cv.height = 120;
              const g = cv.getContext('2d');
              const h = 58, w = Math.round(h * SPRITE.gBack.w / SPRITE.gBack.h);
              const keep = window.pxLine, O = outfitNow(), arm = [O.skin || PX.skin, O.skin2 || PX.skin2];
              if (noArms) window.pxLine = function (c, a, b, x2, y2, col) { if (arm.includes(col)) return; return keep.apply(this, arguments); };
              try { paintHeli(g, 30 - w / 2, 40, w, h, t, 40 + h + 8); } finally { window.pxLine = keep; }
              return { d: g.getImageData(0, 0, 60, 120).data, y0: 40, h };
            };
            const A = draw(false), N = draw(true);
            let body = 0, over = 0;
            for (let y = A.y0 + Math.round(A.h * 0.02); y < A.y0 + Math.round(A.h * 0.45); y++)
              for (let x = 0; x < 60; x++) {
                const k = (y * 60 + x) * 4;
                if (N.d[k + 3] < 255) continue;   // (a soft edge of her sleeve shows what is behind it)
                body++;
                if (A.d[k] !== N.d[k] || A.d[k + 1] !== N.d[k + 1] || A.d[k + 2] !== N.d[k + 2]) { over++; (window.__fa = window.__fa || []).push([gen, t, x, y - A.y0, [...N.d.slice(k, k + 4)], [...A.d.slice(k, k + 4)]]); }
              }
            out.push({ gen, t, body, over });
          }
        }
      } finally { S.gender = was; buildSprites(); }
      return out;
    });
    for (const x of r) {
      if (x.body < 150) throw new Error('too little of him drawn to judge (' + JSON.stringify(x) + ')');
      if (x.over > 0) throw new Error('an arm crosses his head or back as he flies: ' + JSON.stringify(x) + ' ' + JSON.stringify(await page.evaluate(() => (window.__fa || []).slice(0, 8))));
    }
  }
};
