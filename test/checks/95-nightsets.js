/* The Dread and Psychedelic glow the more after dark (the user asked for
 * night versions of the two, "more glow after dark"), and so do the seven
 * Legendary skins, each with a haze of its own light round him (asked
 * for after them; no caddie of their own is drawn here):
 *
 *   - each drawn alone on a clear canvas, in every pose, the night adds
 *     pixels of its own: The Dread's grave-mist, will-o'-wisps and the
 *     light of his lantern and eyes; Psychedelic's glow paint and rising
 *     bubbles
 *   - his caddie glows too
 *   - by day, and in the Vault's cellar (night there is the cellar's, not
 *     the sky's), nothing of it is drawn
 */
'use strict';
module.exports = {
  name: 'nightsets',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], adds: {} }, f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const was = { night: Scene.night, run: S.dgnRun };
      try {
        hideSheet(); QUIET = true;
        const cv = document.createElement('canvas'); cv.width = 160; cv.height = 140;
        const c = cv.getContext('2d');
        const draw = (s, pose, night, run) => {
          Scene.night = night; S.dgnRun = run;
          const SP = showSprites(s), keep = {};
          for (const k of SHOW_KEYS) { keep[k] = SPRITE[k]; SPRITE[k] = SP[k]; }
          SHOWSET = s;
          try {
            c.clearRect(0, 0, 160, 140);
            const h = 58, ph = pose, spr = ph > 0.6 ? SPRITE.gFinish : SPRITE.gAddr, w = Math.round(h * spr.w / spr.h), x = 50, bot = 110, y = bot - h;
            if (pose < 0) { // the caddie alone
              const sc = Object.assign(Object.create(Scene), { t: 3.3, fairyMoveNow: () => null, fairyNow: () => null, fairyDy: () => 0, fairyCast: null });
              Scene.drawCaddie.call(sc, c, x + 40, y, w, h);
            } else paintGolfer(c, x, y, w, h, ph, 3.3, bot, false, 0, spr, [], undefined, false);
          } finally { SHOWSET = null; for (const k of SHOW_KEYS) SPRITE[k] = keep[k]; }
          const d = c.getImageData(0, 0, 160, 140).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
          return { n, d: Array.from(d) };
        };
        const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
        // (and the Legendary skins, given a night after them: no caddie of
        // their own drawn here)
        for (const s of ['dread', 'psyche', 'cyber', 'inferno', 'frost', 'storm', 'void', 'glitch', 'midas', 'disco']) for (const pose of FULL_SETS[s] ? [0, 0.3, 0.8, -1] : [0, 0.3, 0.8]) {
          const day = draw(s, pose, false, null), night = draw(s, pose, true, null), vault = draw(s, pose, true, { mode: 'floor' });
          const add = diff(day.d, night.d), where = s + (pose < 0 ? ' caddie' : ' at ' + pose);
          o.adds[where] = add;
          if (add < (pose < 0 ? 6 : 40)) f(where + ': night changes only ' + add + ' pixels');
          if (diff(day.d, vault.d)) f(where + ': in the Vault the night glow is drawn (' + diff(day.d, vault.d) + ' pixels)');
        }
        // and the others are left as they were (no glow of these on them)
        const dd = draw('divine', 0.3, false, null), dn = draw('divine', 0.3, true, null);
        o.divine = diff(dd.d, dn.d);
      } finally {
        Scene.night = was.night; S.dgnRun = was.run; SHOWSET = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    if (r.divine) throw new Error('the Divine changed ' + r.divine + ' pixels at night drawn alone');
    return ['pixels the night adds: ' + Object.entries(r.adds).map(([k, v]) => k + ' ' + v).join(', ')];
  }
};
