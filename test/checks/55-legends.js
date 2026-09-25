/* The Demonic and the Ascended (the user asked for them): two skins at the
 * top of the Style tab, each with a caddie, a club, a trail and a ball to
 * match. "Make it as intricate as possible."
 *
 *   - the prices: the Demonic at the Divine's price, the Ascended at 3500
 *     sovereigns, and each piece of a set in the Divine's own proportion (a
 *     club and a trail two thirds of the skin, a ball half, a caddie a
 *     third); the Demonic's pieces marked Legendary, the Ascended's Mythic
 *   - each piece has an effect of its own, and the shop lists it
 *   - drawn, by pixels, each part taken away in turn from the same frame.
 *     The Demonic: wings spread either side of him above his waist, on him
 *     and his caddie; horns standing up off his cap. The Ascended, a knight
 *     of the void after a picture the user sent: a cape streaming behind
 *     him, and hanging down his back as he walks away; horns; hair of fire
 *     streaming back from his head; a light in his chest; hands in their own
 *     magenta. His caddie, the picture's imp: horns, a flame, green eyes and
 *     a curled tail. Both: eyes that shine, where his eye is; walking away,
 *     the sole of his lifted boot in his belt's colour (it flashed the plain
 *     tan under the Ascended's cape), while a plain golfer keeps the tan
 *   - his arms in his own skin: they were always the plain tone, so the red
 *     Demonic had peach arms (and the Void Walker, Midas and the Ghost too)
 *   - the Ascended made the ultimate skin ("really go nuts, but not so much
 *     that it takes up a ton of the screen"): a sigil on the ground at his
 *     feet and nowhere else; an aura of flame close about him that swells as
 *     he winds up; a ring of shards round him both sides, passing in front of
 *     his middle over a lap; horns swept back off his helm, a pair either
 *     side from behind; sparks off the ball and a shockwave out past the
 *     sigil as he strikes; and all of it within 1.3 of his widths either side
 *     of him and 0.4 of his height over him, the most over six seconds
 *   - a skin's ground goes down before the pin and a putt rolling away beyond
 *     him, which stand on it: drawn with him, it covered them
 *   - the Demonic made the ultimate skin too: an aura of hellfire swelling as
 *     he winds up, two chains of fire round him, horns curling over, his
 *     hands on fire, the ground cracking and fire off the ball at the strike
 *   - a moment for the legends: on an eagle or better, the Demonic's column
 *     of hellfire with his skulls scattering, the Ascended's pillar of light
 *     with his shards bursting out, each with its sound, bigger on an ace
 */
