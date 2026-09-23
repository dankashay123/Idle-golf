/* Every course, every weather, every Depths floor draws without throwing, and
 * the ground pass stays inside the frame budget. Themes are authored as literal
 * tables in places, so a colour the renderer newly depends on can be missing on
 * one course and one course only -- which is exactly how the Depths went down
 * once before.
 *
 * And nothing draws a hard line across the frame. The sky ends and the ground
 * begins at the horizon, and for a long time they met at full saturation with
 * a one row step between them; the haze that was supposed to soften it faded
 * IN over a fraction of the buffer height and OUT over a world distance, two
 * things that do not scale together, so on a tall buffer it collapsed into a
 * bar of its own. Both read as a hazy line ruled across the middle of the
 * screen, and the haze one cut through the trees because it goes down after
 * them. */
'use strict';
const BUDGET_MS = 8;                      // half a 60fps frame, all to the ground
module.exports = {
  name: 'render',
  async run(page, ctx) {
    let rows = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      if (!window.__t) {
        window.__t = [];
        const og = Scene.drawGround;
        Scene.drawGround = function () {
          const t0 = performance.now(); const r = og.apply(this, arguments);
          window.__t.push(performance.now() - t0); return r;
        };
      }
      // The second slowest of the last sixteen frames, not the slowest. The
      // slowest failed once at 12.9ms on sandbelt/rain against a worst of
      // 3-3.6ms on reruns: one browser pause landing in one of 960 samples.
      // A ground that is slow every frame still fails on the second slowest;
      // a single stall no longer does.
      const take = () => { const a = window.__t.slice(-16).sort((x, y) => y - x); window.__t = [];
        return a.length ? (a[1] !== undefined ? a[1] : a[0]) : 0; };
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
      // and the seam: no row anywhere near the horizon may step hard across
      // the whole width. Measured on the buffer, where one row is one row.
      window.__seam = [];
      for (let i = 0; i < B.COURSE.length; i++) {
        DEV.course(i); hideSheet();
        for (const mode of ['day', 'night']) {
          Scene.night = mode === 'night'; Scene.rain = false;
          Scene.themeId = ''; Scene.theme = buildTheme(Scene.course, mode);
          Scene.skyKey = ''; Scene.hazeKey = ''; Scene.ridgeKey = ''; Scene.woodKey = '';
          await sleep(320);
          const px = Scene.b.getImageData(0, 0, VW, VH).data;
          const avg = y => { let r = 0, g = 0, b = 0;
            for (let x = 0; x < VW; x++) { const j = (y*VW + x)*4; r += px[j]; g += px[j+1]; b += px[j+2]; }
            return [r/VW, g/VW, b/VW]; };
          // a band either side of the line, where a seam or a haze edge lands
          const lo = Math.max(1, HORIZON - Math.round(VH*0.06));
          const hi = Math.min(VH - 1, HORIZON + Math.round(VH*0.22));
          let worstRow = 0, worstY = 0;
          let prev = avg(lo - 1);
          for (let y = lo; y <= hi; y++) {
            const a = avg(y);
            const d = Math.abs(a[0]-prev[0]) + Math.abs(a[1]-prev[1]) + Math.abs(a[2]-prev[2]);
            if (d > worstRow) { worstRow = d; worstY = y; }
            prev = a;
          }
          window.__seam.push({ what: B.COURSE[i].id + '/' + mode,
            step: +worstRow.toFixed(1), y: worstY, horizon: HORIZON });
        }
      }

      for (const d of B.DGN) {
        setView('dgn'); startDgn(d); await sleep(500); take(); await sleep(200);
        out.push({ what: 'depths/' + d.id, ms: +take().toFixed(2) });
      }
      return { out, seam: window.__seam };
    });
    const seam = rows.seam; rows = rows.out;
    const worst = rows.reduce((a, b) => (b.ms > a.ms ? b : a));
    if (worst.ms > BUDGET_MS)
      throw new Error('ground pass ' + worst.ms + 'ms on ' + worst.what + ', budget ' + BUDGET_MS + 'ms');
    if (ctx.shots) {
      const el = await page.$('#stage');
      if (el) await el.screenshot({ path: ctx.shots + '/render.png' });
    }
    // 35 is roughly what one band of the dithered sky steps by, so anything
    // over 60 across the full width is a ruled line and not terrain.
    const SEAM_MAX = 60;
    const badSeam = seam.filter(s2 => s2.step > SEAM_MAX);
    if (badSeam.length)
      throw new Error('a hard line runs across the frame on '
        + badSeam.map(s2 => s2.what + ' (row ' + s2.y + ', horizon ' + s2.horizon
          + ', steps ' + s2.step + ')').join(', ')
        + '. Nothing at the horizon should read as a rule drawn across the screen.');
    const worstSeam = seam.reduce((a, b) => (b.step > a.step ? b : a));

    const avg = rows.reduce((n, r) => n + r.ms, 0) / rows.length;
    return [rows.length + ' scenes, ground pass worst ' + worst.ms + 'ms ('
            + worst.what + '), avg ' + avg.toFixed(2) + 'ms',
            'worst horizon step ' + worstSeam.step + ' of ' + SEAM_MAX
            + ' on ' + worstSeam.what];
  }
};
