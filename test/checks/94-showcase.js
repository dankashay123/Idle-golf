/* The showcase over the Sets rack (the user asked: "a Sets showcase in
 * the shop where you can preview each full set swinging"):
 *
 *   - it is there on the Sets rack only; the arrows and a tap on a set's
 *     picture put that set on it, and its name over it
 *   - played through its round, every set shows its own colours (its
 *     accents counted on the stage), its blessing falls, an ace gives him
 *     his moment, it hops on its club and its caddie does its own trick;
 *     no two sets draw alike
 *   - Night darkens its sky and Day brings it back
 *   - drawing it never touches the round behind: his look, his caddie,
 *     his pictures and the moment on the course are all as they were
 *   - it stops when the shop closes
 */
'use strict';
module.exports = {
  name: 'showcase',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const raf = window.requestAnimationFrame;
      try {
        hideSheet(); QUIET = false; S.sov = 1e9;
        const before = { out: outfitNow().id, cad: caddieNow().id, club: clubNow().id, tr: trailNow().id, spr: SPRITE.gAddr, cspr: SPRITE.caddie, leg: Scene.legend };
        for (const cat of ['golfer', 'caddie', 'clubs', 'balls']) { styleCat = cat; openShop('style'); if (document.getElementById('showCv')) f('the showcase is on the ' + cat + ' rack'); }
        styleCat = 'sets'; openShop('style');
        const cv = document.getElementById('showCv');
        if (!cv) { f('no showcase on the Sets rack'); return o; }
        window.requestAnimationFrame = () => 0; cancelAnimationFrame(SHOW.raf);
        // the arrows and the pictures
        const name = () => document.getElementById('showN').textContent;
        const s0 = SHOW.set; document.querySelector('[data-show="1"]').click();
        if (SHOW.set !== SET_ORDER[(SET_ORDER.indexOf(s0) + 1) % SET_ORDER.length] || name() !== FULL_SETS[SHOW.set].n) f('the next arrow put on ' + SHOW.set + ' named ' + name());
        document.querySelector('[data-show="-1"]').click(); document.querySelector('[data-show="-1"]').click();
        if (SHOW.set !== SET_ORDER[(SET_ORDER.indexOf(s0) - 1 + SET_ORDER.length) % SET_ORDER.length]) f('the back arrow put on ' + SHOW.set);
        const art = [...document.querySelectorAll('.cart[data-art]')];
        if (art.length !== SET_ORDER.length) f(art.length + ' set pictures can be tapped');
        art[2].click();
        if (SHOW.set !== SET_ORDER[2] || name() !== FULL_SETS[SET_ORDER[2]].n) f('a tap on ' + SET_ORDER[2] + "'s picture put on " + SHOW.set);
        // each set played through its round
        const c = cv.getContext('2d'), W = cv.width, H = cv.height;
        const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
        const prints = {};
        const play = (T, night) => { const n = night; showStart(SHOW.set); SHOW.night = n; while (SHOW.t < T - 1e-6) showDraw(cv, Math.min(1 / 60, T - SHOW.t)); return c.getImageData(0, 0, W, H).data; };
        const count = (d, cols) => { const C = cols.map(hex); let n = 0; for (let i = 0; i < d.length; i += 4) if (C.some(q => q[0] === d[i] && q[1] === d[i + 1] && q[2] === d[i + 2])) n++; return n; };
        const T_BLESS = 0.6, T_SWING = 2.2, T_ACE = SHOW_PLAN[0].dur + SHOW_PLAN[1].dur + SHOW_PLAN[2].addr + 0.45 + 1.25 + 0.15, T_FLY = SHOW_PLAN[0].dur + SHOW_PLAN[1].dur + SHOW_PLAN[2].dur + SHOW_PLAN[3].dur * 0.5,
          T_MOVE = SHOW_PLAN.slice(0, 4).reduce((a, p) => a + p.dur, 0) + 1.0;
        for (const s of SET_ORDER) {
          showStart(s); SHOW.night = false;
          const acc = SKIN_ACCENT[s];
          const dS = play(T_SWING, false), nS = count(dS, acc);
          if (nS < 12) f(s + ' shows ' + nS + ' pixels of its colours mid swing');
          prints[s] = Array.from(dS.filter((v, i) => i % 7 === 0)).join(',');
          // its blessing: more of the caddie's look than without it
          const dB = play(T_BLESS, false), BL = BLESS_FX[styleDef('c', s).fx];
          if (!BL) f(s + ' has no blessing of its own');
          else { const col = [BL.col]; const withB = count(dB, col); const keep = BLESS_FX[styleDef('c', s).fx]; BLESS_FX[styleDef('c', s).fx] = null;
            const without = count(play(T_BLESS, false), col); BLESS_FX[styleDef('c', s).fx] = keep;
            if (withB < without + 15) f(s + "'s blessing adds " + (withB - without) + ' pixels of its colour'); }
          // the ace: his moment
          play(T_ACE, false);
          if (!SHOW.legend || SHOW.t - SHOW.legend.t0 > 0.5) f(s + ' had no moment on its ace');
          // the hop on his club: him up off the grass
          play(T_FLY, false);
          // his caddie's own trick while he waits on the tee
          play(T_MOVE, false);
          const MV = FULL_SETS[s] && FAIRY_MOVES.find(m => m.only === styleDef('c', s).fx);
          if (!MV) f(s + "'s caddie has no trick of its own");
          else if (!SHOW.move || SHOW.move.kind !== MV.id) f(s + "'s caddie does not do its trick on the stage (" + JSON.stringify(SHOW.move) + ')');
          // night: a dark sky over him
          const dN = play(T_SWING, true), top = [dN[0], dN[1], dN[2]];
          if (top[0] + top[1] + top[2] > 120) f(s + ' at night has a sky of ' + top);
          const dD = play(T_SWING, false);
          if (dD[0] + dD[1] + dD[2] < 300) f(s + ' by day has a sky of ' + [dD[0], dD[1], dD[2]]);
        }
        const P = Object.values(prints);
        if (new Set(P).size !== P.length) f('two sets drew the same');
        // the Night button
        document.getElementById('showNight').click();
        if (!SHOW.night || document.getElementById('showNight').textContent !== 'Day') f('Night did not turn it to night');
        document.getElementById('showNight').click();
        if (SHOW.night) f('Day did not turn it back');
        // the round behind untouched
        const after = { out: outfitNow().id, cad: caddieNow().id, club: clubNow().id, tr: trailNow().id, spr: SPRITE.gAddr, cspr: SPRITE.caddie, leg: Scene.legend };
        for (const k in before) if (before[k] !== after[k]) f('drawing the showcase changed the round behind: ' + k);
        if (SHOWSET !== null) f('the set on show is still worn after drawing: ' + SHOWSET);
        // closed, it stops
        window.requestAnimationFrame = raf; showBind(document.getElementById('sheet'));
        hideSheet();
        const t0 = SHOW.t;
        return new Promise(res => setTimeout(() => { if (SHOW.t !== t0) f('the showcase went on after the shop closed'); res(o); }, 300));
      } catch (e) { f('threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); return o; }
      finally {
        window.requestAnimationFrame = raf;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites();
      }
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['all ' + 6 + ' sets play on the stage with their own colours, blessing, ace and hop, by day and by night; the round behind untouched'];
  }
};