'use strict';
module.exports = {
  name: 'legends',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S);
      try {
        hideSheet(); QUIET = true;
        // ---- the prices and the pieces ----
        const P = id => styleDef('o', id).cost;
        o.price = { divine: P('divine'), demonic: P('demonic'), ascended: P('ascended') };
        const SETS = { divine: ['divine', 'divine', 'seraph', 'godlight'], demonic: ['demonic', 'demonic', 'hellfire', 'demoneye'],
                       ascended: ['ascended', 'ascended', 'ascension', 'ascorb'] };
        o.sets = {};
        for (const id in SETS) {
          const [c0, k0, t0, b0] = SETS[id], out = styleDef('o', id), cad = B.CADDIES.find(c => c.of === id);
          const club = styleDef('k', k0), trail = styleDef('t', t0), ball = styleDef('t', b0);
          o.sets[id] = { have: !!(out && cad && club && trail && ball),
            fx: [out, cad, club, trail, ball].every(d => d && d.fx), ballKind: ball && ball.cat, trailKind: trail && trail.cat,
            top: [out, club, trail, ball].map(d => d && d.top), cost: [out, cad, club, trail, ball].map(d => d ? d.cost : null) };
        }
        // the badges on the Style tab
        S.sov = 0; QUIET = false; styleCat = 'golfer'; openShop('style');
        const badge = name => { const card = [...document.querySelectorAll('#sheet .card')].find(c => c.querySelector('.chd').textContent === name);
          const b = card && card.querySelector('.badge'); return b ? b.textContent : null; };
        o.badges = { Ascended: badge('Ascended'), Demonic: badge('Demonic'), Divine: badge('Divine') };
        hideSheet(); QUIET = true;

        // ---- drawn ----
        const D = derive(), c = Scene.b;
        const px = () => c.getImageData(0, 0, VW, VH).data;
        const diff = (A, B2) => { const pts = []; for (let i = 0; i < A.length; i += 4)
          if (A[i] !== B2[i] || A[i + 1] !== B2[i + 1] || A[i + 2] !== B2[i + 2] || A[i + 3] !== B2[i + 3]) pts.push([(i >> 2) % VW, (i >> 2) / VW | 0]); return pts; };
        const blank = document.createElement('canvas'); blank.width = blank.height = 1;
        // the frame with a part of an effect taken away, and without
        const part = (fx, name, frame) => {
          const F = STYLEFX[fx], keep = F[name];
          const full = frame();
          F[name] = name === 'wings' && fx === 'demonic' ? function () { const w = keep.apply(this, arguments); return { cv: blank, ox: w.ox, oy: w.oy }; } : () => {};
          try { return diff(full, frame()); } finally { F[name] = keep; }
        };
        const soles = (golfer, box, h) => {
          const O = outfitNow(), belt0 = O.belt;
          if (belt0) { O.belt = '#01FE02'; buildSprites(); }
          Scene.walkOn = true; Scene.walkPh = 0.2;
          let all;
          try { all = golfer(); } finally { Scene.walkOn = false; if (belt0) { O.belt = belt0; buildSprites(); } }
          const n = { own: 0, tan: 0 };
          for (let i = 0; i < all.length; i += 4) {
            if (!all[i + 3]) continue;
            if (all[i] === 1 && all[i + 1] === 254 && all[i + 2] === 2 && ((i >> 2) / VW | 0) > box.y0 + h * 0.75) n.own++;
            if (all[i] === 0xB8 && all[i + 1] === 0xAE && all[i + 2] === 0x9C) n.tan++;
          }
          return n;
        };
        o.drawn = {};
        // Wings as he is seen (the user asked): side on at address and at the
        // top of the backswing, on his back behind him and up off it, none out
        // in front of him; walking away, spread either side of him
        const wingViews = (id, golfer, box, w, h, head) => {
          const R = {};
          for (const [k, ph] of [['addr', 0], ['top', 0.36]]) {
            Scene.swingT = ph ? Scene.swingDur * (1 - ph) : 0;
            const W = part(id, 'wings', golfer);
            R[k] = { n: W.length, behind: W.filter(([x]) => x < box.x0 + w * 0.4).length, up: W.filter(([, y]) => y < head.y).length,
                     front: W.filter(([x]) => x > box.x1 + 2).length };
          }
          Scene.swingT = 0; Scene.walkOn = true; Scene.walkPh = 0.2;
          const W = part(id, 'wings', golfer).filter(([, y]) => y < box.y0 + h * 0.55);
          Scene.walkOn = false;
          // (from behind he stands centred on his line, not where he addresses the ball)
          const bx0 = box.x0 + Math.round(w * 0.42) - Math.round(w * 0.5), bx1 = bx0 + w;
          R.backL = W.filter(([x]) => x < bx0 - 2).length; R.backR = W.filter(([x]) => x > bx1 + 2).length;
          return R;
        };
        for (const id of ['demonic', 'ascended']) {
          S.styleOwn['o:' + id] = 1; S.styleOwn['c:' + id] = 1; S.outfit = id; S.caddie = id; buildSprites();
          const cad = SPRITE.caddie;
          Scene.walkOn = false; Scene.swingT = 0; Scene.fairyMove = null; Scene.fairySay = null; Scene.moveT = 999; Scene.t = 1.3;
          // him alone, at address
          const golfer = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
          const p = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * p.s)), w = Math.max(4, Math.round(h * 40 / 58));
          const bob = STYLEFX[id].bob ? Math.round(2 + Math.sin(Scene.t * 2.2) * 2) : 0;
          const box = { x0: p.x - Math.round(w * 0.42), y0: p.y - h - bob }; box.x1 = box.x0 + w; box.y1 = box.y0 + h;
          const head = { x: box.x0 + w * CAP_ADDR.x, y: box.y0 + h * CAP_ADDR.y, w: w * CAP_ADDR.w };
          const eye = { x: box.x0 + w * EYE_ADDR.x, y: box.y0 + h * EYE_ADDR.y };
          const d = o.drawn[id] = {};
          if (id === 'demonic') {
            d.wing = wingViews(id, golfer, box, w, h, head);
            // ---- made the ultimate skin too ----
            const cx = box.x0 + w * 0.55;
            // an aura of hellfire close about him, swelling as he winds up
            d.auraIdle = 0; d.auraTop = 0; d.auraOff = 0;
            for (let k = 0; k < 6; k++) {
              Scene.t = 1.3 + k * 0.43;
              const au = part(id, 'aura', golfer);
              d.auraIdle += au.length; d.auraOff += au.filter(([x, y]) => x < box.x0 - w * 0.3 || x > box.x1 + w * 0.3 || y < box.y0 - h * 0.3 || y > p.y + 1).length;
              Scene.swingT = Scene.swingDur * (1 - 0.36); d.auraTop += part(id, 'aura', golfer).length; Scene.swingT = 0;
            }
            Scene.t = 1.3;
            // two chains of fire round him, both sides, and over a lap in front of his middle
            const ch = part(id, 'chains', golfer);
            d.chains = ch.length; d.chainsL = ch.filter(([x]) => x < box.x0).length; d.chainsR = ch.filter(([x]) => x > box.x1).length;
            d.chainsOff = ch.filter(([x, y]) => Math.abs(x - cx) > w * 0.9 || y < box.y0 + h * 0.3 || y > box.y0 + h * 0.8).length;
            d.chainsFront = 0;
            for (let k = 0; k < 8; k++) {
              Scene.t = 1.3 + k * 0.5;
              d.chainsFront += part(id, 'chains', golfer).filter(([x, y]) => x > box.x0 + w * 0.35 && x < box.x0 + w * 0.65 && y > box.y0 + h * 0.45 && y < box.y0 + h * 0.65).length;
            }
            Scene.t = 1.3;
            // the horns curl forward: their top a good way ahead of their roots
            const hn = part(id, 'horns', golfer).filter(([x, y]) => y < head.y), ys = hn.map(([, y]) => y);
            const y0h = Math.min(...ys), y1h = Math.max(...ys), mx = P => P.length ? P.reduce((a, [x]) => a + x, 0) / P.length : 0;
            // (the widest row of the top of them, against his cap: a hook curling
            // over lies across near the top, where a straight horn is a post)
            d.hornCurl = 0;
            for (let y = y0h; y < y0h + (y1h - y0h) * 0.4; y++) { const xs = hn.filter(([, yy]) => yy === y).map(([x]) => x);
              if (xs.length) d.hornCurl = Math.max(d.hornCurl, (Math.max(...xs) - Math.min(...xs) + 1) / head.w); }
            // at the top of the backswing his hands on fire; at the strike the
            // ground cracks open out past the pit, and fire flies off the ball
            Scene.swingT = Scene.swingDur * (1 - 0.36);
            d.fists = part(id, 'fists', golfer).length;
            Scene.swingT = Scene.swingDur * (1 - 0.66);
            const bx = box.x0 + w * 1.19, bl = part(id, 'blast', golfer);
            d.blast = bl.length; d.blastOff = bl.filter(([x, y]) => Math.abs(x - bx) > w * 0.8 || y > p.y + 2 || y < p.y - h * 0.5).length;
            d.cracks = part(id, 'cracks', golfer).filter(([x]) => Math.abs(x - cx) > w * 1.05 + 2).length;
            Scene.swingT = 0;
            d.cracksIdle = part(id, 'cracks', golfer).length;
            // all of it, against him bare, the most over six seconds
            const bare = () => { const O = outfitNow(), fx = O.fx; O.fx = null; try { return golfer(); } finally { O.fx = fx; } };
            d.foot = { l: 0, r: 0, up: 0, dn: 0 };
            for (let k = 0; k < 16; k++) {
              Scene.t = 0.1 + k * 0.41;
              if (STYLEFX.demonic.erupt(Scene.t) >= 0) continue;   // (the pit's eruption, a second in six and a half, throws its ring wider)
              const foot = diff(golfer(), bare());
              const ext = { l: (cx - Math.min(...foot.map(([x]) => x))) / w, r: (Math.max(...foot.map(([x]) => x)) - cx) / w,
                            up: (box.y0 - Math.min(...foot.map(([, y]) => y))) / h, dn: (Math.max(...foot.map(([, y]) => y)) - p.y) / h };
              for (const e in ext) d.foot[e] = Math.max(d.foot[e], +ext[e].toFixed(2));
            }
            Scene.t = 1.3;
          } else {
            // the cape: behind him, out past his legs; walking away, down his back
            const cape = part(id, 'cape', golfer);
            d.cape = cape.length; d.capeBehind = cape.filter(([x]) => x < box.x0 + w * 0.25).length;
            Scene.walkOn = true; Scene.walkPh = 0.2;
            d.capeBack = part(id, 'cape', golfer).filter(([x, y]) => x >= box.x0 && x <= box.x1 && y > box.y0 + h * 0.3 && y < box.y0 + h * 0.8).length;
            Scene.walkOn = false;
            // hair of fire, back from his head
            const hair = part(id, 'hair', golfer), hl = head.x - head.w / 2;
            d.hair = hair.length; d.hairBack = hair.filter(([x]) => x < hl).length; d.hairReach = hl - Math.min(...hair.map(([x]) => x));
            // the light in his chest
            const core = part(id, 'core', golfer);
            d.core = core.length; d.coreOff = core.filter(([x, y]) => x < box.x0 || x > box.x1 || y < box.y0 + h * 0.3 || y > box.y0 + h * 0.6).length;
            // ---- made the ultimate skin ("go nuts, but not so much that it
            // takes up a ton of the screen") ----
            const cx = box.x0 + w * 0.55, [rx, ry] = STYLEFX.ascended.sigilSize({ w, h });
            // the sigil on the ground under him, and nowhere else
            const gr = part(id, 'ground', golfer);
            d.ground = gr.length; d.groundOff = gr.filter(([x, y]) => Math.abs(x - cx) > w + 1 || Math.abs(y - p.y) > h * 0.13 + 1.5).length;
            // the aura: flames rising off him, close about him
            const au = part(id, 'aura', golfer);
            d.aura = au.length; d.auraAbove = au.filter(([x, y]) => y < head.y).length;
            d.auraOff = au.filter(([x, y]) => x < box.x0 - w * 0.3 || x > box.x1 + w * 0.3 || y < box.y0 - h * 0.3 || y > p.y + 1).length;
            // the ring of shards, round him both sides and close in; over a
            // lap, passing in front of his middle
            const ob = part(id, 'orbit', golfer);
            d.orbit = ob.length; d.orbitL = ob.filter(([x]) => x < box.x0).length; d.orbitR = ob.filter(([x]) => x > box.x1).length;
            d.orbitOff = ob.filter(([x, y]) => Math.abs(x - cx) > w * 0.95 || y < box.y0 + h * 0.3 || y > box.y0 + h * 0.8).length;
            d.orbitFront = 0;
            for (let k = 0; k < 8; k++) {
              Scene.t = 1.3 + k * 0.66;
              d.orbitFront += part(id, 'orbit', golfer).filter(([x, y]) => x > box.x0 + w * 0.35 && x < box.x0 + w * 0.65 && y > box.y0 + h * 0.5 && y < box.y0 + h * 0.65).length;
            }
            Scene.t = 1.3;
            // the horns swept back off his helm: the top third of them well
            // behind the bottom third
            const hn = part(id, 'horns', golfer).filter(([x, y]) => y < head.y), ys = hn.map(([, y]) => y);
            const y0h = Math.min(...ys), y1h = Math.max(...ys), mx = P => P.length ? P.reduce((a, [x]) => a + x, 0) / P.length : 0;
            d.hornSweep = hn.length ? (mx(hn.filter(([, y]) => y < y0h + (y1h - y0h) / 3)) - mx(hn.filter(([, y]) => y > y1h - (y1h - y0h) / 3))) / head.w : 0;
            // walking away, a pair either side of his head
            Scene.walkOn = true; Scene.walkPh = 0.2;
            const hb = part(id, 'horns', golfer), hx = p.x;
            d.hornsBack = [hb.filter(([x]) => x < hx - 2).length, hb.filter(([x]) => x > hx + 2).length];
            Scene.walkOn = false;
            // all of it, against him bare: how much of the screen it takes,
            // the most over six seconds of him standing there (its shockwave
            // and all), and his aura then against at the top of his backswing
            const bare = () => { const O = outfitNow(), fx = O.fx; O.fx = null; try { return golfer(); } finally { O.fx = fx; } };
            d.foot = { l: 0, r: 0, up: 0, dn: 0 }; d.auraIdle = 0; d.auraTop = 0;
            for (let k = 0; k < 14; k++) {
              Scene.t = 1.3 + k * 0.43;
              const foot = diff(golfer(), bare());
              const ext = { l: (cx - Math.min(...foot.map(([x]) => x))) / w, r: (Math.max(...foot.map(([x]) => x)) - cx) / w,
                            up: (box.y0 - Math.min(...foot.map(([, y]) => y))) / h, dn: (Math.max(...foot.map(([, y]) => y)) - p.y) / h };
              for (const e in ext) d.foot[e] = Math.max(d.foot[e], +ext[e].toFixed(2));
              if (k < 6){ d.auraIdle += part(id, 'aura', golfer).length;
                Scene.swingT = Scene.swingDur * (1 - 0.36); d.auraTop += part(id, 'aura', golfer).length; Scene.swingT = 0; }
            }
            Scene.t = 1.3;
            // at the strike, sparks flying up off the ball, and a shockwave
            // running out past the sigil
            Scene.swingT = Scene.swingDur * (1 - 0.62);
            const bx = box.x0 + w * 1.19, sp = part(id, 'sparks', golfer);
            d.sparks = sp.length; d.sparksOff = sp.filter(([x, y]) => Math.abs(x - bx) > w * 0.8 || y > p.y + 2 || y < p.y - h * 0.5).length;
            Scene.swingT = Scene.swingDur * (1 - 0.7);
            d.waveOut = part(id, 'ground', golfer).filter(([x]) => Math.abs(x - cx) > rx + 2).length;
            Scene.swingT = 0;
          }
          const top = part(id, 'horns', golfer);
          d.top = top.length; d.topAbove = top.filter(([x, y]) => y < head.y).length;
          d.topBelow = top.filter(([x, y]) => y > head.y + h * 0.1).length;
          d.topWide = top.filter(([x]) => Math.abs(x - head.x) > head.w * 1.4).length;
          const eyes = part(id, 'eyes', golfer);
          d.eyes = eyes.length; d.eyesOff = eyes.filter(([x, y]) => Math.abs(x - eye.x) > 4.5 || Math.abs(y - eye.y) > 2.5).length;
          // his arms: none of the plain skin tone left on him
          const all = golfer(), hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
          const tone = [hex(PX.skin), hex(PX.skin2)], own = [hex(outfitNow().skin), hex(outfitNow().skin2)];
          d.plain = 0; d.own = 0;
          for (let i = 0; i < all.length; i += 4) {
            if (!all[i + 3]) continue;
            if (tone.some(t => t[0] === all[i] && t[1] === all[i + 1] && t[2] === all[i + 2])) d.plain++;
            if (own.some(t => t[0] === all[i] && t[1] === all[i + 1] && t[2] === all[i + 2])) d.own++;
          }
          // and hands in their own colour, where the skin has one (counted
          // with their glow taken off, which lights them)
          if (outfitNow().hand) {
            const F = STYLEFX[id], k = F.hands; F.hands = () => {};
            const bare = golfer(); F.hands = k;
            const hc = hex(outfitNow().hand); d.hand = 0;
            for (let i = 0; i < bare.length; i += 4) if (bare[i + 3] && bare[i] === hc[0] && bare[i + 1] === hc[1] && bare[i + 2] === hc[2]) d.hand++;
          }
          // walking away, the sole of his lifted boot in his belt's colour, as
          // it is side-on, not the plain tan (a colour of its own put on the
          // belt, where he has one, to count it by, below his waist)
          d.sole = soles(golfer, box, h);
          // and his caddie
          const caddie = () => { c.clearRect(0, 0, VW, VH); Scene.drawCaddie(c, box.x0, box.y0, w, h); return px(); };
          if (id === 'demonic') d.cWings = part(id, 'wings', caddie).length;
          else { d.cTail = part(id, 'tail', caddie).length; d.cFlame = part(id, 'hair', caddie).length;
                 // the imp's eyes are green: the brightest pixel they put down
                 const ce = caddie(), eyes = part(id, 'eyes', caddie);
                 d.cGreen = eyes.filter(([x, y]) => { const i = (y * VW + x) * 4; return ce[i + 1] > ce[i] + 30 && ce[i + 1] > ce[i + 2]; }).length; }
          d.cTop = part(id, 'horns', caddie).length;
          d.cEyes = part(id, 'eyes', caddie).length;
          d.cadSprite = cad === SPRITE.caddie;
        }
        // ---- the Divine, made the ultimate skin ----
        {
          S.styleOwn['o:divine'] = 1; S.outfit = 'divine'; S.caddie = 'bib'; buildSprites();
          Scene.walkOn = false; Scene.swingT = 0; Scene.fairyMove = null; Scene.fairySay = null; Scene.moveT = 999; Scene.t = 1.3; Scene.legend = null;
          const golfer = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
          const p = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * p.s)), w = Math.max(4, Math.round(h * 40 / 58));
          const box = { x0: p.x - Math.round(w * 0.42), y0: p.y - h }; box.x1 = box.x0 + w; box.y1 = box.y0 + h;
          const head = { x: box.x0 + w * CAP_ADDR.x, y: box.y0 + h * CAP_ADDR.y, w: w * CAP_ADDR.w };
          const cx = box.x0 + w * 0.55, d = o.divine = {};
          d.wing = wingViews('divine', golfer, box, w, h, head);
          // up off his back through the backswing, and down again at the strike
          const top = ph => { Scene.swingT = ph ? Scene.swingDur * (1 - ph) : 0; const W = part('divine', 'wings', golfer); Scene.swingT = 0; return Math.min(...W.map(([, y]) => y)); };
          d.rise = top(0) - top(0.36); d.sweep = top(0.62) - top(0.36);
          // the sun at his feet and nowhere else
          const gr = part('divine', 'ground', golfer);
          d.ground = gr.length; d.groundOff = gr.filter(([x, y]) => Math.abs(x - cx) > w * 1.2 + 1 || Math.abs(y - p.y) > h * 0.13 + 1.5).length;
          // the second halo, over his head
          const h2 = part('divine', 'halo2', golfer);
          d.halo2 = h2.length; d.halo2Off = h2.filter(([x, y]) => y > head.y + h * 0.04 || Math.abs(x - head.x) > head.w * 1.8).length;
          // a feather coming away now and then
          d.feathers = 0; for (let k = 0; k < 40; k++) { Scene.t = 1.3 + k * 0.37; d.feathers += part('divine', 'feathers', golfer).length > 0; } Scene.t = 1.3;
          // at the strike, light off the ball and a ring of light out past the sun
          Scene.swingT = Scene.swingDur * (1 - 0.62);
          const bx = box.x0 + w * 1.19, sp = part('divine', 'sparks', golfer);
          d.sparks = sp.length; d.sparksOff = sp.filter(([x, y]) => Math.abs(x - bx) > w * 0.8 || y > p.y + 2 || y < p.y - h * 0.5).length;
          Scene.swingT = Scene.swingDur * (1 - 0.7);
          d.waveOut = part('divine', 'ground', golfer).filter(([x]) => Math.abs(x - cx) > w * 0.9 + 2).length;
          Scene.swingT = 0;
        }

        // ---- a moment for the legends: on an eagle or better ----
        {
          const p = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * p.s)), w = Math.max(4, Math.round(h * 40 / 58));
          const box = { x0: p.x - Math.round(w * 0.42), y0: p.y - h }, cx = box.x0 + w * 0.55;
          const golfer = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
          const played = [], keep = Sfx.play;
          Sfx.play = function (k, a) { played.push(k + (a ? '!' : '')); };
          o.legend = {};
          try {
            for (const id of ['demonic', 'ascended', 'divine']) {
              S.outfit = id; buildSprites();
              Scene.walkOn = false; Scene.swingT = 0; Scene.fairyMove = null; Scene.moveT = 999; Scene.t = 10;
              const L = o.legend[id] = {};
              // what the moment adds, T seconds in, over him as he is
              const at = (d, T) => {
                Scene.legend = null; QUIET = false; played.length = 0;
                Scene.t = 10 - T; Scene.happyDance(d); QUIET = true; Scene.t = 10;
                const sound = played.join(' '), on = diff(golfer(), (() => { const k = Scene.legend; Scene.legend = null; const a = golfer(); Scene.legend = k; return a; })());
                Scene.legend = null;
                // out: thrown clear of him; far: out of the close ring about
                // him it keeps to (the user asked: no more up the sky)
                return { sound, n: on.length, out: on.filter(([x, y]) => x < box.x0 - 2 || x > box.x1 + 2 || y < box.y0 - 2).length,
                         far: on.filter(([x, y]) => Math.abs(x - cx) > w * 1.9 || y < box.y0 - h * 0.6).length };
              };
              // only on an albatross or an ace, for half a second
              L.birdie = at(-1, 0.15); L.eagle = at(-2, 0.15); L.alb = at(-3, 0.15); L.ace = at(-4, 0.15);
              L.over = at(-3, LEGEND_DUR + 0.05); L.dur = LEGEND_DUR;
              // the burst itself, out of his outline, taken away from the same frame
              Scene.legend = { t0: Scene.t - 0.3, big: false, dur: LEGEND_DUR };
              { const a = golfer(), keepB = window.outlineBurst; window.outlineBurst = () => {}; const b2 = golfer(); window.outlineBurst = keepB;
                const B2 = diff(a, b2); L.burst = { n: B2.length, clear: B2.filter(([x, y]) => x < box.x0 - 2 || x > box.x1 + 2 || y < box.y0 - 2).length }; }
              Scene.legend = null;
              // not in the plain golfer
              S.outfit = 'classic'; buildSprites(); L.plain = at(-4, 0.15); S.outfit = id; buildSprites();
              // never while the game is quiet (a catch-up, a check)
              Scene.legend = null; QUIET = true; Scene.happyDance(-4); L.quiet = !!Scene.legend;
              // and the battery saver starting puts an end to it
              QUIET = false; Scene.happyDance(-4); saverOn(); L.saver = !!Scene.legend; saverOff(); QUIET = true; Scene.legend = null;
            }
            // ---- and a flourish for every other effect skin ----
            o.flourish = {};
            const fxOutfits = B.OUTFITS.filter(x => x.fx && !['demonic', 'ascended', 'divine'].includes(x.fx));
            for (const O of fxOutfits) {
              S.styleOwn['o:' + O.id] = 1; S.outfit = O.id; buildSprites();
              Scene.walkOn = false; Scene.swingT = 0; Scene.fairyMove = null; Scene.moveT = 999;
              // (the whole of him, his ground and all, as the frame draws it)
              const whole = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolferGround(); Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
              const at = (d, T) => {
                Scene.flourish = null; Scene.legend = null; QUIET = false; played.length = 0;
                Scene.t = 10 - T; Scene.happyDance(d); QUIET = true; Scene.t = 10;
                const F0 = Scene.flourish, sound = played.join(' ');
                const on = whole(); Scene.flourish = null; const off = diff(on, whole());
                return { sound, n: off.length, big: F0 ? F0.big : null, dur: F0 ? +F0.dur.toFixed(2) : null, legend: !!Scene.legend,
                         far: off.filter(([x, y]) => Math.abs(x - cx) > w * 1.9 || y < box.y0 - h * 0.6).length };
              };
              o.flourish[O.fx] = { birdie: at(-1, 0.15), eagle: at(-2, 0.15), alb: at(-3, 0.15), ace: at(-4, 0.15), over: at(-3, FLOURISH_DUR + 0.05) };
            }
            Scene.flourish = null;
          } finally { Sfx.play = keep; Scene.legend = null; Scene.flourish = null; QUIET = true; }
        }
        // his ground goes down before the pin and a putt rolling away beyond
        // him, which stand on it (drawn with him, it covered them): the order
        // of a frame, and the ball seen as the putt is struck over a ground
        // laid solid for it (his sigil is open where the ball first rolls)
        {
          S.outfit = 'ascended'; buildSprites();
          startHole(); const D2 = derive();
          S.yards = 0; S.doneT = null;
          Scene.camD = LEN - B_GREEN_STAND; Scene.walkTo = LEN; Scene.swingT = 0; Scene.walkOn = false; Scene.restBall = null; Scene.balls.length = 0;
          Scene.upT = Scene.t - 1; Scene.cupT = 0; Scene.fairyMove = null; Scene.moveT = 999;
          const order = [], keep = {}, cam = [Scene.camD, Scene.walkTo, Scene.upT];
          for (const k of ['drawGolferGround', 'drawFlagstick', 'drawGolfer']) { keep[k] = Scene[k]; Scene[k] = function () { order.push(k); return keep[k].apply(this, arguments); }; }
          const F = STYLEFX.ascended, g0 = F.ground;
          F.ground = function (c, g) { c.globalAlpha = 1; c.fillStyle = '#01FE02'; c.beginPath(); c.ellipse(g.cx, g.bot, g.w * 1.2, g.h * 0.2, 0, 0, Math.PI * 2); c.fill(); };
          try {
            const T = PUTT_HIT + 0.01;
            Scene.putt = { t0: Scene.t - T, d0: Scene.camD, hit: 1 };
            Scene.draw(0, D2);
            const q = Scene.puttBall(T), bp = Scene.proj(q.d, q.lat), X = Math.round(bp.x), Y = Math.round(bp.y);
            const px2 = Scene.b.getImageData(X, Y - 2, 3, 3).data, near = Scene.b.getImageData(X - 5, Y - 6, 12, 10).data;
            let white = 0, ground = 0;
            for (let i = 0; i < px2.length; i += 4) if (px2[i] > 225 && px2[i + 1] > 225 && px2[i + 2] > 225) white++;
            for (let i = 0; i < near.length; i += 4) if (near[i] === 1 && near[i + 1] === 254 && near[i + 2] === 2) ground++;
            o.layer = { order: order.join(' '), white, inSigil: ground >= 20 };
          } finally { F.ground = g0; for (const k in keep) Scene[k] = keep[k]; Scene.putt = null; Scene.cupT = 0; [Scene.camD, Scene.walkTo, Scene.upT] = cam; }
        }
        // and a golfer with no belt colour of his own keeps the tan sole
        {
          S.outfit = 'classic'; S.caddie = 'bib'; buildSprites();
          const p = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * p.s));
          const golfer = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
          o.plainSole = soles(golfer, { y0: p.y - h }, h);
        }
        // the other skins with a skin of their own have their arms in it too
        o.otherArms = {};
        for (const id of ['void', 'midas', 'ghost']) {
          S.styleOwn['o:' + id] = 1; S.outfit = id; S.caddie = 'bib'; buildSprites();
          const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); SPRITE.caddie = k;
          const all = px(), tone = [PX.skin, PX.skin2].map(s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]);
          let n = 0; for (let i = 0; i < all.length; i += 4) if (all[i + 3] && tone.some(t => t[0] === all[i] && t[1] === all[i + 1] && t[2] === all[i + 2])) n++;
          o.otherArms[id] = n;
        }
      } finally {
        QUIET = false; styleCat = 'golfer';
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    const J = x => JSON.stringify(x);
    if (r.price.demonic !== r.price.divine || r.price.ascended !== 3500) f('prices: ' + J(r.price) + ' (the Demonic at the Divine\'s price, the Ascended 3500)');
    const dv = r.sets.divine.cost;
    for (const id of ['demonic', 'ascended']) {
      const S2 = r.sets[id];
      if (!S2.have || !S2.fx) f('the ' + id + ' set is missing a piece, or a piece has no effect: ' + J(S2));
      if (S2.ballKind !== 'ball' || S2.trailKind) f('the ' + id + ' set\'s ball and trail are not a ball and a trail: ' + J(S2));
      const k = S2.cost[0] / dv[0];
      const want = dv.map((v, i) => i === 0 ? S2.cost[0] : i === 1 ? Math.round(v * k / 5) * 5 : Math.round(v * k / 50) * 50);
      if (J(S2.cost) !== J(want)) f('the ' + id + ' set costs ' + J(S2.cost) + ', not the Divine\'s proportion ' + J(want));
      const lv = id === 'ascended' ? 2 : 1;
      if (S2.top.some(t => t !== lv)) f('the ' + id + ' pieces are not all marked ' + (lv > 1 ? 'Mythic' : 'Legendary') + ': ' + J(S2.top));
    }
    if (r.badges.Ascended !== 'MYTHIC' || r.badges.Demonic !== 'LEGENDARY' || r.badges.Divine !== 'LEGENDARY') f('the Style tab\'s badges: ' + J(r.badges));
    const dm = r.drawn.demonic, as = r.drawn.ascended;
    // (counted past the box he is drawn in, which is wider than he is)
    for (const [nm, V] of [['Demonic', dm.wing], ['Divine', r.divine.wing]]) {
      for (const k of ['addr', 'top']) { const q = V[k];
        if (!(q.n >= 40 && q.behind >= q.n * 0.6 && q.up >= 8) || q.front) f('the ' + nm + ' wings side on (' + k + '): ' + J(q) + ' (on his back behind him and up off it, none in front)'); }
      if (!(V.backL >= 12 && V.backR >= 12)) f('the ' + nm + ' wings walking away: ' + V.backL + ' and ' + V.backR + ' pixels either side of him (spread from behind)');
    }
    if (!(dm.cWings >= 30)) f('the Demonic caddie\'s wings: ' + dm.cWings + ' pixels');
    if (!(as.cape >= 40 && as.capeBehind >= 25 && as.capeBack >= 100))
      f('the Ascended cape: ' + as.cape + ' pixels, ' + as.capeBehind + ' behind him, ' + as.capeBack + ' down his back as he walks away');
    if (!(as.hairBack >= 25 && as.hairReach >= 5)) f('the Ascended hair of fire: ' + as.hairBack + ' pixels back from his head, reaching ' + as.hairReach);
    if (!(as.core >= 10) || as.coreOff) f('the light in the Ascended\'s chest: ' + as.core + ' pixels, ' + as.coreOff + ' of them off his chest');
    if (!(as.hand >= 2)) f('the Ascended hands in their own magenta: ' + as.hand + ' pixels');
    if (!(as.cTail >= 5 && as.cFlame >= 4 && as.cGreen >= 1)) f('the imp: tail ' + as.cTail + ', flame ' + as.cFlame + ', green eye ' + as.cGreen + ' pixels');
    // the ultimate
    if (!(as.ground >= 120) || as.groundOff) f('the Ascended sigil: ' + as.ground + ' pixels, ' + as.groundOff + ' of them off the ground at his feet');
    if (!(as.auraIdle >= 120) || as.auraOff) f('the Ascended aura: ' + as.auraIdle + ' pixels over six frames, ' + as.auraOff + ' of them away from him');
    if (!(as.orbit >= 25 && as.orbitL >= 3 && as.orbitR >= 3 && as.orbitFront >= 5) || as.orbitOff)
      f('the ring of shards: ' + as.orbit + ' pixels, ' + as.orbitL + '/' + as.orbitR + ' either side of him, ' + as.orbitFront + ' over a lap in front of his middle, ' + as.orbitOff + ' out of place');
    if (!(as.hornSweep <= -0.2) || !(as.hornsBack[0] >= 5 && as.hornsBack[1] >= 5))
      f('the horns: their top ' + as.hornSweep.toFixed(2) + ' of his helm behind their roots (swept back is past -0.2); from behind ' + J(as.hornsBack) + ' pixels either side');
    if (as.foot.l > 1.3 || as.foot.r > 1.3 || as.foot.up > 0.4 || as.foot.dn > 0.2)
      f('the Ascended takes too much of the screen: ' + J(as.foot) + ' (his widths either side of him, his heights above and below)');
    if (!(as.auraTop >= as.auraIdle * 1.2)) f('the aura does not swell as he winds up: ' + as.auraTop + ' pixels at the top of his backswing against ' + as.auraIdle + ' at address');
    if (!(as.sparks >= 6) || as.sparksOff || !(as.waveOut >= 8)) f('the strike: sparks ' + as.sparks + ' (' + as.sparksOff + ' away from the ball), a shockwave ' + as.waveOut + ' pixels out past the sigil');
    // the Demonic made the ultimate skin
    if (!(dm.auraIdle >= 120) || dm.auraOff || !(dm.auraTop >= dm.auraIdle * 1.2))
      f('the Demonic aura: ' + dm.auraIdle + ' pixels over six frames (' + dm.auraOff + ' away from him), ' + dm.auraTop + ' at the top of the backswing');
    if (!(dm.chains >= 30 && dm.chainsL >= 3 && dm.chainsR >= 3 && dm.chainsFront >= 5) || dm.chainsOff)
      f('the chains of fire: ' + dm.chains + ' pixels, ' + dm.chainsL + '/' + dm.chainsR + ' either side, ' + dm.chainsFront + ' over a lap in front of his middle, ' + dm.chainsOff + ' out of place');
    if (!(dm.hornCurl >= 0.8)) f('the Demonic horns do not curl over: the widest row of their top ' + dm.hornCurl.toFixed(2) + ' of his cap');
    if (!(dm.fists >= 4) || !(dm.blast >= 6) || dm.blastOff || !(dm.cracks >= 8) || dm.cracksIdle)
      f('the Demonic swing: hands on fire ' + dm.fists + ', fire off the ball ' + dm.blast + ' (' + dm.blastOff + ' away from it), cracks out past the pit ' + dm.cracks + ' (' + dm.cracksIdle + ' at rest)');
    if (dm.foot.l > 1.4 || dm.foot.r > 1.4 || dm.foot.up > 0.45 || dm.foot.dn > 0.2)
      f('the Demonic takes too much of the screen: ' + J(dm.foot));
    // the moment
    for (const fx in r.flourish) {
      const F = r.flourish[fx];
      if (F.birdie.n || F.birdie.sound || F.eagle.n || F.eagle.sound) f('the ' + fx + ' flourish on a birdie ' + J(F.birdie) + ' or an eagle ' + J(F.eagle));
      if (!(F.alb.n >= 25) || F.alb.far || F.alb.sound !== 'flourish!' || F.alb.legend || F.alb.dur > 0.5) f('the ' + fx + ' flourish on an albatross: ' + J(F.alb) + ' (half a second, kept close about him)');
      if (!(F.ace.big && F.ace.n > F.alb.n) || F.ace.far) f('the ' + fx + ' flourish on an ace is no bigger, or strays: ' + J(F.ace));
      if (F.over.n) f('the ' + fx + ' flourish has not ended after its time: ' + F.over.n + ' pixels');
    }
    if (Object.keys(r.flourish).length !== 11) f('flourishes for ' + Object.keys(r.flourish).length + ' skins, not the eleven: ' + Object.keys(r.flourish).join(', '));
    const dvn = r.divine;
    if (!(dvn.rise >= 2) || !(dvn.sweep >= 2)) f('the Divine wings through a swing: up ' + dvn.rise + 'px at the top of the backswing, down ' + dvn.sweep + ' at the strike');
    if (!(dvn.ground >= 100) || dvn.groundOff) f('the Divine sun: ' + dvn.ground + ' pixels, ' + dvn.groundOff + ' off the ground at his feet');
    if (!(dvn.halo2 >= 10) || dvn.halo2Off) f('the Divine second halo: ' + dvn.halo2 + ' pixels, ' + dvn.halo2Off + ' away from over his head');
    if (!(dvn.feathers >= 3)) f('the Divine feathers drifting down: in ' + dvn.feathers + ' of 40 frames');
    if (!(dvn.sparks >= 6) || dvn.sparksOff || !(dvn.waveOut >= 8)) f('the Divine strike: light off the ball ' + dvn.sparks + ' (' + dvn.sparksOff + ' away from it), a ring ' + dvn.waveOut + ' out past the sun');
    for (const id of ['demonic', 'ascended', 'divine']) {
      const L = r.legend[id], snd = { demonic: 'hellfire', ascended: 'ascend', divine: 'choir' }[id];
      if (L.birdie.n || L.birdie.sound || L.eagle.n || L.eagle.sound) f('the ' + id + ' moment on a birdie ' + J(L.birdie) + ' or an eagle ' + J(L.eagle) + ' (only an albatross or an ace)');
      if (!(L.alb.out >= 40) || L.alb.far || L.alb.sound !== snd) f('the ' + id + ' moment on an albatross: ' + J(L.alb) + ' (a burst out of him, kept close about him, the sound ' + snd + ')');
      if (!(L.ace.n > L.alb.n * 1.05) || L.ace.far || L.ace.sound !== snd + '!') f('the ' + id + ' moment on an ace is not bigger, or strays: ' + J(L.ace) + ' against ' + J(L.alb));
      if (!(L.burst.n >= 60 && L.burst.clear >= 30)) f('the ' + id + ' burst out of him: ' + J(L.burst));
      if (L.dur > 0.5) f('the ' + id + ' moment lasts ' + L.dur + 's (half a second)');
      if (L.over.n) f('the ' + id + ' moment has not ended after its time: ' + L.over.n + ' pixels');
      if (L.plain.n || L.plain.sound) f('a plain golfer has a moment: ' + J(L.plain));
      if (L.quiet || L.saver) f('the ' + id + ' moment while the game is quiet ' + L.quiet + ', or through the battery saver starting ' + L.saver);
    }
    if (r.layer.order !== 'drawGolferGround drawFlagstick drawGolfer' || !r.layer.inSigil || !(r.layer.white >= 1))
      f('his ground over the pin or the putt: the frame draws ' + r.layer.order + '; the ball on his sigil ' + r.layer.inSigil + ', its white pixels ' + r.layer.white);
    for (const id of ['demonic', 'ascended']) {
      const d = r.drawn[id];
      if (!(d.top >= 12 && d.topAbove >= 6) || d.topBelow || d.topWide) f('the ' + id + ' horns: ' + J(d) + ' (standing up off his cap, and nowhere else)');
      if (!(d.eyes >= 1) || d.eyesOff) f('the ' + id + ' eyes: ' + d.eyes + ' pixels, ' + d.eyesOff + ' of them away from his eye');
      if (d.plain || !(d.own >= 12)) f('the ' + id + ' golfer\'s arms: ' + d.plain + ' pixels of the plain skin tone on him, ' + d.own + ' of his own');
      if (!(d.cTop >= 4 && d.cEyes >= 1)) f('the ' + id + ' caddie: horns ' + d.cTop + ', eyes ' + d.cEyes + ' pixels');
    }
    for (const id of ['demonic', 'ascended']) {
      const so = r.drawn[id].sole;
      if (so.tan || !(so.own >= 1)) f('the ' + id + ' walking away: ' + so.tan + ' pixels of the plain tan sole, ' + so.own + ' of his belt\'s colour on his lifted boot');
    }
    if (!(r.plainSole.tan >= 1) || r.plainSole.own) f('the Tour Classic walking away: ' + J(r.plainSole) + ' (the tan sole on his lifted boot, having no belt colour of his own)');
    const oa = Object.entries(r.otherArms).filter(([, n]) => n);
    if (oa.length) f('plain skin tone on skins with their own: ' + oa.map(([k, n]) => k + ' ' + n).join(', '));
    return ['the Demonic at the Divine\'s ' + r.price.demonic + ', the Ascended at ' + r.price.ascended + '; club, trail, ball and caddie for each in the Divine\'s proportion (' + J(r.sets.ascended.cost) + '), Legendary and Mythic',
      'the Demonic: wings on his back side on (' + dm.wing.addr.behind + 'px behind him, none in front) and spread from behind walking away (' + dm.wing.backL + '/' + dm.wing.backR + '), horns ' + dm.top + ', eyes at his eye; his caddie\'s wings ' + dm.cWings,
      'the Ascended: a cape ' + as.cape + ' (' + as.capeBack + ' down his back walking away), horns ' + as.top + ', hair of fire reaching ' + Math.round(as.hairReach) + 'px back, the light in his chest, magenta hands; the imp\'s tail ' + as.cTail + ', flame ' + as.cFlame + ', green eyes',
      'his arms in his own skin, on these and on the Void Walker, Midas and the Ghost; his soles in his belt\'s colour walking away (' + r.drawn.ascended.sole.own + 'px), a plain golfer\'s tan',
      'the ultimate Ascended: a sigil at his feet (' + as.ground + 'px), an aura of flame (' + Math.round(as.auraTop / as.auraIdle * 100 - 100) + '% more at the top of the backswing), a ring of shards passing in front of him and behind, horns swept back (their tops ' + (-as.hornSweep).toFixed(2) + ' of his helm behind their roots), sparks and a shockwave as he strikes; ' + as.foot.l + '/' + as.foot.r + ' of his width either side and ' + as.foot.up + ' of his height over him at most',
      'his ground under the pin and a putt rolling away (' + r.layer.order + ')',
      'the ultimate Demonic: an aura of hellfire (' + Math.round(dm.auraTop / dm.auraIdle * 100 - 100) + '% more at the top of the backswing), chains of fire round him, horns curling over (their top row ' + dm.hornCurl.toFixed(2) + ' of his cap across), hands on fire, the ground cracking at the strike (' + dm.cracks + 'px); ' + dm.foot.l + '/' + dm.foot.r + ' of his width either side, ' + dm.foot.up + ' of his height over him',
      'the ultimate Divine: wings of feathers side on and from behind, up ' + dvn.rise + 'px through the backswing and down at the strike; a sun at his feet, a second halo, feathers drifting down, light off the ball and a ring of light as he strikes',
      'a flourish on an albatross or an ace for each of the other ' + Object.keys(r.flourish).length + ' effect skins (' + Object.entries(r.flourish).map(([k, v]) => k + ' ' + v.alb.n).join(', ') + 'px), half a second, close about him, with a sound, more on an ace; none on a birdie or an eagle',
      'the moment on an albatross: the Demonic ' + r.legend.demonic.alb.n + 'px (' + r.legend.demonic.ace.n + ' on an ace), the Ascended ' + r.legend.ascended.alb.n + 'px (' + r.legend.ascended.ace.n + '), the Divine ' + r.legend.divine.alb.n + 'px, bursting out of him and close about him for half a second, each with its sound; none on an eagle, in a plain golfer, while quiet or once over'];
  }
};
