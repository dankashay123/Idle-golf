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
 *     a curled tail. Both: eyes that shine, where his eye is
 *   - his arms in his own skin: they were always the plain tone, so the red
 *     Demonic had peach arms (and the Void Walker, Midas and the Ghost too)
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
          F[name] = name === 'wings' ? function () { const w = keep.apply(this, arguments); return { cv: blank, ox: w.ox, oy: w.oy }; } : () => {};
          try { return diff(full, frame()); } finally { F[name] = keep; }
        };
        o.drawn = {};
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
            const wings = part(id, 'wings', golfer).filter(([x, y]) => y < box.y0 + h * 0.55);
            d.wingL = wings.filter(([x]) => x < box.x0 - 2).length; d.wingR = wings.filter(([x]) => x > box.x1 + 2).length;
            d.reachL = box.x0 - Math.min(...wings.map(([x]) => x)); d.reachR = Math.max(...wings.map(([x]) => x)) - box.x1;
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
    if (!(dm.wingL >= 12 && dm.wingR >= 12 && dm.reachL >= 4 && dm.reachR >= 4))
      f('the Demonic wings, either side of him above his waist: ' + dm.wingL + ' and ' + dm.wingR + ' pixels, reaching ' + dm.reachL + ' and ' + dm.reachR + ' past him');
    if (!(dm.cWings >= 30)) f('the Demonic caddie\'s wings: ' + dm.cWings + ' pixels');
    if (!(as.cape >= 40 && as.capeBehind >= 25 && as.capeBack >= 100))
      f('the Ascended cape: ' + as.cape + ' pixels, ' + as.capeBehind + ' behind him, ' + as.capeBack + ' down his back as he walks away');
    if (!(as.hairBack >= 25 && as.hairReach >= 5)) f('the Ascended hair of fire: ' + as.hairBack + ' pixels back from his head, reaching ' + as.hairReach);
    if (!(as.core >= 10) || as.coreOff) f('the light in the Ascended\'s chest: ' + as.core + ' pixels, ' + as.coreOff + ' of them off his chest');
    if (!(as.hand >= 2)) f('the Ascended hands in their own magenta: ' + as.hand + ' pixels');
    if (!(as.cTail >= 5 && as.cFlame >= 4 && as.cGreen >= 1)) f('the imp: tail ' + as.cTail + ', flame ' + as.cFlame + ', green eye ' + as.cGreen + ' pixels');
    for (const id of ['demonic', 'ascended']) {
      const d = r.drawn[id];
      if (!(d.top >= 12 && d.topAbove >= 6) || d.topBelow || d.topWide) f('the ' + id + ' horns: ' + J(d) + ' (standing up off his cap, and nowhere else)');
      if (!(d.eyes >= 1) || d.eyesOff) f('the ' + id + ' eyes: ' + d.eyes + ' pixels, ' + d.eyesOff + ' of them away from his eye');
      if (d.plain || !(d.own >= 12)) f('the ' + id + ' golfer\'s arms: ' + d.plain + ' pixels of the plain skin tone on him, ' + d.own + ' of his own');
      if (!(d.cTop >= 4 && d.cEyes >= 1)) f('the ' + id + ' caddie: horns ' + d.cTop + ', eyes ' + d.cEyes + ' pixels');
    }
    const oa = Object.entries(r.otherArms).filter(([, n]) => n);
    if (oa.length) f('plain skin tone on skins with their own: ' + oa.map(([k, n]) => k + ' ' + n).join(', '));
    return ['the Demonic at the Divine\'s ' + r.price.demonic + ', the Ascended at ' + r.price.ascended + '; club, trail, ball and caddie for each in the Divine\'s proportion (' + J(r.sets.ascended.cost) + '), Legendary and Mythic',
      'the Demonic: wings reaching ' + dm.reachL + '/' + dm.reachR + 'px past him either side, horns ' + dm.top + ', eyes at his eye; his caddie\'s wings ' + dm.cWings,
      'the Ascended: a cape ' + as.cape + ' (' + as.capeBack + ' down his back walking away), horns ' + as.top + ', hair of fire reaching ' + Math.round(as.hairReach) + 'px back, the light in his chest, magenta hands; the imp\'s tail ' + as.cTail + ', flame ' + as.cFlame + ', green eyes',
      'his arms in his own skin, on these and on the Void Walker, Midas and the Ghost'];
  }
};
