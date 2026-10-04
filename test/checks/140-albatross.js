/* The Lucky Albatross (the user picked it from the menu): now and then,
 * while the course is drawn, an albatross glides across the top of the
 * field for ten seconds; tapped, feathers burst, it is off, and the purse is
 * doubled for a minute, said by the cog. Never away, never in a wager.
 *
 *   - its wait counts down only on frames drawn, never quietly or in a wager
 *   - it crosses the field in ALB_FLY seconds, below the readout
 *   - a tap on it catches it (a tap beside it does not); caught once
 *   - the purse doubles while the boost runs, live only, and the cog says so
 *   - the boost runs down on the clock and is gone */
'use strict';
module.exports = {
  name: 'albatross',
  async run(page) {
    const r = await page.evaluate(async () => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), o = {};
      try {
        hideSheet();
        // ---- the wait counts down only while drawn and watched ----
        LUCKY.a = null; LUCKY.wait = 100;
        QUIET = true; albTick(Scene.b, 5); QUIET = false; if (LUCKY.wait !== 100) f('the wait ran down quietly');
        S.dgnRun = { id: B.DGN[0].id }; albTick(Scene.b, 5); S.dgnRun = null; if (LUCKY.wait !== 100) f('the wait ran down in a wager');
        OFFLINE = true; albTick(Scene.b, 5); OFFLINE = false; if (LUCKY.wait !== 100) f('the wait ran down away');
        albTick(Scene.b, 5); if (LUCKY.wait !== 95) f('the wait did not run down on a frame drawn: ' + LUCKY.wait);
        // ---- it comes, and crosses ----
        LUCKY.wait = 0.01; albTick(Scene.b, 0.02);
        if (!LUCKY.a) f('none came when the wait ran out');
        else {
          if (!(LUCKY.wait >= ALB_GAP[0])) f('the next wait is ' + LUCKY.wait);
          const cv = document.getElementById('hole').getBoundingClientRect(), rr = document.getElementById('rRow').getBoundingClientRect();
          const P = albAt(), top = (rr.bottom - cv.top) * VH / cv.height;
          if (P.y - P.h / 2 < top - 1) f('it flies over the readout: top ' + (P.y - P.h / 2) + ' against ' + top);
          const x0 = P.x; for (let i = 0; i < 50; i++) albTick(Scene.b, 0.1);
          const x1 = albAt() && albAt().x;
          if (!(Math.abs(x1 - x0) > VW * 0.35)) f('it did not cross: ' + x0 + ' to ' + x1);
          for (let i = 0; i < 52; i++) albTick(Scene.b, 0.1);
          if (LUCKY.a) f('still up after ' + ALB_FLY + 's');
        }
        // ---- side on, its wings beating, facing the way it flies ----
        { const used = new Set(), keepS = window.albSprite; window.albSprite = function (f, flip) { used.add(f + (flip ? 'L' : 'R')); return keepS.apply(this, arguments); };
          try { LUCKY.wait = 0.01; albTick(Scene.b, 0.02); const dir = LUCKY.a.dir; for (let i = 0; i < 30; i++) albTick(Scene.b, 0.07);
            const fr = [...used].filter(k => k.endsWith(dir < 0 ? 'L' : 'R')).length;
            if (fr < 5) f('its wings went through ' + fr + ' positions in two seconds');
            if ([...used].some(k => k.endsWith(dir < 0 ? 'R' : 'L') && k !== '3R' && k !== '3L')) f('it faced back the way it came');
          } finally { window.albSprite = keepS; LUCKY.a = null; }
          // (its bill on the side it flies to: the head's pale pink right of its middle)
          const sp = albSprite(3, false), g = sp.cv.getContext('2d').getImageData(0, 0, sp.w, sp.h).data; let r = 0, l = 0;
          for (let y = 0; y < sp.h / 2 + 1; y++) for (let x = 0; x < sp.w; x++) { const k = (y * sp.w + x) * 4; if (g[k] === 0xEE && g[k + 1] === 0xB0 && g[k + 2] === 0xB0) (x > sp.w / 2 ? r++ : l++); }
          if (!(r > 3 && l === 0)) f('its bill: ' + r + ' pixels ahead, ' + l + ' behind'); }
        // ---- a tap beside it does nothing; on it, caught ----
        LUCKY.wait = 0.01; albTick(Scene.b, 0.02); albTick(Scene.b, 3);
        const cvr = document.getElementById('hole').getBoundingClientRect(), P = albAt();
        const at = (x, y) => [cvr.left + x * cvr.width / VW, cvr.top + y * cvr.height / VH];
        const s0 = S.albN || 0, gold0 = derive().gold;
        if (albTap(...at(P.x, P.y + P.h / 2 + 40))) f('a tap well below it caught it');
        if (LUCKY.buff) f('a boost from a miss');
        if (!albTap(...at(P.x + P.w * 0.3, P.y))) f('a tap on its wing missed');
        if (!(LUCKY.buff === ALB_DUR)) f('the boost is ' + LUCKY.buff);
        if (albTap(...at(albAt().x, albAt().y))) f('caught twice');
        if ((S.albN || 0) !== s0 + 1) f('counted ' + ((S.albN || 0) - s0));
        if (!(LUCKY.fx.length >= 12)) f('feathers: ' + LUCKY.fx.length);
        // the burst drawn alone a moment later: real feathers (the user saw
        // none: they were dots a pixel or two across), spread well out
        { const bc = document.createElement('canvas'); bc.width = VW; bc.height = VH; const bg = bc.getContext('2d');
          const keepA = LUCKY.a, keepW = LUCKY.wait; LUCKY.a = null; LUCKY.wait = 1e9; albTick(bg, 0.25); LUCKY.a = keepA; LUCKY.wait = keepW;
          const px = bg.getImageData(0, 0, VW, VH).data; let n = 0, x0 = VW, x1 = 0, cols = new Set();
          for (let i = 0; i < px.length; i += 4) if (px[i + 3]) { n++; const x = (i / 4) % VW; x0 = Math.min(x0, x); x1 = Math.max(x1, x); cols.add(px[i] + ',' + px[i + 1] + ',' + px[i + 2]); }
          o.burst = n + 'px across ' + (x1 - x0) + ' in ' + cols.size + ' colours';
          if (n < 400) f('the feathers drew ' + n + ' pixels');
          if (x1 - x0 < VW * 0.15) f('the feathers spread ' + (x1 - x0) + ' wide');
          if (cols.size < 4) f('the feathers in ' + cols.size + ' colours'); }
        for (let i = 0; i < 20; i++) albTick(Scene.b, 0.1);
        if (LUCKY.a) f('still about after being caught');
        if (LUCKY.fx.length) f('feathers left after two seconds: ' + LUCKY.fx.length);
        // ---- the purse, live only; said by the cog ----
        const g1 = derive().gold; if (Math.abs(g1 / gold0 - ALB_V) > 1e-6) f('purse x' + (g1 / gold0) + ' with the boost');
        OFFLINE = true; const g2 = derive().gold; OFFLINE = false; if (Math.abs(g2 / gold0 - 1) > 1e-6) f('the boost paid away: x' + (g2 / gold0));
        buffTip(0); const tip = document.getElementById('buffTip').textContent;
        if (!tip.includes(ALB_V + '× purse for')) f('the cog says ' + tip);
        // ---- it runs down on the clock ----
        const D = derive(); for (let i = 0; i < ALB_DUR + 2; i++) step(1, D);
        if (LUCKY.buff) f('the boost still on after ' + (ALB_DUR + 2) + 's: ' + LUCKY.buff);
        buffTip(0); if (document.getElementById('buffTip').textContent.includes('purse for')) f('the cog still says it');
      } finally { LUCKY.a = null; LUCKY.buff = 0; LUCKY.fx = []; QUIET = false; OFFLINE = false; S.dgnRun = null; const o0 = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o0); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['counts down only drawn and watched; side on, its wings beating, its bill ahead; crosses below the readout in ' + 10 + 's; caught by a tap on it, once, a burst of feathers (' + r.o.burst + '); purse doubled live only, by the cog; runs down'];
  }
};
