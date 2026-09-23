/* Skins and balls that do more than change a colour.
 *
 *   - every one draws, and draws something: the stage with the effect on has
 *     to differ from the same colours with the effect taken off, or a 3000
 *     sovereign skin is a recolour
 *   - none is expensive: each skin's golfer is drawn 300 times and must
 *     average under 1.5ms. The Divine skin first measured 2.3ms, stamping its
 *     glow by redrawing him strip by strip twelve times; it now stamps one
 *     silhouette and measures under 1ms
 *   - "Try it" wears a look for ten seconds without buying it: nothing is
 *     spent, nothing is saved, and when it runs out he is back in his own
 *   - he walks between shots: every look strides (two phases of the walk
 *     differ from each other and from him standing), under the same 1.5ms,
 *     and his caddie is drawn beside him
 *   - the shop lists every look exactly once, each with its own picture
 *   - every trail and ball can be seen: one in flight has to paint at least
 *     fifteen times the pixels the plain ball does, and draw in under 0.5ms.
 *     It was four times at first, and the Rubber Duck -- a small duck and a
 *     few blue dots -- passed at 10.7x while being hard to spot; with a wake
 *     under it the faintest look is 27x.
 *   - and none reaches back behind him: the camera walks on while the ball
 *     is up, and the tail used to run back to the tee he had left, below his
 *     feet, as if the shot came from behind him.
 *     The colour trails were three one-pixel dots behind the ball; the
 *     Rainbow painted about as much as the plain ball and nobody could tell
 *     it was on. Its six bands were then stacked down the screen, along a
 *     flight that runs up it, and landed on one line.
 */
