/* Dragonflies over the water (the user picked them from the menu): on a
 * summer day one to three hover and dart about a hole's reeds and lily
 * pads; spotted, they count for the Field Guide's Dragonfly.
 *
 *   - summer only (a seasoned course by its season, the others by the
 *     month: pinned to July, then to November), by day, dry; never on ice
 *   - only where there are reeds or pads, close by them, three at most, on
 *     most such holes, the same each time the hole is laid
 *   - drawn, and big enough to see: a body and wings
 *   - spotted live, the Guide's one Dragonfly counts it */
'use strict';
module.exports = {
  name: 'dragonfly',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = { wet: 0, flies: 0, off: 0 };
      const JULY = Math.round(Date.UTC(2026, 6, 15) / 86400000), NOV = Math.round(Date.UTC(2026, 10, 15) / 86400000);
      QUIET = true;
      try {
        for (const [day, sea, summer] of [[JULY, 0, true], [NOV, 1, false]]) {
          DAY_FORCE = day; SEASON_FORCE = sea;
          for (let ci = 0; ci < B.COURSE.length; ci++) {
            DEV.course(ci); hideSheet();
            for (let k = 0; k < 30; k++) {
              const h = S.hole + k; Scene.newHole(h, S.tier);
              const P = Scene.props || [], at = P.filter(p => p.kind === 26 && (p.sp === 'lily' || p.sp === 'reed')), fl = P.filter(p => p.sp === 'dfly'), id = B.COURSE[ci].id + ' h' + h;
              if (!summer) { o.off += fl.length; if (fl.length) f(id + ': a dragonfly in November'); continue; }
              if (fl.length && !at.length) f(id + ': dragonflies with no reeds or pads');
              if (fl.length > 3) f(id + ': ' + fl.length + ' dragonflies');
              if ((Scene.night || Scene.rain || Scene.ice) && fl.length) f(id + ': dragonflies at night, in the rain or on ice');
              for (const d of fl) if (!at.some(a => Math.abs(a.d - d.d) < 1 && Math.abs(a.x - d.x) < 1.5)) f(id + ': a dragonfly far from the water\'s edge');
              if (at.length && !Scene.night && !Scene.rain && !Scene.ice) { o.wet++; if (fl.length) o.flies++; }
              const again = JSON.stringify(fl.map(p => [p.d, p.x, p.c]));
              Scene.newHole(h, S.tier);
              if (JSON.stringify((Scene.props || []).filter(p => p.sp === 'dfly').map(p => [p.d, p.x, p.c])) !== again) f(id + ': laid differently a second time');
            }
          }
        }
        if (!o.wet) f('no summer day hole with reeds or pads');
        else if (o.flies / o.wet < 0.5 || o.flies / o.wet > 0.9) f('dragonflies on ' + o.flies + ' of ' + o.wet + ' summer holes with reeds or pads');
        // drawn: a frame with them, against one with them taken away
        DAY_FORCE = JULY; SEASON_FORCE = 0; DEV.course(0); hideSheet(); DFLY_FORCE = true; S.chaos = { n: 'Fair' }; DEV.stones(); hideSheet(); Scene.announce = null;
        const fl = (Scene.props || []).filter(p => p.sp === 'dfly');
        if (!fl.length) f('pinned, no dragonfly laid');
        else {
          const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; const D = derive(), keep = Scene.props;
          const shot = () => { for (let k = 0; k < 2; k++) { Scene.t = 0.5; Scene.camD = Math.max(0, fl[0].d - 6); Scene.draw(0, D); } return Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data; };
          const a = shot(); Scene.props = keep.filter(p => p.sp !== 'dfly'); const b = shot(); Scene.props = keep; window.requestAnimationFrame = raf;
          let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
          o.drawn = n; if (n < 14 * fl.length) f(fl.length + ' dragonflies drew ' + n + ' pixels');
        }
        // a course whose rare visitor is the dragonfly: these tick it
        { const id = Object.keys(COURSE_RARE).find(k => rareOf(k).includes('dragonfly')), keepR = JSON.stringify(S.cwildR || {});
          try { S.cwildR = {}; courseWildSee({ course: courseById(id), props: [{ kind: 26, sp: 'dfly' }] });
            if (!((S.cwildR[id] || {}).dragonfly)) f(id + ': a dragonfly seen, its rare visitor not ticked'); } finally { S.cwildR = JSON.parse(keepR); } }
        // the Guide
        // (the Guide had a dragonfly already, flitting over water: these
        // count for it, never a second entry of the same name)
        if (GUIDE.filter(g => g.id === 'dragonfly').length !== 1) f(GUIDE.filter(g => g.id === 'dragonfly').length + ' Guide entries for the dragonfly');
        if (!guideUrl('dragonfly')) f('no picture in the Guide');
        QUIET = false; S.guide = S.guide || {}; const n0 = S.guide.dragonfly || 0, tw = window.toast; window.toast = () => {};
        try { guideSpot({ hole: S.hole, props: [{ kind: 26, sp: 'dfly' }] }); } finally { window.toast = tw; }
        if ((S.guide.dragonfly || 0) !== n0 + 1) f('spotted, the Guide counted ' + ((S.guide.dragonfly || 0) - n0));
      } finally { DFLY_FORCE = null; DAY_FORCE = null; SEASON_FORCE = -1; STONES_FORCE = 0; QUIET = false; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['in July dragonflies on ' + r.o.flies + ' of ' + r.o.wet + ' day holes with reeds or pads, by them, three at most, the same each time; none in November; drawn (' + r.o.drawn + 'px); spotted, the Guide counts it'];
  }
};
