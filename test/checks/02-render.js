/* Every course, every weather, every Depths floor draws without throwing, and
 * the ground pass stays inside the frame budget. Themes are authored as literal
 * tables in places, so a colour the renderer newly depends on can be missing on
 * one course and one course only -- which is exactly how the Depths went down
 * once before. */
'use strict';
const BUDGET_MS = 8;                      // half a 60fps frame, all to the ground
module.exports = {
  name: 'render',
  async run(page, ctx) {
    const rows = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      if (!window.__t) {
        window.__t = [];
        const og = Scene.drawGround;
        Scene.drawGround = function () {
          const t0 = performance.now(); const r = og.apply(this, arguments);
          window.__t.push(performance.now() - t0); return r;
        };
      }
      const take = () => { const a = window.__t.slice(-16); window.__t = [];
        return a.length ? Math.max.apply(null, a) : 0; };
      const out = [];
      for (let i = 0; i < B.COURSE.length; i++) {
        DEV.course(i); hideSheet();
        for (const mode of ['day', 'night', 'rain']) {
          Scene.night = mode === 'night'; Scene.rain = mode === 'rain';
          Scene.themeId = ''; Scene.theme = buildTheme(Scene.course, mode);
          Scene.skyKey = ''; Scene.hazeKey = ''; Scene.ridgeKey = ''; Scene.woodKey = '';
          Scene.camD = Scene.holeLen() * 0.4;
          // The first frames after a switch rebuild the sky, the haze, the
          // ridge and the wood, so they are not what the game costs to run.
          // Let those land, throw the samples away, then measure.
          await sleep(260); take(); await sleep(200);
          out.push({ what: B.COURSE[i].id + '/' + mode, ms: +take().toFixed(2) });
        }
      }
      for (const d of B.DGN) {
        setView('dgn'); startDgn(d); await sleep(500); take(); await sleep(200);
        out.push({ what: 'depths/' + d.id, ms: +take().toFixed(2) });
      }
      return out;
    });
    const worst = rows.reduce((a, b) => (b.ms > a.ms ? b : a));
    if (worst.ms > BUDGET_MS)
      throw new Error('ground pass ' + worst.ms + 'ms on ' + worst.what + ', budget ' + BUDGET_MS + 'ms');
    if (ctx.shots) {
      const el = await page.$('#stage');
      if (el) await el.screenshot({ path: ctx.shots + '/render.png' });
    }
    const avg = rows.reduce((n, r) => n + r.ms, 0) / rows.length;
    return [rows.length + ' scenes, ground pass worst ' + worst.ms + 'ms ('
            + worst.what + '), avg ' + avg.toFixed(2) + 'ms'];
  }
};
