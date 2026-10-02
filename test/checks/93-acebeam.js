/* An ace's column of light (the user asked: on an ace he never walks up,
 * so the ball's moment in the cup shoots up out of it, far off, past the
 * top of the screen, and ends as soon as the next hole starts; and "the
 * environment covers the ace effect so it doesn't show up through trees
 * or anything"):
 *
 *   - played on a strong bag that aces: every ace has its column for about
 *     its held second, none is ever drawn once the next hole has begun,
 *     and none on a hole that was not an ace
 *   - drawn against the same frame without it, on every home course: it
 *     reaches the top of the view, nothing of it shows below the ground's
 *     line at the cup (a crest in front hides its foot), and nothing of it
 *     over a tree of the forest nearer than the cup
 */
'use strict';
module.exports = {
  name: 'acebeam',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, crest: 0, wood: 0, reach: 0 }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const mr = Math.random, raf = window.requestAnimationFrame, pn = performance.now.bind(performance), keep = window.step;
      const od = Scene.drawAceBeam;
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0; FROST_FORCE = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 99; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        // ---- played: a strong bag on a home course, watched ----
        DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
        for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 60);
        S.trail = 'plain'; startHole();
        let drawn = 0, wrong = 0;
        Scene.drawAceBeam = function () { if (this.aceBeamQ() >= 0) { drawn++; if (!this.aceHold()) wrong++; } return od.apply(this, arguments); };
        o.frames = []; o.leak = 0; let at = S.hole, n = 0;
        for (let i = 0; i < 60 * 40; i++) {
          fake += 1000 / 60; const D = derive(); keep(1 / 60, D);
          if (S.hole !== at) { if (n) o.frames.push(n); n = 0; at = S.hole; }
          const b0 = drawn; Scene.draw(1 / 60, D);
          if (drawn > b0) { n++; if (Scene.hole !== S.hole || !Scene.cupT) o.leak++; }
        }
        Scene.drawAceBeam = od;
        if (o.frames.length < 3) f('only ' + o.frames.length + ' aces in 40s on a strong bag');
        const bad = o.frames.filter(k => k < 50 || k > 62);
        if (bad.length) f('a column lasted ' + bad.join(', ') + ' frames, not about a second (60)');
        if (o.leak) f(o.leak + ' frames drew the column after its hole');
        if (wrong) f(wrong + ' frames drew a column on a hole that was not an ace');
        // ---- the ball always goes in (the user saw one land a little in
        // front of him and vanish as the ace played): one nearly down when
        // the hole went, one lying short from an earlier shot, and none ----
        o.into = {};
        for (const mode of ['late', 'lying', 'none']) {
          startHole(); const D = derive();
          Scene.camD = 0; Scene.walkTo = 0; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.pendingBall = null; Scene.cupT = 0;
          if (mode === 'late') Scene.balls.push({ d0: 0, dist: 8, t: 0.85 * 0.45, dur: 0.45, el: null, crit: false, seed: 1, lat0: 0.42, lat: 0, cup: 0, tee: 1 });
          if (mode === 'lying') Scene.restBall = { d: 8, lat: 0 };
          S.elapsed = S.parTime * 0.05; S.doneT = S.elapsed; S.yards = 0;
          let from = null;
          for (let i = 0; i < 180 && !Scene.cupT; i++) { fake += 1000 / 60; const b = Scene.balls[0]; Scene.draw(1 / 60, D); if (Scene.cupT && b) from = b.d0 + b.dist; }
          o.into[mode] = from === null ? 'none' : (from - Scene.pinD()).toFixed(2);
          if (from === null || Math.abs(from - Scene.pinD()) > 0.3) f('an ace with ' + (mode === 'late' ? 'its ball nearly down short' : mode === 'lying' ? 'a ball lying short' : 'no ball out') + ': the ace played without a ball flying into the cup');
        }
        // ---- drawn: with and without it, the same frame ----
        QUIET = true; window.step = () => {};
        const c = Scene.b;
        for (const cs of B.COURSE.filter(x => x.slot === 'home')) {
          DEV.course(B.COURSE.indexOf(cs)); hideSheet(); const h0 = S.hole;
          for (let hh = 1; hh <= 6; hh++) {
            S.hole = h0 + hh - 1; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); startHole();
            Scene.announce = null; Scene.rain = false; Scene.night = false; S.trail = 'plain';
            Scene.camD = 0; Scene.walkTo = 0; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.hole = S.hole; Scene.t = 40;
            const D = derive();
            // (the ball in the cup both times: the gallery cheers it)
            Scene.cupT = 40 - 0.3 * ACE_HOLD; Scene.aceT = 0; Scene.draw(0, D); Scene.draw(0, D);
            const a = c.getImageData(0, 0, VW, VH).data;
            // the scenery split at the cup for it changes nothing else: the
            // frame with the column left out is the frame without one
            Scene.aceT = Scene.cupT; Scene.drawAceBeam = () => {}; Scene.draw(0, D); Scene.drawAceBeam = od;
            const a2 = c.getImageData(0, 0, VW, VH).data;
            let moved = 0; for (let j = 0; j < a.length; j += 4) if (a[j] !== a2[j] || a[j + 1] !== a2[j + 1] || a[j + 2] !== a2[j + 2]) moved++;
            if (moved) f(cs.id + ' hole ' + hh + ': ' + moved + ' pixels of the frame change with the scenery split at the cup');
            // and the column alone: what it does to the frame as it is drawn
            let pre = null, post = null;
            Scene.drawAceBeam = function () { pre = c.getImageData(0, 0, VW, VH).data; const r = od.apply(this, arguments); post = c.getImageData(0, 0, VW, VH).data; return r; };
            Scene.draw(0, D); Scene.drawAceBeam = od;
            const P = Scene.pinD(), p = Scene.proj(P, Scene.pinX()), cutY = Math.min(Math.round(p.y), Math.floor(Scene.clipAt(P)) + 1);
            if (cutY <= 4 || !pre) continue;
            o.views++; if (cutY < Math.round(p.y) - 1) o.crest++;
            const FD = Scene._fdep, X = Math.round(p.x);
            let n = 0, top = 0, under = 0, trees = 0;
            for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
              const i = y * VW + x, j = i * 4;
              if (FD && FD[i] < P - 0.3 && y < cutY && Math.abs(x - X) < 12) o.wood++;
              if (pre[j] === post[j] && pre[j + 1] === post[j + 1] && pre[j + 2] === post[j + 2]) continue;
              n++; if (y < 3) top++;
              if (y >= cutY) under++;
              if (FD && FD[i] < P - 0.3) trees++;
            }
            const where = cs.id + ' hole ' + hh;
            if (top) o.reach++; else f(where + ': the column does not reach the top of the view (' + n + ' pixels)');
            if (under) f(where + ': ' + under + ' pixels of it below the ground\'s line at the cup (row ' + cutY + ')');
            if (trees) f(where + ': ' + trees + ' pixels of it over a tree of the forest nearer than the cup');
          }
        }
        if (o.views < 30) f('only ' + o.views + ' views of the cup to look at');
        if (!o.wood) f('no view had a tree of the forest in front of the column to test it');
      } finally {
        Scene.drawAceBeam = od; Math.random = mr; window.requestAnimationFrame = raf; performance.now = pn; window.step = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the ball into the cup from nearly down, lying short and with none out: ' + JSON.stringify(r.into), 'aces played: ' + r.frames.length + ' columns of ' + r.frames.join('/') + ' frames, none after its hole',
      r.views + ' views (' + r.crest + ' behind a crest, ' + r.wood + ' wood pixels in front): every one reaches the top, none below the ground\'s line or over a nearer tree'];
  }
};
