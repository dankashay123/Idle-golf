/* The loading screen (the user asked): the title in the calls' lettering
 * over the course at sunrise, his tee shot to the flag, a caddie's tip in
 * plain words; it goes by itself, or at a tap.
 *
 *   - never in a check's own page (it would sit over everything)
 *   - shown when asked for, at 390x844, 320x568 and 844x390: the title and
 *     the tip inside the screen, the scene filling it
 *   - drawn alone at moments of the shot: him and his caddie at address
 *     (some of the caddie left of him), the ball lying; mid-flight the dotted
 *     way it came and the ball up in the sky; once in, no ball in the air;
 *     on a night course the sky the same sunrise, the night put back after
 *   - every tip short, plain and ending in a full stop
 *   - gone by itself within its time, and at once on a tap */
'use strict';
module.exports = {
  name: 'boot',
  async run(page, opts) {
    const fails = [], f = m => { if (fails.length < 12) fails.push(m); }, o = { sizes: [] };
    if (await page.evaluate(() => !!document.getElementById('boot'))) f('the loading screen in a check\'s page');
    const ctxs = [];
    const openBoot = async (W, H) => {
      const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } }); ctxs.push(ctx);
      const tp = await ctx.newPage(); const errs = [];
      tp.on('pageerror', e => errs.push(e.message));
      await tp.addInitScript(() => { window.__bootShow = 1; window.__noShimmer = 1; });
      await tp.goto(opts.url);
      await tp.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
      return { tp, errs };
    };
    for (const [W, H] of [[390, 844], [320, 568], [844, 390]]) {
      const { tp, errs } = await openBoot(W, H);
      const r = await tp.evaluate(([W, H]) => {
        const out = { fails: [] }, f = m => out.fails.push(W + 'x' + H + ': ' + m), el = document.getElementById('boot');
        if (!el) { f('no loading screen when asked for'); return out; }
        const box = id => document.getElementById(id).getBoundingClientRect();
        const T = box('bootTitle'), P = box('bootTip'), C = box('bootCv');
        if (T.left < 0 || T.right > W || T.top < 0 || T.width < 100) f('the title ' + Math.round(T.left) + '..' + Math.round(T.right) + ' wide ' + Math.round(T.width));
        if (P.left < 0 || P.right > W || P.bottom > H) f('the tip outside the screen');
        if (P.top < T.bottom) f('the tip over the title');
        if (C.width < W - 1 || C.height < H - 1) f('the scene ' + Math.round(C.width) + 'x' + Math.round(C.height) + ' short of the screen');
        const tx = document.getElementById('bootTipTx').textContent;
        if (!BOOT_TIPS.includes(tx)) f('the tip shown is not one of the tips: ' + tx);
        // drawn alone at moments of the shot
        const B = window.__boot, cv = document.createElement('canvas'); cv.width = B.W; cv.height = B.H; const c = cv.getContext('2d');
        const bg = (() => { const g = document.createElement('canvas'); g.width = B.W; g.height = B.H; const x = g.getContext('2d'); x.drawImage(B.bg, 0, 0); return x.getImageData(0, 0, B.W, B.H).data; })();
        const shot = t => { c.clearRect(0, 0, B.W, B.H); bootDraw(c, B, t); const d = c.getImageData(0, 0, B.W, B.H).data, px = [];
          for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - bg[i]) + Math.abs(d[i + 1] - bg[i + 1]) + Math.abs(d[i + 2] - bg[i + 2]) > 40) px.push([(i >> 2) % B.W, (i >> 2) / B.W | 0, d[i], d[i + 1], d[i + 2]]); return px; };
        const L = bootLayout(B), h = L.h, gx = L.x;
        const a = shot(0.1), left = a.filter(p => p[0] < gx && p[1] < B.G - 4).length;
        if (a.length < h * 8) f('at address only ' + a.length + ' pixels of him');
        if (left < 20) f('no caddie beside him (' + left + ' pixels left of him)');
        // (the sky past his club's reach, the flag's cloth left out: it flies)
        const air = p => p[1] < B.G - h * 1.25 && p[0] > L.bx && !(p[0] >= B.FX0 && p[0] <= B.FX0 + 8 && p[1] >= B.G - 19);
        const dots = shot(bootImpact() + BOOT_T.fly * 0.5).filter(air).length;
        if (dots < 8) f('mid-flight no ball or dotted way up in the sky (' + dots + ' pixels)');
        const up = shot(bootLand() + BOOT_T.after * 0.99).filter(air).length;
        if (up > 4) f('the ball still in the air once in (' + up + ' pixels)');
        // the night course leaves the sunrise as it is, and is put back
        const keep = Scene.night; Scene.night = true; const n = shot(0.1); const back = Scene.night; Scene.night = keep;
        if (Math.abs(n.length - a.length) > a.length * 0.15) f('on a night course the screen changed (' + n.length + ' against ' + a.length + ')');
        if (back !== true) f('the night not put back after');
        out.n = [a.length, dots, up, left];
        // the tips
        for (const s of BOOT_TIPS) if (s.length > 90 || !/\.$/.test(s) || /\b(rim|tier|heirloom|sigil|wake)\b/i.test(s)) f('a tip not short and plain: ' + s);
        return out;
      }, [W, H]);
      r.fails.forEach(f); if (r.n) o.sizes.push(W + 'x' + H + ' ' + r.n.join('/'));
      // gone by itself
      const gone = await tp.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 9000 }).then(() => true, () => false);
      if (!gone) f(W + 'x' + H + ': the loading screen still up after 9s');
      if (errs.length) f(W + 'x' + H + ': ' + errs.slice(0, 2).join('; '));
      await tp.close();
    }
    // a tap ends it at once
    { const { tp } = await openBoot(390, 844);
      await tp.waitForTimeout(150);
      const was = await tp.evaluate(() => !!document.getElementById('boot'));
      await tp.mouse.click(195, 300);
      const t0 = Date.now(); const gone = await tp.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 2000 }).then(() => true, () => false);
      o.tap = Date.now() - t0;
      if (was && !gone) f('a tap did not end it');
      await tp.close(); }
    for (const x of ctxs) await x.close().catch(() => {});
    if (fails.length) throw new Error(fails.join('; '));
    return ['the loading screen: none in a check\'s page; at three sizes the title, tip and scene inside the screen; pixels of him/dots in the sky/left in the air once in/the caddie ' + o.sizes.join(', ') + '; the night left alone; gone by itself, and ' + o.tap + 'ms after a tap'];
  }
};
