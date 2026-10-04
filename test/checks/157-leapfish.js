/* Fish leaping in the lakes and ponds (the user picked it from the menu):
 * now and then a fish leaps out, arcs and drops back in, a splash where it
 * leaves and a ring where it lands; spotted, the Guide's Fish counts it.
 *
 *   - on about 60% of holes with open water, one or two, each with room to
 *     leap either way; none on ice or by the stepping stones (their river
 *     has fish of its own); the same each time the hole is laid
 *   - drawn: the fish in the air, then a ring where it lands
 *   - spotted live, the Guide counts a Fish */
'use strict';
module.exports = {
  name: 'leapfish',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = { wet: 0, fish: 0 };
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      const leap = () => (Scene.props || []).filter(p => p.kind === 26 && p.sp === 'leap');
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          for (let k = 0; k < 24; k++) {
            const h = S.hole + k; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier);
            const F = leap(), id = B.COURSE[ci].id + ' h' + h;
            if (F.length > 2) f(id + ': ' + F.length + ' leaping fish');
            if (F.length && (Scene.ice || sigKind(h) === 'stones' || sigKind(h) === 'pier')) f(id + ': a leaping fish ' + (Scene.ice ? 'on ice' : 'by the ' + sigKind(h)));
            for (const q of F) if (Math.hypot(q.d - LEN, q.x) < 4.8) f(id + ': a fish leaping by the green');
            for (const q of F) for (const x of [q.x - 0.8, q.x, q.x + 0.8]) if (!Scene.wetSpot(q.d, x)) { f(id + ': a fish leaps onto dry ground at ' + q.d.toFixed(1) + ',' + x.toFixed(1)); break; }
            const W = Scene.water, open = (W && !W.canyon && !W.rail) || Scene.pond;
            if (open && !Scene.ice && sigKind(h) !== 'stones' && sigKind(h) !== 'pier') { o.wet++; if (F.length) o.fish++; }
            const again = JSON.stringify(F.map(p => [p.d, p.x, p.k])); Scene.newHole(h, S.tier);
            if (JSON.stringify(leap().map(p => [p.d, p.x, p.k])) !== again) f(id + ': laid differently a second time');
          }
        }
        // a home course in its winter: its water frozen, no fish leap
        o.iced = 0; DEV.course(0); hideSheet(); SEASON_FORCE = 2;
        try { for (let k = 0; k < 40; k++) { const h = S.hole + k; Scene.newHole(h, S.tier); if (!Scene.ice) continue; o.iced++; if (leap().length) f('h' + h + ': a leaping fish on ice'); } } finally { SEASON_FORCE = -1; }
        if (!o.iced) f('no frozen hole in a winter sweep');
        if (!o.wet) f('no hole with open water');
        else if (o.fish / o.wet < 0.35 || o.fish / o.wet > 0.75) f('leaping fish on ' + o.fish + ' of ' + o.wet + ' holes with water');
        // drawn: in the air, then its ring, against the same moments without it
        DEV.course(0); hideSheet(); LEAP_FORCE = true; S.chaos = { n: 'Fair' };
        let fish = null; for (let h = S.hole; h < S.hole + 60 && !fish; h++) { Scene.newHole(h, S.tier); fish = leap()[0]; }
        if (!fish) f('pinned, no leaping fish in 60 holes');
        else {
          const D = derive(), keep = Scene.props, L = 6 + 5 * hr(fish.k, 891), J = 0.8 / L;
          let n = 0; while (!Scene.leapAt(fish.k, (n + 0.01 - hr(fish.k, 892)) * L).jumps) n++;
          const base = (n - hr(fish.k, 892)) * L;
          const shot = t => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = Math.max(0, fish.d - 5); Scene.draw(0, D); } return Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data; };
          const diff = t => { const a = shot(t); Scene.props = keep.filter(p => p !== fish); const b = shot(t); Scene.props = keep; let m = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) m++; return m; };
          o.air = diff(base + 0.5 * J * L); o.ring = diff(base + J * L + 0.6);
          if (o.air < 6) f('the fish in the air drew ' + o.air + ' pixels');
          if (o.ring < 6) f('its ring as it landed drew ' + o.ring + ' pixels');
        }
        // the Guide
        S.guide = S.guide || {}; QUIET = false; const n0 = S.guide.fish || 0, tw = window.toast; window.toast = () => {};
        try { guideSpot({ hole: S.hole, props: [{ kind: 26, sp: 'leap' }] }); } finally { window.toast = tw; }
        if ((S.guide.fish || 0) !== n0 + 1) f('a leaping fish spotted: the Guide counted ' + ((S.guide.fish || 0) - n0));
      } finally { LEAP_FORCE = null; QUIET = false; window.requestAnimationFrame = raf; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['leaping fish on ' + r.o.fish + ' of ' + r.o.wet + ' holes with water, with room either way, none on ice or by the stones, the same each time; in the air ' + r.o.air + 'px, its ring ' + r.o.ring + 'px; the Guide counts a Fish'];
  }
};
