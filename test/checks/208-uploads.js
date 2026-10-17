/* The phone kept hot (the user, twice): every frame pushed the tree mask to
 * the graphics chip whole, twice, and the trees in front of props whole
 * once more, for the few pixels where things stand.
 *
 *   - over ten holes, day and night, standing and walking, the pixels sent
 *     to the canvas a frame stay under 300 KB (they were about 500)
 *   - and the tree mask on the canvas is, after every frame, exactly what
 *     sending it whole would have made */
'use strict';
module.exports = {
  name: 'uploads',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), raf = window.requestAnimationFrame, P = CanvasRenderingContext2D.prototype, pi = P.putImageData, ot = Scene.overTrees, fl = [], f = m => fl.push(m), o = {};
      let bytes = 0, frames = 0, checks = 0, bad = 0;
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; HOUR_FORCE = 14;
        P.putImageData = function (img, x, y, dx, dy, dw, dh) { bytes += (dw === undefined ? img.width * img.height : Math.max(0, dw) * Math.max(0, dh)) * 4; return pi.apply(this, arguments); };
        Scene.overTrees = function (c, layer) { const out = ot.call(this, c, layer);
          if (this.treeMask && this._tmF) { checks++; const d = new Uint32Array(pi.call ? this.treeMask.getImageData(0, 0, VW, VH).data.buffer : []);
            for (let i = 0; i < d.length; i++) if (d[i] !== this._tmF[i]) { bad++; break; } }
          return out; };
        DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet();
        for (let hole = 0; hole < 10; hole++) {
          HOUR_FORCE = hole % 4 === 3 ? 22 : 9 + hole; S.hole += 1; startHole(); Scene.announce = null;
          for (let i = 0; i < 100; i++) { const D = derive(); step(1 / 60, D); Scene.draw(1 / 60, D); frames++; }
        }
        o.kb = Math.round(bytes / frames / 1024); o.checks = checks; o.bad = bad;
        if (!(o.kb < 300)) f(o.kb + ' KB sent to the canvas a frame');
        if (checks < 500 || bad) f('the tree mask on the canvas differed from sending it whole on ' + bad + ' of ' + checks + ' frames');
      } finally { P.putImageData = pi; Scene.overTrees = ot; window.requestAnimationFrame = raf; HOUR_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return [r.o.kb + ' KB sent to the canvas a frame over 1,000 frames; the tree mask exact on all ' + r.o.checks];
  }
};
