/* The celebrations, his and hers, laid out so nothing crosses the body
 * (the user saw her ace's arm and club over her face and her albatross arm
 * across her chest: "ensure body parts do not clip and that they are where
 * they are supposed to be anatomically").
 *
 *   - held, every pose: no arm drawn over the head (the shoulder joint
 *     aside) and no club drawn over the head or the body; what goes behind
 *     is drawn before the body, so it is hidden there
 *   - her ace: the far hand behind her head (hidden, the elbow showing), the
 *     club spun over her head in her near hand, stopped when it ends
 *   - her albatross: the arm out from the front of her shoulder, clear of
 *     her chest
 */
'use strict';
module.exports = {
  name: 'poses',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], n: 0 }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet();
        const h = 58, w = 40, sx = 24, sy = 15.43, cl = h * 0.64, bot = h;   // the finish picture's own grid, a pixel a cell
        const KINDS = { f: ['herace', 'heralb', 'twirl', 'hip'], m: ['hisace', 'hisalb', 'hisbird', 'hislean', 'toss'] };
        for (const gen of ['f', 'm']) {
          S.gender = gen; const R = femRows(G_FIN_ROWS, 'fin', outfitNow());
          const on = (X, Y, r0, r1) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = Math.floor(X + dx), rr = Math.floor(Y + dy);
            if (rr >= r0 && rr <= r1 && R[rr] && R[rr][c] && R[rr][c] !== '.') return true; } return false; };
          // (a segment over pixels of rows r0 to r1, a pixel's grace either
          // side for the line's width; none within 2.5 of the joint O)
          const over = (A, Bq, r0, r1, O) => { for (let i = 0; i <= 80; i++) { const X = A[0] + (Bq[0] - A[0]) * i / 80, Y = A[1] + (Bq[1] - A[1]) * i / 80;
            if (O && Math.hypot(X - O[0], Y - O[1]) < 2.5) continue; if (on(X, Y, r0, r1)) return [X.toFixed(1), Y.toFixed(1)]; } return null; };
          const segs = L => L.slice(1).map((p, i) => [L[i], p]);
          for (const k of KINDS[gen]) {
            // (held: from 0.2s on; the birdie's twirl the whole way)
            for (let T = k === 'twirl' ? 0 : 0.2; T <= 1.6; T += 0.01) { o.n++;
              const P = herPoseAt({ kind: k, t: T }, sx, sy, w, h, cl, bot), N = P.near || [[sx, sy], [P.hx, P.hy]], at = k + ' at ' + T.toFixed(2) + 's: ';
              for (const s of segs(N)) { const q = over(s[0], s[1], 0, 12, N[0]); if (q) { f(at + 'the near arm over the head at ' + q); break; } }
              if (P.far && !P.farBack) for (const s of segs(P.far)) { const q = over(s[0], s[1], 0, 12, P.far[0]); if (q) { f(at + 'the far arm over the head at ' + q); break; } }
              if (!P.noClub && !P.clubBack) { const q = over([P.gx, P.gy], [P.tx, P.ty], 0, 31); if (q) f(at + 'the club over him at ' + q); }
            }
          }
        }
        // drawn: her ace, held, on a canvas of its own
        S.gender = 'f'; buildSprites();
        const spr = SPRITE.gFinish, W = Math.round(h * spr.w / spr.h), cv = document.createElement('canvas'); cv.width = W * 3; cv.height = h * 2;
        const c = cv.getContext('2d'), X0 = W, Y0 = Math.round(h * 0.6);
        const draw = P => { c.clearRect(0, 0, cv.width, cv.height); HER_POSE = P; try { paintGolfer(c, X0, Y0, W, h, 0, 1, Y0 + h, false, 0, spr, [], undefined, true); } finally { HER_POSE = null; }
          return c.getImageData(0, 0, cv.width, cv.height).data; };
        const O = outfitNow(), arm2 = (O.arm2 || O.skin2 || PX.skin2).toLowerCase();
        const hex = (d, gx, gy) => { const x = Math.floor(X0 + spr.ax * W + (gx - 24) * W / 40), y = Math.floor(Y0 + spr.ay * h + (gy - 15.43) * h / 58), i = (y * cv.width + x) * 4;
          return '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
        const near = (d, gx, gy, col) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (hex(d, gx + dx, gy + dy) === col) return true; return false; };
        const d = draw({ kind: 'herace', t: 1.5 });
        if (near(d, 21.5, 5, arm2)) f('her far hand is drawn over her head, not behind it');
        if (!near(d, 14, 7, arm2)) f('her far elbow does not show beside her head');
        const P1 = herPoseAt({ kind: 'herace', t: 1.2 }, sx, sy, w, h, cl, bot), P2 = herPoseAt({ kind: 'herace', t: 1.5 }, sx, sy, w, h, cl, bot);
        if (P1.tx !== P2.tx || P1.ty !== P2.ty) f('her club is still spinning after the celebration');
        const Pm = herPoseAt({ kind: 'herace', t: 0.4 }, sx, sy, w, h, cl, bot);
        if (!(Pm.hy < 0 && Math.abs(Pm.tx - Pm.gx) > cl * 0.3)) f('her club is not spun over her head (' + JSON.stringify([Pm.hy, Pm.gx, Pm.tx]) + ')');
        // her albatross: the arm starts at the front of her shoulder
        const A = herPoseAt({ kind: 'heralb', t: 1 }, sx, sy, w, h, cl, bot);
        if (!(A.near && A.near[0][0] >= 28.5)) f('her pointing arm starts at column ' + (A.near ? A.near[0][0].toFixed(1) : '?') + ', across her chest');
      } finally {
        HER_POSE = null; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return [r.n + ' held frames of nine celebrations, his and hers: no arm over the head, no club over the body; what passes behind is drawn first',
      'her ace: the far hand behind her head with the elbow showing, the club spun over it and stopped by the end; her albatross arm clear of her chest'];
  }
};