'use strict';
module.exports = {
  name: 'skins',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}; const SNAP = JSON.stringify(S);
      hideSheet(); QUIET = true;
      const D = derive();
      const shot = () => { const g = Scene.b.getImageData(0, 0, VW, VH).data; let h = 0;
        for (let i = 0; i < g.length; i += 4) h = (h * 31 + g[i] + g[i + 1] * 3 + g[i + 2] * 7) | 0; return h; };
      const frame = () => { Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); Scene.drawBalls(0); };
      try {
        // ---- every effect draws something ---------------------------------
        o.blank = []; o.errs = [];
        for (const d of B.OUTFITS.filter(x => x.fx)) {
          S.styleOwn['o:' + d.id] = 1; S.outfit = d.id; buildSprites();
          try {
            Scene.t = 1.23; frame(); const on = shot();
            const fx = d.fx; d.fx = undefined; Scene.t = 1.23; frame(); const off = shot(); d.fx = fx;
            if (on === off) o.blank.push('skin ' + d.id);
          } catch (e) { o.errs.push(d.id + ': ' + e.message); }
        }
        S.outfit = 'classic'; buildSprites();
        for (const d of B.TRAILS.filter(x => x.fx)) {
          S.styleOwn['t:' + d.id] = 1; S.trail = d.id;
          try {
            const launch = () => { Scene.balls.length = 0; Scene.swingT = 0;
              Scene.pendingBall = { crit: false, el: null, dmg: 5 }; Math.random = () => 0.5; Scene.launch();
              Scene.balls.forEach(b => { b.t = b.dur * 0.4; }); };
            const real = Math.random;
            launch(); Scene.t = 2.0; Scene.b.clearRect(0, 0, VW, VH); Scene.drawBalls(0); const on = shot();
            S.trail = 'plain'; launch(); Scene.t = 2.0; Scene.b.clearRect(0, 0, VW, VH); Scene.drawBalls(0); const off = shot();
            Math.random = real;
            if (on === off) o.blank.push('ball ' + d.id);
          } catch (e) { o.errs.push(d.id + ': ' + e.message); }
        }
        S.trail = 'plain'; Scene.balls.length = 0;

        // ---- a trail you can see, at a price you can afford ------------------
        // pixels painted by one ball in flight, a third of the way out, and
        // the time to draw it, for every look against the plain ball
        o.paint = {}; o.tcost = {};
        {
          const real = Math.random;
          const painted = () => { const g = Scene.b.getImageData(0, 0, VW, VH).data; let n = 0;
            for (let i = 3; i < g.length; i += 4) if (g[i]) n++; return n; };
          for (const d of B.TRAILS) {
            S.styleOwn['t:' + d.id] = 1; S.trail = d.id;
            let n = 0;
            for (const u of [0.2, 0.3, 0.4]) {
              Scene.balls.length = 0; Scene.pendingBall = { crit: false, el: null, dmg: 5 };
              Math.random = () => 0.5; Scene.launch(); Math.random = real;
              Scene.balls.forEach(b => { b.t = b.dur * u; });
              Scene.b.clearRect(0, 0, VW, VH); Scene.t = 2 + u; Scene.drawBalls(0); n += painted();
            }
            o.paint[d.id] = n / 3;
            const t0 = performance.now();
            for (let i = 0; i < 200; i++) { Scene.balls.forEach(b => { b.t = b.dur * 0.3; }); Scene.t += 0.016; Scene.drawBalls(0); }
            o.tcost[d.id] = (performance.now() - t0) / 200;
          }
          S.trail = 'plain'; Scene.balls.length = 0;
        }

        // ---- none is expensive -----------------------------------------------
        o.cost = {};
        for (const d of B.OUTFITS) {
          S.outfit = d.id; buildSprites();
          for (let i = 0; i < 30; i++) { Scene.t += 0.016; Scene.drawGolfer(D); }
          const t0 = performance.now();
          for (let i = 0; i < 300; i++) { Scene.t += 0.016; Scene.drawGolfer(D); }
          o.cost[d.id] = (performance.now() - t0) / 300;
        }
        S.outfit = 'classic'; buildSprites();

        // ---- walking: every look strides, and the caddie walks with him ------
        o.walkSame = []; o.walkCost = {};
        for (const d of B.OUTFITS) {
          S.styleOwn['o:' + d.id] = 1; S.outfit = d.id; buildSprites();
          Scene.swingT = 0; Scene.t = 1.23;
          Scene.walkOn = false; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const stand = shot();
          Scene.walkOn = true; Scene.walkPh = 0.2; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const a = shot();
          Scene.walkPh = 0.7; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const b2 = shot();
          if (a === stand || a === b2) o.walkSame.push(d.id);
          const t0 = performance.now();
          for (let i = 0; i < 200; i++) { Scene.t += 0.016; Scene.walkPh += 0.03; Scene.drawGolfer(D); }
          o.walkCost[d.id] = (performance.now() - t0) / 200;
        }
        { const keep = SPRITE.caddie; Scene.walkOn = false; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const w1 = shot();
          SPRITE.caddie = null; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const w0 = shot(); SPRITE.caddie = keep;
          o.caddie = w1 !== w0; }
        Scene.walkOn = false; S.outfit = 'classic'; buildSprites();

        // ---- try it ------------------------------------------------------------
        S.styleOwn = {}; S.outfit = 'classic'; S.sov = 0;
        styleTry('o', 'divine');
        o.tryWorn = outfitNow().id; o.trySaved = S.outfit; o.trySov = S.sov;
        o.tryInSave = JSON.stringify(S).indexOf('divine') >= 0;
        PREVIEW.until = Date.now() - 1; previewTick();
        o.tryAfter = outfitNow().id;
        styleTry('t', 'godlight'); o.tryBall = trailNow().id; PREVIEW.until = Date.now() - 1; previewTick();
        o.tryBallAfter = trailNow().id;

        // ---- the shop lists every look once, each with its own picture --------
        S.sov = 0; QUIET = false; openShop('style');
        const sheet = document.getElementById('sheet');
        const acts = [...sheet.querySelectorAll('.price[data-do^="style:"]')].map(b => b.dataset.do);
        o.listed = acts.length; o.dupes = acts.length - new Set(acts).size;
        o.want = B.OUTFITS.length + B.TRAILS.length;
        const imgs = [...sheet.querySelectorAll('.card img')].map(i => i.src);
        o.noPic = imgs.filter(x => !x || x.length < 50).length;
        o.samePic = imgs.length - new Set(imgs).size;
        o.tries = sheet.querySelectorAll('.try[data-try]').length;
        hideSheet();
      } finally {
        QUIET = false; PREVIEW = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites();
      }
      return o;
    });

    // ---- nothing behind him ------------------------------------------------
    // Played live, because it takes the camera walking on while the ball is
    // up: a launch set up by hand and frozen never showed it. Every point a
    // trail projects is compared with his feet, frame by frame.
    const behind = await page.evaluate(() => new Promise(done => {
      const keep = S.trail, db = Scene.drawBalls, pj = Scene.proj;
      let inB = false, maxY = -1e9, worst = -1e9, frames = 0;
      QUIET = true; DEV.gold(8); QUIET = false; S.trail = 'seraph';
      Scene.proj = function(d, lat, lift){ const q = pj.call(this, d, lat, lift); if (inB) maxY = Math.max(maxY, q.y); return q; };
      Scene.drawBalls = function(dt){ maxY = -1e9; inB = true;
        try { return db.call(this, dt); } finally { inB = false;
          if (this.balls.length){ frames++; worst = Math.max(worst, maxY - pj.call(this, this.camD, -0.30).y); } } };
      setTimeout(() => { Scene.drawBalls = db; Scene.proj = pj; S.trail = keep; done({ worst, frames }); }, 8000);
    }));
    if (!(behind.frames > 60)) throw new Error('only ' + behind.frames + ' frames with a ball in the air in eight seconds');
    if (behind.worst > 1) throw new Error('a trail reached ' + behind.worst + 'px below his feet, back to the tee he had '
      + 'walked on from: the shot looks as if it came from behind him');

    if (r.errs.length) throw new Error('effects threw: ' + r.errs.join('; '));
    if (r.blank.length) throw new Error('these draw nothing their colours do not: ' + r.blank.join(', '));
    const slow = Object.entries(r.cost).filter(([, v]) => v > 1.5);
    if (slow.length) throw new Error('skins over 1.5ms a frame: ' + slow.map(([k, v]) => k + ' ' + v.toFixed(2) + 'ms').join(', '));
    if (r.walkSame.length) throw new Error('these looks do not stride when he walks: ' + r.walkSame.join(', '));
    const wslow = Object.entries(r.walkCost).filter(([, v]) => v > 1.5);
    if (wslow.length) throw new Error('walking over 1.5ms a frame: ' + wslow.map(([k, v]) => k + ' ' + v.toFixed(2) + 'ms').join(', '));
    if (!r.caddie) throw new Error('no caddie beside him');
    if (r.tryWorn !== 'divine') throw new Error('"Try it" did not put the Divine skin on: ' + r.tryWorn);
    if (r.trySaved !== 'classic' || r.trySov !== 0 || r.tryInSave)
      throw new Error('"Try it" changed the save: wearing ' + r.trySaved + ', ' + r.trySov + ' sovereigns'
        + (r.tryInSave ? ', and the try is written into it' : ''));
    if (r.tryAfter !== 'classic' || r.tryBallAfter !== 'plain')
      throw new Error('after the try ran out he was still in ' + r.tryAfter + ' with a ' + r.tryBallAfter + ' ball');
    if (r.tryBall !== 'godlight') throw new Error('"Try it" on a ball did not put it on: ' + r.tryBall);
    if (r.listed !== r.want || r.dupes) throw new Error('the Style tab lists ' + r.listed + ' looks with '
      + r.dupes + ' twice; there are ' + r.want);
    if (r.noPic || r.samePic) throw new Error(r.noPic + ' looks have no picture and ' + r.samePic + ' share one');
    if (r.tries < r.want - 2) throw new Error('only ' + r.tries + ' looks offer "Try it"');

    const faint = Object.entries(r.paint).filter(([k, v]) => k !== 'plain' && !(v >= r.paint.plain * 15));
    if (faint.length) throw new Error('these trails are hard to see: ' + faint.map(([k, v]) => k + ' paints '
      + Math.round(v) + ' pixels').join(', ') + ' against ' + Math.round(r.paint.plain) + ' for the plain ball; a look has to be at least fifteen times that');
    const tslow = Object.entries(r.tcost).filter(([, v]) => v > 0.5);
    if (tslow.length) throw new Error('trails over 0.5ms a ball: ' + tslow.map(([k, v]) => k + ' ' + v.toFixed(2) + 'ms').join(', '));
    const worst = Object.entries(r.cost).sort((a, b) => b[1] - a[1])[0];
    const dim = Object.entries(r.paint).filter(([k]) => k !== 'plain').sort((a, b) => a[1] - b[1])[0];
    const tw = Object.entries(r.tcost).sort((a, b) => b[1] - a[1])[0];
    return ['every effect skin and ball draws something its colours alone do not',
      'dearest per frame ' + worst[0] + ' at ' + worst[1].toFixed(2) + 'ms (budget 1.5ms)',
      'every look strides when he walks, the caddie beside him; dearest walking '
        + Object.entries(r.walkCost).sort((a, b) => b[1] - a[1])[0].map((v, i) => i ? v.toFixed(2) + 'ms' : v).join(' at '),
      'every trail and ball at least 15x the plain ball on screen (faintest ' + dim[0] + ' at '
        + (dim[1] / r.paint.plain).toFixed(1) + 'x), dearest ' + tw[0] + ' at ' + tw[1].toFixed(2) + 'ms a ball',
      'nothing drawn behind him: ' + behind.frames + ' frames of flight, the lowest ' + (-behind.worst) + 'px above his feet',
      '"Try it" wears a look for ten seconds, spends nothing, saves nothing, and takes it off',
      'the Style tab lists all ' + r.want + ' looks once, each with its own picture'];
  }
};
