/* The flag wet in the rain (the user picked it): darker, soaked, hanging a
 * row deeper and flapping at a third the pace; the pole darker with a sheen
 * on it, a drop now and then; none when dry, none on Golden Hour's gold flag,
 * none in a wager. Its switch (Wet flag) brings the rain.
 *
 *   - drawn alone at three sizes: wet cloth darker than dry, and deeper
 *   - over two seconds in the same wind, the wet flag changes frame at most
 *     half as often as the dry one
 *   - a dry hole's flag is the dry one; the switch on a fair hole rains */
'use strict';
module.exports = {
  name: 'wetflag',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, o = { rows: [] }, SNAP = JSON.stringify(S);
      const keep = { mtn: Scene.mtn, wind: Scene.wind, night: Scene.night, rain: Scene.rain, t: Scene.t };
      const draw = (s, t) => { const cv = document.createElement('canvas'); cv.width = 80; cv.height = 120; const c = cv.getContext('2d'); Scene.t = t; Scene.pinBody(c, { x: 20, y: 110, s });
        const d = c.getImageData(0, 0, 80, 120).data; let n = 0, lum = 0, top = 999, bot = -1;
        for (let y = 0; y < 120; y++) for (let x = 22; x < 80; x++) { const i = (y * 80 + x) * 4; if (d[i + 3] > 200 && d[i] > d[i + 1] + 40) { n++; lum += d[i] + d[i + 1] + d[i + 2]; top = Math.min(top, y); bot = Math.max(bot, y); } }
        return { n, lum: n ? lum / n : 0, h: bot - top + 1, key: n + ':' + top + ':' + bot }; };
      try {
        hideSheet(); Scene.mtn = null; Scene.wind = 0.5; Scene.night = false;
        for (const s of [2.5, 4, 6]) {
          WETFLAG_FORCE = false; const a = draw(s, 0.1); WETFLAG_FORCE = true; const b = draw(s, 0.1);
          o.rows.push(s + ': ' + Math.round(a.lum) + '/' + Math.round(b.lum) + ' ' + a.h + '/' + b.h + 'px');
          if (!(b.lum < a.lum - 60)) f('at ' + s + ' the wet flag not darker (' + Math.round(b.lum) + ' against ' + Math.round(a.lum) + ')');
          if (!(b.h > a.h)) f('at ' + s + ' the wet flag not deeper (' + b.h + ' against ' + a.h + ')');
        }
        const flaps = wet => { WETFLAG_FORCE = wet; let k = 0, last = null; for (let t = 0; t < 2; t += 0.01) { const q = draw(4, t).key; if (last !== null && q !== last) k++; last = q; } return k; };
        const fd = flaps(false), fw = flaps(true); o.flaps = fd + '/' + fw;
        if (!(fw <= fd * 0.5) || !fd) f('the wet flag flapped ' + fw + ' times to the dry one\'s ' + fd);
        // by the weather: dry on a fair hole, wet in the rain, gold never
        WETFLAG_FORCE = null; Scene.rain = 0; const dry = draw(4, 0.1); Scene.rain = 1; const rain = draw(4, 0.1);
        if (!(rain.lum < dry.lum - 60)) f('the flag not wet in the rain');
        Scene.mtn = { x: 0 }; const gold = draw(4, 0.1); Scene.mtn = null;
        if (gold.n && gold.h > dry.h) f('Golden Hour\'s flag wet');
        // the switch brings the rain
        { const keepC = S.chaos; S.chaos = { n: 'Fair' }; const P = SCENE_PINS.find(x => x.id === 'wetflag'); QUIET = false; const tw = window.toast; window.toast = () => {};
          try { DEV.pin('wetflag'); hideSheet(); if (!Scene.rain) f('the Wet flag switch on a fair hole, no rain'); DEV.pin('wetflag'); hideSheet(); } finally { window.toast = tw; QUIET = true; S.chaos = keepC; } if (P.get()) f('the switch left on'); }
      } finally { WETFLAG_FORCE = null; Object.assign(Scene, keep); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the flag wet in the rain, dry/wet brightness and depth ' + r.o.rows.join(', ') + '; frames changed in 2s dry/wet ' + r.o.flaps + '; dry on a fair hole, gold never wet; the switch brings rain'];
  }
};
