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
 *     The Demonic (redrawn after a fourth picture, a demon knight in
 *     black plate edged in gold): streamers of lava streaming back off him,
 *     on him and his caddie; four black horns swept back off his head; a
 *     ram's skull on his shoulder (on both from behind); fangs at his mask
 *     and red eyes; his dais of stone under his feet, and nowhere else. The Ascended,
 *     redrawn after a third picture as a hooded star-walker: a galaxy cape
 *     streaming behind him, and hanging down his back as he walks away;
 *     wings of feathers on his back behind him (none out in front), spread
 *     either side as he walks away; two ears on his hood; a silver mantle,
 *     his hood down past his face, a gauntlet; hands in their own silver;
 *     his caddie's wings behind him. Both: eyes where his eye is; walking
 *     away, the sole of his lifted boot in his belt's colour (it flashed the
 *     plain tan under the Ascended's cape), while a plain golfer keeps the tan
 *   - his arms in his own skin: they were always the plain tone, so the red
 *     Demonic had peach arms (and the Void Walker, Midas and the Ghost too)
 *   - the Ascended made the ultimate skin ("really go nuts, but not so much
 *     that it takes up a ton of the screen"): a disc on the ground at his
 *     feet and nowhere else; bits of light glitching close about him; motes
 *     drawn in as he winds up; sparks off the ball and a ring out past the
 *     disc as he strikes; and all of it within 1.4 of his widths either
 *     side of him and 0.4 of his height over him, the most over six seconds
 *   - a skin's ground goes down before the pin and a putt rolling away beyond
 *     him, which stand on it: drawn with him, it covered them
 *   - the Demonic made the ultimate skin too: an aura of hellfire swelling as
 *     he winds up, two ribbons of fire swirling round him, the crest, his
 *     hands on fire, the ground cracking and fire off the ball at the strike
 *   - the Divine, reworked after two pictures the user sent of a celestial
 *     monk ("obviously no skin showing"): no pixel of him in a skin tone;
 *     ribbons of jade and gold round him either side, close, drawn in as he
 *     winds up and flung out as he strikes; since the user's third
 *     picture a great ring of blue and gold behind him, a crown, the long
 *     nosed crimson mask, his hair streaming back, beads, sash, guards
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
            // (reworked after a second picture: torn wrappings streaming
            // back off him side on, over his back and out as he walks away)
            d.wing = {};
            for (const [k, ph] of [['addr', 0], ['top', 0.36]]) {
              Scene.swingT = ph ? Scene.swingDur * (1 - ph) : 0;
              const W = part(id, 'streamers', golfer);
              d.wing[k] = { n: W.length, behind: W.filter(([x]) => x < box.x0 + w * 0.4).length, front: W.filter(([x]) => x > box.x1 + 2).length };
            }
            Scene.swingT = 0; Scene.walkOn = true; Scene.walkPh = 0.2;
            { const W = part(id, 'streamers', golfer), bx0 = box.x0 + Math.round(w * 0.42) - Math.round(w * 0.5);
              d.wing.back = W.length; d.wing.backL = W.filter(([x]) => x < bx0 + w * 0.4).length; d.wing.backR = W.filter(([x]) => x > bx0 + w * 0.6).length; }
            Scene.walkOn = false;
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
            // two ribbons of fire swirling round him, both sides, and over a
            // lap in front of his middle
            d.chains = 0; d.chainsL = 0; d.chainsR = 0; d.chainsOff = 0; d.chainsFront = 0;
            for (let k = 0; k < 8; k++) {
              Scene.t = 1.3 + k * 0.37;
              const ch = part(id, 'swirl', golfer);
              d.chains += ch.length; d.chainsL += ch.filter(([x]) => x < box.x0).length; d.chainsR += ch.filter(([x]) => x > box.x1).length;
              d.chainsOff += ch.filter(([x, y]) => Math.abs(x - cx) > w * 1.2 || y < box.y0 + h * 0.1 || y > box.y0 + h * 0.95).length;
              d.chainsFront += ch.filter(([x, y]) => x > box.x0 + w * 0.35 && x < box.x0 + w * 0.65 && y > box.y0 + h * 0.3 && y < box.y0 + h * 0.8).length;
            }
            Scene.t = 1.3;
            // the crest of blades swept back off his hood: their tips behind
            // their roots and up over his head
            const hn = part(id, 'crest', golfer).filter(([x, y]) => y < head.y);
            d.hornCurl = hn.length ? (head.x - hn.reduce((a, [x]) => a + x, 0) / hn.length) / head.w : 0;
            d.crestUp = hn.length ? (head.y - Math.min(...hn.map(([, y]) => y))) / h : 0;
            // (redrawn after the user's fourth picture) a ram's skull on his
            // shoulder, fangs at his mask, eyes burning red, and his dais of
            // stone with its star of fire under his feet
            { const sk = part(id, 'skullGuard', golfer);
              d.skull = sk.length; d.skullOff = sk.filter(([x, y]) => y < box.y0 + h * 0.12 || y > box.y0 + h * 0.5 || x < box.x0 || x > box.x1 + 2).length;
              const fg = part(id, 'fangs', golfer); d.fangs = fg.length; d.fangsOff = fg.filter(([x, y]) => Math.abs(y - eye.y) > h * 0.12).length;
              Scene.walkOn = true; Scene.walkPh = 0.2;
              const sb = part(id, 'skullGuard', golfer); d.skullBackL = sb.filter(([x]) => x < p.x).length; d.skullBackR = sb.filter(([x]) => x > p.x).length;
              Scene.walkOn = false;
              const ey = part(id, 'eyes', golfer); d.eyesRed = ey.length;
              const ds = part(id, 'dais', golfer), rx = w * 1.2 + 2, ry = h * 0.13 + 2;
              d.dais = ds.length; d.daisOut = ds.filter(([x, y]) => ((x - cx) / rx) ** 2 + ((y - p.y) / (ry + h * 0.04)) ** 2 > 1.3).length; }
            // at the top of the backswing his hands on fire; at the strike the
            // ground cracks open out past the pit, and fire flies off the ball
            Scene.swingT = Scene.swingDur * (1 - 0.36);
            d.fists = part(id, 'fists', golfer).length;
            Scene.swingT = Scene.swingDur * (1 - 0.66);
            const bx = box.x0 + w * 1.19, bl = part(id, 'blast', golfer);
            d.blast = bl.length; d.blastOff = bl.filter(([x, y]) => Math.abs(x - bx) > w * 0.8 || y > p.y + 2 || y < p.y - h * 0.5).length;
            d.cracks = part(id, 'cracks', golfer).filter(([x]) => Math.abs(x - cx) > w * 1.5 + 2).length;
            Scene.swingT = 0;
            // (at rest the ground round the pit smoulders, cracked close about
            // it, dim: the user asked for the grounds more prominent; only the
            // strike runs them out past that)
            d.cracksIdle = part(id, 'cracks', golfer).filter(([x]) => Math.abs(x - cx) > w * 1.5 + 2).length;
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
            // (redrawn after the user's third picture: a hooded star-walker)
            // the galaxy cape: behind him, out past his legs; walking away, down his back
            const cape = part(id, 'cape', golfer);
            d.cape = cape.length; d.capeBehind = cape.filter(([x]) => x < box.x0 + w * 0.25).length;
            Scene.walkOn = true; Scene.walkPh = 0.2;
            d.capeBack = part(id, 'cape', golfer).filter(([x, y]) => x >= box.x0 && x <= box.x1 && y > box.y0 + h * 0.3 && y < box.y0 + h * 0.8).length;
            Scene.walkOn = false;
            // wings of feathers following his profile: side on, on his back
            // behind him and up off it, none out in front of him; walking
            // away, spread either side of him
            d.wing = {};
            for (const [k, ph] of [['addr', 0], ['top', 0.36]]) {
              Scene.swingT = ph ? Scene.swingDur * (1 - ph) : 0;
              const W = part(id, 'wings', golfer);
              d.wing[k] = { n: W.length, behind: W.filter(([x]) => x < box.x0 + w * 0.6).length, up: W.filter(([, y]) => y < head.y + h * 0.1).length, front: W.filter(([x]) => x > box.x0 + w * 0.75).length };
            }
            Scene.swingT = 0; Scene.walkOn = true; Scene.walkPh = 0.2;
            { const W = part(id, 'wings', golfer); d.wing.backL = W.filter(([x]) => x < p.x - w * 0.3).length; d.wing.backR = W.filter(([x]) => x > p.x + w * 0.3).length; }
            // and from behind, the silver mantle across his shoulders
            d.mantleBack = part(id, 'mantle', golfer).filter(([x, y]) => Math.abs(x - p.x) < w * 0.45 && y < box.y0 + h * 0.45).length;
            Scene.walkOn = false;
            d.mantle = part(id, 'mantle', golfer).length;
            d.drape = part(id, 'drape', golfer).length;
            d.gauntlet = part(id, 'gauntlet', golfer).length;
            const cx = box.x0 + w * 0.55, [rx, ry] = STYLEFX.ascended.sigilSize({ w, h });
            // the disc on the ground under him (its rim lit out over the
            // grass round it), and nowhere else
            const inDisc = (x, y, m) => ((x - cx) / rx) ** 2 + ((y - p.y) / ry) ** 2 <= (1 + m / ry) ** 2;
            const gr = part(id, 'ground', golfer);
            d.ground = gr.length; d.groundOff = gr.filter(([x, y]) => !inDisc(x, y, 3)).length;
            // bits of light glitching about him, close
            d.glitch = 0; d.glitchOff = 0;
            for (let k = 0; k < 6; k++) {
              Scene.t = 1.3 + k * 0.53;
              const gl = part(id, 'glitch', golfer);
              d.glitch += gl.length; d.glitchOff += gl.filter(([x, y]) => Math.abs(x - cx) > w * 1.3 || y > p.y || y < box.y0 - h * 0.15).length;
            }
            Scene.t = 1.3;
            // all of it, against him bare: how much of the screen it takes,
            // the most over six seconds of him standing there
            const bare = () => { const O = outfitNow(), fx = O.fx; O.fx = null; try { return golfer(); } finally { O.fx = fx; } };
            d.foot = { l: 0, r: 0, up: 0, dn: 0 };
            for (let k = 0; k < 14; k++) {
              Scene.t = 1.3 + k * 0.43;
              const foot = diff(golfer(), bare());
              const ext = { l: (cx - Math.min(...foot.map(([x]) => x))) / w, r: (Math.max(...foot.map(([x]) => x)) - cx) / w,
                            up: (box.y0 - Math.min(...foot.map(([, y]) => y))) / h, dn: (Math.max(...foot.map(([, y]) => y)) - p.y) / h };
              for (const e in ext) d.foot[e] = Math.max(d.foot[e], +ext[e].toFixed(2));
            }
            Scene.t = 1.3;
            // as he winds up, motes drawn into him; at the strike, light
            // flying up off the ball, and a ring running out past the disc
            Scene.swingT = Scene.swingDur * (1 - 0.3);
            d.motes = part(id, 'motes', golfer).length;
            Scene.swingT = Scene.swingDur * (1 - 0.62);
            const bx = box.x0 + w * 1.19, sp = part(id, 'sparks', golfer);
            d.sparks = sp.length; d.sparksOff = sp.filter(([x, y]) => Math.abs(x - bx) > w * 0.8 || y > p.y + 2 || y < p.y - h * 0.5).length;
            Scene.swingT = Scene.swingDur * (1 - 0.7);
            d.waveOut = part(id, 'ground', golfer).filter(([x]) => Math.abs(x - cx) > rx + 4).length;
            Scene.swingT = 0;
          }
          const top = part(id, id === 'demonic' ? 'crest' : 'ears', golfer);
          d.top = top.length; d.topAbove = top.filter(([x, y]) => y < head.y).length;
          d.topBelow = top.filter(([x, y]) => y > head.y + h * 0.1).length;
          d.topWide = top.filter(([x]) => Math.abs(x - head.x) > head.w * (id === 'demonic' ? 2.6 : 1.4)).length;
          const eyes = part(id, 'eyes', golfer);
          d.eyes = eyes.length; d.eyesOff = eyes.filter(([x, y]) => Math.abs(x - eye.x) > 4.5 || Math.abs(y - eye.y) > 2.5).length;
          // his arms: none of the plain skin tone left on him
          const all = golfer(), hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
          const tone = [hex(PX.skin), hex(PX.skin2)], own = [hex(outfitNow().arm || outfitNow().skin), hex(outfitNow().arm2 || outfitNow().skin2)];   // (his arms, where they have a colour of their own)
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
          // (his wings side on, on his back: the caddie is always seen side on)
          const cb = Scene.fairyBox(box.x0, box.y0, w, h);
          if (id === 'demonic') { const cw = part(id, 'streamers', caddie); d.cWings = cw.length; d.cWingsBehind = cw.filter(([x]) => x < cb.x + cb.w * 0.5).length; }
          else { const cw = part(id, 'wings', caddie); d.cWings = cw.length; d.cWingsBehind = cw.filter(([x]) => x < cb.x + cb.w * 0.5).length; }
          d.cTop = part(id, id === 'demonic' ? 'crest' : 'ears', caddie).length;
          d.cEyes = part(id, 'eyes', caddie).length;
          d.cadSprite = cad === SPRITE.caddie;
        }
        // ---- the Divine: a celestial monk (the user's two pictures) ----
        {
          S.styleOwn['o:divine'] = 1; S.outfit = 'divine'; S.caddie = 'bib'; buildSprites();
          Scene.walkOn = false; Scene.swingT = 0; Scene.fairyMove = null; Scene.fairySay = null; Scene.moveT = 999; Scene.t = 1.3; Scene.legend = null;
          const golfer = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
          const p = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * p.s)), w = Math.max(4, Math.round(h * 40 / 58));
          const box = { x0: p.x - Math.round(w * 0.42), y0: p.y - h }; box.x1 = box.x0 + w; box.y1 = box.y0 + h;
          const head = { x: box.x0 + w * CAP_ADDR.x, y: box.y0 + h * CAP_ADDR.y, w: w * CAP_ADDR.w };
          const cx = box.x0 + w * 0.55, d = o.divine = {};
          // no skin showing: not a pixel of him, his arms or his hands in a skin tone
          { const F = STYLEFX.divine, keep = {}; for (const k of ['ground', 'back', 'body', 'front']) { keep[k] = F[k]; F[k] = () => {}; }
            const tones = new Set([PX.skin, PX.skin2, '#E0A060', '#9A5A30'].map(x => x.toLowerCase()));
            const hex = (A, i) => '#' + [A[i], A[i + 1], A[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
            let n = 0, skin = 0;
            try { for (const ph of [0, 0.36, 0.99]) { Scene.swingT = ph ? Scene.swingDur * (1 - ph) : 0; const A = golfer();
                for (let i = 0; i < A.length; i += 4) if (A[i + 3]) { n++; if (tones.has(hex(A, i))) skin++; } }
              Scene.walkOn = true; Scene.walkPh = 0.2; { const A = golfer(); for (let i = 0; i < A.length; i += 4) if (A[i + 3]) { n++; if (tones.has(hex(A, i))) skin++; } }
            } finally { Scene.walkOn = false; Scene.swingT = 0; Object.assign(F, keep); }
            d.skinPx = skin; d.bodyPx = n; }
          // ribbons of jade and gold about him, either side, close; drawn in
          // as he winds up and flung out as he strikes
          const spread = ph => { Scene.swingT = ph ? Scene.swingDur * (1 - ph) : 0; const R = part('divine', 'ribbons', golfer); Scene.swingT = 0;
            return { n: R.length, L: R.filter(([x]) => x < box.x0 - 1).length, R: R.filter(([x]) => x > box.x1 + 1).length,
                     far: R.filter(([x, y]) => Math.abs(x - cx) > w * 1.35 || y < box.y0 - h * 0.1 || y > p.y + 2).length,
                     span: R.length ? Math.max(...R.map(([x]) => x)) - Math.min(...R.map(([x]) => x)) : 0 }; };
          d.rib = spread(0); d.ribTop = spread(0.36); d.ribHit = spread(0.62);
          Scene.walkOn = true; Scene.walkPh = 0.2;
          { const R = part('divine', 'ribbons', golfer), bx0 = box.x0 + Math.round(w * 0.42) - Math.round(w * 0.5);
            d.ribBackL = R.filter(([x]) => x < bx0 - 1).length; d.ribBackR = R.filter(([x]) => x > bx0 + w + 1).length; }
          // from behind: his hair down his back, his sash, the skirt of his robe
          d.hairBack = part('divine', 'hair', golfer).length; d.skirt = part('divine', 'skirt', golfer).length;
          Scene.walkOn = false;
          // his caddie's ribbons
          S.styleOwn['c:divine'] = 1; S.caddie = 'divine'; buildSprites();
          { const caddie = () => { c.clearRect(0, 0, VW, VH); Scene.drawCaddie(c, box.x0, box.y0, w, h); return px(); };
            d.cRib = part('divine', 'ribbons', caddie).length; d.cHorns = part('divine', 'crown', caddie).length; }
          S.caddie = 'bib'; buildSprites();
          // what he wears (the user's third picture): the great ring of blue
          // and gold behind him, round his head and shoulders; a crown; hair
          // streaming back behind him, the long-nosed mask, beads, sash, guards
          const ring = part('divine', 'ring', golfer);
          d.ring = ring.length; d.ringOff = ring.filter(([x, y]) => Math.abs(x - head.x) > h * 0.6 || y > head.y + h * 0.7 || y < head.y - h * 0.25).length;
          d.ringAbove = ring.filter(([x, y]) => y < head.y).length;
          const horns = part('divine', 'crown', golfer);
          d.horns = horns.length; d.hornsOff = horns.filter(([x, y]) => Math.abs(x - head.x) > head.w * 1.3 || y > head.y + h * 0.15).length;
          const hair = part('divine', 'hair', golfer);
          d.hair = hair.length; d.hairBehind = hair.filter(([x]) => x < head.x - head.w * 0.3).length;
          for (const k of ['nose', 'beads', 'sash', 'guards']) d[k] = part('divine', k, golfer).length;
          // the seal at his feet and nowhere else
          const gr = part('divine', 'ground', golfer);
          d.ground = gr.length; d.groundOff = gr.filter(([x, y]) => Math.abs(x - cx) > w * 1.3 + 1 || Math.abs(y - p.y) > h * 0.15 + 1.5).length;
          // at the strike, jade light off the ball and a ring out past the seal
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
            for (const id of ['demonic', 'ascended', 'divine', 'cosmic']) {
              S.styleOwn['o:' + id] = 1; S.outfit = id; buildSprites();
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
            const fxOutfits = B.OUTFITS.filter(x => x.fx && !['demonic', 'ascended', 'divine', 'cosmic'].includes(x.fx));
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
            // ---- a pure strike with the three dearest drivers ----
            o.pure = {};
            S.outfit = 'classic'; buildSprites();
            const G2 = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.clubArc = []; Scene.drawGolfer(D); SPRITE.caddie = k; return px(); };
            const bxp = box.x0 + w * 1.19;
            for (const id of ['divine', 'demonic', 'ascended', 'cosmic', 'steel']) {
              S.styleOwn['k:' + id] = 1; S.club = id;
              const hit = (crit, T) => {
                Scene.pure = null; played.length = 0; QUIET = false;
                Scene.t = 10 - T; Scene.pendingBall = { crit, el: null, dmg: 0 }; Scene.launch(); QUIET = true; Scene.balls.length = 0; Scene.t = 10;
                Scene.swingT = Scene.swingDur * (1 - 0.62);
                const P0 = Scene.pure, sound = played.filter(k => /pure/.test(k)).join(' ');
                const a = G2(); Scene.pure = null; const b2 = G2(); Scene.swingT = 0;
                const d2 = diff(a, b2);
                return { set: !!P0, sound, n: d2.length, off: d2.filter(([x, y]) => Math.abs(x - bxp) > h * 0.5 || Math.abs(y - p.y) > h * 0.5).length };
              };
              o.pure[id] = { crit: hit(true, 0.1), plain: hit(false, 0.1), over: hit(true, PURE_DUR + 0.05) };
            }
            S.club = 'steel'; Scene.pure = null; o.pureDur = PURE_DUR;
          } finally { Sfx.play = keep; Scene.legend = null; Scene.flourish = null; QUIET = true; }
        }
        // his ground goes down before the pin and a putt rolling away beyond
        // him, which stand on it (drawn with him, it covered them): the order
        // of a frame, and the ball seen as the putt is struck over a ground
        // laid solid for it (his sigil is open where the ball first rolls)
        {
          S.outfit = 'ascended'; buildSprites();
          startHole(); const D2 = derive();
          S.yards = 0; S.doneT = null; S.elapsed = S.parTime * 0.5;   // (a par: an ace would go straight in)
          Scene.camD = Scene.pinD() - B_GREEN_STAND; Scene.walkTo = LEN; Scene.swingT = 0; Scene.walkOn = false; Scene.restBall = null; Scene.balls.length = 0;
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
    for (const k of ['addr', 'top']) { const q = dm.wing[k];
      if (!(q.n >= 40 && q.behind >= q.n * 0.7) || q.front) f('the Demonic streamers side on (' + k + '): ' + J(q) + ' (streaming back behind him, none in front)'); }
    if (!(dm.wing.back >= 30 && dm.wing.backL >= 5 && dm.wing.backR >= 5)) f('the Demonic streamers walking away: ' + J(dm.wing) + ' (over his back and out either side)');
    if (!(dm.cWings >= 15 && dm.cWingsBehind >= dm.cWings * 0.6)) f('the Demonic caddie\'s streamers: ' + dm.cWings + ' pixels, ' + dm.cWingsBehind + ' of them behind him');
    if (!(as.cape >= 40 && as.capeBehind >= 25 && as.capeBack >= 100))
      f('the Ascended cape: ' + as.cape + ' pixels, ' + as.capeBehind + ' behind him, ' + as.capeBack + ' down his back as he walks away');
    for (const k of ['addr', 'top']) { const q = as.wing[k];
      if (!(q.n >= 30 && q.behind >= q.n * 0.85 && q.up >= q.n * 0.5) || q.front) f('the Ascended wings side on (' + k + '): ' + J(q) + ' (on his back behind him and up off it, none in front)'); }
    if (!(as.wing.backL >= 10 && as.wing.backR >= 10)) f('the Ascended wings walking away: ' + J(as.wing) + ' (spread either side of him)');
    if (!(as.mantle >= 6 && as.mantleBack >= 30 && as.drape >= 4 && as.gauntlet >= 3))
      f('what the Ascended wears: his mantle ' + as.mantle + ' (' + as.mantleBack + ' across his shoulders from behind), his hood down past his face ' + as.drape + ', his gauntlet ' + as.gauntlet + ' pixels');
    if (!(as.hand >= 2)) f('the Ascended hands in their own silver: ' + as.hand + ' pixels');
    if (!(as.cWings >= 10 && as.cWingsBehind >= as.cWings * 0.6)) f('the Ascended caddie\'s wings: ' + as.cWings + ' pixels, ' + as.cWingsBehind + ' of them behind him');
    if (!(as.ground >= 120) || as.groundOff) f('the Ascended disc: ' + as.ground + ' pixels, ' + as.groundOff + ' of them off the ground at his feet');
    if (!(as.glitch >= 10) || as.glitchOff) f('the Ascended glitching: ' + as.glitch + ' pixels over six frames, ' + as.glitchOff + ' of them away from him');
    // (his wings made "a lot bigger" at the user's asking: up to two thirds
    // of his height over him, still no wider than the rest)
    if (as.foot.l > 1.4 || as.foot.r > 1.4 || as.foot.up > 0.66 || as.foot.dn > 0.2)
      f('the Ascended takes too much of the screen: ' + J(as.foot) + ' (his widths either side of him, his heights above and below)');
    if (!(as.motes >= 4)) f('no motes drawn into the Ascended as he winds up: ' + as.motes + ' pixels');
    if (!(as.sparks >= 6) || as.sparksOff || !(as.waveOut >= 8)) f('the strike: sparks ' + as.sparks + ' (' + as.sparksOff + ' away from the ball), a ring ' + as.waveOut + ' pixels out past the disc');
    // the Demonic made the ultimate skin
    if (!(dm.auraIdle >= 120) || dm.auraOff || !(dm.auraTop >= dm.auraIdle * 1.2))
      f('the Demonic aura: ' + dm.auraIdle + ' pixels over six frames (' + dm.auraOff + ' away from him), ' + dm.auraTop + ' at the top of the backswing');
    if (!(dm.chains >= 200 && dm.chainsL >= 20 && dm.chainsR >= 20 && dm.chainsFront >= 20) || dm.chainsOff)
      f('the ribbons of fire: ' + dm.chains + ' pixels over eight frames, ' + dm.chainsL + '/' + dm.chainsR + ' either side, ' + dm.chainsFront + ' in front of his middle, ' + dm.chainsOff + ' out of place');
    if (!(dm.skull >= 15 && !dm.skullOff && dm.skullBackL >= 10 && dm.skullBackR >= 10)) f('the Demonic\'s skulls on his shoulders: ' + J({ n: dm.skull, off: dm.skullOff, backL: dm.skullBackL, backR: dm.skullBackR }) + ' (on his shoulder, on both from behind)');
    if (!(dm.fangs >= 3 && !dm.fangsOff && dm.eyesRed >= 2)) f('the Demonic\'s mask: fangs ' + dm.fangs + ' (' + dm.fangsOff + ' off his face), eyes ' + dm.eyesRed);
    if (!(dm.dais >= 150 && !dm.daisOut)) f('the Demonic\'s dais: ' + dm.dais + ' pixels, ' + dm.daisOut + ' out past it (a disc of stone under his feet)');
    if (!(dm.hornCurl >= 0.3 && dm.crestUp >= 0.08)) f('the Demonic crest is not swept back and up: ' + dm.hornCurl.toFixed(2) + ' of his hood behind, ' + dm.crestUp.toFixed(2) + ' of his height over it');
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
    if (!(r.pureDur <= 0.5)) f('a pure strike\'s flourish lasts ' + r.pureDur + 's (a fast bag strikes pure every second or two)');
    for (const id in r.pure) {
      const P = r.pure[id];
      if (id === 'steel') { if (P.crit.set || P.crit.n || P.crit.sound) f('a pure strike with a plain club flourishes: ' + J(P.crit)); continue; }
      if (!(P.crit.set && P.crit.n >= 15) || P.crit.off || P.crit.sound !== 'pure!') f('the ' + id + ' driver\'s pure strike: ' + J(P.crit) + ' (its flourish at the ball, and its sound)');
      if (P.plain.set || P.plain.n) f('the ' + id + ' driver flourishes on a strike that is not pure: ' + J(P.plain));
      if (P.over.n) f('the ' + id + ' driver\'s flourish has not ended after its time: ' + J(P.over));
    }
    const dvn = r.divine;
    if (dvn.skinPx) f('the Divine shows skin: ' + dvn.skinPx + ' of his ' + dvn.bodyPx + ' pixels in a skin tone');
    { const R = dvn.rib; if (!(R.n >= 60 && R.L >= 8 && R.R >= 8) || R.far) f('the Divine ribbons: ' + J(R) + ' (either side of him, close)'); }
    if (!(dvn.ribTop.span < dvn.rib.span && dvn.ribHit.span > dvn.rib.span)) f('the Divine ribbons do not draw in as he winds up and fly out as he strikes: spans ' + [dvn.rib.span, dvn.ribTop.span, dvn.ribHit.span].join(', '));
    if (!(dvn.ribBackL >= 5 && dvn.ribBackR >= 5)) f('the Divine ribbons walking away: ' + dvn.ribBackL + ' and ' + dvn.ribBackR + ' pixels either side of him');
    if (!(dvn.cRib >= 15 && dvn.cHorns >= 3)) f('the Divine caddie: ribbons ' + dvn.cRib + ', crown ' + dvn.cHorns + ' pixels');
    if (!(dvn.ring >= 60 && dvn.ringAbove >= 8) || dvn.ringOff) f('the Divine\'s great ring behind him: ' + dvn.ring + ' pixels (' + dvn.ringAbove + ' over his head), ' + dvn.ringOff + ' away from him');
    if (!(dvn.horns >= 6) || dvn.hornsOff) f('the Divine crown: ' + dvn.horns + ' pixels, ' + dvn.hornsOff + ' away from his head');
    if (!(dvn.hair >= 8 && dvn.hairBehind >= dvn.hair * 0.6 && dvn.hairBack >= 15)) f('the Divine\'s hair: ' + dvn.hair + ' pixels, ' + dvn.hairBehind + ' streaming back; ' + dvn.hairBack + ' down his back walking away');
    if (!(dvn.nose >= 5 && dvn.beads >= 2 && dvn.sash >= 8 && dvn.guards >= 10 && dvn.skirt >= 12))
      f('what the Divine wears: the mask\'s nose ' + dvn.nose + ', beads ' + dvn.beads + ', sash ' + dvn.sash + ', guards ' + dvn.guards + ', skirt from behind ' + dvn.skirt + ' pixels');
    if (!(dvn.ground >= 100) || dvn.groundOff) f('the Divine seal: ' + dvn.ground + ' pixels, ' + dvn.groundOff + ' off the ground at his feet');
    if (!(dvn.sparks >= 6) || dvn.sparksOff || !(dvn.waveOut >= 8)) f('the Divine strike: light off the ball ' + dvn.sparks + ' (' + dvn.sparksOff + ' away from it), a ring ' + dvn.waveOut + ' out past the seal');
    // (The Void has no sound of its own: the user wants no more)
    for (const id of ['demonic', 'ascended', 'divine', 'cosmic']) {
      const L = r.legend[id], snd = { demonic: 'hellfire', ascended: 'ascend', divine: 'choir', cosmic: '' }[id];
      if (L.birdie.n || L.birdie.sound || L.eagle.n || L.eagle.sound) f('the ' + id + ' moment on a birdie ' + J(L.birdie) + ' or an eagle ' + J(L.eagle) + ' (only an albatross or an ace)');
      if (!(L.alb.out >= 40) || L.alb.far || L.alb.sound !== snd) f('the ' + id + ' moment on an albatross: ' + J(L.alb) + ' (a burst out of him, kept close about him, the sound ' + snd + ')');
      if (!(L.ace.n > L.alb.n * 1.05) || L.ace.far || L.ace.sound !== (snd ? snd + '!' : '')) f('the ' + id + ' moment on an ace is not bigger, or strays: ' + J(L.ace) + ' against ' + J(L.alb));
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
      // (the Ascended's two ears are smaller than the Demonic's crest of blades)
      if (!(d.top >= (id === 'ascended' ? 8 : 12) && d.topAbove >= 6) || d.topBelow || d.topWide) f('the ' + id + (id === 'ascended' ? ' hood\'s ears: ' : ' crest: ') + J(d) + ' (standing up off his head, and nowhere else)');
      if (!(d.eyes >= 1) || d.eyesOff) f('the ' + id + ' eyes: ' + d.eyes + ' pixels, ' + d.eyesOff + ' of them away from his eye');
      if (d.plain || !(d.own >= 12)) f('the ' + id + ' golfer\'s arms: ' + d.plain + ' pixels of the plain skin tone on him, ' + d.own + ' of his own');
      if (!(d.cTop >= 4 && d.cEyes >= 1)) f('the ' + id + ' caddie: ' + (id === 'ascended' ? 'ears ' : 'crest ') + d.cTop + ', eyes ' + d.cEyes + ' pixels');
    }
    for (const id of ['demonic', 'ascended']) {
      const so = r.drawn[id].sole;
      if (so.tan || !(so.own >= 1)) f('the ' + id + ' walking away: ' + so.tan + ' pixels of the plain tan sole, ' + so.own + ' of his belt\'s colour on his lifted boot');
    }
    if (!(r.plainSole.tan >= 1) || r.plainSole.own) f('the Tour Classic walking away: ' + J(r.plainSole) + ' (the tan sole on his lifted boot, having no belt colour of his own)');
    const oa = Object.entries(r.otherArms).filter(([, n]) => n);
    if (oa.length) f('plain skin tone on skins with their own: ' + oa.map(([k, n]) => k + ' ' + n).join(', '));
    return ['the Demonic at the Divine\'s ' + r.price.demonic + ', the Ascended at ' + r.price.ascended + '; club, trail, ball and caddie for each in the Divine\'s proportion (' + J(r.sets.ascended.cost) + '), Legendary and Mythic',
      'the Demonic, armoured in black and gold: streamers of lava back side on (' + dm.wing.addr.behind + 'px behind him, none in front) and over his back walking away (' + dm.wing.backL + '/' + dm.wing.backR + '), four horns ' + dm.top + ', red eyes, fangs ' + dm.fangs + ', a ram\'s skull on his shoulder (' + dm.skull + 'px; ' + dm.skullBackL + '/' + dm.skullBackR + ' from behind), his dais of stone ' + dm.dais + 'px; his caddie\'s streamers ' + dm.cWings,
      'the Ascended, a hooded star-walker: a galaxy cape ' + as.cape + ' (' + as.capeBack + ' down his back walking away), wings of feathers on his back side on (' + as.wing.addr.behind + 'px behind him, none in front) and either side walking away, ears on his hood ' + as.top + ', a silver mantle (' + as.mantleBack + ' from behind), a gauntlet; his caddie\'s wings ' + as.cWings + '',
      'his arms in his own skin, on these and on the Void Walker, Midas and the Ghost; his soles in his belt\'s colour walking away (' + r.drawn.ascended.sole.own + 'px), a plain golfer\'s tan',
      'the Ascended\'s disc at his feet (' + as.ground + 'px), glitching about him (' + as.glitch + 'px), motes as he winds up, sparks and a ring as he strikes; ' + as.foot.l + '/' + as.foot.r + ' of his width either side and ' + as.foot.up + ' of his height over him at most',
      'his ground under the pin and a putt rolling away (' + r.layer.order + ')',
      'the ultimate Demonic: an aura of hellfire (' + Math.round(dm.auraTop / dm.auraIdle * 100 - 100) + '% more at the top of the backswing), two ribbons of fire swirling round him, a crest swept back (' + dm.hornCurl.toFixed(2) + ' of his hood behind, ' + dm.crestUp.toFixed(2) + ' of his height up), hands on fire, the ground cracking at the strike (' + dm.cracks + 'px); ' + dm.foot.l + '/' + dm.foot.r + ' of his width either side, ' + dm.foot.up + ' of his height over him',
      'the Divine, a celestial monk: no skin showing (' + dvn.bodyPx + ' pixels of him); ribbons of jade and gold either side (' + dvn.rib.n + 'px), drawn in to ' + dvn.ribTop.span + 'px wide at the top and out to ' + dvn.ribHit.span + ' at the strike (' + dvn.rib.span + ' at rest), from behind too; a gold ring behind his head, jade horns, hair streaming back and down his back, blindfold, beads, sash, guards and his robe from behind; the jade seal at his feet, light off the ball and a ring as he strikes; his caddie in ribbons and horns',
      'a flourish on an albatross or an ace for each of the other ' + Object.keys(r.flourish).length + ' effect skins (' + Object.entries(r.flourish).map(([k, v]) => k + ' ' + v.alb.n).join(', ') + 'px), half a second, close about him, with a sound, more on an ace; none on a birdie or an eagle',
      'a pure strike with the Divine, Demonic and Ascended drivers: its flourish at the ball (' + ['divine', 'demonic', 'ascended'].map(k => k + ' ' + r.pure[k].crit.n).join(', ') + 'px) and its sound, over in a third of a second; none on an ordinary strike or with a plain club',
      'the moment on an albatross: the Demonic ' + r.legend.demonic.alb.n + 'px (' + r.legend.demonic.ace.n + ' on an ace), the Ascended ' + r.legend.ascended.alb.n + 'px (' + r.legend.ascended.ace.n + '), the Divine ' + r.legend.divine.alb.n + 'px, bursting out of him and close about him for half a second, each with its sound; none on an eagle, in a plain golfer, while quiet or once over'];
  }
};
