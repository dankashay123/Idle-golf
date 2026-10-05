/* The developer menu's Scenery Switches (the user: "an on/off switch ... I
 * want to be able to turn on the steam and keep it on until I can see it
 * and test it repeatedly"): each switch pins its thing on over every hole
 * it can show on, until switched off, and a reload keeps it.
 *
 *   - the section is drawn, a button a switch, the lit ones marked
 *   - each switch turns its thing on and off again
 *   - on holds over holes: steam pinned shows on the water at 3pm in summer
 *     (when it never would), balloons at 3pm, a storm brings its rain, the
 *     Lucky Albatross comes again at once
 *   - kept: a reload (the switches read back) keeps them, and only in a
 *     developer copy; "all off" clears them */
'use strict';
module.exports = {
  name: 'devpins',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const keepH = HOUR_FORCE; let keepLS = null; try { keepLS = localStorage.getItem(KEY + ':pins'); } catch (e) {}
      QUIET = true;
      try {
        hideSheet(); DEV._open = { pins: 1 }; QUIET = false; const tw = window.toast; window.toast = () => {}; DEV.open();
        const btns = [...document.querySelectorAll('details[data-f="pins"] button')].filter(b => /DEV\.pin\(/.test(b.getAttribute('onclick') || ''));
        o.n = btns.length; if (btns.length !== SCENE_PINS.length) f(btns.length + ' switches drawn for ' + SCENE_PINS.length);
        // each on and off
        for (const P of SCENE_PINS) { DEV.pin(P.id); if (!P.get()) f(P.n + ' does not switch on');
          const lit = [...document.querySelectorAll('details[data-f="pins"] button.devon')].some(b => (b.getAttribute('onclick') || '').includes("'" + P.id + "'"));
          if (!lit) f(P.n + ' on, its button not lit');
          DEV.pin(P.id); if (P.get()) f(P.n + ' does not switch off'); }
        QUIET = true; window.toast = tw; hideSheet();
        // a switch does not start the hole over (it put the yards back and
        // paid a milestone's fee again)
        { S.yards = S.yardsMax * 0.37; const y0 = S.yards, g0 = S.gold, sv0 = S.sov; QUIET = false; window.toast = () => {};
          try { DEV.pin('steam'); DEV.pin('steam'); } finally { QUIET = true; window.toast = tw; hideSheet(); }
          if (S.yards !== y0 || S.gold !== g0 || S.sov !== sv0) f('a switch moved the hole on: yards ' + y0 + ' to ' + S.yards + ', purse ' + g0 + ' to ' + S.gold + ', sovereigns ' + sv0 + ' to ' + S.sov); }
        // held over holes, whatever the hour and season
        HOUR_FORCE = 15; SEASON_FORCE = 0;
        DEV.pin('steam'); DEV.stones(); hideSheet();
        let st = 0; for (let k = 0; k < 3; k++) { Scene.newHole(S.hole, S.tier); st += Scene.props.filter(p => p.sp === 'steam').length; }
        if (!st) f('steam pinned, none on the stones\' river at 3pm in summer');
        DEV.pin('steam');
        DEV.pin('balloon'); S.chaos = { n: 'Fair' }; let bl = 0; for (let h = S.hole; h < S.hole + 6; h++) { Scene.newHole(h, S.tier); if (Scene.balloons) bl++; } DEV.pin('balloon');
        if (bl < 6) f('balloons pinned on ' + bl + ' of 6 holes at 3pm');
        DEV.pin('storm'); S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); if (!Scene.storm || !Scene.rain) f('a storm pinned on a fair hole: storm ' + Scene.storm + ', rain ' + Scene.rain); DEV.pin('storm');
        DEV.pin('alb'); LUCKY.a = null; LUCKY.wait = 500; QUIET = false; albTick(Scene.b, 0.1); QUIET = true; if (!(LUCKY.wait <= 2)) f('the albatross pinned waits ' + LUCKY.wait.toFixed(0) + 's'); DEV.pin('alb'); LUCKY.a = null;
        SEASON_FORCE = -1; STONES_FORCE = 0;
        // kept over a reload, a developer copy only
        DEV.pin('steam'); DEV.pin('plane');
        PSTEAM_FORCE = null; PLANE_FORCE = null; pinsLoad();
        if (PSTEAM_FORCE !== true || PLANE_FORCE !== true) f('read back, steam ' + PSTEAM_FORCE + ', planes ' + PLANE_FORCE);
        PSTEAM_FORCE = null; PLANE_FORCE = null; DEV_OFF = true; try { pinsLoad(); } finally { DEV_OFF = false; }
        if (PSTEAM_FORCE !== null || PLANE_FORCE !== null) f('a player\'s copy read the switches back');
        DEV.pinsOff(); if (SCENE_PINS.some(P => P.get())) f('all off left ' + SCENE_PINS.filter(P => P.get()).map(P => P.n).join(', '));
        PSTEAM_FORCE = null; PLANE_FORCE = null; pinsLoad(); if (SCENE_PINS.some(P => P.get())) f('all off, a reload brought some back');
      } finally {
        for (const P of SCENE_PINS) P.set(false); HOUR_FORCE = keepH; SEASON_FORCE = -1; STONES_FORCE = 0; DEV_OFF = false;
        try { if (keepLS === null) localStorage.removeItem(KEY + ':pins'); else localStorage.setItem(KEY + ':pins', keepLS); } catch (e) {}
        hideSheet(); QUIET = false; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier);
      }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.o.n + ' switches, each on (lit) and off; held over holes at any hour (steam, balloons), a storm brings rain, the albatross comes again; kept over a reload in a developer copy only; all off clears them'];
  }
};
