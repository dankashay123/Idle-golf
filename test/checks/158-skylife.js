/* Thunderstorms and airplanes (the user asked for both).
 *
 *   - a storm: on about one rainy hole in three, never a dry one or in a
 *     wager, the same each time; its sky darker than the rain's alone; a
 *     bolt now and then, drawn above the horizon only (the hills stand in
 *     front of its foot), with a flash over the whole frame; the thunder
 *     after it; the Guide counts a Thunderstorm
 *   - an airplane: up in about 60% of turns of the clock, never in the rain
 *     or a wager; drawn in the sky only, by day and at night; seen live,
 *     the Guide counts an Airplane */
'use strict';
module.exports = {
  name: 'skylife',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      const D = derive(), px = () => Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
      const shot = t => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = 0; Scene.draw(0, D); } return px(); };
      const lum = (d, y0, y1) => { let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = 0; x < VW; x++) { const i = (y * VW + x) * 4; s += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; n++; } return s / n; };
      try {
        // the rate: rainy holes only, about one in three, the same twice
        let wet = 0, st = 0;
        for (let h = 1; h <= 600; h++) {
          S.chaos = { n: h % 2 ? 'Crosswind' : 'Fair' }; Scene.newHole(h, S.tier);
          if (Scene.storm && !Scene.rain) f('a storm on a dry hole ' + h);
          if (Scene.rain) { wet++; if (Scene.storm) st++; const a = Scene.storm; Scene.newHole(h, S.tier); if (Scene.storm !== a) f('hole ' + h + ' stormy one time and not the next'); }
        }
        o.storm = st + ' of ' + wet;
        if (st / wet < 0.25 || st / wet > 0.42) f('storms on ' + st + ' of ' + wet + ' rainy holes');
        { STORM_FORCE = true; Scene.newDepthsHole({ id: 'cellar', floor: 1 }); if (Scene.storm) f('a storm in a wager'); STORM_FORCE = null; Scene.dFloor = null; }
        // drawn: darker, a bolt above the horizon, a flash
        STORM_FORCE = true; S.chaos = { n: 'Crosswind' }; Scene.newHole(S.hole, S.tier); Scene.announce = null;
        const h = Scene.hole, n = 3, t0 = n * STORM_GAP + hr(h * 7 + n, 995) * STORM_GAP * 0.6;
        const calm = shot(t0 - 2), lit = shot(t0 + 0.03), keepL = Scene.drawStormLight; Scene.drawStormLight = () => {}; const bolt = shot(t0 + 0.03), calm0 = shot(t0 - 2); Scene.drawStormLight = keepL;
        STORM_FORCE = false; Scene.newHole(S.hole, S.tier); Scene.announce = null; const rain = shot(t0 - 2); STORM_FORCE = true; Scene.newHole(S.hole, S.tier); Scene.announce = null;
        o.sky = [lum(calm, 0, Math.round(HORIZON * 0.5)), lum(rain, 0, Math.round(HORIZON * 0.5))].map(Math.round);
        if (!(o.sky[0] < o.sky[1] - 15)) f('the storm\'s sky ' + o.sky[0] + ' against the rain\'s ' + o.sky[1]);
        let bp = 0, below = 0; for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) { const i = (y * VW + x) * 4; if (bolt[i] > 235 && bolt[i + 1] > 235 && bolt[i + 2] > 240 && !(calm0[i] > 235 && calm0[i + 1] > 235)) { if (y <= HORIZON + 6) bp++; else below++; } }
        o.bolt = bp; if (bp < 15) f('the bolt drew ' + bp + ' pixels'); if (below) f(below + ' pixels of bolt below the horizon');
        o.flash = Math.round(lum(lit, HORIZON, VH) - lum(calm, HORIZON, VH)); if (o.flash < 12) f('the flash lit the course by ' + o.flash);
        // the thunder after it: heard once per bolt, as it comes
        // (the game's own sound tick, on a stand-in sound card, every sound
        // but the thunder hushed)
        { let heard = 0; const keepF = {}, keepC = Sfx.ctx, keepS = S.sound;
          for (const k in Sfx) if (typeof Sfx[k] === 'function' && k !== 'tick' && k !== 'on') { keepF[k] = Sfx[k]; Sfx[k] = () => {}; }
          Sfx.thunder = () => heard++; Sfx.ctx = { state: 'running', currentTime: 1 }; S.sound = 1; Sfx.boltN = undefined;
          QUIET = false; try { for (let t = t0 - 0.5; t < t0 + STORM_GAP * 2.2; t += 1 / 15) { Scene.t = t; Sfx.tick(1 / 15); } }
          finally { QUIET = true; Object.assign(Sfx, keepF); Sfx.ctx = keepC; S.sound = keepS; Sfx.boltN = undefined; }
          o.thunder = heard; if (heard < 1) f('no thunder after the bolts'); }
        if (!GUIDE.find(g => g.id === 'storm' && g.g === 'c')) f('no Thunderstorm on the Course shelf');
        if (!guideUrl('storm')) f('no picture for the Thunderstorm');
        // airplanes
        STORM_FORCE = null; let up = 0, all = 0;
        S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier);
        for (let t = 0; t < PLANE_GAP * 400; t += PLANE_GAP) { all++; for (let u = 0; u < PLANE_GAP; u += 2) { Scene.t = t + u; if (Scene.planeNow()) { up++; break; } } }
        o.plane = Math.round(up / all * 100); if (up / all < 0.45 || up / all > 0.75) f('an airplane in ' + o.plane + '% of turns');
        S.chaos = { n: 'Crosswind' }; Scene.newHole(S.hole, S.tier); { let any = 0; for (let t = 0; t < 2000; t += 3) { Scene.t = t; if (Scene.planeNow()) any++; } if (any) f('an airplane in the rain'); }
        PLANE_FORCE = true;
        for (const ch of ['Fair', 'Night Round']) {
          S.chaos = { n: ch }; Scene.newHole(S.hole, S.tier); Scene.announce = null;
          const a = shot(PLANE_DUR * 3 + PLANE_DUR * 0.5); PLANE_FORCE = false; const b = shot(PLANE_DUR * 3 + PLANE_DUR * 0.5); PLANE_FORCE = true;
          let n2 = 0, low = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { n2++; if (Math.floor(i / 4 / VW) > HORIZON) low++; }
          o[ch] = n2; if (n2 < (ch === 'Fair' ? 20 : 2)) f('the airplane drew ' + n2 + ' pixels (' + ch + ')'); if (low) f('the airplane below the horizon (' + ch + ')');
        }
        if (!GUIDE.find(g => g.id === 'plane' && g.g === 'c')) f('no Airplane on the Course shelf');
        if (!guideUrl('plane')) f('no picture for the Airplane');
        // seen live: the Guide counts it; in quiet (away), never
        S.guide = S.guide || {}; const p0 = S.guide.plane || 0, tw = window.toast; window.toast = () => {};
        try { S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); Scene.planeSeen = null; shot(PLANE_DUR * 7 + 9); const q0 = S.guide.plane || 0; if (q0 !== p0) f('an airplane counted while away');
          QUIET = false; Scene.planeSeen = null; Scene.t = PLANE_DUR * 7 + 9; Scene.draw(0, D); QUIET = true;
          if ((S.guide.plane || 0) !== p0 + 1) f('seen live, the Guide counted ' + ((S.guide.plane || 0) - p0) + ' airplanes'); } finally { window.toast = tw; }
      } finally { STORM_FORCE = null; PLANE_FORCE = null; QUIET = false; window.requestAnimationFrame = raf; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['storms on ' + r.o.storm + ' rainy holes, none dry or in a wager; the sky ' + r.o.sky.join(' against ') + ', the bolt ' + r.o.bolt + 'px above the horizon only, the flash +' + r.o.flash + ', thunder ' + r.o.thunder + ' times; an airplane in ' + r.o.plane + '% of turns, none in the rain, drawn ' + r.o.Fair + 'px by day and ' + r.o['Night Round'] + ' at night, in the sky only; the Guide counts each'];
  }
};
