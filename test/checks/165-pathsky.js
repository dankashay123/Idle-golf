/* What the user saw on the phone (6 October): the ball lying out there too
 * big, the cart path vanishing under the water and the green, the cloud
 * shadows travelling with him, the steam in blocks with a hard line under
 * them, the storm's sky in stripes.
 *
 *   - the ball lying ahead: no bigger than 1.15 times true (it was 1.7)
 *   - the path: on every stepping-stones river and canyon it is drawn
 *     where it crosses (a footbridge); never within the green's apron
 *   - cloud shadows: a spot on the course is shaded or not the same from
 *     two places down the hole (laid ahead of the camera, they moved with
 *     him)
 *     soft at the edge (the far end was cut off in a line) and over the
 *     tee's deck too
 *   - steam: each wisp faded to nothing at its top, foot and ends; low
 *   - the storm sky: no step down it from one row to the next */
'use strict';
module.exports = {
  name: 'pathsky',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true; const keepStep = window.step; window.step = () => {};
      const D = derive(), px = () => Scene.b.getImageData(0, 0, VW, VH).data;
      const shot = (cam, t) => { Scene.camD = cam; Scene.walkTo = cam; Scene.t = t; Scene.gGen++; Scene.draw(0, D); Scene.draw(0, D); return px(); };
      const fair = () => { S.chaos = { n: 'Fair' }; };
      try {
        DEV.course(0); hideSheet();
        // ---- the ball lying ahead ----
        { fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; const keep = window.drawLyingBall; let worst = 0;
          let calls = 0; drawLyingBall = function (c, x, y, rr) { const p = Scene.proj(Scene.restBall.d, Scene.restBall.lat), tr = B_BALL * p.s * US; calls++; worst = Math.max(worst, rr / Math.max(2, Math.round(tr * 1.3))); return keep.apply(this, arguments); };
          try { for (const ahead of [1, 2, 4, 8]) { Scene.restBall = { d: 10 + ahead, lat: 0.3 }; Scene.camD = 10; Scene.walkTo = 10; Scene.props = Scene.props; Scene.draw(0, D); } }
          finally { drawLyingBall = keep; Scene.restBall = null; }
          o.ball = worst.toFixed(2); if (!calls) f('the ball lying ahead never drawn'); if (worst > 1) f('the ball lying ahead drawn ' + o.ball + ' times what 1.3 times true allows'); }
        // ---- the path ----
        { let holes = 0, looked = 0, hid = 0, near = 0, apron = 0;
          for (let ci = 0; ci < B.COURSE.length; ci++) { DEV.course(ci); hideSheet();
            for (let hh = S.hole; hh < S.hole + 72; hh++) { const k = sigKind(hh); fair(); Scene.newHole(hh, S.tier);
              if (Scene.cart) for (let d = 0; d < LEN + 9; d += 0.25) { const gd = d - LEN; if (gd > -8.6 && gd < 8.6) { const a = 3.32 * Math.sqrt(1 - (gd / 8.6) * (gd / 8.6)); if (Math.abs(Scene.cartX(d)) < a + 0.4) apron++; } }
              if ((k !== 'stones' && k !== 'canyon') || !Scene.cart || holes >= 8) continue;
              holes++; const span = Scene.cartBridgeSpan(); if (!span) { f(k + ' hole ' + hh + ': no footbridge'); continue; }
              const keepP = Scene.props; Scene.props = [];
              const cam = Math.max(0, span.a - 7), A = shot(cam, 1), C = Scene.cart; Scene.cart = null; const B1 = shot(cam, 1); Scene.cart = C; Scene.props = keepP;
              for (let d = span.a + 0.2; d < span.b - 0.2; d += 0.3) { const p = Scene.proj(d, Scene.cartX(d)), X = Math.round(p.x), Y = Math.round(p.y);
                if (X < 3 || X >= VW - 3 || Y <= HORIZON + 2 || Y >= VH - 2 || Y > Scene.clipAt(d) - 1) continue; looked++; let diff = false;
                for (let yy = Y - 2; yy <= Y + 1 && !diff; yy++) for (let xx = X - 2; xx <= X + 2; xx++) { const j = (yy * VW + xx) * 4; if (A[j] !== B1[j] || A[j + 1] !== B1[j + 1] || A[j + 2] !== B1[j + 2]) { diff = true; break; } }
                if (!diff) hid++; } } }
          DEV.course(0); hideSheet();
          o.path = holes + ' holes, ' + (looked - hid) + ' of ' + looked; if (holes < 4) f('only ' + holes + ' river and canyon holes'); if (looked < 20 || hid > looked * 0.1) f('the path over the river or gorge drawn at ' + o.path + ' points');
          if (apron) f(apron + ' points of the path within the green\'s apron'); }
        // ---- cloud shadows fixed to the course ----
        { CSHADOW_FORCE = true; fair(); let hh = S.hole; while (sigKind(hh)) hh++; Scene.newHole(hh, S.tier); Scene.announce = null; const keepP = Scene.props; Scene.props = [];
          const flags = cam => { const A = shot(cam, 5); Scene.cshadow = false; const B1 = shot(cam, 5); Scene.cshadow = true; const m = new Map();
            for (let d = 20; d < 56; d += 0.5) for (let x = -6; x <= 6; x += 0.5) { const p = Scene.proj(d, x), X = Math.round(p.x), Y = Math.round(p.y) - 1; if (X < 0 || X >= VW || Y < 0 || Y >= VH || Y > Scene.clipAt(d) - 1) continue;
              const j = (Y * VW + X) * 4; m.set(d + ',' + x, A[j] + A[j + 1] + A[j + 2] < B1[j] + B1[j + 1] + B1[j + 2] - 4); } return m; };
          const a = flags(8), b = flags(18); let same = 0, n = 0, sh = 0; for (const [k, v] of a) if (b.has(k)) { n++; if (v === b.get(k)) same++; if (v) sh++; }
          // (soft at the edge, in layers: the user saw the far end cut off in
          // a line; and across the tee's deck, drawn after the ground: one
          // went missing there)
          { const A = shot(8, 5); Scene.cshadow = false; const B1 = shot(8, 5); Scene.cshadow = true; let n2 = 0, faint = 0, mx = 0; const dk = [];
            for (let i = 0; i < A.length; i += 4) { const b0 = B1[i] + B1[i + 1] + B1[i + 2], v = (b0 - A[i] - A[i + 1] - A[i + 2]) / Math.max(1, b0); if (v > 0.012 && b0 > 120) { dk.push(v); mx = Math.max(mx, v); } }
            // (by how much of its own light each pixel lost: one fill takes the same share everywhere)
            dk.sort((p, q) => p - q); mx = dk.length ? dk[Math.floor(dk.length * 0.9)] : 0;
            for (const v of dk) { n2++; if (v < mx * 0.6) faint++; }
            o.soft = (faint / Math.max(1, n2)).toFixed(2); o.dark = mx.toFixed(3); if (mx > 0.075) f('cloud shadows take ' + o.dark + ' of the light (the user asked them fainter than the 0.09 they were)'); if (n2 < 200 || faint < n2 * 0.2) f('cloud shadows hard at the edge: ' + faint + ' of ' + n2 + ' shaded pixels faint (' + mx.toFixed(3) + ')'); }
          { let best = 0, tot = 1; const TD = TEE_DECK, a = Scene.proj(TD.d1, -TD.hw * 0.8, TD.lift), b = Scene.proj((TD.d0 + TD.d1) / 2, TD.hw * 0.8, TD.lift);
            for (let t = 0; t < 120 && best < tot * 0.8; t += 3) { const A = shot(0, t); Scene.cshadow = false; const B1 = shot(0, t); Scene.cshadow = true; let k = 0, n3 = 0;
              const a2 = Scene.proj(TD.d1, -TD.hw * 0.8, TD.lift), b2 = Scene.proj(Math.max(TD.d0, 0.6), TD.hw * 0.8, TD.lift);
              for (let y = Math.max(0, Math.round(a2.y) + 1); y < Math.min(VH, Math.round(b2.y)); y++) for (let x = Math.max(0, Math.round(a2.x) + 1); x < Math.min(VW, Math.round(b2.x)); x++) { n3++; const j = (y * VW + x) * 4; if (A[j] + A[j + 1] + A[j + 2] < B1[j] + B1[j + 1] + B1[j + 2] - 3) k++; }
              if (k > best) { best = k; tot = n3; } }
            o.tee = best; if (best < tot * 0.5) f('no cloud shadow ever over the tee\'s deck (' + best + ' pixels)'); }
          Scene.props = keepP; CSHADOW_FORCE = null; o.cs = same + ' of ' + n + ' (' + sh + ' shaded)'; if (n < 50 || sh < 10) f('cloud shadows sampled at ' + o.cs + ' ' + JSON.stringify([Scene.cshadow, hh, VW, HORIZON, Scene.camD, Scene.proj(30, 0), Scene.clipAt(30)])); if (same < n * 0.9) f('cloud shadows moved with the camera: ' + o.cs); }
        // ---- steam ----
        { let worst = 0, edge = 0; for (const sz of [6, 11, 20, 36]) { const cv = steamSprite(sz), g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height;
            let mx = 0; for (let i = 3; i < d.length; i += 4) mx = Math.max(mx, d[i]);
            const rowMax = y => { let m = 0; for (let x = 0; x < W; x++) m = Math.max(m, d[(y * W + x) * 4 + 3]); return m; }, colMax = x => { let m = 0; for (let y = 0; y < H; y++) m = Math.max(m, d[(y * W + x) * 4 + 3]); return m; };
            edge = Math.max(edge, rowMax(0) / mx, rowMax(H - 1) / mx, colMax(0) / mx, colMax(W - 1) / mx); if (H > W * 0.5) worst++; }
          o.steam = edge.toFixed(2); if (edge > 0.45) f('a steam wisp ends hard at its edge (' + o.steam + ' of its fullest)'); if (worst) f(worst + ' steam wisps taller than half their width'); }
        // ---- the storm sky ----
        { STORM_FORCE = true; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; const keepP = Scene.props; Scene.props = [];
          const A = shot(10, 1); Scene.props = keepP; STORM_FORCE = null; let worst = 0, prev = null;
          for (let y = 2; y < Math.round(HORIZON * 0.5); y++) { let v = 0; for (let x = 0; x < VW; x++) { const j = (y * VW + x) * 4; v += A[j] + A[j + 1] + A[j + 2]; } v /= VW;
            if (prev !== null) worst = Math.max(worst, Math.abs(v - prev)); prev = v; }
          o.sky = worst.toFixed(1); if (worst > 5.5) f('the storm sky steps ' + o.sky + ' from one row to the next'); }
      } finally { CSHADOW_FORCE = null; STORM_FORCE = null; window.step = keepStep; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const o = r.o;
    return ['the ball lying ahead at most ' + o.ball + ' of what 1.3 times true allows; the path over rivers and gorges drawn: ' + o.path + ' points, never in the green\'s apron',
      'cloud shadows the same from two places: ' + o.cs + ', ' + o.soft + ' of their pixels the faint edge, at most ' + o.dark + ' of the light taken, ' + o.tee + 'px over the tee\'s deck; steam edges at most ' + o.steam + ' of full; the storm sky\'s worst row step ' + o.sky];
  }
};
