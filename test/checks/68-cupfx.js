/* The dearest balls' moment in the cup (the user asked, from the menu: the
 * three dearest balls do something of their own as they drop in the cup).
 *
 *   - Godlight, Demon Eye and the Ascended Orb each draw something as the
 *     ball drops (a frame against the same frame with nothing dropped);
 *     no other ball does
 *   - short and close: over by 0.55s, and nothing outside a box of the
 *     pin's own size about the cup
 *   - the pin stands in front of it: its pixels the same with and without
 *   - cut at the ground's line: nothing under it at the green's distance
 *   - the hole holds for the whole moment with these balls (the next hole
 *     came 0.3s after the drop on a fast bag), and no longer with others
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
        const balls = ['godlight', 'demoneye', 'ascorb', 'singularity', 'classic', 'comet', 'hearts'].filter(id => styleDef('t', id));
        if (balls.length < 5) f('the balls to try are missing: ' + balls.join(','));
        for (let hh = 2; hh <= 7; hh++) {
          S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); startHole(); Scene.announce = null; Scene.rain = false; Scene.night = false;
          for (const at of [LEN - 5, LEN - 14, 4]) {
            Scene.camD = at; Scene.walkTo = at; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.t = 30; o.views++;
            for (const id of balls) {
              S.styleOwn['t:' + id] = 1; S.trail = id;
              const top = ['godlight', 'demoneye', 'ascorb', 'singularity'].includes(id);
              // a frame of the hole first (it owns the clip line), then the
              // moment alone over a blank
              Scene.cupT = 0; Scene.draw(0, derive());
              // (where the frame left the camera)
              const p = Scene.proj(LEN, PIN_X), h = Math.max(4, Math.round(B_FLAG * US * p.s)), cut = Scene.clipAt(LEN);
              let total = 0;
              for (const q of [0.1, 0.35, 0.6, 0.9, 1.05]) {
                Scene.t = 30; Scene.cupT = 30 - q * CUP_FX_DUR; blank(); Scene.drawCupFx();
                const a = px(); let n = 0, out = 0, under = 0;
                for (let i = 0; i < a.length; i += 4) {
                  if (a[i] === 1 && a[i + 1] === 2 && a[i + 2] === 3) continue;
                  n++;
                  const x = (i / 4) % VW, y = Math.floor(i / 4 / VW);
                  if (Math.abs(x - p.x) > h * 0.9 + 2 || y < p.y - h * 0.75 - 2 || y > p.y + h * 0.4 + 2) out++;
                  if (y > cut + 1) under++;
                }
                const where = id + ' hole ' + hh + ' from ' + at.toFixed(0) + ' at ' + q;
                if (q >= 1 && n) f(where + ': ' + n + ' pixels still there after ' + CUP_FX_DUR + 's');
                if (!top && n) f(where + ': a plain ball drew ' + n + ' pixels in the cup');
                if (out) f(where + ': ' + out + ' pixels outside the box about the cup');
                if (under) f(where + ': ' + under + ' pixels under the ground\'s line');
                total += n;
              }
              if (top) {
                o.px[id] = (o.px[id] || 0) + total;
                if (at === LEN - 5 && p.y <= cut + 1 && total < 60) f(id + ' hole ' + hh + ': only ' + total + ' pixels from beside the green');
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
          const hold = (id, age) => { S.trail = id; QUIET = false; Scene.hole = S.hole; Scene.isle = null; Scene.camD = LEN; Scene.t = 50;
            Scene.upT = 48; Scene.cupT = 50 - age; Scene.drawnAt = performance.now(); const w = Scene.holeWait(); QUIET = true; return w; };
          if (!hold('godlight', 0.45) || hold('godlight', CUP_FX_DUR + 0.01)) f('with Godlight the hole does not hold for the moment in the cup, or holds on after it');
          if (hold('classic', 0.35)) f('with a plain ball the hole holds longer than 0.3s after the drop');
        }
        if (rnd) f('the cup moment called Math.random ' + rnd + ' times');
      } finally {
        Scene.drawCupFx = of; Math.random = mr; window.step = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['Godlight ' + r.px.godlight + ', Demon Eye ' + r.px.demoneye + ', Ascended Orb ' + r.px.ascorb + ', Singularity ' + r.px.singularity + ' pixels over ' + r.views + ' views and five moments; no other ball draws a pixel',
      'gone after 0.55s, all of it inside a pin-sized box about the cup, under the pin, over the ground\'s line; no Math.random'];
  }
};
