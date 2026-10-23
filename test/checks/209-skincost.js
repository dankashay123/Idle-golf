/* The skins drawn for less, and the same picture (the user asked, 23
 * October, if it would cost any quality: none).
 *
 *   - a pixel line is laid as runs, one box a stretch along a row or a
 *     column, and paints exactly what a square at every step painted: lines
 *     one pixel thick at any strength and laid "lighter", thick ones fully
 *     on, thousands of them at random, against the old square-a-step line.
 *     The ribbons, hair, sashes and streamers of the dearest skins were a
 *     box a pixel: a third of the Divine's frame
 *   - a figure drawn strip by strip is stamped from a picture of itself the
 *     second time the same layout comes (he stands at address, holds his
 *     finish, a caddie floats), and the stamp is the strips to the pixel
 *     (the Demonic's cracks at rest round his feet the same way)
 *   - the night's haze round the lesser skins, the Dread's and Penitent's
 *     rings of light and the Psychedelic's rings and bubbles are made once
 *     and stamped, the same pixels as painted dot by dot
 *   - what it costs, him and his caddie a frame on the mean: the plain
 *     golfer under 70 canvas calls (it was 174), the Demonic, the dearest,
 *     under 950 (1,300), the Divine under 500 (740), the Psychedelic under
 *     200 (450)
 *   - every store of these pictures keeps a bound and frees what it lets go
 *     (rule 77), and the skins' store lets go the one used longest ago, never
 *     one just drawn (it let go the oldest made, which could be in use) */
