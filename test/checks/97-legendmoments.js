/* The Legendary skins' moments made their own (the user asked them up
 * toward the Mythic sets'): on an albatross or an ace each lays something
 * of its own over the grass round him and throws something of its own out
 * of him, over the burst from his outline every flourish has.
 *
 *   - drawn alone a third of the way through, with and without it, each
 *     adds pixels of its own, more on an ace than an albatross
 *   - none of it before the moment or after its half second
 */
'use strict';
module.exports = {
  name: 'legendmoments',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], adds: {} }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const keep = {}; for (const k in FLOURISH_SIG) keep[k] = FLOURISH_SIG[k];
      try {
        hideSheet(); QUIET = true;
        const cv = document.createElement('canvas'); cv.width = 200; cv.height = 160; const c = cv.getContext('2d');
        const ids = { inferno: 'inferno', frost: 'frostborn', storm: 'stormcaller', void: 'void', glitch: 'glitch', midas: 'midas', disco: 'disco' };
        for (const id in ids) {
          const fx = ids[id]; S.styleOwn['o:' + id] = 1; S.outfit = id; buildSprites();
          const draw = (on, big, T) => { FLOURISH_SIG[fx] = on ? keep[fx] : {};
            Scene.flourish = { t0: 10 - T, big, dur: FLOURISH_DUR, fx };
            c.fillStyle = '#4E8F3A'; c.fillRect(0, 0, 200, 160);
            const spr = SPRITE.gFinish, h = 58, w = Math.round(h * spr.w / spr.h);
            paintGolfer(c, 70, 120 - h, w, h, 0.999, 10, 120, false, 0, spr, [], undefined, false);
            FLOURISH_SIG[fx] = keep[fx]; return c.getImageData(0, 0, 200, 160).data; };
          const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n; };
          const alb = diff(draw(false, false, 0.15), draw(true, false, 0.15)), ace = diff(draw(false, true, 0.15), draw(true, true, 0.15));
          o.adds[id] = alb + '/' + ace;
          if (alb < 25) f(id + ': its own moment adds only ' + alb + ' pixels on an albatross');
          if (ace <= alb) f(id + ': no more of it on an ace (' + ace + ' against ' + alb + ')');
          const before = diff(draw(false, true, -0.05), draw(true, true, -0.05)), after = diff(draw(false, true, 0.55), draw(true, true, 0.55));
          if (before || after) f(id + ': drawn outside its half second (' + before + ' before, ' + after + ' after)');
        }
      } finally {
        Object.assign(FLOURISH_SIG, keep); Scene.flourish = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['pixels each moment adds (albatross/ace): ' + Object.entries(r.adds).map(([k, v]) => k + ' ' + v).join(', ')];
  }
};
