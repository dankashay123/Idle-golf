/* Nothing standing shows through a nearer tree of the forest (the user saw
 * "brown lines ... in the trees": the forest's trees are painted into the
 * ground, under everything drawn standing, so a tree, a shrub or the
 * gallery beyond one of them showed through it, its trunk and its shadow a
 * brown line through the wood). Over every course, two holes, two places,
 * dry and in the rain (umbrellas):
 *
 *   - every pixel where the last thing drawn standing is beyond a tree of
 *     the forest shows that tree, as the forest painted it
 *   - and there are such pixels to look at (without the fix they showed
 *     the thing beyond), while things nearer than the forest still show
 */
'use strict';
module.exports = {
  name: 'forestfront',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, behind: 0, shown: 0, front: 0 }, step0 = window.step, keepFO = Scene.forestOver;
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {}; S.saver = 0; FROST_FORCE = 0;
        let snap = [];
        Scene.forestOver = function (c) {
          const L = this._fcov || [], FD = this._fdep, PD = this._pdep, G = PixPaint.px;
          const S0 = [];
          if (FD && PD && G) for (const i of L) S0.push([i, FD[i], PD[i], G[i]]);
          const out = keepFO.apply(this, arguments);
          // (looked at as soon as it is done: the weather goes over after)
          const A = new Uint32Array(c.getImageData(0, 0, VW, VH).data.buffer);
          for (const e of S0) { e.push(A[e[0]]); snap.push(e); }
          return out;
        };
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); try { hideSheet(); } catch (e) {}
          const first = S.hole;
          for (const hn of [2, 5]) for (const wet of [0, 1]) for (const back of [10, 30]) {
            S.hole = first + hn - 1; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === (wet ? 'Crosswind' : 'Fair')));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.swingT = 0; Scene.walkOn = false;
            Scene.balls = []; Scene.restBall = null; Scene.fairyMove = null; Scene.moveT = 999;
            const cam = Math.max(2, Scene.pinD() - back); Scene.camD = cam; Scene.walkTo = cam; Scene.t = 30;
            snap = [];
            Scene.draw(0, derive());
            o.views++;
            let bad = 0, n = 0, fr = 0;
            for (const [i, fd, pd, g, a] of snap) {
              if (fd < pd) { n++; if (a !== g) bad++; } else fr++;
            }
            o.behind += n; o.shown += n - bad; o.front += fr;
            if (bad) f(B.COURSE[ci].n + ' hole ' + hn + (wet ? ' in the rain' : '') + ' from ' + back + ' short: ' + bad + ' of ' + n + ' pixels beyond a tree of the forest show what is beyond it');
          }
        }
        if (o.behind < 500) f('only ' + o.behind + ' pixels of things standing beyond the forest to look at');
        if (o.front < 500) f('only ' + o.front + ' pixels of things standing in front of the forest');
      } finally {
        Scene.forestOver = keepFO; window.step = step0; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.views + ' views: ' + r.behind + ' pixels of trees, shrubs and the gallery beyond a tree of the forest, ' + r.shown + ' of them showing the tree',
      r.front + ' pixels of them in front of the forest, left as drawn'];
  }
};
