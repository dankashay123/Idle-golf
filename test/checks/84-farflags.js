/* Another hole's flag behind the woods (the user saw a pole on a farther
 * green standing out in front of the forest's trees):
 *
 *   - the forest's trees are painted into the ground and the other greens'
 *     flags are drawn over the ground after them, so a flag beyond a tree
 *     showed through it. Over every course, nine holes, two places down
 *     each: not a pixel of another hole's flag where a tree of the forest
 *     nearer than its green stands
 *   - and the sweep has flags behind trees to hide (without the fix, pixels
 *     of them showed there), and flags in the open still drawn
 */
'use strict';
module.exports = {
  name: 'farflags',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, flags: 0, shown: 0, bad: 0, wouldShow: 0 }, keep = Scene.drawProp, step0 = window.step;
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {}; S.saver = 0;
        // (no heat shimmer: it slides whole rows by the horizon a pixel, tree
        // and flag together, so the trees' places read off the ground no
        // longer match the frame; on a summer afternoon it failed here)
        SHIMMER_FORCE = false;
        const cx = Scene.cv.getContext('2d');
        const grab = () => cx.getImageData(0, 0, VW, VH).data;
        // is (x, y) under a tree of the forest nearer than d?
        const under = (x, y, d) => (Scene._forOcc || []).some(O => {
          if (O.d >= d || y > O.cut || x < O.X0 || x >= O.X0 + O.w) return false;
          const row = O.R.rows[y - O.Y0]; return !!row && row.some(([a, n]) => x - O.X0 >= a && x - O.X0 < a + n); });
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); try { hideSheet(); } catch (e) {}
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hn = 0; hn < 9; hn++) for (const cam of [0, 12]) {
            S.hole = first + hn; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.walkOn = false;
            Scene.balls = []; Scene.restBall = null; Scene.fairyMove = null; Scene.moveT = 999;
            const D = derive(); Scene.draw(1 / 60, D);
            // the flags this view draws, where
            const F = [];
            Scene.drawProp = function (c, T, n, p, pr) { if (p.kind === 12) F.push({ d: p.d, x: pr.x, y: pr.y, h: Math.max(3, Math.round(B_FLAG * US * pr.s)) }); return keep.apply(this, arguments); };
            Scene.draw(0, D); Scene.drawProp = keep; const A = grab();
            if (!F.length) continue;
            o.views++; o.flags += F.length;
            // without them, and with them but not hidden behind the trees
            Scene.drawProp = function (c, T, n, p) { if (p.kind === 12) return; return keep.apply(this, arguments); };
            Scene.draw(0, D); const N = grab();
            Scene.drawProp = function (c, T, n, p) { if (p.kind !== 12) return keep.apply(this, arguments); const k = this._forOcc; this._forOcc = []; keep.apply(this, arguments); this._forOcc = k; };
            Scene.draw(0, D); Scene.drawProp = keep; const U = grab();
            // (a pixel is the nearest flag's whose box it is in: nearer flags
            // are drawn over farther ones)
            const inBox = (G, x, y) => Math.abs(x - G.x) <= G.h + 2 && y >= G.y - G.h - 1 && y <= G.y;
            const flagAt = (x, y) => F.filter(G => inBox(G, x, y)).reduce((a, b) => !a || b.d < a.d ? b : a, null);
            for (let i = 0; i < A.length; i += 4) {
              const x = (i >> 2) % VW, y = ((i >> 2) - x) / VW;
              const drawn = A[i] !== N[i] || A[i + 1] !== N[i + 1] || A[i + 2] !== N[i + 2];
              const unhid = U[i] !== N[i] || U[i + 1] !== N[i + 1] || U[i + 2] !== N[i + 2];
              if (!drawn && !unhid) continue;
              // (only in a flag's own box: measure the thing, not the frame)
              const G = flagAt(x, y); if (!G) continue;
              const cov = under(x, y, G.d);
              if (drawn) { o.shown++; if (cov) { o.bad++; if (o.bad < 4) f(B.COURSE[ci].id + ' hole ' + (hn + 1) + ' from ' + cam + ': a flag pixel at ' + x + ',' + y + ' over a nearer tree'); } }
              if (unhid && cov) o.wouldShow++;
            }
          }
        }
        if (o.views < 20) f('only ' + o.views + ' views with another hole\'s flag in them');
        if (!(o.wouldShow >= 20)) f('the sweep has only ' + o.wouldShow + ' pixels of flags behind trees to hide');
        if (!(o.shown >= 200)) f('only ' + o.shown + ' pixels of flags drawn in the open');
      } finally {
        SHIMMER_FORCE = null;
        Scene.drawProp = keep; window.step = step0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.flags + ' flags of other holes over ' + r.views + ' views: ' + r.shown + ' pixels drawn, none over a tree nearer than its green; ' + r.wouldShow + ' pixels hidden behind the forest that showed through it before'];
  }
};
