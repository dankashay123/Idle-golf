/* The island's lake and the river by the stones (the user asked for the
 * canyon's treatment: depth, reeds and lily pads).
 *
 *   - depth: pale shallows along the shore, darker toward the middle; on the
 *     river the shallows lie at its banks and the deep between them
 *   - reeds stand in the water, close to a shore, never on the fairway, the
 *     green or his way over; lily pads on the water, off the stones' line,
 *     clear of the green, none on ice
 *   - on every course, every season, the same each time the hole is laid;
 *     none on the sea stack or on a hole with no lake or river
 *   - both drawn */
'use strict';
module.exports = {
  name: 'shore',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 12) fails.push(m); };
      const SNAP = JSON.stringify(S), out = { holes: 0, reedHoles: 0, padHoles: 0, padIce: 0, reeds: 0, pads: 0 };
      const off = () => { STONES_FORCE = 0; ISLE_FORCE = 0; CANYON_FORCE = 0; PIER_FORCE = 0; RAIL_FORCE = 0; };
      const shore = (W, d, x) => { for (let k = 0.1; k < 2; k += 0.1)
        if (W.river ? !Scene.wetAt(W, d - k, x) || !Scene.wetAt(W, d + k, x) : !Scene.wetAt(W, d, x - k) || !Scene.wetAt(W, d, x + k)) return k; return 2; };
      QUIET = true;
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          const home = B.COURSE[ci].slot === 'home';
          for (const sn of home ? [0, 1, 2, 3] : [-1]) {
            SEASON_FORCE = sn;
            for (let k = 0; k < 3; k++) for (const kind of ['stones', 'isle']) {
              const h = S.hole + k; off();
              if (kind === 'stones') STONES_FORCE = h; else ISLE_FORCE = h;
              Scene.newHole(h, S.tier);
              const W = Scene.water, P = (Scene.props || []).filter(p => p.kind === 26), id = B.COURSE[ci].id + ' ' + kind + ' s' + sn + ' h' + h;
              if (!W || !(kind === 'stones' ? W.river : W.lake)) { f(id + ': no water'); continue; }
              out.holes++;
              const reeds = P.filter(p => p.sp === 'reed'), pads = P.filter(p => p.sp === 'lily');
              if (reeds.length) out.reedHoles++; if (pads.length) out.padHoles++; if (pads.length && Scene.ice) out.padIce++;
              out.reeds += reeds.length; out.pads += pads.length;
              for (const p of P) {
                if (!Scene.wetAt(W, p.d, p.x)) f(id + ': a ' + p.sp + ' on dry ground at ' + p.d.toFixed(1) + ',' + p.x.toFixed(1));
                if (Math.hypot(p.d - LEN, p.x) < 3.9) f(id + ': a ' + p.sp + ' by the green');
              }
              for (const p of reeds) {
                if (Scene.onPlay(p.d, p.x, 0.55)) f(id + ': reeds on the fairway at ' + p.d.toFixed(1) + ',' + p.x.toFixed(1));
                if (shore(W, p.d, p.x) > 1.3) f(id + ': reeds out in open water');
              }
              for (const p of pads) if (W.river && Math.abs(p.x) < 1.4) f(id + ': a lily pad on the stones\' line');
              // laid again, the same
              const again = JSON.stringify(P);
              Scene.newHole(h, S.tier);
              if (JSON.stringify((Scene.props || []).filter(p => p.kind === 26)) !== again) f(id + ': laid differently a second time');
            }
          }
        }
        SEASON_FORCE = -1;
        // none on the sea stack or an ordinary hole
        DEV.course(0); hideSheet();
        for (let k = 0; k < 6; k++) {
          off(); Scene.newHole(S.hole + k, S.tier);
          if (!sigKind(S.hole + k) && (Scene.props || []).some(p => p.kind === 26)) f('reeds or pads on an ordinary hole ' + (S.hole + k));
        }
        if (typeof DEV.pier === 'function') {
          for (let ci = 0; ci < B.COURSE.length; ci++) if (B.SIG_HOLE[B.COURSE[ci].id] === 'pier') {
            DEV.course(ci); hideSheet(); DEV.pier(); hideSheet();
            if ((Scene.props || []).some(p => p.kind === 26)) f('reeds or pads round the sea stack on ' + B.COURSE[ci].id);
          }
        }
        if (out.reedHoles < out.holes * 0.9) f('reeds on ' + out.reedHoles + ' of ' + out.holes + ' holes');
        if (out.padHoles < out.holes * 0.6) f('lily pads on ' + out.padHoles + ' of ' + out.holes + ' holes');
        if (out.padIce) f('lily pads on ice on ' + out.padIce + ' holes');

        // drawn: depth across the river, and the reeds and pads themselves
        DEV.course(0); hideSheet(); off(); SEASON_FORCE = 0; S.chaos = { n: 'Fair' };
        STONES_FORCE = S.hole; Scene.newHole(S.hole, S.tier);
        const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
        const D = derive(), I = Scene.isle;
        const shot = () => { for (let k = 0; k < 2; k++) { Scene.camD = I.bank - 1.5; Scene.draw(0, D); }
          return Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data; };
        const a = shot(), T = Scene.theme;
        // (read from the painted ground itself, before the haze and the grade)
        if (!T._lks) f('no shallows and deeps for the river');
        else if (!PixPaint.px || PixPaint.w !== VW) f('the ground was not painted to read');
        else {
          const was = PixPaint.cur, set = L => new Set(L.map(c => { PixPaint.fillStyle = c; return PixPaint.cur; }));
          const shal = set(T._lks[0]), deep = set([...T._lks[3], ...T._lks[4], ...T._lks[5]]); PixPaint.cur = was;
          const ys = [], yd = [], px = PixPaint.px;
          for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x += 2) { const c = px[y * VW + x]; if (shal.has(c)) ys.push(y); else if (deep.has(c)) yd.push(y); }
          out.shallow = ys.length; out.deep = yd.length;
          if (ys.length < 30) f('shallows ' + ys.length + ' pixels');
          if (yd.length < 30) f('deep water ' + yd.length + ' pixels');
          // (from here the far bank's shallows are under a pixel deep: the
          // near bank's lie nearer than the deep water)
          if (ys.length && yd.length) {
            const my = ys.reduce((t, v) => t + v, 0) / ys.length, md = yd.reduce((t, v) => t + v, 0) / yd.length;
            if (!(my > md)) f('the shallows (row ' + my.toFixed(1) + ') are not nearer than the deep (row ' + md.toFixed(1) + ')');
          }
          // and asked of the colouring across the river, bank to bank:
          // shallow at both, deepest in the middle
          const W = Scene.water, k = tt => { const c = P_LAKE.tone(T, 0.95, HZ_LZ, 0.5, 0, 42, tt, W, 80); return T._lks.findIndex(L => L.includes(c)); };
          const prof = [0.02, 0.1, 0.25, 0.5, 0.75, 0.9, 0.98].map(k);
          out.prof = prof.join('');
          if (prof[0] !== 0 || prof[6] !== 0) f('the river is not shallow at its banks: ' + prof);
          if (!(prof[3] >= 3 && prof[3] >= Math.max(...prof))) f('the river is not deepest in its middle: ' + prof);
          for (let i = 1; i <= 3; i++) if (prof[i] < prof[i - 1] || prof[6 - i] < prof[7 - i]) f('the river shelves back up toward its middle: ' + prof);
        }
        const keepP = Scene.props; Scene.props = keepP.filter(p => p.kind !== 26);
        const b = shot(); Scene.props = keepP;
        let diff = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) diff++;
        out.drawn = diff;
        if (diff < 150) f('the reeds and pads drew ' + diff + ' pixels');
        window.requestAnimationFrame = raf;
      } finally {
        off(); SEASON_FORCE = -1; QUIET = false;
        Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier);
      }
      return { fails, out };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const o = r.out;
    return [o.holes + ' lake and river holes over every course and season: reeds on ' + o.reedHoles + ' (' + o.reeds + '), lily pads on ' + o.padHoles + ' (' + o.pads + '), none on ice, the fairway, the green or the stones\' line; laid the same each time',
      'drawn: shallows ' + o.shallow + 'px at the near bank, deep ' + o.deep + 'px beyond, shelving ' + o.prof + ' bank to bank; reeds and pads ' + o.drawn + 'px'];
  }
};
