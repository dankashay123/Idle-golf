/* Wind you can see, leaves on the water, and the pins either side (the user
 * asked for all three: "the flags always seem to be on the right side of
 * the greens").
 *
 *   - the pin: over many holes on both sides of his line, about half each,
 *     never on it; two holes running can differ only by side
 *   - the wind: in a calm the reeds and tufts stand straight; in a breeze
 *     they lean the way it blows, harder in a gale, where they also sway;
 *     the lean leaves a reed's foot where it stood (its picture's bottom row
 *     unmoved, its top row moved)
 *   - the flag flies the way the wind blows: drawn alone, its cloth on the
 *     left of the pole in a wind from the right
 *   - leaves on the water: in a course's autumn only, never on ice, on open
 *     water, none by the green; drawn */
'use strict';
module.exports = {
  name: 'windleaves',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      try {
        // ---- pins either side ----
        let left = 0, right = 0;
        for (let h = 1; h <= 2000; h++) { const P = pinFor(h); if (Math.abs(P[1]) < 0.4) { f('hole ' + h + ': the pin on his line'); break; } if (P[1] < 0) left++; else right++; }
        o.pins = left + '/' + right; if (left < 800 || right < 800) f('pins left/right ' + o.pins + ' over 2000 holes');
        // ---- the lean ----
        DEV.course(0); hideSheet(); S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier);
        const p = { d: 20, x: 3 }, at = (w, t) => { Scene.wind = w; Scene.t = t; return Scene.leanB(p); };
        if (at(0, 1) !== 0 || at(0.1, 1) !== 0) f('the reeds lean in a calm');
        if (!(at(0.5, 1) > 0) || !(at(-0.5, 1) < 0)) f('a breeze each way: lean ' + at(0.5, 1) + ' / ' + at(-0.5, 1));
        { let lo = 9, hi = -9; for (let t = 0; t < 6; t += 0.1) { const b = at(1.3, t); lo = Math.min(lo, b); hi = Math.max(hi, b); }
          o.gale = lo + '..' + hi; if (!(hi >= 3 && hi > lo)) f('a gale leans ' + o.gale + ', no sway or not harder'); }
        const R = Scene.treeSpr.reed, L = leanSprite(R, 3);
        const first = row => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') return i; return -1; };
        const firstOf = (sp, r) => first(sp.rows[r]);
        if (firstOf(L, L.h - 1) !== firstOf(R, R.h - 1)) f('a leaning reed\'s foot moved');
        if (!(firstOf(L, 0) - firstOf(R, 0) >= 2)) f('a leaning reed\'s top moved ' + (firstOf(L, 0) - firstOf(R, 0)));
        // ---- the flag the way the wind blows ----
        { const D = derive(), c = Scene.b; Scene.camD = LEN - 12;
          const flagSide = w => { Scene.wind = w; Scene.draw(0, D); c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); const pp = Scene.proj(Scene.pinD(), Scene.pinX()); Scene.pinBody(c, pp);
            const d = c.getImageData(0, 0, VW, VH).data; let l = 0, rr = 0; for (let i = 0; i < d.length; i += 4) { if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue; if (d[i] > 150 && d[i + 1] < 90) { const x = (i / 4) % VW; if (x < pp.x) l++; else if (x > pp.x) rr++; } } return [l, rr]; };
          const R1 = flagSide(1.0), L1 = flagSide(-1.0); o.flag = JSON.stringify([R1, L1]);
          if (!(R1[1] > R1[0]) || !(L1[0] > L1[1])) f('the flag: wind from the left ' + R1 + ', from the right ' + L1 + ' (red pixels left/right of the pole)'); }
        // ---- leaves on the water ----
        const lv = () => (Scene.props || []).filter(q => q.kind === 26 && q.sp === 'wleaf');
        let aut = 0, other = 0, holes = 0;
        for (const sn of [0, 1, 2, 3]) { SEASON_FORCE = sn;
          for (let h = S.hole; h < S.hole + 30; h++) { Scene.newHole(h, S.tier); const L2 = lv();
            if (L2.length && (lookSeason(Scene.look) !== 1 || Scene.ice)) { other++; continue; }
            for (const q of L2) { if (!Scene.wetSpot(q.d, q.x)) f('a leaf on dry ground at ' + q.d.toFixed(1)); if (Math.hypot(q.d - LEN, q.x) < 4.5) f('a leaf by the green'); }
            if (lookSeason(Scene.look) === 1 && !Scene.ice && ((Scene.water && !Scene.water.canyon && !Scene.water.rail) || Scene.pond)) { holes++; if (L2.length) aut++; } } }
        SEASON_FORCE = -1;
        o.leaves = aut + ' of ' + holes; if (other) f(other + ' holes with leaves on the water out of autumn or on ice'); if (!holes || aut < holes * 0.8) f('leaves on the water on ' + o.leaves + ' autumn holes with water');
        { WLEAF_FORCE = true; S.chaos = { n: 'Fair' }; DEV.stones(); hideSheet(); Scene.announce = null; const D = derive(), keep = Scene.props;
          const shot = () => { for (let k = 0; k < 2; k++) { Scene.t = 4; Scene.camD = Scene.isle.bank - 4; Scene.draw(0, D); } return Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data; };
          const a = shot(); Scene.props = keep.filter(q => q.sp !== 'wleaf'); const b = shot(); Scene.props = keep;
          let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
          o.lpx = n; if (n < 15) f('the leaves on the water drew ' + n + ' pixels'); WLEAF_FORCE = null; STONES_FORCE = 0; }
        if (!(Sfx.THUNDER_VOL <= 0.05)) f('the thunder at ' + Sfx.THUNDER_VOL);
      } finally { WLEAF_FORCE = null; SEASON_FORCE = -1; STONES_FORCE = 0; QUIET = false; window.requestAnimationFrame = raf; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['pins left/right ' + r.o.pins + ' over 2000 holes, none on his line; reeds and tufts straight in a calm, leaning with a breeze, a gale ' + r.o.gale + ' swaying, the foot kept; the flag flies the wind\'s way ' + r.o.flag + '; leaves on the water on ' + r.o.leaves + ' autumn holes, none other seasons or on ice, ' + r.o.lpx + 'px; the thunder quieter'];
  }
};