'use strict';
module.exports = {
  name: 'skincost',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {};
      // the old line, a square at every step
      const oldLine = (c, x0, y0, x1, y1, col, thick) => {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let err = dx - dy, n = 0; c.fillStyle = col; const t = thick || 1;
        while (n++ < 400) { c.fillRect(x0, y0, t, t); if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } } };
      const same = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
      try {
        hideSheet(); QUIET = true;
        // ---- lines ----------------------------------------------------------
        const cv = document.createElement('canvas'); cv.width = cv.height = 80; const k = cv.getContext('2d');
        let seed = 11; const rn = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        o.lines = 0; o.lineBad = 0;
        for (let i = 0; i < 4000; i++) {
          const a = [rn() * 90 - 5, rn() * 90 - 5, rn() * 90 - 5, rn() * 90 - 5];
          const col = '#' + Math.floor(rn() * 0xffffff).toString(16).padStart(6, '0'), kind = i % 4;
          const t = kind === 0 ? 1 + Math.floor(rn() * 5) : 1, alpha = kind === 1 ? 0.55 : 1, op = kind === 2 ? 'lighter' : 'source-over';
          const col2 = kind === 3 ? 'rgba(200,40,90,0.6)' : col;
          const draw = fn => { k.globalAlpha = 1; k.globalCompositeOperation = 'source-over'; k.fillStyle = '#204030'; k.fillRect(0, 0, 80, 80);
            k.globalAlpha = alpha; k.globalCompositeOperation = op; fn(k, ...a, col2, t); fn(k, a[2], a[1], a[0], a[3], col2, t);
            k.globalAlpha = 1; k.globalCompositeOperation = 'source-over'; return k.getImageData(0, 0, 80, 80).data; };
          o.lines++; if (same(draw(oldLine), draw(pxLine))) o.lineBad++;
        }
        if (o.lineBad) f(o.lineBad + ' of ' + o.lines + ' lines differ from a square at every step');
        // fewer calls for a long thick line
        { let n = 0; const P = { fillRect() { n++; }, set fillStyle(v) {}, globalAlpha: 1, globalCompositeOperation: 'source-over' };
          pxLine(P, 0, 0, 60, 7, '#FFFFFF', 3); o.longLine = n;
          if (!(n <= 8)) f('a line 60 across and 7 down took ' + n + ' boxes (8 rows of runs at most)'); }

        // ---- the golfer strip by strip, stamped the second time -------------
        const D = derive(), b = Scene.b;
        const pic = () => b.getImageData(0, 0, VW, VH).data;
        o.stampBad = 0; o.stamps = 0;
        for (const id of ['classic', 'demonic', 'psyche']) {
          S.styleOwn['o:' + id] = 1; S.outfit = id; buildSprites();
          for (const [walk, ph] of [[false, 0], [true, 0], [false, 0.45], [false, 0.8]]) {
            Scene.walkOn = walk; Scene.walkPh = 0.3; Scene.swingDur = 1; Scene.swingT = ph ? 1 - ph : 0; Scene.t = 4.2;
            SHEAR_BAKE.forEach(cvFree); SHEAR_BAKE.clear(); SHEAR_SEEN.clear();
            b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const first = pic();
            b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const second = pic();
            const before = SHEAR_BAKE.size;
            b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const third = pic();
            o.stamps += SHEAR_BAKE.size > 0 ? 1 : 0;
            const d = same(first, second) + same(first, third);
            if (d) { o.stampBad++; f(id + (walk ? ' walking' : ' at ' + ph) + ': the stamped figure differs from the strips on ' + d + ' bytes'); }
          }
        }
        if (o.stamps < 8) f('a figure was stamped in ' + o.stamps + ' of 12 poses, drawn three times');
        Scene.swingT = 0; Scene.walkOn = false;

        // ---- the rings and hazes, made once, as painted ----------------------
        const paintCmp = (what, w, h, oldFn, newFn) => {
          const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const g2 = c2.getContext('2d');
          g2.clearRect(0, 0, w, h); oldFn(g2); const A = g2.getImageData(0, 0, w, h).data;
          g2.clearRect(0, 0, w, h); newFn(g2); const B2 = g2.getImageData(0, 0, w, h).data;
          const n = same(A, B2); if (n) f(what + ' differs from painting it dot by dot on ' + n + ' bytes'); cvFree(c2); };
        const BY = BAYER4;
        const oldHalo = (c, x, y, rx, ry, col, ph, top) => { const RX = Math.ceil(rx), RY = Math.ceil(ry), X = Math.round(x), Y = Math.round(y), mx = top || 0.42, oo = ph || 0;
          c.globalAlpha = 1; c.fillStyle = col;
          for (let j = -RY; j <= RY; j++) for (let i = -RX; i <= RX; i++) { const d = Math.sqrt((i * i) / (rx * rx) + (j * j) / (ry * ry));
            if (d > 1 || d < 0.55) continue; const dens = d < 0.72 ? mx * (d - 0.55) / 0.17 : mx * (1 - d) / 0.28;
            if (BY[((X + i + oo) & 3) + ((Y + j) & 3) * 4] / 16 >= dens) continue; c.fillRect(X + i, Y + j, 1, 1); } };
        for (const [x, y, rx, ry, ph] of [[40.3, 50.7, 27, 36.2, 0], [41, 49.2, 25.5, 33, 3], [39.6, 51, 31.1, 18, 7], [40, 50, 12.25, 4.5, 1]])
          paintCmp('the night haze ' + rx + ' by ' + ry, 100, 110, g => oldHalo(g, x, y, rx, ry, '#7A4ED8', ph), g => nightHalo(g, x, y, rx, ry, '#7A4ED8', ph));
        const DH = STYLEFX.dread.halo;
        const oldDH = (c, x, y, r, col) => { const R = Math.ceil(r); c.fillStyle = col;
          for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const d = Math.hypot(i, j) / r;
            if (d > 1 || d < 0.45 || ((x + i + y + j) & 1)) continue; c.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); } };
        for (const [x, y, r] of [[30.4, 30.2, 9.3], [31, 30, 5.8], [29.7, 31.6, 14], [30.5, 29.5, 3]])
          paintCmp('the ring of light at ' + x + ',' + y, 64, 64, g => oldDH(g, x, y, r, '#6E4E1E'), g => DH.call(STYLEFX.dread, g, x, y, r, '#6E4E1E'));
        // the Psychedelic's two rings and the sparkles round them: the skin
        // against the old, dot by dot
        { const F = STYLEFX.psyche;
          const oldGlow = (c, g, X, Y, rx, ry) => { const st = Math.floor(g.t * 3);
            for (let j = 0; j < 2; j++) { const s = 1.12 + j * 0.14, n = Math.round((rx + ry) * s * 2.2);
              for (let i = 0; i < n; i++) { if ((i + j + st) % 3 === 0) continue; const a = i / n * Math.PI * 2;
                c.fillStyle = psyC(i * 6 / n + st - j * 2, j); c.fillRect(Math.round(X + Math.cos(a) * rx * s), Math.round(Y + Math.sin(a) * ry * s), 1, 1); } }
            const k = Math.max(1, Math.round(g.h / 50));
            for (let i = 0; i < 16; i++) { const a = hr(i, 681) * Math.PI * 2, d = 1.5 + hr(i, 682) * 1.3;
              const on = Math.sin(g.t * (1.5 + hr(i, 683)) + i * 2.3); if (on < -0.3) continue;
              const x = Math.round(X + Math.cos(a) * rx * d), y = Math.round(Y + Math.sin(a) * ry * d * 0.9);
              c.fillStyle = psyC(i + Math.floor(g.t * 0.7), 0); c.fillRect(x, y, k + (i & 1), k);
              if (on > 0.6) { c.fillStyle = '#FFFFFF'; c.fillRect(x, y, 1, 1); } } };
          for (const t of [7.4, 7.75, 8.1, 9.3, 11.0, 12.7]) for (const [rx, ry] of [[30, 9], [22, 7]])
            paintCmp('the Psychedelic\'s rings at ' + t, 200, 100, g => oldGlow(g, { t, h: 58 }, 100, 50, rx, ry), g => F.glowPaint(g, { t, h: 58 }, 100, 50, rx, ry)); }

        // ---- what a frame costs -------------------------------------------
        const Pr = CanvasRenderingContext2D.prototype, orig = {}; let calls = 0;
        for (const kk of Object.getOwnPropertyNames(Pr)) { const d = Object.getOwnPropertyDescriptor(Pr, kk); if (typeof d.value !== 'function') continue;
          orig[kk] = d.value; Pr[kk] = function () { calls++; return orig[kk].apply(this, arguments); }; }
        try {
          for (const [id, cap] of [['classic', 70], ['demonic', 950], ['divine', 500], ['psyche', 200]]) {
            S.styleOwn['o:' + id] = 1; S.outfit = id; const cd = B.CADDIES.find(c => c.fx && c.fx === (B.OUTFITS.find(x => x.id === id) || {}).fx);
            S.caddie = cd ? cd.id : 'bib'; if (cd) S.styleOwn['c:' + cd.id] = 1; buildSprites();
            // (a mean over two seconds, day and night, once warm: a frame
            // that makes a new step of a picture costs that once)
            let tot = 0, n = 0;
            for (const night of [false, true]) { Scene.night = night;
              for (let i = 0; i < 600; i++) { Scene.t = 30 + i / 60; b.clearRect(0, 0, VW, VH); const c0 = calls; Scene.drawGolfer(D); if (i >= 480) { tot += calls - c0; n++; } } }
            const worst = Math.round(tot / n);
            o['calls_' + id] = worst;
            if (!(worst < cap)) f(id + ' cost ' + worst + ' canvas calls a frame (under ' + cap + ')');
          }
        } finally { for (const kk in orig) Pr[kk] = orig[kk]; Scene.night = false; }

        // ---- bounds, and what is let go is freed ---------------------------
        o.fx = FXBAKE.size; o.halo = NIGHT_HALO.size; o.shear = SHEAR_BAKE.size;
        if (FXBAKE.size > 801 || NIGHT_HALO.size > NIGHT_HALO_MAX || SHEAR_BAKE.size > SHEAR_MAX) f('a store of pictures past its bound');
        { const keep = new Map(FXBAKE); FXBAKE.clear();
          try {
            const first = fxBake('t|first', 4, 4, () => {});
            for (let i = 0; i < 400; i++) fxBake('t|' + i, 4, 4, () => {});
            fxBake('t|first', 4, 4, () => {});           // used again: now the newest
            for (let i = 400; i < 802; i++) fxBake('t|' + i, 4, 4, () => {});
            if (!(first.width === 4 && FXBAKE.get('t|first') === first)) f('the skins\' store let go a picture just used');
            const gone = []; for (const kk of ['t|0', 't|1']) if (!FXBAKE.has(kk)) gone.push(kk);
            if (gone.length < 2) f('the skins\' store kept its oldest unused pictures past 800');
            if (FXBAKE.size > 801) f('the skins\' store held ' + FXBAKE.size);
          } finally { FXBAKE.forEach(cvFree); FXBAKE.clear(); keep.forEach((v, kk) => FXBAKE.set(kk, v)); }
          // and freed: a canvas let go has no pixels left
          const held = []; for (let i = 0; i < 802; i++) held.push(fxBake('u|' + i, 4, 4, () => {}));
          if (held[0].width !== 0) f('a picture the skins\' store let go was not freed');
          for (let i = 0; i < 802; i++) FXBAKE.delete('u|' + i);
        }
      } finally {
        Scene.swingT = 0; Scene.walkOn = false; Scene.night = false; QUIET = false;
        Object.keys(S).forEach(kk => delete S[kk]); Object.assign(S, JSON.parse(SNAP)); buildSprites();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    const o = r.o;
    return [o.lines + ' random lines the same as a square a step; a figure stamped in ' + o.stamps + ' of 12 poses, to the pixel',
      'calls a frame: plain ' + o.calls_classic + ', Demonic ' + o.calls_demonic + ', Divine ' + o.calls_divine + ', Psychedelic ' + o.calls_psyche,
      'stores: skins ' + o.fx + ', hazes ' + o.halo + ', figures ' + o.shear];
  }
};
