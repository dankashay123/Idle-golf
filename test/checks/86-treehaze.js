/* The haze and the far trees (the user: "there is fog or something in
 * between the trees ... that might be the horizon that is clipping
 * through"). The haze was laid by rows of the screen over everything, so a
 * tall tree's top was washed pale and its trunk not; the soft blend at the
 * horizon streaked the row above down over the trees standing across it;
 * and the wood at the back of the course, its haze and its line, was laid
 * over every tree top standing above the skyline. Over every course, two
 * holes, from beside the green and down the fairway:
 *
 *   - where a tree stands (the forest's, a tree, a shrub, the gallery),
 *     the haze by rows leaves it as it is: the same with it and without it
 *     (each is hazed evenly by its own foot), and it still hazes the rest
 *   - the wood at the back is behind the trees: the same trees with it and
 *     without it
 *   - the haze passes by only where a tree is drawn: what it passes by is
 *     not the bare ground as it is with no trees and no haze (a tree behind
 *     a crest left its whole outline unhazed, tree shapes of bare ground
 *     behind the green)
 */
'use strict';
module.exports = {
  name: 'treehaze',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, tree: 0, hazed: 0, stale: 0, wood: 0 }, step0 = window.step;
      const keep = { fp: Scene.forestPass, sb: Scene.standBlit, bw: Scene.buildWood, bh: Scene.buildHaze };
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {}; S.saver = 0; FROST_FORCE = 0;
        const px = () => Scene.b.getImageData(0, 0, VW, VH).data;
        const draw = () => { Scene._gKey = []; Scene.woodKey = null; Scene.t = 30; Scene.draw(0, derive()); return px(); };
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); try { hideSheet(); } catch (e) {}
          for (const hn of [2, 5, 6]) for (const back of [12, 40]) {
            S.hole = hn; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.rain = false; Scene.night = false; Scene.swingT = 0; Scene.walkOn = false;
            Scene.balls = []; Scene.restBall = null; Scene.fairyMove = null; Scene.moveT = 999;
            const cam = Math.max(2, Scene.pinD() - back); Scene.camD = cam; Scene.walkTo = cam;
            const A = draw(), M = Scene.treeMask ? Scene.treeMask.getImageData(0, 0, VW, VH).data : null;
            if (!M) { f('no mask of where the trees stand'); continue; }
            // without the haze by rows
            Scene.buildHaze = function () { this.haze = null; }; const Hz = draw(); Scene.buildHaze = keep.bh; Scene.hazeKey = null;
            // without the wood at the back
            Scene.buildWood = function () { this.wood = null; this.woodBase = 0; }; const W = draw(); Scene.buildWood = keep.bw;
            // without the trees, and without the haze: bare ground left unhazed
            Scene.forestPass = function () { this._forOcc = []; }; Scene.standBlit = function () {}; Scene.buildHaze = function () { this.haze = null; }; const N = draw(); Scene.buildHaze = keep.bh; Scene.hazeKey = null;
            Scene.forestPass = keep.fp; Scene.standBlit = keep.sb; draw();
            o.views++;
            let tree = 0, same = 0, stale = 0, woodBad = 0, hz = 0, hzOf = 0;
            const top = Math.max(0, HORIZON - Math.round(VH * 0.18)), deep = HORIZON + Math.round((VH - HORIZON) * 0.3);
            for (let y = top; y < deep; y++) for (let x = 0; x < VW; x++) {
              const i = (y * VW + x) * 4, t = M[i + 3] > 128;
              const eq = (P, Q) => P[i] === Q[i] && P[i + 1] === Q[i + 1] && P[i + 2] === Q[i + 2];
              if (t) { tree++; if (eq(A, Hz)) same++; if (eq(A, N)) stale++; if (!eq(A, W)) woodBad++; }
              else if (y > top + 4) { hzOf++; if (!eq(A, Hz)) hz++; }
            }
            const where = B.COURSE[ci].n + ' hole ' + hn + ' from ' + back + ' short';
            o.tree += tree; o.hazed += hz; o.stale += stale; o.wood += woodBad; if (tree) o.worst = Math.max(o.worst || 0, stale / tree);
            if (tree && same < tree) f(where + ': the haze by rows over ' + (tree - same) + ' of ' + tree + ' pixels of the trees');
            if (hzOf && hz < hzOf * 0.3) f(where + ': the haze over only ' + hz + ' of ' + hzOf + ' pixels about the horizon that are not trees');
            if (stale > Math.max(8, tree * 0.03)) f(where + ': ' + stale + ' pixels the haze passes by as trees are bare ground, unhazed');
            if (woodBad > Math.max(4, tree * 0.01)) f(where + ': the wood at the back laid over ' + woodBad + ' pixels of the trees');
          }
        }
        if (o.tree < 5000) f('only ' + o.tree + ' pixels of trees about the horizon to look at');
      } finally {
        Object.assign(Scene, { forestPass: keep.fp, standBlit: keep.sb, buildWood: keep.bw, buildHaze: keep.bh });
        Scene._gKey = []; Scene.woodKey = null; Scene.hazeKey = null;
        window.step = step0; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.views + ' views: ' + r.tree + ' pixels of trees about the horizon, none under the haze by rows or the wood at the back; ' + r.hazed + ' pixels about them still hazed',
      r.stale + ' of the trees\' pixels bare ground unhazed (' + (100 * r.worst).toFixed(1) + '% at the most in a view, 3% allowed)'];
  }
};
