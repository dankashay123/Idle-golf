/* The far trees steady as he walks (the user: the trees at the back of the
 * view "always shake and jitter like crazy whenever the golfer is moving").
 * Four things made them shake, each checked here over every course, three
 * holes each, from three places down the hole, walking 24 small steps:
 *
 *   - the forest's trees were placed across their row by the gap between
 *     two rounded places, which went 3 pixels a unit to 4 in one step: a
 *     tree 20 units along leapt 20 pixels. Now no tree of the forest moves
 *     more than a pixel a step, nor grows more than a pixel
 *   - which far trees are kept changes as he walks, and they popped in
 *     whole: one that comes in away from the view's edges and the near end
 *     of the wood comes in small (a third of its size at most) and grows
 *   - the ground was stepped out from where he stood, so every far slice
 *     was another bit of ground each step: the far slices now fall at the
 *     same places on the course from one step to the next
 *   - a far tree a pixel taller was a different set of pixels picked out of
 *     its picture: shrunk by what covers each pixel, its outline changes
 *     by at least a quarter less from one size to the next; and a tree
 *     standing on its own (not stamped) keeps its middle and its foot, a
 *     pixel a step at most
 */
'use strict';
module.exports = {
  name: 'steady',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, trees: 0, props: 0, newT: 0, same: [] }, step0 = window.step, kp = Scene.drawProp, kb = window.blit;
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {}; S.saver = 0; FROST_FORCE = 0;
        let cur = null, PT = new Map();
        Scene.drawProp = function (c, T, n, p, pr) { cur = p.kind === 0 ? p : null; try { return kp.apply(this, arguments); } finally { cur = null; } };
        window.blit = function (c, spr, x, y, w, h) { if (cur && !PT.has(cur)) PT.set(cur, { x: Math.round(x) + Math.max(1, Math.round(w)) / 2, y: Math.round(y) + Math.max(1, Math.round(h)), h: Math.round(h) }); return kb.apply(this, arguments); };
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); try { hideSheet(); } catch (e) {}
          for (const hn of [1, 4, 7]) for (const at of [4, 20, 38]) {
            S.hole = hn; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.rain = false; Scene.night = false; Scene.swingT = 0; Scene.walkOn = false;
            Scene.balls = []; Scene.restBall = null;
            if (at > LEN - 4) continue;
            o.views++;
            let prevF = null, prevP = null, prevD = null, bad = 0, badP = 0, pop = 0, sameN = 0, sameOf = 0;
            for (let i = 0; i <= 24; i++) {
              const cam = at + i * 0.05;
              Scene.camD = cam; Scene.walkTo = cam; Scene.t = 30; PT = new Map();
              Scene.draw(0, derive());
              const F = new Map(); for (const O of Scene._forOcc || []) F.set(O.t, O);
              const Dn = []; for (let k = 0; k < Scene._clipN; k++) if (Scene._clipD[k] > cam + 30) Dn.push(Math.round(Scene._clipD[k] * 1e4));
              if (prevF) {
                for (const [t, O] of F) {
                  const P = prevF.get(t);
                  if (P) { o.trees++;
                    if (Math.abs((O.X0 + O.w / 2) - (P.X0 + P.w / 2)) > 1.5 || Math.abs(O.R.rows.length - P.R.rows.length) > 1) { if (!bad++) f(B.COURSE[ci].n + ' hole ' + hn + ' from ' + cam.toFixed(2) + ': a tree of the forest ' + (O.d - cam).toFixed(0) + ' away went from ' + P.X0 + ',' + P.R.rows.length + 'px to ' + O.X0 + ',' + O.R.rows.length + 'px in one step'); }
                  } else if (O.X0 > 8 && O.X0 + O.w < VW - 8 && O.d > cam + 8) { o.newT++;
                    if (O.R.rows.length > Math.max(2, Math.ceil(O.full * 0.34))) { if (!pop++) f(B.COURSE[ci].n + ' hole ' + hn + ': a tree ' + (O.d - cam).toFixed(0) + ' away came in whole (' + O.R.rows.length + ' of ' + O.full.toFixed(1) + 'px)'); } }
                }
                for (const [p, Q] of PT) { const P = prevP.get(p); if (!P || p.d < cam + 12) continue; o.props++;
                  if (Math.abs(Q.x - P.x) > 1.5 || Math.abs(Q.y - P.y) > 1 || Math.abs(Q.h - P.h) > 1) { if (!badP++) f(B.COURSE[ci].n + ' hole ' + hn + ': a tree ' + (p.d - cam).toFixed(0) + ' away went from ' + JSON.stringify(P) + ' to ' + JSON.stringify(Q) + ' in one step'); } }
                const S1 = new Set(prevD); sameOf += Dn.length; for (const d of Dn) if (S1.has(d)) sameN++;
              }
              prevF = F; prevP = PT; prevD = Dn;
            }
            const sh = sameOf ? sameN / sameOf : 1; o.same.push(sh);
            if (sh < 0.85) f(B.COURSE[ci].n + ' hole ' + hn + ' from ' + at + ': only ' + (100 * sh).toFixed(0) + '% of the far ground\'s slices at the same places from one step to the next');
          }
        }
        if (o.trees < 2000) f('only ' + o.trees + ' forest trees followed from step to step');
        if (o.newT < 20) f('only ' + o.newT + ' trees coming in to look at');
        if (o.props < 200) f('only ' + o.props + ' standing trees followed');
        // a pixel taller, the same tree: the outline changes less than picked
        const outl = (a, b2) => { const t = document.createElement('canvas'); t.width = b2.width; t.height = b2.height; const x = t.getContext('2d'); x.imageSmoothingEnabled = false;
          x.drawImage(a, 0, 0, b2.width, b2.height); const U = x.getImageData(0, 0, b2.width, b2.height).data, V = b2.getContext('2d').getImageData(0, 0, b2.width, b2.height).data; let n = 0, on = 0;
          for (let k = 3; k < V.length; k += 4) { const s1 = U[k] > 128, s2 = V[k] > 128; if (s1 || s2) on++; if (s1 !== s2) n++; } return n / Math.max(1, on); };
        const nn = (spr, w, h) => { const t = document.createElement('canvas'); t.width = w; t.height = h; const x = t.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(spr.cv, 0, 0, w, h); return t; };
        o.outl = {};
        for (const k of ['pine', 'oak']) { const spr = courseTrees(B.COURSE[0], 'day')[k]; let a = 0, b = 0, m = 0;
          for (let h = 5; h < 30; h++) { const w1 = Math.max(1, Math.round(h * spr.w / spr.h)), w2 = Math.max(1, Math.round((h + 1) * spr.w / spr.h));
            const s1 = shrinkSprite(spr, w1, h), s2 = shrinkSprite(spr, w2, h + 1);
            if (!s1 || !s2) { f('no shrunk ' + k + ' at ' + h + 'px'); break; }
            a += outl(nn(spr, w1, h), nn(spr, w2, h + 1)); b += outl(s1.cv, s2.cv); m++; }
          o.outl[k] = [Math.round(100 * a / m), Math.round(100 * b / m)];
          if (!(b < a * 0.75)) f('a shrunk ' + k + ' a pixel taller changes its outline by ' + o.outl[k][1] + '%, picked ' + o.outl[k][0] + '%'); }
      } finally {
        Scene.drawProp = kp; window.blit = kb; window.step = step0; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; startHole();
      }
      o.same = Math.round(100 * Math.min(...o.same));
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.views + ' views, 24 steps each: ' + r.trees + ' forest trees and ' + r.props + ' standing trees followed, none moved or grew more than a pixel a step; ' + r.newT + ' came in small',
      'the far ground\'s slices at the same places step to step (at least ' + r.same + '%); outline change a pixel taller, picked vs shrunk: ' + JSON.stringify(r.outl)];
  }
};
