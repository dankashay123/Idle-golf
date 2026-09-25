/* No stray ring beside him (the user asked: "what are the yellow rings
 * next to the golfer? ... please remove it").
 *
 * A ring used to swell out from a spot off his hip on every pure strike
 * (brass), affinity (its colour) and skill (green), hanging in the air
 * beside him. It is gone: a frame drawn after a pure strike, an affinity
 * and a skill going off is the same as one drawn without them, over the
 * half second the rings used to last.
 */
'use strict';
module.exports = {
  name: 'rings',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {}, keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        startHole(); Scene.announce = null;
        const D = derive(), c = Scene.b;
        const at = (fire) => {
          Scene.t = 40; Scene.nums.length = 0; Scene.casts && (Scene.casts.length = 0);
          if (fire) { Scene.spark('crit'); Scene.spark('ember'); Scene.burst('thunder'); }
          const frames = [];
          for (let k = 0; k < 3; k++) { Scene.t = 40 + k * 0.1; Scene.draw(0.1, D); frames.push(c.getImageData(0, 0, VW, VH).data); }
          return frames;
        };
        const A = at(true), B2 = at(false);
        let n = 0;
        for (let k = 0; k < 3; k++) for (let i = 0; i < A[k].length; i += 4)
          if (A[k][i] !== B2[k][i] || A[k][i + 1] !== B2[k][i + 1] || A[k][i + 2] !== B2[k][i + 2]) n++;
        o.n = n;
      } finally {
        window.step = keep;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; startHole();
      }
      return o;
    });
    if (r.n) throw new Error('a pure strike, an affinity and a skill still draw ' + r.n + ' pixels beside him');
    return ['a pure strike, an affinity and a skill: nothing drawn beside him over 0.3s'];
  }
};
