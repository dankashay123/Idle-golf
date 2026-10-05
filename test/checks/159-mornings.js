/* Hot-air balloons, ducklings and steam off the water (the user picked all
 * three from the menu).
 *
 *   - balloons: on a calm, dry morning (the hour pinned to 8, none at 15,
 *     none at night, in the rain or in a strong wind), on about two holes
 *     in five; drawn in the sky only; seen live, the Guide counts one
 *   - ducklings: in spring on the island's lake (none in its summer, autumn
 *     or winter, none at night), a line behind a hen, drawn; the Guide
 *     counts them
 *   - steam: on a cold morning (autumn or winter at 8, none at 15 or in
 *     summer, none on ice or in the rain), wisps laid on the water only,
 *     drawn paler over it
 *   - frost: on a frosty morning the reeds and the lily pads rimed paler
 *   - mist in the dips: on every autumn morning (8, not 15, dry, day, not
 *     a signature hole), lying only in hollows, drawn paler, never in the
 *     sky */
'use strict';
module.exports = {
  name: 'mornings',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true;
      const D = derive(), px = () => Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
      const shot = (cam, t) => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = cam; Scene.draw(0, D); } return px(); };
      const diff = (a, b, below) => { let n = 0, low = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { n++; if (Math.floor(i / 4 / VW) > below) low++; } return { n, low }; };
      const keepH = HOUR_FORCE, keepF = FROST_FORCE;
      try {
        // ---- balloons ----
        DEV.course(0); hideSheet(); FROST_FORCE = false;
        let calm = 0, up = 0;
        for (const hrs of [8, 15]) { HOUR_FORCE = hrs;
          for (let h = 1; h <= 400; h++) for (const ch of ['Fair', 'Crosswind', 'Night Round']) {
            S.chaos = { n: ch }; Scene.newHole(h, S.tier); const b = Scene.balloons;
            if (b && (hrs !== 8 || ch !== 'Fair' || Math.abs(Scene.wind) >= 0.4)) { f('balloons at ' + hrs + ' in ' + ch + ' (wind ' + Scene.wind.toFixed(2) + ')'); break; }
            if (hrs === 8 && ch === 'Fair' && Math.abs(Scene.wind) < 0.4) { calm++; if (b) up++; } } }
        o.balloons = up + ' of ' + calm; if (!calm || up / calm < 0.3 || up / calm > 0.5) f('balloons on ' + o.balloons + ' calm mornings');
        HOUR_FORCE = 8; BALLOON_FORCE = true; S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); Scene.announce = null;
        { let best = { n: 0, low: 0 };
          for (const t of [5, 20, 40, 60]) { const a = shot(0, t); Scene.balloons = false; const b = shot(0, t); Scene.balloons = true; const d = diff(a, b, HORIZON); if (d.n > best.n) best = d; if (d.low) f('a balloon below the horizon'); }
          o.bpx = best.n; if (best.n < 30) f('the balloons drew ' + best.n + ' pixels'); }
        BALLOON_FORCE = null;
        if (!GUIDE.find(g => g.id === 'balloon' && g.g === 'c') || !guideUrl('balloon')) f('no Hot-Air Balloon in the Guide with a picture');
        { S.guide = S.guide || {}; const n0 = S.guide.balloon || 0, tw = window.toast; window.toast = () => {};
          try { BALLOON_FORCE = true; Scene.newHole(S.hole, S.tier); Scene.balloonSeen = null; QUIET = false; for (const t of [5, 20, 40, 60]) { Scene.t = t; Scene.draw(0, D); } QUIET = true; }
          finally { window.toast = tw; BALLOON_FORCE = null; }
          if ((S.guide.balloon || 0) !== n0 + 1) f('a balloon seen: the Guide counted ' + ((S.guide.balloon || 0) - n0)); }
        // ---- ducklings ----
        HOUR_FORCE = 14;
        let isl = 0, dk = 0;
        for (const sn of [0, 1, 2, 3]) { SEASON_FORCE = sn;
          for (let h = 1; h <= 4000 && isl < 400; h++) { if (sigKind(h) !== 'island') continue; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier);
            const spring = lookSeason(Scene.look) === 3;
            if (Scene.ducklings && !spring) { f('ducklings in season ' + lookSeason(Scene.look) + ' on ' + Scene.look.id); break; }
            if (spring) { isl++; if (Scene.ducklings) dk++; } } }
        SEASON_FORCE = -1;
        o.ducklings = dk + ' of ' + isl; if (!isl || dk / isl < 0.45 || dk / isl > 0.75) f('ducklings on ' + o.ducklings + ' spring island holes');
        DUCKLING_FORCE = true; S.chaos = { n: 'Night Round' }; DEV.isle(); hideSheet(); if (Scene.ducklings) f('ducklings at night');
        S.chaos = { n: 'Fair' }; DEV.isle(); hideSheet(); Scene.announce = null;
        { let best = 0; for (const t of [10, 25, 40, 55]) { const a = shot(30, t); Scene.ducklings = false; const b = shot(30, t); Scene.ducklings = true; best = Math.max(best, diff(a, b, VH).n); }
          o.dpx = best; if (best < 12) f('the ducklings drew ' + best + ' pixels'); }
        { S.guide = S.guide || {}; const n0 = S.guide.duckling || 0, tw = window.toast; window.toast = () => {};
          try { QUIET = false; guideSpot(Object.assign(Object.create(Scene), { hole: S.hole, props: [], ducklings: true, night: false })); QUIET = true; } finally { window.toast = tw; }
          if ((S.guide.duckling || 0) !== n0 + 1) f('ducklings seen: the Guide counted ' + ((S.guide.duckling || 0) - n0)); }
        if (!guideUrl('duckling')) f('no picture for the Ducklings');
        DUCKLING_FORCE = null; ISLE_FORCE = 0;
        // ---- steam ----
        const steam = () => (Scene.props || []).filter(p => p.kind === 26 && p.sp === 'steam');
        DEV.course(0); hideSheet(); FROST_FORCE = false;
        let cold = 0, wet = 0;
        for (const sn of [0, 1, 2, 3]) for (const hrs of [8, 15]) { SEASON_FORCE = sn; HOUR_FORCE = hrs;
          for (let h = S.hole; h < S.hole + 40; h++) for (const ch of ['Fair', 'Crosswind']) {
            S.chaos = { n: ch }; Scene.newHole(h, S.tier); const st = steam(), want = (sn === 1 || sn === 2) && hrs === 8 && ch === 'Fair' && !Scene.ice;
            if (st.length && !want) { f('steam in season ' + sn + ' at ' + hrs + ' in ' + ch + (Scene.ice ? ' on ice' : '')); break; }
            for (const q of st) if (!Scene.wetSpot(q.d, q.x)) { f('steam laid on dry ground at ' + q.d.toFixed(1) + ',' + q.x.toFixed(1)); break; }
            const W = Scene.water, open = (W && !W.canyon && !W.rail) || Scene.pond;
            if (want && open) { wet++; if (st.length) cold++; } } }
        SEASON_FORCE = -1;
        o.steam = cold + ' of ' + wet; if (!wet || cold / wet < 0.9) f('steam on ' + o.steam + ' cold mornings with water');
        PSTEAM_FORCE = true; S.chaos = { n: 'Fair' }; DEV.stones(); hideSheet(); Scene.announce = null;
        { const keepP = Scene.props; let best = 0;
          for (const t of [3, 7, 11]) { const a = shot(Scene.isle.bank - 5, t); Scene.props = keepP.filter(p => p.sp !== 'steam'); const b = shot(Scene.isle.bank - 5, t); Scene.props = keepP;
            let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] > b[i] + b[i + 1] + b[i + 2] + 12) n++; best = Math.max(best, n); }
          o.spx = best; if (best < 40) f('the steam made ' + best + ' pixels paler'); }
        PSTEAM_FORCE = null; STONES_FORCE = 0;
        // ---- mist pooled in the low ground ----
        { DEV.course(0); hideSheet(); FROST_FORCE = false; let on = 0, want = 0;
          for (const sn of [0, 1, 2, 3]) for (const hrs of [8, 15]) { SEASON_FORCE = sn; HOUR_FORCE = hrs;
            for (let h = S.hole; h < S.hole + 24; h++) for (const ch of ['Fair', 'Crosswind', 'Night Round']) {
              S.chaos = { n: ch }; Scene.newHole(h, S.tier); const w = sn === 1 && hrs === 8 && ch === 'Fair' && !sigKind(h) && !Scene.golden;
              if (Scene.lmist && !w) { f('mist in the dips in season ' + sn + ' at ' + hrs + ' in ' + ch + (sigKind(h) ? ' on a ' + sigKind(h) : '')); break; }
              if (w) { want++; if (Scene.lmist) on++; } } }
          SEASON_FORCE = -1; o.lmist = on + ' of ' + want; if (on !== want) f('mist in the dips on ' + o.lmist + ' autumn mornings');
          // pools only in hollows: the floor below the ground a few paces either side
          let pools = 0; for (let h = S.hole; h < S.hole + 40; h++) { if (sigKind(h)) continue; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier);
            for (const Q of Scene.lowPools()) { pools++; if (!(Q.d1 > Q.d0) || Scene.hAt(Q.d0 - 1.5) < Q.b + 0.5 || Scene.hAt(Q.d1 + 1.5) < Q.b + 0.5) { f('a mist pool not in a hollow at ' + Q.d0.toFixed(1) + '-' + Q.d1.toFixed(1)); break; } } }
          o.pools = pools; if (pools < 20) f('only ' + pools + ' hollows over 40 holes');
          // drawn: paler over the ground, never in the sky
          LMIST_FORCE = true; SEASON_FORCE = 1; S.chaos = { n: 'Fair' }; let best = 0, sky = 0;
          for (let h = S.hole; h < S.hole + 12; h++) { if (sigKind(h)) continue; Scene.newHole(h, S.tier); Scene.announce = null; const P = Scene.lowPools(); if (!P.length) continue;
            const cam = Math.max(0, P[0].d0 - 8), a = shot(cam, 3); Scene.lmist = false; const b2 = shot(cam, 3); Scene.lmist = true;
            let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] > b2[i] + b2[i + 1] + b2[i + 2] + 6) { n++; if (Math.floor(i / 4 / VW) < HORIZON) sky++; }
            best = Math.max(best, n); }
          LMIST_FORCE = null; SEASON_FORCE = -1; HOUR_FORCE = keepH; FROST_FORCE = keepF;
          o.lmpx = best; if (best < 300) f('the mist in a dip made ' + best + ' pixels paler'); if (sky) f(sky + ' pixels of the dips\' mist in the sky'); }
        // ---- frost on the reeds and the lily pads ----
        { const lum = c => { const v = parseInt(c.slice(1), 16); return ((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11; };
          const sprLum = sp => { const g = sp.cv.getContext('2d'), d = g.getImageData(0, 0, sp.cv.width, sp.cv.height).data; let s2 = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { s2 += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; n++; } return s2 / n; };
          FROST_FORCE = 1; SEASON_FORCE = 1; S.chaos = { n: 'Fair' }; DEV.stones(); hideSheet(); Scene.announce = null;
          const L = Scene.look, id = c => c, mf = reedMap(L, id, true), md = reedMap(L, id, false), rf = lum(mf[4]) + lum(mf.B), rd = lum(md[4]) + lum(md.B);
          shot(Scene.isle.bank - 4, 3); const pf = Scene.lilyPal && Scene.lilyPal[2];
          FROST_FORCE = 0; Scene.newHole(S.hole, S.tier); shot(Scene.isle.bank - 4, 3); const pd = Scene.lilyPal && Scene.lilyPal[2];
          o.frost = Math.round(rf - rd) + '/' + (pf && pd ? Math.round(lum(pf) - lum(pd)) : '?');
          if (!(rf > rd + 60)) f('frosty reeds ' + rf.toFixed(0) + ' against ' + rd.toFixed(0));
          if (!pf || !pd || !(lum(pf) > lum(pd) + 40)) f('frosty pads ' + pf + ' against ' + pd);
          FROST_FORCE = null; SEASON_FORCE = -1; STONES_FORCE = 0; }
      } finally { BALLOON_FORCE = null; DUCKLING_FORCE = null; PSTEAM_FORCE = null; SEASON_FORCE = -1; HOUR_FORCE = keepH; FROST_FORCE = keepF; ISLE_FORCE = 0; STONES_FORCE = 0;
        QUIET = false; window.requestAnimationFrame = raf; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['balloons on ' + r.o.balloons + ' calm mornings, none at 3pm, at night, in rain or wind, ' + r.o.bpx + 'px in the sky only; ducklings on ' + r.o.ducklings + ' spring island holes, none other seasons or at night, ' + r.o.dpx + 'px; steam on ' + r.o.steam + ' cold mornings with water, on the water only, ' + r.o.spx + 'px paler; frost on the reeds and pads (+' + r.o.frost + ' paler); mist in the dips on ' + r.o.lmist + ' autumn mornings, ' + r.o.pools + ' hollows over 40 holes, ' + r.o.lmpx + 'px paler; the Guide counts balloons and ducklings'];
  }
};
