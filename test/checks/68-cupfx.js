/* The dearest balls' moment in the cup (the user asked, from the menu: the
 * three dearest balls do something of their own as they drop in the cup).
 *
 *   - Godlight, Demon Eye, the Ascended Orb and the Singularity each draw
 *     something as the ball drops (a frame against the same frame with
 *     nothing dropped), and so do the Ascended's and The Void's wakes (the
 *     user found The Void's not its own), and the Jade and Hellfire Wakes
 *     play their sets' too
 *   - the cheaper balls (Rubber Duck, Hearts, Bubbles, Confetti, Comet,
 *     Black Hole) have a smaller one each: inside a smaller box, and fewer
 *     pixels than any of the dear balls'; the plain wakes have none
 *   - short and close: over by 0.55s, and nothing outside a box of the
 *     pin's own size about the cup
 *   - the pin stands in front of it: its pixels the same with and without
 *   - cut at the ground's line: nothing under it at its own distance (what
 *     lies flat in front of the cup is nearer than the pin)
 *   - the hole holds for the whole moment with these balls (the next hole
 *     came 0.3s after the drop on a fast bag), and no longer than any hole
 *   - none of it calls Math.random
 */
'use strict';
module.exports = {
  name: 'cupfx',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], px: {}, views: 0 }, keep = window.step, mr = Math.random;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      let rnd = 0, inF = 0; const of = Scene.drawCupFx;
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        Math.random = () => { if (inF) rnd++; return mr(); };
        Scene.drawCupFx = function () { inF++; try { return of.apply(this, arguments); } finally { inF--; } };
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const c = Scene.b, px = () => c.getImageData(0, 0, VW, VH).data;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        DEV.course(B.COURSE.findIndex(cs => cs.slot === 'home')); hideSheet();
        const TOP = ['godlight', 'demoneye', 'ascorb', 'singularity', 'horizon', 'ascension', 'seraph', 'hellfire'];
        const SMALL = ['duck', 'hearts', 'bubbles', 'confetti', 'comet', 'blackhole'];
        const PLAIN = ['plain', 'gold', 'aurora', 'ember', 'mythic', 'rainbow'];
        const balls = TOP.concat(SMALL, PLAIN).filter(id => styleDef('t', id));
        if (balls.length < TOP.length + SMALL.length + PLAIN.length) f('the balls to try are missing: ' + balls.join(','));
        delete S.ball;
        for (let hh = 2; hh <= 7; hh++) {
          S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); startHole(); Scene.announce = null; Scene.rain = false; Scene.night = false;
          const PD = Scene.pinD();
          for (const at of [PD - 5, PD - 14, 4]) {
            Scene.camD = at; Scene.walkTo = at; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.t = 30; o.views++;
            for (const id of balls) {
              S.styleOwn['t:' + id] = 1; S.trail = id;
              const top = TOP.includes(id), small = SMALL.includes(id), has = top || small;
              // a frame of the hole first (it owns the clip line), then the
              // moment alone over a blank
              Scene.cupT = 0; Scene.draw(0, derive());
              // (where the frame left the camera)
              const p = Scene.proj(PD, Scene.pinX()), h = Math.max(4, Math.round(B_FLAG * US * p.s)), cut = Scene.clipAt(PD);
              // the ground's line for a row: at the distance whose ground lies on it
              const rowCut = {}; const lineAt = y => { if (y <= p.y) return cut; if (rowCut[y] !== undefined) return rowCut[y];
                let d = PD; while (d > PD - 8 && Scene.proj(d, Scene.pinX()).y < y) d -= 0.02; return rowCut[y] = Scene.clipAt(d); };
              let total = 0;
              for (const q of [0.1, 0.35, 0.6, 0.9, 1.05]) {
                Scene.t = 30; Scene.cupT = 30 - q * CUP_FX_DUR; blank(); Scene.drawCupFx();
                const a = px(); let n = 0, out = 0, under = 0, big = 0;
                for (let i = 0; i < a.length; i += 4) {
                  if (a[i] === 1 && a[i + 1] === 2 && a[i + 2] === 3) continue;
                  n++;
                  const x = (i / 4) % VW, y = Math.floor(i / 4 / VW);
                  if (Math.abs(x - p.x) > h * 0.9 + 2 || y < p.y - h * 0.75 - 2 || y > p.y + h * 0.4 + 2) out++;
                  // (the cheaper balls' inside a smaller box)
                  if (small && (Math.abs(x - p.x) > h * 0.55 + 2 || y < p.y - h * 0.6 - 2 || y > p.y + h * 0.2 + 2)) { if (!big) o.bx = ' (h ' + h + ', at ' + (x - p.x).toFixed(1) + ',' + (y - p.y) + ')'; big++; }
                  if (y > lineAt(y) + 1) under++;
                }
                const where = id + ' hole ' + hh + ' from ' + at.toFixed(0) + ' at ' + q;
                if (q >= 1 && n) f(where + ': ' + n + ' pixels still there after ' + CUP_FX_DUR + 's');
                if (!has && n) f(where + ': a plain wake drew ' + n + ' pixels in the cup');
                if (big) f(where + ': ' + big + ' pixels outside the smaller box of a cheaper ball' + o.bx);
                if (out) f(where + ': ' + out + ' pixels outside the box about the cup');
                if (under) f(where + ': ' + under + ' pixels under the ground\'s line');
                total += n;
              }
              if (has) {
                o.px[id] = (o.px[id] || 0) + total;
                if (at === PD - 5 && p.y <= cut + 1 && total < (top ? 60 : 20)) f(id + ' hole ' + hh + ': only ' + total + ' pixels from beside the green');
              }
            }
          }
        }
        // the pin stands in it: the frame puts the moment down before the pin
        {
          const order = [], kf = Scene.drawFlagstick, kc = Scene.drawCupFx;
          Scene.drawFlagstick = function () { order.push('pin'); return kf.apply(this, arguments); };
          Scene.drawCupFx = function () { order.push('cup'); return kc.apply(this, arguments); };
          try { S.trail = 'godlight'; Scene.cupT = Scene.t - 0.1; Scene.draw(0, derive()); } finally { Scene.drawFlagstick = kf; Scene.drawCupFx = kc; }
          if (order.join(' ') !== 'cup pin') f('the frame draws ' + order.join(' then ') + ', not the moment then the pin');
        }
        // the hole holds for the whole moment with these balls, and no longer
        // than before with any other (a fast bag's next hole came at 0.3s)
        {
          const hold = (id, age) => { S.trail = id; QUIET = false; Scene.hole = S.hole; Scene.isle = null; Scene.camD = Scene.pinD(); Scene.t = 50;
            Scene.upT = 48; Scene.cupT = 50 - age; Scene.drawnAt = performance.now(); const w = Scene.holeWait(); QUIET = true; return w; };
          // (every ball now holds CUP_HOLD, for the score to be read; the
          // moment fits inside it)
          if (!(CUP_HOLD >= CUP_FX_DUR)) f('the hold after the drop, ' + CUP_HOLD + 's, is shorter than the moment in the cup');
          if (!hold('godlight', CUP_FX_DUR - 0.05) || hold('godlight', CUP_HOLD + 0.01)) f('with Godlight the hole does not hold for the moment in the cup, or holds on after it');
          if (hold('classic', CUP_HOLD + 0.01)) f('with a plain ball the hole holds longer than ' + CUP_HOLD + 's after the drop');
        }
        // the Twilight Putt (the user asked): a putt that drops has the moment
        // too, with a dearest ball; a plain one draws nothing
        o.twi = {};
        for (const id of ['godlight', 'singularity', 'duck', 'plain']) {
          const fn = CUP_FX[id]; let calls = 0; if (fn) CUP_FX[id] = function () { calls++; return fn.apply(this, arguments); };
          try {
            hideSheet(); QUIET = false; delete S.dgnRun; S.styleOwn['t:' + id] = 1; S.trail = id;
            const d = B.DGN.find(x => x.id === 'twilight'); S.dgnKeys[d.id] = 3; setView('dgn'); startDgn(d); hideSheet();
            let drops = 0, was = 0;
            for (let i = 0; i < 60 * 25 && drops < 2 && S.dgnRun; i++) { const D = derive(); keep(1 / 60, D); Scene.draw(1 / 60, D);
              if (Scene.cupT && Scene.cupT !== was) { was = Scene.cupT; drops++; } }
            o.twi[id] = drops + '/' + calls;
            if (!drops) f('no putt dropped in the Twilight Putt with ' + id);
            else if (fn && id !== 'plain' && !calls) f(id + ': a putt dropped in the Twilight Putt with no moment in the cup');
            else if (id === 'plain' && CUP_FX.plain) f('a plain ball has a moment in the cup');
          } finally { if (fn) CUP_FX[id] = fn; delete S.dgnRun; QUIET = true; }
        }
        // the cheaper balls' moments are smaller than any of the dear balls'
        { const least = Math.min(...['godlight', 'demoneye', 'ascorb', 'singularity'].map(id => o.px[id] || 0));
          for (const id of SMALL) if (!((o.px[id] || 0) < least)) f(id + ' draws ' + o.px[id] + ' pixels, not fewer than the least of the dear balls (' + least + ')'); }
        if (rnd) f('the cup moment called Math.random ' + rnd + ' times');
      } finally {
        Scene.drawCupFx = of; Math.random = mr; window.step = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['pixels over ' + r.views + ' views and five moments: ' + JSON.stringify(r.px) + '; the plain wakes draw none; in the Twilight Putt (drops/moments drawn) ' + JSON.stringify(r.twi),
      'gone after 0.55s, all of it inside a pin-sized box about the cup, under the pin, over the ground\'s line; no Math.random'];
  }
};
