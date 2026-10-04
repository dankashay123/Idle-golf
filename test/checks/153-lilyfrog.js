/* A frog on a lily pad (the user picked it from the menu): now and then a
 * frog sits on one of a hole's lily pads; spotted, its own Field Guide entry.
 *
 *   - only on a hole with pads, on one of them, about one in three such
 *     holes, the same each time the hole is laid; none on ice (no pads)
 *   - drawn on its pad
 *   - spotted live, the Guide counts it; it has a picture */
'use strict';
module.exports = {
  name: 'lilyfrog',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = { pads: 0, frogs: 0 };
      QUIET = true;
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          for (let k = 0; k < 30; k++) {
            const h = S.hole + k; Scene.newHole(h, S.tier);
            const P = Scene.props || [], pads = P.filter(p => p.kind === 26 && p.sp === 'lily'), frogs = P.filter(p => p.frog);
            if (frogs.length && !pads.length) f(B.COURSE[ci].id + ' h' + h + ': a frog with no pad');
            if (frogs.some(p => p.kind !== 26 || p.sp !== 'lily')) f(B.COURSE[ci].id + ' h' + h + ': a frog not on a pad');
            if (frogs.length > 1) f(B.COURSE[ci].id + ' h' + h + ': ' + frogs.length + ' frogs');
            if (Scene.ice && frogs.length) f(B.COURSE[ci].id + ' h' + h + ': a frog on ice');
            if (pads.length) { o.pads++; if (frogs.length) o.frogs++; }
            const again = JSON.stringify(frogs.map(p => [p.d, p.x]));
            Scene.newHole(h, S.tier);
            if (JSON.stringify((Scene.props || []).filter(p => p.frog).map(p => [p.d, p.x])) !== again) f(B.COURSE[ci].id + ' h' + h + ': laid differently a second time');
          }
        }
        if (o.frogs / o.pads < 0.15 || o.frogs / o.pads > 0.5) f(o.frogs + ' frogs on ' + o.pads + ' holes with pads');
        // drawn: a frame with it, against one with its flag taken off
        DEV.course(0); hideSheet(); LILYFROG_FORCE = true; S.chaos = { n: 'Fair' }; DEV.stones(); hideSheet();
        const fr = (Scene.props || []).find(p => p.frog);
        if (!fr) f('pinned, no frog laid');
        else {
          const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; const D = derive();
          const shot = () => { for (let k = 0; k < 2; k++) { Scene.camD = Math.max(0, fr.d - 6); Scene.draw(0, D); } return Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data; };
          const a = shot(); fr.frog = 0; const b = shot(); fr.frog = 1; window.requestAnimationFrame = raf;
          let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
          o.drawn = n; if (n < 6) f('the frog drew ' + n + ' pixels');
        }
        // the Guide
        if (!GUIDE.find(g => g.id === 'lilyfrog' && g.g === 'w')) f('no Guide entry on the Wildlife shelf');
        if (!guideUrl('lilyfrog')) f('no picture in the Guide');
        QUIET = false; S.guide = S.guide || {}; const n0 = S.guide.lilyfrog || 0, tw = window.toast; window.toast = () => {};
        try { guideSpot({ hole: S.hole, props: [{ kind: 26, sp: 'lily', frog: 1 }] }); } finally { window.toast = tw; }
        if ((S.guide.lilyfrog || 0) !== n0 + 1) f('spotted, the Guide counted ' + ((S.guide.lilyfrog || 0) - n0));
      } finally { LILYFROG_FORCE = null; STONES_FORCE = 0; QUIET = false; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['a frog on ' + r.o.frogs + ' of ' + r.o.pads + ' holes with lily pads, on a pad only, one at most, the same each time; drawn (' + r.o.drawn + 'px); spotted, the Guide counts it'];
  }
};
