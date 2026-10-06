/* The blessing drawn through him, the tee box, and the caddie on its own
 * stage (the user: the blessing had "a hard cutoff when it reached the
 * golfer ... I only want the opacity to kick in on the exact outline of the
 * golfer"; "redesign the tee boxes to look like real ones"; a showcase for
 * the caddies):
 *
 *   - for the plain beam and each great caddie's, drawn behind and in front
 *     of a stand-in for him: off him every pixel is as it is with no one
 *     there, on him the beam shows and so does he, and the beam goes on
 *     down to the grass
 *   - at the tee the deck is drawn, lighter than the fairway, its two
 *     markers at its front; walked on down the hole it is gone, and a
 *     wager keeps its two posts
 *   - the Caddie rack has the stage, its arrows walk the caddies, and each
 *     does its own trick and puts its blessing down on it
 */
'use strict';
module.exports = {
  name: 'blessthrough',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], seen: {} }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const raf = window.requestAnimationFrame, keep = { bless: Scene.bless, t: Scene.t };
      try {
        hideSheet(); QUIET = true;
        // ---- the blessing through him ----
        const H = 46, W = 20, CW = 120, CH = 140, X = 50, BOT = 130, Y = BOT - H;
        const draw = (id, him, q) => {
          const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const c = cv.getContext('2d');
          c.fillStyle = '#4E8F3A'; c.fillRect(0, 0, CW, CH);
          S.styleOwn['c:' + id] = 1; S.caddie = id;
          Scene.bless = { col: '#57A5C2', lv: 1, t0: 10 }; Scene.t = 10 + q;
          Scene.drawBless(c, X, Y, W, H, BOT, 'back');
          if (him) { c.fillStyle = '#E8E4D8'; c.fillRect(X + 4, Y, W - 8, H); }
          Scene.drawBless(c, X, Y, W, H, BOT, 'front');
          return c.getImageData(0, 0, CW, CH).data;
        };
        const inHim = i => { const p = i / 4, x = p % CW, y = Math.floor(p / CW); return x >= X + 4 && x < X + W - 4 && y >= Y && y < Y + H; };
        for (const id of ['bib', 'divine', 'demonic', 'ascended', 'cosmic', 'dread', 'psyche', 'cyber']) for (const q of [0.45, 0.9]) {
          const A = draw(id, false, q), Bm = draw(id, true, q);
          let off = 0, on = 0, him = 0, cov = 0, low = 0;
          for (let i = 0; i < A.length; i += 4) {
            const same = A[i] === Bm[i] && A[i + 1] === Bm[i + 1] && A[i + 2] === Bm[i + 2];
            if (!inHim(i)) { if (!same) off++; continue; }
            // (on him: the beam there, and him showing through it, his colour
            // in what is drawn where the beam alone was)
            const isHim = Bm[i] === 0xE8 && Bm[i + 1] === 0xE4 && Bm[i + 2] === 0xD8;
            if (!isHim) on++;
            // (where the beam lies over him, him showing through it)
            const beam = !(A[i] === 0x4E && A[i + 1] === 0x8F && A[i + 2] === 0x3A);
            if (beam){ cov++; if (!same) him++; }
          }
          // the beam down to the grass beside his legs: its colour in the
          // rows of his lower half, off him
          for (let y = Y + H / 2; y < BOT - 2; y++) for (let x = X - 8; x < X + W + 8; x++) { if (x >= X + 4 && x < X + W - 4) continue;
            const i = (y * CW + x) * 4; if (!(A[i] === 0x4E && A[i + 1] === 0x8F && A[i + 2] === 0x3A)) { low++; } }
          o.seen[id + '@' + q] = [off, on, him + ' of ' + cov, low].join('/');
          if (off) f(id + ' at ' + q + 's: ' + off + ' pixels off him change with him there');
          if (id !== 'demonic' && on < (id === 'bib' ? 10 : 40)) f(id + ' at ' + q + 's: only ' + on + ' pixels of the beam on him');
          if (him < cov * 0.6) f(id + ' at ' + q + 's: he shows through only ' + him + ' of the ' + cov + ' pixels the beam lies on him');
          if (id !== 'demonic' && low < 20) f(id + ' at ' + q + 's: the beam does not reach the grass beside him (' + low + ')');
        }
        S.caddie = JSON.parse(SNAP).caddie;
        // ---- the tee box ----
        DEV.course(0); hideSheet(); Scene.announce = null; window.requestAnimationFrame = () => 0;
        const D = derive(), T = Scene.theme || THEMES.day;
        const shot = cd => { Scene.camD = cd; Scene.walkTo = cd; Scene.walkOn = false; Scene.swingT = 0; Scene.t = 30; Scene.draw(0, D);
          return Scene.b.getImageData(0, 0, Scene.b.canvas.width, Scene.b.canvas.height).data; };
        const count = (d, cols) => { const C = cols.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
          let n = 0; for (let i = 0; i < d.length; i += 4) if (C.some(q => q[0] === d[i] && q[1] === d[i + 1] && q[2] === d[i + 2])) n++; return n; };
        const d0 = shot(0);
        if (!T._tee) f('no tee box was drawn at the tee');
        else {
          const deck = count(d0, [T._tee.a, T._tee.b]);
          o.deck = deck;
          if (deck < 1500) f('the tee box shows ' + deck + ' pixels at the tee');
          const mk = Scene.proj(TEE_DECK.mark, TEE_DECK.markLat, TEE_DECK.lift), Wd = Scene.b.canvas.width;
          let red = 0; for (let y = mk.y - 6; y <= mk.y; y++) for (let x = mk.x - 3; x <= mk.x + 3; x++) { const i = (y * Wd + x) * 4; if (d0[i] > 150 && d0[i + 1] < 90) red++; }
          if (red < 2) f('no marker at the front of the tee box (' + red + ')');
          const far = count(shot(Scene.holeLen() * 0.5), [T._tee.a, T._tee.b]);
          if (far > deck * 0.05) f('half way down the hole ' + far + ' pixels of the tee box\'s colours are drawn, against ' + deck + ' at the tee');
        }
        // ---- the caddie on its own stage ----
        QUIET = false; S.sov = 1e9;
        styleCat = 'caddie'; openShop('style');
        const cv = document.getElementById('showCv');
        if (!cv) f('no showcase on the Caddie rack');
        else {
          window.requestAnimationFrame = () => 0; cancelAnimationFrame(SHOW.raf);
          if (!SHOW.set.startsWith('c:') || SHOW.list.length !== B.CADDIES.length) f('the Caddie rack shows ' + SHOW.set + ' of ' + SHOW.list.length);
          const s0 = SHOW.set; document.querySelector('[data-show="1"]').click();
          if (SHOW.list.indexOf(SHOW.set) !== (SHOW.list.indexOf(s0) + 1) % SHOW.list.length || document.getElementById('showN').textContent !== styleDef('c', SHOW.set.slice(2)).n)
            f('the next arrow put on ' + SHOW.set);
          const art = [...document.querySelectorAll('.cart[data-art]')];
          const want = B.CADDIES.filter(d => !(d.pass && !styleOwned('c', d.id))).length;   // (a month's Tour Pass caddie only once his)
          if (art.length !== want) f(art.length + ' caddie pictures can be tapped, not ' + want);
          else { art[5].click(); if (SHOW.set !== art[5].dataset.art) f('a tap on a caddie put on ' + SHOW.set); }
          let tricks = 0, bless = 0;
          for (const id of SHOW.list) {
            showStart(id); let did = false, cast = false;
            while (SHOW.t < 12) { showDraw(cv, 1 / 30); if (SHOW.move) did = true; if (SHOW.sc && SHOW.sc.fairyCast) cast = true; }
            const MV = FAIRY_MOVES.find(m => m.only === cadKey(styleDef('c', id.slice(2))));
            if (MV && !did) f(id + ' does not do its trick on the stage'); else if (MV) tricks++;
            if (!cast) f(id + ' does not put its blessing down on the stage'); else bless++;
          }
          o.cads = tricks + ' tricks, ' + bless + ' blessings of ' + SHOW.list.length;
          hideSheet();
        }
      } catch (e) { f('threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      finally {
        window.requestAnimationFrame = raf; Scene.bless = keep.bless; Scene.t = keep.t;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the blessing through him (off/on/him/low): ' + Object.entries(r.seen).map(([k, v]) => k + ' ' + v).join(', '),
            'the tee box ' + r.deck + ' pixels at the tee; the Caddie rack\'s stage: ' + r.cads];
  }
};
