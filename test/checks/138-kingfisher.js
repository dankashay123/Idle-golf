/* The kingfisher: on the stones' river about one hole in two, by a pond
 * rarely; by day only, never in winter or the rain; it sits on dry bank and
 * darts out low over the water and back.
 *
 * Lays the stones hole on a seasoned course across many holes, each way. */
'use strict';

module.exports = {
  name: 'kingfisher',
  async run(page) {
    const r = await page.evaluate(() => {
      QUIET = true; const keep = window.courseFor, ch = S.chaos, cs = courseById('riverbend'), out = { river: 0, n: 0, bad: [], pond: 0, pn: 0 };
      try {
        window.courseFor = () => cs;
        const lay = (h, chaos, sea) => { S.chaos = { n: chaos }; SEASON_FORCE = sea; Scene.newHole(h, 4);
          return (Scene.props || []).filter(q => q.kind === 15 && q.an === 'kingfisher'); };
        for (let i = 0; i < 80; i++) {
          const h = 1000 + i * 37;
          STONES_FORCE = h;
          const k = lay(h, 'Fair', 0); out.n++;
          if (k.length) { out.river++;
            const p = k[0], W = Scene.water;
            if (!W || !W.river) out.bad.push('no river at ' + h);
            if (Scene.inPond(p.d, p.x, 0) || (Math.abs(p.d - W.d) < W.rd && Math.abs(p.x - W.x) < W.rx)) out.bad.push('in the water at ' + h);
            if (!(Math.abs(p.td - W.d) < W.rd)) out.bad.push('darts to dry ground at ' + h);
          }
          if (lay(h, 'Night', 0).length) out.bad.push('out at night at ' + h);
          if (lay(h, 'Crosswind', 0).length) out.bad.push('out in the rain at ' + h);
          if (lay(h, 'Fair', 1 + 1).length) out.bad.push('out in winter at ' + h);
          STONES_FORCE = 0;
          // (an ordinary hole: rarely, by a pond or a lake)
          const k2 = lay(h + 1, 'Fair', 0); if (Scene.water || Scene.pond || (Scene.fills || []).some(F => F.kind === 'lake')) { out.pn++; if (k2.length) out.pond++; }
        }
        // the dart: sitting most of the time; out over the water, then back
        STONES_FORCE = 1000; KING_FORCE = true; lay(1000, 'Fair', 0);
        const p = Scene.props.find(q => q.kind === 15 && q.an === 'kingfisher');
        out.dart = !!p;
      } finally { window.courseFor = keep; S.chaos = ch; SEASON_FORCE = -1; STONES_FORCE = 0; KING_FORCE = false; QUIET = false; }
      return out;
    });
    if (r.bad.length) throw new Error(r.bad.slice(0, 5).join('; '));
    const share = r.river / r.n;
    if (share < 0.3 || share > 0.7) throw new Error('on the stones river ' + r.river + ' of ' + r.n + ' holes, not about one in two');
    if (r.pn < 20 || r.pond / r.pn > 0.2) throw new Error('by a pond ' + r.pond + ' of ' + r.pn + ': not rare');
    if (!r.dart) throw new Error('not laid with KING_FORCE on a stones hole');
    return ['on the river ' + r.river + '/' + r.n + ', by a pond ' + r.pond + '/' + r.pn + '; never at night, in winter or rain; on dry bank, darting over the water'];
  }
};
