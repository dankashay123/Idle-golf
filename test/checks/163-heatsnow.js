/* Heat shimmer, snow settling, the low sun on the water and footprints in
 * the frost (the user picked all four).
 *
 *   - shimmer: on hot summer afternoons only (none in the morning, the
 *     evening, another season, rain, night or frost), on about two holes in
 *     three; drawn as rows by the horizon moved sideways, nothing moved
 *     below its band, and moving with the clock
 *   - snow settling: in a snowy round, a dusting on holes 1 to 6, more from
 *     7, deep from 13; the trees whiter at each step, their trunks bare; the
 *     clubhouse's and the grandstand's roofs white with it; none without
 *     snowfall; the trees' sets stay bounded
 *   - the low sun on the water: with Dawn and Dusk on, at dusk the water
 *     warmer, only the water; none with the setting off
 *   - footprints: on a frosty morning his steps darker on the grass behind
 *     him; none on an ordinary morning */
'use strict';
module.exports = {
  name: 'heatsnow',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; QUIET = true; const keepH = HOUR_FORCE;
      const D = derive(), px = () => Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
      const shot = (cam, t) => { for (let k = 0; k < 2; k++) { Scene.t = t; Scene.camD = cam; Scene.walkTo = cam; Scene.draw(0, D); } return px(); };
      const fair = () => { S.chaos = { n: 'Fair' }; };
      try {
        DEV.course(0); hideSheet();
        // ---- shimmer ----
        const sh = (sn, hr0, h) => { SEASON_FORCE = sn; HOUR_FORCE = hr0; fair(); Scene.newHole(h, S.tier); return Scene.shimmer; };
        let on = 0, n = 0;
        for (let h = 1; h <= 300; h++) { const s0 = sh(0, 14, h); if (Scene.fog) { if (s0) f('shimmer in the fog'); continue; } if (lookSeason(Scene.look) !== 0) { if (s0) f('shimmer out of summer'); continue; } n++; if (s0) on++; }
        o.shim = on + ' of ' + n; if (on / n < 0.55 || on / n > 0.78) f('shimmer on ' + o.shim + ' summer afternoons');
        for (let h = 1; h <= 60; h++) {
          for (const hh of [8, 11, 18, 21]) if (sh(0, hh, h)) { f('shimmer in summer at ' + hh); break; }
          for (const sn of [1, 2, 3]) if (sh(sn, 14, h)) { f('shimmer in season ' + sn); break; }
          SEASON_FORCE = 0; HOUR_FORCE = 14; S.chaos = { n: 'Night Round' }; Scene.newHole(h, S.tier); if (Scene.shimmer) f('shimmer at night');
          FROST_FORCE = 1; fair(); Scene.newHole(h, S.tier); if (Scene.shimmer) f('shimmer on a frosty morning'); FROST_FORCE = null;
        }
        { SHIMMER_FORCE = true; SEASON_FORCE = 0; HOUR_FORCE = 14; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null;
          const y1 = Math.min(VH - 1, Math.round(Scene.proj(0 - CAM_BACK + 22, 0).y));
          let best = 0, low = 0, moved = 0, prev = null;
          for (const t of [3, 7.3, 11.9]) { const a = shot(0, t); Scene.shimmer = false; const b = shot(0, t); Scene.shimmer = true;
            let m = 0, sig = ''; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { m++; const y = Math.floor(i / 4 / VW); if (y < HORIZON - 3 || y > y1) low++; if (m < 400) sig += i + ','; }
            if (prev !== null && sig !== prev) moved++; prev = sig; best = Math.max(best, m); }
          SHIMMER_FORCE = null; o.spx = best;
          if (best < 300) f('the shimmer moved ' + best + ' pixels'); if (low) f(low + ' pixels moved outside the shimmer\'s band'); if (!moved) f('the shimmer never changed'); }
        // ---- snow settling ----
        SEASON_FORCE = 2; HOUR_FORCE = 14; fair();
        const lv = []; for (const k of [1, 6, 7, 12, 13, 18]) { const h = S.hole - holeInRound(S.hole) + k; Scene.newHole(h, S.tier); lv.push(Scene.snow ? Scene.snowL : -1); }
        o.lv = lv.join(''); if (o.lv !== '112233') f('snow by hole 1/6/7/12/13/18: ' + o.lv);
        { SEASON_FORCE = 0; Scene.newHole(S.hole, S.tier); if (Scene.snowL) f('snow settled with no snowfall'); }
        { const white = cv => { const a = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let w = 0; for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 200 && a[i] > 225 && a[i + 1] > 230 && a[i + 2] > 235) w++; return w; };
          const S0 = PINE_ROWS.join('').split('S').length - 1;
          const cnt = L => { const R = snowRows(PINE_ROWS, L); let s2 = 0; for (let y = 0; y < R.length; y++) for (let x = 0; x < R[y].length; x++) { const c0 = PINE_ROWS[y][x], c1 = R[y][x]; if (c1 !== c0) { if (!(c0 >= '0' && c0 <= '4')) f('snow on a trunk'); s2++; } } return s2; };
          const t = [cnt(1), cnt(2), cnt(3)]; o.tree = t.join('/'); if (!(S0 === 0 && t[0] > 5 && t[1] > t[0] && t[2] > t[1])) f('snow on a pine by level ' + o.tree);
          const c0 = white(clubhouseCv(12, false, 1, 3, false, false, 0, 0)), c3 = white(clubhouseCv(12, false, 1, 3, false, false, 0, 3));
          const s0 = white(standCv(12, 0.8, false, 3, 0, false, false, 0, 0)), s3 = white(standCv(12, 0.8, false, 3, 0, false, false, 0, 3));
          o.roofs = (c3 - c0) + '/' + (s3 - s0); if (c3 - c0 < 20) f('the clubhouse roof took ' + (c3 - c0) + ' pixels of snow'); if (s3 - s0 < 20) f('the grandstand roof took ' + (s3 - s0) + ' pixels of snow');
          SEASON_FORCE = 2; for (let ci = 0; ci < Math.min(6, B.COURSE.length); ci++) { DEV.course(ci); hideSheet(); for (const k of [1, 7, 13]) { fair(); Scene.newHole(S.hole - holeInRound(S.hole) + k, S.tier); } }
          o.sets = Object.keys(TREE_CACHE).length; if (o.sets > 8) f(o.sets + ' tree sets kept'); DEV.course(0); hideSheet(); }
        // ---- the low sun on the water ----
        { SEASON_FORCE = 0; HOUR_FORCE = 19.2; ISLE_FORCE = S.hole; const keepDD = S.dawnDusk; fair();
          S.dawnDusk = 1; Scene.newHole(S.hole, S.tier); Scene.announce = null; const cam = LEN - 16, a = shot(cam, 4), dd = !!Scene.dawnDusk;
          delete S.dawnDusk; Scene.newHole(S.hole, S.tier); Scene.announce = null; const b = shot(cam, 4), wat = Scene.waterAt(Scene.b, Scene.theme);
          let warm = 0, off = 0; for (let i = 0; i < a.length; i += 4) { const y = Math.floor(i / 4 / VW); if (y <= HORIZON + 2) continue;
            if (a[i] - a[i + 2] > b[i] - b[i + 2] + 10) { warm++; if (!wat((i / 4) % VW, y)) off++; } }
          o.glow = warm; if (!dd) f('no dusk at 7pm with Dawn and Dusk on'); if (warm < 1500) f('the dusk warmed ' + warm + ' pixels of water'); if (off > warm * 0.03) f(off + ' pixels warmed off the water');
          S.dawnDusk = 1; HOUR_FORCE = 13; Scene.newHole(S.hole, S.tier); if (Scene.dawnDusk) f('dusk at 1pm');
          if (keepDD === undefined) delete S.dawnDusk; else S.dawnDusk = keepDD; ISLE_FORCE = 0; }
        // ---- footprints in the frost ----
        { SEASON_FORCE = 1; HOUR_FORCE = 8; FROST_FORCE = 1; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.tracks = null;
          Scene.noteTrack(0, 14); if (!Scene.tracks) f('no tracks kept on a frosty morning');
          const a = shot(14, 2); const keep = Scene.tracks; Scene.tracks = null; const b = shot(14, 2); Scene.tracks = keep;
          let dk = 0; for (let i = 0; i < a.length; i += 4) if (a[i] + a[i + 1] + a[i + 2] < b[i] + b[i + 1] + b[i + 2] - 15) dk++;
          o.prints = dk; if (dk < 4) f('frost footprints drew ' + dk + ' pixels');
          FROST_FORCE = 0; fair(); Scene.newHole(S.hole, S.tier); Scene.tracks = null; Scene.noteTrack(0, 14); if (!Scene.snow && Scene.tracks) f('tracks kept with no frost or snow'); }
      } finally { SHIMMER_FORCE = null; SNOWSET_FORCE = null; FROST_FORCE = null; ISLE_FORCE = 0; HOUR_FORCE = keepH; SEASON_FORCE = -1; QUIET = false; window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const o = r.o;
    return ['shimmer on ' + o.shim + ' summer afternoons, never morning, evening, other seasons, night or frost; ' + o.spx + 'px moved, all by the horizon, moving',
      'snow settling by hole 1/6/7/12/13/18 ' + o.lv + ', a pine ' + o.tree + 'px whiter, trunks bare; roofs ' + o.roofs + 'px of snow; ' + o.sets + ' tree sets kept',
      'dusk on the water ' + o.glow + 'px warmer, only the water; frost footprints ' + o.prints + 'px'];
  }
};
