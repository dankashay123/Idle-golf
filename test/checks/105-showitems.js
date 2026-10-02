/* The showcase for clubs, balls and wakes (the user asked for "the skin
 * showcase for clubs and balls, and trails"):
 *
 *   - the Clubs rack and the Balls rack each have the stage over them, its
 *     arrows walking that rack's pieces in the rack's order, and a tap on a
 *     piece's picture putting it on the stage
 *   - on the stage the plain golfer swings the club on show (a club's own
 *     picture shows in the swing), or hits the ball or wake on show (its
 *     flight differs from the plain ball's); one ball out at a time
 *   - drawing the stage leaves what he wears on the course as it was
 */
'use strict';
module.exports = {
  name: 'showitems',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const raf = window.requestAnimationFrame;
      try {
        hideSheet(); QUIET = false; S.sov = 1e9; window.requestAnimationFrame = () => 0;
        const wear = () => [clubNow().id, trailNow().id, (ballNow() || {}).id, outfitNow().id, caddieNow().id].join('|');
        const before = wear();
        for (const [cat, k, list] of [['clubs', 'k', showClubs()], ['balls', 't', showTrails()]]) {
          styleCat = cat; openShop('style');
          const cv = document.getElementById('showCv');
          if (!cv) { f('no showcase on the ' + cat + ' rack'); continue; }
          if (!SHOW.set.startsWith(k + ':')) f('the ' + cat + ' rack opened on ' + SHOW.set);
          const name = () => document.getElementById('showN').textContent;
          const s0 = SHOW.set; document.querySelector('[data-show="1"]').click();
          const want = list[(list.indexOf(s0) + 1) % list.length];
          if (SHOW.set !== want || name() !== styleDef(k, want.slice(2)).n) f(cat + ': the next arrow put on ' + SHOW.set + ' named ' + name());
          const art = [...document.querySelectorAll('.cart[data-art]')];
          if (art.length !== list.length) f(cat + ': ' + art.length + ' pictures can be tapped, not ' + list.length);
          else { art[2].click(); if (SHOW.set !== art[2].dataset.art) f(cat + ': a tap on a picture put on ' + SHOW.set); }
          o[cat] = list.length;
          // the piece shows: the stage through a round, against the plain one
          const plain = k + ':' + STYLE_DEFAULT[k];
          const film = s => { showStart(s); const fr = []; while (SHOW.t < 9) { showDraw(cv, 1 / 30); fr.push(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data); } return fr; };
          const P = film(plain);
          let same = [];
          for (const s of list.filter(x => x !== plain)) {
            const F = film(s); let diff = 0;
            for (let j = 0; j < F.length; j += 3) { const a = F[j], b = P[j]; for (let i = 0; i < a.length; i += 16) if (a[i] !== b[i] || a[i + 1] !== b[i + 1]) diff++; }
            if (diff < 40) same.push(s + ' (' + diff + ')');
            // one ball out at a time
            showStart(s); let worst = '';
            while (SHOW.t < 9) { showDraw(cv, 1 / 30); if (SHOW.rest.length && SHOW.balls.length) worst = 'a ball in the air with one lying'; if (SHOW.rest.length > 1) worst = SHOW.rest.length + ' balls lying'; }
            if (worst) f(s + ' on the stage: ' + worst);
          }
          if (same.length) f(cat + ': drawn just like the plain one: ' + same.join(', '));
          if (wear() !== before) f('drawing the ' + cat + ' stage changed what he wears: ' + wear() + ', was ' + before);
          hideSheet();
        }
      } finally {
        window.requestAnimationFrame = raf; if (SHOW) cancelAnimationFrame(SHOW.raf);
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['a stage over the Clubs rack (' + r.clubs + ' clubs) and the Balls rack (' + r.balls + ' balls and wakes): arrows, a tap on a picture',
      'each piece drawn unlike the plain one, one ball out at a time; what he wears on the course untouched'];
  }
};
