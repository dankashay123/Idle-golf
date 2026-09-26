/* Dawn and dusk (the user asked, as a setting, off by default: "some courses
 * are built for the day and some for night ... I don't want to force players
 * to only see night holes at night and day holes during the day").
 *
 *   - off by default, and off it changes nothing: the sky at six in the
 *     morning and seven in the evening is the sky at noon, pixel for pixel
 *   - on, the sky warms low down at dawn and dusk (more red than blue in
 *     the lower sky than at noon, and a low sun on the east side in the
 *     morning, the west in the evening); at noon it is the plain sky
 *   - never at night or in the rain: those skies are the same on or off
 *   - the clock never picks day or night: across forty holes, the weather
 *     (a Night Round among it) is the same at two in the morning and at two
 *     in the afternoon, with the setting on or off
 *   - the setting is a row in Settings that turns it on and off, and a
 *     broken value in a save is cleared on load
 */
'use strict';
module.exports = {
  name: 'dawn',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] };
      const f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = true;
        if (S.dawnDusk !== undefined) f('Dawn and Dusk is not off in a new save (' + S.dawnDusk + ')');
        const CH = n => Object.assign({}, B.CHAOS.find(x => x.n === n));
        // the sky as built for a hole, at an hour, with the setting on or off
        const sky = (hr, on, ch) => {
          HOUR_FORCE = hr; if (on) S.dawnDusk = 1; else delete S.dawnDusk;
          Scene.night = /Night/.test(ch); Scene.rain = /Rain|Storm|Squall/.test(ch) ? 1 : 0; Scene.aurora = false;
          Scene.skyKey = null; Scene.buildSky();
          const g = Scene.sky.getContext('2d');
          return g.getImageData(0, 0, Scene.sky.width, Scene.sky.height);
        };
        const same = (a, b) => { for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false; return true; };
        // red less blue, over the lower sky (below its middle)
        const warmth = (im, x0, x1) => { let t = 0, n = 0; const W = im.width, H = im.height;
          for (let y = Math.round(H * 0.5); y < H; y++) for (let x = Math.round(W * x0); x < Math.round(W * x1); x++) {
            const i = (y * W + x) * 4; t += im.data[i] - im.data[i + 2]; n++; }
          return t / n; };
        const sunPx = (im, x0, x1) => { let n = 0; const W = im.width, H = im.height;
          for (let y = 0; y < H; y++) for (let x = Math.round(W * x0); x < Math.round(W * x1); x++) {
            const i = (y * W + x) * 4; if (im.data[i] === 0xFF && im.data[i + 1] === 0xE7 && im.data[i + 2] === 0xA8) n++; }
          return n; };
        o.rows = [];
        for (const ci of [B.COURSE.findIndex(c => c.slot === 'home'), B.COURSE.findIndex(c => c.slot === 'event'), B.COURSE.length - 1]) {
          DEV.course(ci); hideSheet();
          const noon = sky(12, false, 'Fair');
          for (const hr of [6, 19]) if (!same(sky(hr, false, 'Fair'), noon)) f(Scene.course.n + ': the sky at ' + hr + ' changed with the setting off');
          if (!same(sky(12, true, 'Fair'), noon)) f(Scene.course.n + ': the setting on changed the sky at noon');
          const w0 = warmth(noon, 0, 1);
          const dawn = sky(6, true, 'Fair'), dusk = sky(19, true, 'Fair');
          const wa = warmth(dawn, 0, 1), wd = warmth(dusk, 0, 1);
          if (!(wa > w0 + 20) || !(wd > w0 + 20)) f(Scene.course.n + ': the low sky not warm at dawn or dusk (noon ' + w0.toFixed(0) + ', dawn ' + wa.toFixed(0) + ', dusk ' + wd.toFixed(0) + ')');
          const sa = [sunPx(dawn, 0, 0.5), sunPx(dawn, 0.5, 1)], sd = [sunPx(dusk, 0, 0.5), sunPx(dusk, 0.5, 1)];
          if (!(sa[0] > 8 && sa[1] === 0) || !(sd[1] > 8 && sd[0] === 0)) f(Scene.course.n + ': the sun not low in the east at dawn and the west at dusk (' + sa + ' / ' + sd + ')');
          for (const ch of ['Night Round', 'Rain']) for (const hr of [6, 19])
            if (!same(sky(hr, true, ch), sky(hr, false, ch))) f(Scene.course.n + ': the setting changed the sky on a ' + ch + ' at ' + hr);
          o.rows.push(Scene.course.n + ' ' + w0.toFixed(0) + '/' + wa.toFixed(0) + '/' + wd.toFixed(0));
        }
        // the clock never decides day or night
        const weathers = (hr, on) => { HOUR_FORCE = hr; if (on) S.dawnDusk = 1; else delete S.dawnDusk;
          const out = []; const h0 = S.hole;
          for (let k = 0; k < 40; k++) { S.hole = h0 + k * 3; startHole(); out.push((S.chaos ? S.chaos.n : '') + (Scene.night ? '*' : '')); }
          S.hole = h0; return out.join(','); };
        const base = weathers(14, false);
        o.nights = base.split(',').filter(x => x.indexOf('*') >= 0).length;
        for (const [hr, on] of [[2, false], [2, true], [14, true], [6, true], [19, true]])
          if (weathers(hr, on) !== base) f('the weather or the night changed with the clock at ' + hr + (on ? ' with the setting on' : ''));
        // the row in Settings, and a broken save
        delete S.dawnDusk; QUIET = false; settingsSheet();
        const rowBtn = () => [...document.querySelectorAll('#sheet .setrow')].find(r => r.querySelector('.nm').textContent === 'Dawn and Dusk');
        if (!rowBtn()) f('no Dawn and Dusk row in Settings');
        else {
          if (rowBtn().querySelector('button').textContent !== 'Off') f('the row does not read Off in a new save');
          rowBtn().querySelector('button').click();
          if (S.dawnDusk !== 1 || rowBtn().querySelector('button').textContent !== 'On') f('the row did not turn it on');
          rowBtn().querySelector('button').click();
          if (S.dawnDusk !== undefined) f('the row did not turn it off');
        }
        hideSheet(); QUIET = true;
        const saved = JSON.parse(JSON.stringify(S)); saved.dawnDusk = 'yes';
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, saved); initState();
        if (S.dawnDusk !== undefined) f('a broken setting in a save was kept: ' + S.dawnDusk);
      } finally {
        HOUR_FORCE = null; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        Scene.skyKey = null; Scene.buildSky();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['off by default and changes nothing; on, the low sky warms (red less blue, noon/dawn/dusk: ' + r.rows.join(', ') + ') with a low sun east then west; the same at noon, at night and in the rain',
      'forty holes play the same weather at 2am and 2pm, on or off (' + r.nights + ' of them at night); a row in Settings turns it on and off; a broken save is cleared'];
  }
};
