/* The ball lying, and the far hills turning (the user, from the phone):
 *
 *   - the ball lying ahead of him goes down before him ("when approaching
 *     a ball, it clips through the player"): the frame draws it first
 *   - every ball lying is more than a square: a lit ball, and the dear
 *     ones something going round them; the Divine's (Godlight) and its
 *     wake with a ribbon of jade and a ribbon of gold about it, outside the
 *     ball itself
 *   - the ranges far off slide a little as the hole bends ("the horizon
 *     view would move slightly ... when turning"): not at all on the tee,
 *     never past their margin, and a few pixels at most
 */
'use strict';
module.exports = {
  name: 'ballrest',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], ribbon: {}, maxShift: 0, bent: 0 }, step0 = window.step;
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {}; FROST_FORCE = 0;
        DEV.course(0); hideSheet(); S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); Scene.newHole(S.hole, S.tier); Scene.announce = null;
        // the order: the ball lying, then him
        { const order = [], kr = Scene.drawRestBall, kg = Scene.drawGolfer;
          Scene.drawRestBall = function () { order.push('ball'); return kr.apply(this, arguments); };
          Scene.drawGolfer = function () { order.push('him'); return kg.apply(this, arguments); };
          try { Scene.camD = 20; Scene.walkTo = 30; Scene.restBall = { d: 21, lat: 0 }; Scene.balls = []; Scene.draw(1 / 60, derive()); }
          finally { Scene.drawRestBall = kr; Scene.drawGolfer = kg; Scene.restBall = null; }
          if (order.join(' ') !== 'ball him') f('the frame draws ' + order.join(' then ') + ', not the ball lying and then him'); }
        // the balls lying
        const W = 30, cv = document.createElement('canvas'); cv.width = W; cv.height = W; const g = cv.getContext('2d');
        const look = (id, r, t) => { g.fillStyle = '#010203'; g.fillRect(0, 0, W, W); drawLyingBall(g, W / 2, W / 2, r, t); g.globalAlpha = 1;
          const a = g.getImageData(0, 0, W, W).data, P = []; for (let i = 0; i < a.length; i += 4) if (!(a[i] === 1 && a[i + 1] === 2 && a[i + 2] === 3)) P.push([(i / 4) % W, Math.floor(i / 4 / W), a[i], a[i + 1], a[i + 2]]); return P; };
        for (const id of ['plain', 'godlight', 'seraph', 'demoneye', 'ascorb', 'singularity', 'duck', 'comet', 'gold']) {
          S.styleOwn['t:' + id] = 1; const d = styleDef('t', id); if (d.cat === 'ball') { S.ball = id; S.trail = 'plain'; } else { S.ball = null; S.trail = id; }
          const P = look(id, 3.5, 30.3);
          if (P.length < 30) f(id + ' lying is only ' + P.length + ' pixels');
          const tones = new Set(P.map(p => p.slice(2).join())); if (tones.size < (id === 'plain' ? 3 : 4)) f(id + ' lying is ' + tones.size + ' colours: a flat square');
          if (id === 'godlight' || id === 'seraph') { let jade = 0, gold = 0;
            for (let k = 0; k < 6; k++) for (const [x, y, R, G, B2] of look(id, 3.5, 30 + k * 0.4)) { if (Math.hypot(x + 0.5 - W / 2, y + 0.5 - W / 2) < 4.5) continue;
              if (G > R && G > B2 * 0.9 && G > 120) jade++; if (R > 180 && G > 120 && B2 < 140) gold++; }
            o.ribbon[id] = jade + '/' + gold;
            if (jade < 20 || gold < 20) f(id + ': the ribbons about it, jade ' + jade + ' and gold ' + gold + ' pixels outside the ball over six moments'); }
        }
        // the ranges far off, down every hole of a round
        const first = S.hole;
        for (let hn = 1; hn <= 18; hn++) { S.hole = first + hn - 1; Scene.newHole(S.hole, S.tier);
          const sh = d => { Scene.camD = d; let x = null; const c = Scene.b, kd = c.drawImage;
            c.drawImage = function (img, dx) { if (img === Scene.ridge) x = dx; return kd.apply(this, arguments); };
            try { Scene.drawRidge(); } finally { c.drawImage = kd; } return x + (Scene.ridgeM || 0); };
          if (sh(0) !== 0) f('hole ' + hn + ': the ranges shifted ' + sh(0) + ' on the tee');
          for (let d = 0; d <= Scene.pinD(); d += 2) { const v = sh(d); o.maxShift = Math.max(o.maxShift, Math.abs(v)); if (v) o.bent++;
            if (Math.abs(v) > Math.min(Scene.ridgeM, 8)) f('hole ' + hn + ' at ' + d + ': the ranges slid ' + v + ' pixels'); }
        }
        if (!o.bent) f('the ranges never slid on a bent hole');
      } finally {
        window.step = step0; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the ball lying goes down before him; every ball lying is lit, the Divine\'s ribbons (jade/gold pixels) ' + JSON.stringify(r.ribbon),
      'the ranges slide as the hole bends, ' + r.maxShift + ' pixels at the most, none on the tee (' + r.bent + ' places turned)'];
  }
};
