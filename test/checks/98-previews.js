/* The shop's previews and the idle screen (the user: the skin previews were
 * "very low pixel", wanted "the camera distance back just a bit", and "when
 * they hit a ball in the preview, the ball disappears before another ball is
 * hit. Also fix this in the idle mode screen too"; the Third Eye was "mostly
 * white"):
 *
 *   - the Golfer rack has the stage, its arrows walking the skins and a tap
 *     on a skin's picture putting it on
 *   - the stage fills the shop's width, its pixels the course's own size
 *   - played through, on the stage and on the idle screen, a ball is never
 *     struck while the last one still lies out by the flag
 *   - the Third Eye drawn alone is a rainbow, white only in its glint
 *   - the Trophy Room's cabinet has a shelf of the six sets, lit as worn
 */
'use strict';
module.exports = {
  name: 'previews',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const raf = window.requestAnimationFrame;
      try {
        hideSheet(); QUIET = false; S.sov = 1e9;
        styleCat = 'golfer'; openShop('style');
        const cv = document.getElementById('showCv');
        if (!cv) { f('no showcase on the Golfer rack'); return o; }
        window.requestAnimationFrame = () => 0; cancelAnimationFrame(SHOW.raf);
        const name = () => document.getElementById('showN').textContent;
        const s0 = SHOW.set; document.querySelector('[data-show="1"]').click();
        const want = SHOW_SKINS[(SHOW_SKINS.indexOf(s0) + 1) % SHOW_SKINS.length];
        if (SHOW.set !== want || name() !== styleDef('o', want).n) f('the next arrow put on ' + SHOW.set + ' named ' + name());
        const art = [...document.querySelectorAll('.cart[data-art]')];
        if (art.length !== SHOW_SKINS.length) f(art.length + ' skin pictures can be tapped, not ' + SHOW_SKINS.length);
        else { art[3].click(); if (SHOW.set !== art[3].dataset.art || name() !== styleDef('o', SHOW.set).n) f('a tap on a picture put on ' + SHOW.set); }
        // as wide as the shop, at the course's pixel size
        const box = cv.parentNode.parentNode.clientWidth, cssW = parseFloat(cv.style.width);
        if (cssW > box + 0.5 || cssW < Math.min(480, box) - 8) f('the stage is ' + cssW + ' wide in a box of ' + box);
        const dpr = Math.min(3, devicePixelRatio || 1), want2 = Scene.scale / dpr, got = cssW / cv.width;
        if (Math.abs(got - want2) > 0.01) f('a stage pixel is ' + got + ' of the screen, the course\'s ' + want2);
        // one ball out at a time on the stage: never a swing with the last still lying
        for (const s of SHOW_SKINS.slice(0, 3).concat(['psyche'])) {
          showStart(s); let worst = '';
          while (SHOW.t < SHOW_CYC * 2) {
            showDraw(cv, 1 / 30);
            const A = showAt(SHOW.t), ph = A.P.k === 'fly' || A.P.k === 'move' ? 0 : A.u - A.P.addr;
            if (SHOW.rest.length && SHOW.balls.length) worst = 'a ball in the air with one lying at ' + SHOW.t.toFixed(2);
            if (SHOW.rest.length && ph > 0 && ph < 0.45) worst = 'a ball lying while he swings at ' + SHOW.t.toFixed(2);
            if (SHOW.rest.length > 1) worst = SHOW.rest.length + ' balls lying';
          }
          if (worst) f(s + ' on the stage: ' + worst);
        }
        hideSheet();
        // and on the idle screen
        saverOn();
        if (!SAVER) f('the idle screen did not come on');
        else {
          let worst = '', lay = 0;
          for (let i = 0; i < 30 * 12; i++) {
            saverDraw(1 / 30);
            const u = SAVER.t % 2.5;
            if (SAVER.rest.length) lay++;
            if (SAVER.rest.length && SAVER.balls.length) worst = 'a ball in the air with one lying at ' + SAVER.t.toFixed(2);
            if (SAVER.rest.length && u > 0.8 && u < 1.7) worst = 'a ball lying while he swings at ' + SAVER.t.toFixed(2);
          }
          if (worst) f('the idle screen: ' + worst);
          if (!lay) f('on the idle screen a ball never lies by the flag');
          saverOff();
        }
        // the Third Eye: a rainbow, not white
        const ec = document.createElement('canvas'); ec.width = ec.height = 30; const x = ec.getContext('2d');
        for (const R of [3, 5, 8]) {
          x.clearRect(0, 0, 30, 30); psyBallEye(x, 15, 15, R, 1.7, 0.8, -0.2);
          const d = x.getImageData(0, 0, 30, 30).data, cols = new Set(); let white = 0, all = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { all++; cols.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) white++; }
          if (white > 1) f('the Third Eye at ' + R + ' has ' + white + ' white pixels of ' + all);
          if (cols.size < 6) f('the Third Eye at ' + R + ' has ' + cols.size + ' colours');
        }
        // the Trophy Room's shelf of sets
        S.fullSets = { dread: 1 };
        trophyRoom('case');
        const sh = document.querySelector('.shelf.three');
        if (!sh) f('no shelf of sets in the cabinet');
        else {
          const cells = [...sh.querySelectorAll('.ci')];
          if (cells.length !== SET_ORDER.length) f('the shelf has ' + cells.length + ' sets');
          cells.forEach((c, i) => { const s = SET_ORDER[i], on = !c.classList.contains('no');
            if (c.querySelector('.cn').textContent !== FULL_SETS[s].n) f('shelf ' + i + ' is named ' + c.querySelector('.cn').textContent);
            if (on !== (s === 'dread')) f(s + ' is ' + (on ? 'lit' : 'dark') + ' on the shelf'); });
        }
        hideSheet();
      } catch (e) { f('threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      finally {
        window.requestAnimationFrame = raf;
        if (SAVER) saverOff();
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the Golfer rack\'s stage walks the skins at the course\'s pixel size; one ball out at a time there and on the idle screen; the Third Eye a rainbow; the cabinet\'s shelf of sets'];
  }
};
