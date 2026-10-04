/* Night creatures (the user picked them from the menu): glow-worms low in
 * the rough, moths round the tee's lamps and now and then a luna moth among
 * them, on a dry night that is not snowing, each in the Field Guide on a
 * Night shelf of its own.
 *
 *   - rates over six hundred night holes: glow-worms on about half, moths on
 *     about three in five, a luna moth on about one in eight of those; none
 *     by day, in the rain (a night by the player's clock with a wet round),
 *     on a snowy or frozen course, and none drawn in a wager
 *   - every glow-worm off the fairway and the green, out of the water, off
 *     the cart path and clear of anyone standing in the rough
 *   - each is drawn, counted by its own colours in the part drawn alone:
 *     the glow-worms, the moths round the lamps (the lamp with them against
 *     the lamp without), the luna moth; none of it when the night is wet
 *   - fox eyes at night only, two points of light, gone as he nears; the
 *     hedgehog by day and night
 *   - the Field Guide spots each on a night hole played live, and the Guide
 *     shows a Night shelf holding them, the fireflies, the owl, the bat and
 *     the badger
 * (Nothing of it through a hill: `nightholes` holds every night prop to the
 * ground's line, these included.)
 */
'use strict';
module.exports = {
  name: 'nightlife',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step;
      const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0; S.guide = {};
        const ch = n => Object.assign({}, B.CHAOS.find(x => x.n === n));
        const play = (h, n) => { S.hole = h; S.chaos = ch(n); Scene.newHole(h, S.tier); Scene.announce = null; Scene.balls = []; Scene.restBall = null; };
        const c = Scene.b, D = derive();
        const count = cols => { const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (cols.has(hex(d, i))) n++; return n; };
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const alone = (props, t) => { const was = Scene.props; Scene.t = t; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was; };
        const GLOW = new Set(['#A6E040', '#EEFFB0']), MOTH = new Set(['#4A3C2A', '#241A10', '#F2E6C6']), LUNA = new Set(Object.values(LUNA_COL).map(x => x.toUpperCase()));
        // ---- rates, and where they lie ---------------------------------------
        let nights = 0, glow = 0, moth = 0, luna = 0, wet = 0, snowy = 0;
        const h0 = S.hole;
        for (let h = h0; h < h0 + 600; h++) {
          play(h, 'Night Round');
          if (!Scene.night) { f('a Night Round hole was not night'); break; }
          const P = Scene.props, g = P.filter(p => p.kind === 22), m = P.filter(p => p.kind === 4 && p.moth), l = P.filter(p => p.luna);
          if (Scene.rain || Scene.snow || Scene.ice) { if (g.length || m.length) f('glow-worms or moths on a wet or snowy night, hole ' + h); continue; }
          nights++; if (g.length) glow++; if (m.length) moth++; if (l.length) luna++;
          if (l.length > 1) f(l.length + ' luna moths on hole ' + h);
          const w = Scene.water;
          for (const p of g) {
            if (Scene.onPlay(p.d, p.x, 0.3)) f('glow-worms on the fairway or green, hole ' + h);
            if (Scene.hitsHazard(p.d, p.x, 0.3) || Scene.inPond(p.d, p.x, 0) || Scene.inFill(p.d, p.x, 0, 'lake')
              || (w && !w.canyon && !w.rail && Math.abs(p.d - w.d) < w.rd && Math.abs(p.x - w.x) < w.rx)) f('glow-worms in a hazard or the water, hole ' + h);
            if (Scene.cart && Math.sign(p.x) === Scene.cart.sd && Math.abs(Math.abs(p.x) - Math.abs(Scene.cartX(p.d))) < 0.8) f('glow-worms on the cart path, hole ' + h);
            if (P.some(q => [1, 13, 15, 16].includes(q.kind) && Math.abs(q.d - p.d) < 0.6 && Math.abs(q.x - p.x) < 0.6)) f('glow-worms under someone\'s feet, hole ' + h);
          }
        }
        o.rates = [glow / nights, moth / nights, luna / Math.max(1, moth)];
        if (!(glow / nights > 0.4 && glow / nights < 0.7)) f('glow-worms on ' + glow + ' of ' + nights + ' dry nights');
        if (!(moth / nights > 0.45 && moth / nights < 0.75)) f('moths on ' + moth + ' of ' + nights + ' dry nights');
        if (!(luna / moth > 0.05 && luna / moth < 0.22)) f('a luna moth on ' + luna + ' of ' + moth + ' holes with moths');
        // none by day, nor on a wet night (the player's clock making a wet round night)
        for (let h = h0; h < h0 + 60; h++) { play(h, 'Fair'); if (Scene.props.some(p => p.kind === 22 || p.moth)) { f('glow-worms or moths by day, hole ' + h); break; } }
        S.dawnDusk = 1; HOUR_FORCE = 23;
        for (let h = h0; h < h0 + 60; h++) { play(h, 'Crosswind'); if (!Scene.night || !Scene.rain) { f('a wet round at 11pm was not a wet night'); break; }
          if (Scene.props.some(p => p.kind === 22 || p.moth)) { f('glow-worms or moths on a wet night, hole ' + h); break; } }
        S.dawnDusk = 0; HOUR_FORCE = 14;
        // none on a snowy course: winter on the home courses
        { const home = B.COURSE.findIndex(cs => cs.slot === 'home'); DEV.course(home); hideSheet(); SEASON_FORCE = 2; const s0 = S.hole;
          for (let h = s0; h < s0 + 40; h++) { play(h, 'Night Round'); if (Scene.snow || Scene.ice) { snowy++; if (Scene.props.some(p => p.kind === 22 || p.moth)) f('glow-worms or moths in the snow, hole ' + h); } }
          SEASON_FORCE = -1; }
        if (!snowy) f('no snowy night was played, so the snow means nothing');
        // ---- drawn: each by its own colours, the part alone --------------------
        let hg = h0; while (!(hr(hg, 351) < GLOW_P && hr(hg, 356) < MOTH_P) || sigKind(hg)) hg++;
        LUNA_FORCE = 1; play(hg, 'Night Round'); LUNA_FORCE = null;
        const G = Scene.props.filter(p => p.kind === 22), L = Scene.props.filter(p => p.kind === 4);
        if (!G.length || !L.some(p => p.moth) || !L.some(p => p.luna)) f('hole ' + hg + ' had no glow-worms, moths or luna moth to draw');
        o.glowPx = 0;
        for (const p of G) { Scene.camD = Math.max(0, p.d - 6); Scene.draw(1 / 30, D); for (const t of [0.4, 2.1, 3.9]) { alone([p], t); o.glowPx += count(GLOW); } }
        Scene.camD = 0; Scene.draw(1 / 30, D);
        o.mothPx = 0; o.lunaPx = 0; let bare = 0;
        for (const t of [0.3, 1.1, 2.6, 4.2]) {
          alone(L, t); o.mothPx += count(MOTH); o.lunaPx += count(LUNA);
          const was = L.map(p => [p.moth, p.luna]); L.forEach(p => { p.moth = 0; p.luna = 0; });
          alone(L, t); bare += count(MOTH) + count(LUNA); L.forEach((p, i) => { p.moth = was[i][0]; p.luna = was[i][1]; });
        }
        if (!(o.glowPx >= 6)) f('the glow-worms drew ' + o.glowPx + ' pixels of their glow');
        if (!(o.mothPx - bare >= 12)) f('the moths drew ' + (o.mothPx - bare) + ' pixels round the lamps');
        if (!(o.lunaPx - bare >= 8)) f('the luna moth drew ' + (o.lunaPx - bare) + ' pixels');
        // none when the night is wet, none in a wager
        Scene.rain = true; alone(G, 1); const wetG = count(GLOW); alone(L, 1); const wetM = count(MOTH) + count(LUNA); Scene.rain = false;
        if (wetG || wetM) f('in the rain: ' + wetG + ' pixels of glow-worms, ' + wetM + ' of moths');
        S.dgnRun = { id: B.DGN[0].id }; alone(G, 1); const dg = count(GLOW); alone(L, 1); const dm = count(MOTH) + count(LUNA); S.dgnRun = null;
        if (dg || dm) f('in a wager: ' + dg + ' pixels of glow-worms, ' + dm + ' of moths');
        // ---- the fox's eyes and the hedgehog (the user picked more for the
        // Night shelf): eyes only at night, the hedgehog by day and night;
        // the eyes drawn as two points of light, shut now and then, gone as
        // he comes within five yards
        { let eyesN = 0, eyesDay = 0, hogN = 0, hogDay = 0, drawn = 0, near = 0, tried = 0;
          for (let h = h0; h < h0 + 300; h++) { if (sigKind(h)) continue;
            play(h, 'Fair'); if (Scene.props.some(p => p.an === 'eyes')) eyesDay++; if (Scene.props.some(p => p.an === 'hedgehog')) hogDay++;
            play(h, 'Night Round'); const E = Scene.props.find(p => p.kind === 15 && p.an === 'eyes'); if (Scene.props.some(p => p.an === 'hedgehog')) hogN++;
            if (!E) continue; eyesN++;
            if (tried < 12) { tried++;
              for (const t of [0.3, 1.7, 2.9]) { Scene.camD = Math.max(0, E.d - 9); Scene.draw(1 / 30, D); alone([E], t);
                const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++;
                drawn += n; Scene.camD = E.d - 4; Scene.draw(1 / 30, D); alone([E], t); const d2 = c.getImageData(0, 0, VW, VH).data;
                for (let i = 0; i < d2.length; i += 4) if (!(d2[i] === 1 && d2[i + 1] === 2 && d2[i + 2] === 3)) near++; } } }
          o.eyes = [eyesN, hogN, hogDay, drawn];
          if (eyesDay) f('fox eyes by day on ' + eyesDay + ' holes');
          if (!(eyesN >= 15)) f('fox eyes on only ' + eyesN + ' night holes of 300');
          if (!hogN || !hogDay) f('the hedgehog on ' + hogDay + ' day and ' + hogN + ' night holes (want both)');
          if (!(drawn >= 2 * tried)) f('the fox eyes drew ' + drawn + ' pixels over ' + tried + ' holes');
          if (near) f('the fox eyes still there within five yards: ' + near + ' pixels'); }
        // ---- the Field Guide ---------------------------------------------------
        S.guide = {}; QUIET = false; const was = window.toast; window.toast = () => {};
        try { LUNA_FORCE = 1; play(hg, 'Night Round'); LUNA_FORCE = null; } finally { window.toast = was; QUIET = true; }
        for (const id of ['glowworm', 'moth', 'luna']) if (!S.guide[id]) f('the Guide did not spot ' + id + ' on a night hole with it');
        S.guide = {}; OFFLINE = true; LUNA_FORCE = 1; play(hg, 'Night Round'); LUNA_FORCE = null; OFFLINE = false;
        if (S.guide.glowworm || S.guide.moth) f('spotted away');
        const shelf = GUIDE.filter(g => g.g === 'n').map(g => g.id);
        for (const id of ['firefly', 'glowworm', 'moth', 'luna', 'owl', 'bat', 'badger', 'hedgehog', 'eyes']) if (!shelf.includes(id)) f('the Night shelf has no ' + id);
        QUIET = false; trophyRoom('guide'); QUIET = true;
        const eb = [...document.querySelectorAll('#roomBody .eyebrow')].map(e => e.textContent.trim());
        if (!eb.some(t => /^Night\b/.test(t))) f('the Guide shows no Night shelf: ' + eb.join(', '));
        hideSheet();
      } finally {
        HOUR_FORCE = null; FROST_FORCE = null; LUNA_FORCE = null; SEASON_FORCE = -1; OFFLINE = false; window.step = keep;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['on dry nights: glow-worms on ' + Math.round(r.rates[0] * 100) + '%, moths on ' + Math.round(r.rates[1] * 100) + '%, a luna moth with '
        + Math.round(r.rates[2] * 100) + '% of those; none by day, wet or in the snow',
      'glow-worms clear of play, water, the path and anyone standing',
      'drawn: glow-worms ' + r.glowPx + ', moths ' + r.mothPx + ', luna ' + r.lunaPx + ' pixels; none in the rain or a wager',
      'fox eyes on ' + r.eyes[0] + ' of 300 night holes, none by day, ' + r.eyes[3] + ' pixels from ten yards and gone within five; the hedgehog on ' + r.eyes[2] + ' day and ' + r.eyes[1] + ' night holes',
      'the Guide spots each live, on a Night shelf with the fireflies, owl, bat, badger, hedgehog and fox eyes'];
  }
};
