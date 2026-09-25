/* A skin flies with him (the user saw it: over the island's water the
 * Ascended was a plain figure, "it takes a lot away from the skin").
 *
 * Flying over the island's lake or the canyon on his spinning club, he was
 * drawn by his own painter, which never asked the skin for its effects: no
 * cape, wings, horns, aura, flames or flourish.
 *
 *   - every skin (not the fun suits, whose bits are on the face) draws its
 *     effect in flight: the same flight drawn with the skin's effect and
 *     with it taken away differs, summed over several moments
 *   - the Demonic's and the Divine's wings show either side of him
 *   - nothing is left under his feet in the air: what a skin lays round his
 *     feet (a glow, mist, a puddle of light, the pit's smoke and tendrils, a
 *     banana peel) stays on the ground: at his boots, out past his sides,
 *     no more of the effect than as many rows at his waist, where a
 *     beam, snow or sparks are as thick (six pixels over, at most, in
 *     three moments of five)
 *   - a flourish on an ace goes off in flight too
 *   - his arms are up holding the club, not hanging at his sides (the
 *     walking-away picture has them painted in, and the raised pair was
 *     drawn over it, so he had four; the user saw them by his sides): in
 *     every skin with arms of their own colour, none of it beside his
 *     body below the shoulders, and his arms seen above his head; the
 *     Ascended's cape does not cover them
 */
'use strict';
module.exports = {
  name: 'flight',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = { skins: [], fails: [] }, SNAP = JSON.stringify(S), keepFl = Scene.flourish;
      try {
        QUIET = true;
        const W = 200, H = 220, cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        const c = cv.getContext('2d');
        // his size in flight on a phone, up off the water a good way
        const h = 60, w = Math.round(h * SPRITE.gBack.w / SPRITE.gBack.h), x = 80, y = 70, bot = y + h + 50;
        const shot = (t) => { c.clearRect(0, 0, W, H); paintHeli(c, x, y, w, h, t, bot); return c.getImageData(0, 0, W, H).data; };
        const z0 = id => (B.OUTFITS.find(q => q.id === id) || { n: id }).n;
        const fxs = B.OUTFITS.filter(z => z.fx && STYLEFX[z.fx]);
        for (const z of fxs) {
          S.styleOwn['o:' + z.id] = 1; S.outfit = z.id; buildSprites();
          const FX = STYLEFX[z.fx];
          let diff = 0, left = 0, right = 0, grounded = 0, most = -99;
          for (const t of [0.3, 1.1, 2.7, 4.2, 6.9]) {
            const a = shot(t);
            let below = 0;
            STYLEFX[z.fx] = null;
            const b = shot(t);
            STYLEFX[z.fx] = FX;
            for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
              const i = (yy * W + xx) * 4;
              if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) < 24) continue;
              diff++;
              // flat and wide at his boots: a glow, a pool or a puddle laid round
              // his feet, counted against as many rows at his waist (a
              // beam from the sky, snow or sparks are as thick there)
              const out = xx < x - 2 || xx > x + w + 2;
              if (out && yy >= y + h - 2 && yy <= y + h + 3) below++;
              if (out && yy >= y + h - 30 && yy <= y + h - 25) below--;
              if (yy < y + h * 0.6) { if (xx < x - 2) left++; if (xx > x + w + 2) right++; }
            }
            if (below > 6) grounded++;
            most = Math.max(most, below);
          }
          o.skins.push(z.id + ' ' + diff);
          if (z.cat === 'skin' && diff < 40) o.fails.push(z.n + ' draws only ' + diff + ' pixels of its effect in flight');
          // (a glow on the ground is there at every moment; a spark or the
          // Glitch's scanline passing his boots now and then is not)
          if (grounded >= 3) o.fails.push(z.n + ' leaves a glow round his feet in the air, as if on the ground (' + grounded + ' of 5 moments, up to ' + most + ' pixels)');
          o.worst = Math.max(o.worst || -99, most);
          if ((z.fx === 'demonic' || z.fx === 'divine') && (left < 40 || right < 40))
            o.fails.push(z.n + '\'s wings in flight: ' + left + ' pixels left of him, ' + right + ' right');
        }
        // his arms: up, and none hanging at his sides
        o.arms = [];
        for (const id of ['classic', 'inferno', 'demonic', 'ascended']) {
          S.styleOwn['o:' + id] = 1; S.outfit = id; buildSprites();
          const O = outfitNow(), SK = new Set([O.skin || PX.skin, O.skin2 || PX.skin2].map(v => v.toUpperCase()));
          const count = () => {
            const d = shot(2.2); let up = 0, side = 0;
            for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
              const i = (yy * W + xx) * 4, hx = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
              if (!SK.has(hx)) continue;
              if (yy < y + h * 0.27) up++;
              if (yy > y + h * 0.36 && yy < y + h * 0.54 && (xx < x + w * 0.29 || xx > x + w * 0.71)) side++;
            }
            return { up, side };
          };
          const { up, side } = count();
          // (and the skin's front half, a cape, leaves them be: the same with it taken away)
          const FX = STYLEFX[O.fx], fr = FX && FX.front;
          if (fr) FX.front = () => {};
          const bare = count().up;
          if (fr) FX.front = fr;
          if (up < bare * 0.92) o.fails.push(z0(id) + '\'s arms in flight covered by the skin: ' + up + ' of ' + bare + ' pixels');
          o.arms.push(id + ' ' + up + '/' + side);
          if (up < 90) o.fails.push(z0(id) + '\'s arms above his head in flight: ' + up + ' pixels');
          if (side > 2) o.fails.push(z0(id) + '\'s arms hang at his sides in flight: ' + side + ' pixels');
        }
        // an ace's flourish, in flight
        S.styleOwn['o:inferno'] = 1; S.outfit = 'inferno'; buildSprites();
        Scene.flourish = { t0: 10 - 0.15, big: true, dur: FLOURISH_DUR, fx: 'inferno' };
        const FL = flourishNow({ minor: false, t: 10 });
        const a = shot(10);
        Scene.flourish = null;
        const b = shot(10);
        let fl = 0;
        for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) fl++;
        o.flourish = fl; o.flOn = !!FL;
        if (!(fl >= 30)) o.fails.push('an ace\'s flourish in flight drew ' + fl + ' pixels' + (FL ? '' : ' (not running: the check\'s setup)'));
      } finally {
        Scene.flourish = keepFl;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        buildSprites(); QUIET = false;
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['in flight, each skin\'s own pixels (5 moments): ' + r.skins.join(', '), 'an ace\'s flourish in flight: ' + r.flourish + ' pixels', 'most round his feet at a moment: ' + r.worst, 'arms above his head / by his sides: ' + r.arms.join(', ')];
  }
};
