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
              const W = Scene.water, P = (Scene.props || []).filter(p => p.kind === 26 && p.sp !== 'dfly'), id = B.COURSE[ci].id + ' ' + kind + ' s' + sn + ' h' + h;
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
              if (JSON.stringify((Scene.props || []).filter(p => p.kind === 26 && p.sp !== 'dfly')) !== again) f(id + ': laid differently a second time');
            }
          }
        }
        SEASON_FORCE = -1;
        // none on the sea stack or a hole with no water
        DEV.course(0); hideSheet();
        for (let k = 0; k < 6; k++) {
          off(); Scene.newHole(S.hole + k, S.tier);
          if (!sigKind(S.hole + k) && !Scene.water && !Scene.pond && (Scene.props || []).some(p => p.kind === 26)) f('reeds or pads on a hole with no water ' + (S.hole + k));
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
    // ---- the ponds (then the user: "Do 1": the same for the ponds) ----
    const q = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 12) fails.push(m); }, SNAP = JSON.stringify(S);
      const o = { hz: 0, hzLaid: 0, path: 0, pathLaid: 0, ice: 0, woods: 0 };
      QUIET = true;
      try {
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          for (const sn of B.COURSE[ci].slot === 'home' ? [0, 2] : [-1]) {
            SEASON_FORCE = sn;
            for (let k = 0; k < 24; k++) {
              const h = S.hole + k; Scene.newHole(h, S.tier);
              const W = Scene.water, PP = Scene.pond, id = B.COURSE[ci].id + ' s' + sn + ' h' + h;
              const P26 = (Scene.props || []).filter(p => p.kind === 26 && p.sp !== 'dfly');
              const hzPond = W && !W.lake && !W.river && !W.canyon && !W.rail;
              if (!hzPond && !PP) { if (!(W && (W.lake || W.river)) && P26.length) f(id + ': reeds or pads with no water'); continue; }
              const inHz = p => hzPond && Scene.wetAt(W, p.d, p.x), inPP = p => { if (!PP) return false; const w = Scene.lobeSpan(PP, p.d); return !!w && p.x > PP.x - w[0] && p.x < PP.x + w[1]; };
              for (const p of P26) if (!inHz(p) && !inPP(p) && !(W && (W.lake || W.river))) f(id + ': a ' + p.sp + ' on dry ground at ' + p.d.toFixed(1) + ',' + p.x.toFixed(1));
              if (Scene.ice && P26.some(p => p.sp === 'lily')) { o.ice++; f(id + ': lily pads on ice'); }
              if (hzPond) { o.hz++; if (P26.some(inHz)) o.hzLaid++; for (const p of P26) if (inHz(p) && p.sp === 'reed' && Scene.onPlay(p.d, p.x, 0.25)) f(id + ': reeds on the fairway'); }
              if (PP) { o.path++; if (P26.some(inPP)) o.pathLaid++;
                // on level ground (laid over a rise its far end climbed the slope)
                { let lo = 1e9, hi = -1e9; for (let t = -1; t <= 1; t += 0.1) { const g = Scene.hAt(PP.d + t * PP.rd); lo = Math.min(lo, g); hi = Math.max(hi, g); } if (hi - lo > 1.25) f(id + ': the pond by the path on a rise of ' + (hi - lo).toFixed(1)); }
                // no tree of the woods standing in it (the woods' own trees
                // were planted in its water)
                const L = Scene.layForest(0.7);
                for (const R of L.rows) for (const t of R.t) if (Scene.inPond(R.d, t.x, -0.2)) { const w = Scene.lobeSpan(PP, R.d);
                  if (w && t.x > PP.x - w[0] && t.x < PP.x + w[1]) { o.woods++; f(id + ': a tree of the woods in the pond at ' + R.d.toFixed(1) + ',' + t.x.toFixed(1)); break; } } }
            }
          }
        }
        SEASON_FORCE = -1;
        if (o.hzLaid < o.hz * 0.8) f('reeds or pads on ' + o.hzLaid + ' of ' + o.hz + ' water hazards');
        if (o.pathLaid < o.path * 0.8) f('reeds or pads on ' + o.pathLaid + ' of ' + o.path + ' ponds by the path');
        // drawn: the path pond's shallows
        DEV.course(0); hideSheet(); let h = S.hole; for (let k = 0; k < 200; k++) { Scene.newHole(h + k, S.tier); if (Scene.pond && !Scene.ice) break; }
        const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
        const D = derive(); for (let k = 0; k < 2; k++) { Scene.camD = Math.max(0, Scene.pond.d - 6); Scene.draw(0, D); }
        window.requestAnimationFrame = raf;
        const T = Scene.theme, was = PixPaint.cur, set = L => new Set(L.map(c => { PixPaint.fillStyle = c; return PixPaint.cur; }));
        const sh = set(lakeShelves(T)[0]), dp = set(lakeShelves(T)[3]); PixPaint.cur = was;
        let a = 0, b = 0; for (const v of PixPaint.px) { if (sh.has(v)) a++; else if (dp.has(v)) b++; }
        o.drawn = a + '/' + b;
        if (a < 20 || b < 10) f('the pond by the path drawn with ' + a + ' shallow and ' + b + ' deeper pixels');
      } finally { SEASON_FORCE = -1; QUIET = false; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    r.fails.push(...q.fails);
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const o = r.out;
    const p = q.o;
    return ['ponds: reeds or pads on ' + p.hzLaid + ' of ' + p.hz + ' water hazards and ' + p.pathLaid + ' of ' + p.path + ' ponds by the path, all in the water, none on ice, the path\'s ponds on level ground with no tree of the woods in them; shallows and deeper water drawn (' + p.drawn + 'px)',
      o.holes + ' lake and river holes over every course and season: reeds on ' + o.reedHoles + ' (' + o.reeds + '), lily pads on ' + o.padHoles + ' (' + o.pads + '), none on ice, the fairway, the green or the stones\' line; laid the same each time',
      'drawn: shallows ' + o.shallow + 'px at the near bank, deep ' + o.deep + 'px beyond, shelving ' + o.prof + ' bank to bank; reeds and pads ' + o.drawn + 'px'];
  }
};
