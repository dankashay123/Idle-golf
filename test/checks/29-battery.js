/* What a frame costs a phone. The game draws sixty times a second for as long
 * as it is open, so anything wasted in a frame is battery gone for nothing.
 * Measured on a page the size of an iPhone at three device pixels a point:
 *
 *   - the ground is painted by the pixel and stamped once, and it is the same
 *     picture, to the pixel, as painting it on the canvas rect by rect: every
 *     course, day, night and rain, from tee to green, every Depths floor, and
 *     again when it is reused while he stands still (with the pond ripples
 *     still moving), and not reused once the camera or the colours move. It was two and a half thousand separate canvas fills a
 *     frame, the dearest thing the game did
 *   - a frame on the course sends the canvas under a thousand calls
 *   - the canvas on the page is the size of the picture, blown up by whole
 *     pixels by the browser. It was the size of the screen, and the picture
 *     was enlarged into it by hand every frame: 1.4 million pixels on an
 *     iPhone, redrawn sixty times a second to show 160 thousand
 *   - the live numbers leave the page alone when nothing has changed. They
 *     were written every frame whether or not they had changed, and each
 *     write made the browser lay the text out again
 */
'use strict';
const MAX_CALLS = 1000;
module.exports = {
  name: 'battery',
  dsf: 3,
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S);
      const o = { scenes: 0, bad: [] };
      try {
        hideSheet();
        const c = Scene.b;
        const shot = pix => {
          Scene.pixGround = pix; c.setTransform(1, 0, 0, 1, 0, 0);
          c.fillStyle = '#123456'; c.fillRect(0, 0, VW, VH);
          Scene.drawGround(); return c.getImageData(0, 0, VW, VH).data;
        };
        const same = (a, b) => { let n = 0; for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) n++; return n; };
        // painted by the pixel, fresh and reused, against painted rect by rect
        const compare = what => {
          const t0 = Scene.t;
          const byRect = shot(false), fresh = shot(true);
          Scene.t = t0 + 0.37;                       // the ripples move on
          const byRect2 = shot(false);
          shot(true); Scene.t = t0 + 0.37;
          const reused = shot(true);                 // nothing moved but time
          Scene.t = t0;
          const d1 = same(byRect, fresh), d2 = same(byRect2, reused);
          o.scenes++;
          if (d1 || d2) o.bad.push(what + ' (' + d1 + ' fresh, ' + d2 + ' reused)');
        };
        for (let i = 0; i < B.COURSE.length; i++) {
          DEV.course(i); hideSheet();
          for (const mode of ['day', 'night', 'rain']) for (const at of [0, 0.35, 0.7, 0.97]) {
            Scene.night = mode === 'night'; Scene.rain = mode === 'rain';
            Scene.theme = buildTheme(Scene.course, mode); Scene.woodKey = '';
            Scene.camD = Scene.holeLen() * at; Scene.t = i + at * 3;
            compare(B.COURSE[i].id + '/' + mode + ' at ' + at);
          }
        }
        // is the reuse let go the moment he moves?
        Scene.camD = 10; shot(true); Scene.camD = 14;
        const after = shot(true), moved = same(shot(false), after);
        if (moved) o.bad.push('a field reused after the camera moved (' + moved + ' pixels)');
        // or after its palette was recoloured in place
        const T = Scene.theme, keepFw = T._fw;
        shot(true); T._fw = T._fw.map(() => '#ff00ff');
        const recol = shot(true), recolled = same(shot(false), recol);
        T._fw = keepFw;
        if (recolled) o.bad.push('a field reused after its colours changed (' + recolled + ' pixels)');
        // the Depths floors
        for (const dg of B.DGN) {
          const R = { id: dg.id, floor: 0, work: 5, full: 10, mode: 'floor', t: 0, dur: 30, cleared: 0, log: [] };
          Scene.newDepthsHole(R); Scene.camD = 20;
          compare('Depths ' + dg.id);
        }
        Scene.pixGround = true;

        // a frame on the course, counted
        DEV.course(6); hideSheet();
        Scene.night = false; Scene.rain = false; Scene.theme = buildTheme(Scene.course, 'day');
        const P = CanvasRenderingContext2D.prototype, orig = {};
        let calls = 0;
        for (const k of Object.getOwnPropertyNames(P)) {
          const d = Object.getOwnPropertyDescriptor(P, k);
          if (typeof d.value !== 'function') continue;
          orig[k] = d.value; P[k] = function () { calls++; return orig[k].apply(this, arguments); };
        }
        try { Scene.camD = 12; Scene.draw(1 / 60, derive()); calls = 0; Scene.camD = 12.5; Scene.draw(1 / 60, derive()); }
        finally { for (const k in orig) P[k] = orig[k]; }
        o.calls = calls;

        // words on the field are baked whole and laid down in one; the same
        // picture as setting them a letter at a time, shadow and all
        // each letter where the one before it ends: the small face is
        // proportional, so a letter's place is the sum of those before it
        const byLetter = (cx, str, x, y, col, sc, shadow) => {
          const f = faceOf(sc);
          const adv = i => { let w = 0; for (let j = 0; j < i; j++) w += glyphW(str[j], f) + faceGap(f); return w; };
          const put = (c2, x0, y0) => { for (let i = 0; i < str.length; i++) if (str[i] !== ' ')
            cx.drawImage(glyphCv(str[i], c2, sc), x0 + adv(i) * sc, y0); };
          if (shadow) put('rgba(8,13,10,.75)', x + sc, y + sc); put(col, x, y); };
        const tc = document.createElement('canvas'); tc.width = 240; tc.height = 40; const tg = tc.getContext('2d');
        const px = f => { tg.fillStyle = '#3A7A40'; tg.fillRect(0, 0, 240, 40); f(); return tg.getImageData(0, 0, 240, 40).data; };
        o.text = 0; o.textN = 0;
        for (const [str, col, sc, sh] of [['8 MPH >>', '#F4F6EF', 1, 1], ['LEY SURGE', '#E3B457', 2, 1], ['NICE!', '#57E0BE', 1, 0], ['-1S', '#FFD66B', 3, 1]]) {
          const a = px(() => byLetter(tg, str, 4, 4, col, sc, sh)), bb = px(() => (sh ? drawTextS : drawText)(tg, str, 4, 4, col, sc));
          o.textN++; for (let k = 0; k < a.length; k++) if (a[k] !== bb[k]) { o.text++; break; }
        }

        // the canvas on the page
        const cv = $('hole'), dpr = devicePixelRatio;
        o.canvas = { w: cv.width, h: cv.height, VW, VH, css: cv.getBoundingClientRect().width, scale: Scene.scale, dpr,
                     stage: $('stage').getBoundingClientRect().width };

        // the live numbers, written twice with nothing changed in between
        const D = derive(); renderLive(D);
        const muts = [];
        const mo = new MutationObserver(() => {});
        mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
        renderLive(D);
        // taken at once, so a real frame of the game cannot land in between
        o.muts = muts.concat(mo.takeRecords().map(m => m.type + ' ' + (m.target.id || (m.target.parentNode || {}).id || '?')));
        mo.disconnect();
      } finally {
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        Scene.pixGround = true; QUIET = false; startHole();
      }
      return o;
    });
    if (r.bad.length)
      throw new Error('the ground painted by the pixel is not the ground painted rect by rect in '
        + r.bad.length + ' of ' + r.scenes + ' scenes: ' + r.bad.slice(0, 6).join('; '));
    if (!(r.calls > 50 && r.calls < MAX_CALLS))
      throw new Error('a frame on the course made ' + r.calls + ' canvas calls (the field is meant to go in one stamp; '
        + 'under ' + MAX_CALLS + ')');
    if (r.text) throw new Error(r.text + ' of ' + r.textN + ' words baked whole differ from the same words set a letter at a time');
    const C = r.canvas;
    if (C.w !== C.VW || C.h !== C.VH)
      throw new Error('the canvas on the page is ' + C.w + 'x' + C.h + ' for a ' + C.VW + 'x' + C.VH + ' picture');
    if (Math.abs(C.css - C.w * C.scale / C.dpr) > 0.01 || C.css < C.stage - 0.01)
      throw new Error('the picture is shown ' + C.css + 'px wide: not ' + C.scale + ' device pixels to one of its own, '
        + 'or short of the ' + C.stage + 'px stage');
    // a picture exactly 300 wide, the width a new canvas starts at, from its
    // first frame: the fade row never got its context and every frame threw
    await page.setViewportSize({ width: 302, height: 700 });
    await page.waitForTimeout(250);
    const w300 = await page.evaluate(async () => {
      Scene._fadeRow = null; frameErr = 0;
      await new Promise(r => setTimeout(r, 300));
      return { VW, err: frameErr };
    });
    if (w300.VW !== 300) throw new Error('the 300 wide case came out ' + w300.VW + ' wide, so it measured nothing');
    if (w300.err) throw new Error('with a picture 300 wide the frame threw');
    // and the picture covers the stage when the stage is a fraction of a
    // pixel wide, as it is on a phone on its side
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    const cover = await page.evaluate(() => {
      const c = $('hole').getBoundingClientRect(), st = $('stage').getBoundingClientRect();
      return { right: +(c.right - st.right).toFixed(3), bottom: +(c.bottom - st.bottom).toFixed(3), stage: st.width };
    });
    if (cover.right < -0.01 || cover.bottom < -0.01)
      throw new Error('on its side the picture stops short of the ' + cover.stage + 'px stage by '
        + (-cover.right) + 'px on the right and ' + (-cover.bottom) + 'px at the bottom: a sliver of dark shows');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(150);
    if (r.muts.length) throw new Error('writing the live numbers again, with nothing changed, touched the page '
      + r.muts.length + ' times: ' + r.muts.slice(0, 6).join('; '));
    return [r.scenes + ' scenes: the ground painted by the pixel matches it painted rect by rect, fresh and reused',
      'a frame makes ' + r.calls + ' canvas calls; the page canvas is the ' + C.w + 'x' + C.h + ' picture, shown at '
        + C.scale + ' device pixels a pixel',
      'writing unchanged numbers touches the page 0 times',
      'a 300 wide picture draws, and on its side the picture covers the ' + cover.stage + 'px stage'];
  }
};
