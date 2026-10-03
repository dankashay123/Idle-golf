/* The season's touches (the user asked for pumpkins in October, then "do
 * things for other seasons too"): pumpkins and hay bales in autumn, carved
 * and lit at night in Halloween's week, snowmen in winter, tulips in
 * blossom, sunflowers in summer.
 *
 *   - each season lays its own, by the tee on most holes and down the hole,
 *     and none on the short grass, in a hazard, a wood or another hole
 *   - by the season: autumn in October (carved from the 24th), the summer's
 *     only from June to August, none on a course with no season
 *   - drawn: the pumpkin's orange shows by the tee, and a carved one's
 *     candle at night; none in a wager
 */
'use strict';
module.exports = {
  name: 'decor',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], per: {} }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const SPR = { autumn: ['pk', 'bale'], halloween: ['jack', 'bale'], winter: ['snowman'], spring: ['tulip'], summer: ['sunfl'] };
      const day = (m, d) => Math.round(Date.UTC(2026, m, d) / 86400000);
      try {
        hideSheet(); HOUR_FORCE = 14;
        const lay = h => { S.hole = h; S.chaos = { n: 'Fair' }; startHole(); Scene.newHole(h, S.tier); return Scene.props.filter(p => p.kind === 14); };
        for (const k of DECOR_KINDS) {
          DECOR_FORCE = k;
          let tee = 0, all = 0, holes = 0;
          for (let h = 1; h <= 40; h++) {
            const P = lay(h); holes++; all += P.length;
            if (P.some(p => p.d < 8.5)) tee++;
            for (const p of P) {
              if (!SPR[k].includes(p.sp)) f(k + ': a ' + p.sp + ' on hole ' + h);
              const at = ' on hole ' + h + ' at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1);
              if (Scene.onPlay(p.d, p.x, 0.3)) f(k + ': a ' + p.sp + ' on the short grass' + at);
              if (Scene.hitsHazard(p.d, p.x, 0.3)) f(k + ': a ' + p.sp + ' in a hazard' + at);
              if (Scene.onNbr(p.d, p.x, 0)) f(k + ': a ' + p.sp + ' on another hole' + at);
              if (Scene.inFill(p.d, p.x, -0.3, 'wood')) f(k + ': a ' + p.sp + ' in a wood' + at);
            }
          }
          o.per[k] = [tee, (all / holes).toFixed(1)];
          if (tee < holes * 0.6) f(k + ': by the tee on only ' + tee + ' of ' + holes + ' holes');
          if (all < holes * 3) f(k + ': only ' + all + ' over ' + holes + ' holes');
        }
        // nothing through a hill: each alone over a blank, from eight places
        // down each home course's first four holes, in every season
        {
          const D = derive(), c = Scene.b, keep = window.step; window.step = () => {}; FROST_FORCE = 0;
          const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
          const drawn = Q => { const was = Scene.props; blank(); Scene.props = [Q]; Scene.drawProps(); Scene.props = was;
            const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return { n, d }; };
          o.views = 0; o.pix = 0;
          for (const k of DECOR_KINDS) for (const cs of COURSE_HOME) {
            DECOR_FORCE = k; DEV.course(B.COURSE.indexOf(cs)); hideSheet();
            const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
            for (let hh = first; hh < first + 4; hh++) {
              S.hole = hh; S.chaos = { n: 'Fair' }; Scene.newHole(hh, S.tier); Scene.announce = null;
              const P = Scene.props.filter(p => p.kind === 14);
              for (let v = 0; v < 8; v++) {
                Scene.camD = LEN * v / 8; Scene.walkTo = Scene.camD; Scene.t = 1 + v * 0.7; Scene.draw(0, D); o.views++;
                for (const Q of P) {
                  if (Q.d < Scene.camD - 5) continue;
                  const lim = Scene.clipAt(Q.d) + 1, { n, d } = drawn(Q); o.pix += n;
                  for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
                    const i = (y * VW + x) * 4;
                    if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                    f(cs.id + ' ' + k + ' hole ' + holeInRound(hh) + ', camera at ' + Scene.camD.toFixed(1) + ': a ' + Q.sp + ' at ' + Q.d.toFixed(1) + ' shows at row ' + y + ', under the line ' + Math.round(lim));
                    y = VH; break;
                  }
                }
              }
            }
          }
          window.step = keep; FROST_FORCE = null;
          if (o.pix < 3000) f('the touches showed only ' + o.pix + ' pixels over ' + o.views + ' views');
        }
        // by the season and the date
        DECOR_FORCE = null;
        const home = COURSE_HOME[0], cal = courseById(CAL_SEASONED[0]), none = B.COURSE.find(c => c.slot !== 'home' && !CAL_SEASONED.includes(c.id));
        const want = (cs, s, m, d, w) => { DAY_FORCE = day(m, d); const got = seasonDecor(cs, seasonLook(cs, s));
          if (got !== w) f('on ' + cs.n + ' (season ' + s + ') on ' + (m + 1) + '/' + d + ': ' + got + ', not ' + w); };
        want(home, 1, 9, 10, 'autumn'); want(home, 1, 9, 28, 'halloween'); want(home, 1, 10, 28, 'autumn');
        want(home, 2, 9, 10, 'winter'); want(home, 3, 9, 10, 'spring'); want(home, 0, 6, 10, 'summer'); want(home, 0, 9, 10, null);
        want(cal, 0, 7, 1, 'summer'); want(cal, 0, 3, 1, null); want(none, 0, 6, 10, null);
        DAY_FORCE = null;
        // drawn: the pumpkin's orange by the tee, and the candle at night
        // (the thing measured, not the frame: the same frame drawn again
        // without them, and the pixels that differ counted)
        const D = derive(), grab = () => Scene.b.getImageData(0, 0, VW, VH).data;
        const shoot = (k, night, wager) => { DECOR_FORCE = k; SEASON_FORCE = 1; let h = 1;
          for (; h < 40; h++) { lay(h); if (Scene.props.some(p => p.kind === 14 && p.d < 8.5)) break; }
          S.chaos = { n: night ? 'Night' : 'Fair' }; S.dgnRun = wager ? { id: B.DGN[0].id } : null; Scene.newHole(h, S.tier);
          Scene.balls = []; Scene.restBall = null; Scene.camD = 0; Scene.walkTo = 0; Scene.draw(0, D); Scene.draw(0, D);
          const a = grab(), keep = Scene.props; Scene.props = keep.filter(p => p.kind !== 14); Scene.draw(0, D); const b = grab(); Scene.props = keep;
          let n = 0, lit = 0;
          for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { n++; if (a[i] > 220 && a[i + 1] > 170 && a[i + 2] < 120) lit++; }
          S.dgnRun = null; return night ? lit : n; };
        o.orange = shoot('autumn', 0); o.candle = shoot('halloween', 1); o.wager = shoot('autumn', 0, 1);
        if (o.orange < 12) f('only ' + o.orange + ' pixels of the display by the tee');
        if (o.candle < 4) f('only ' + o.candle + ' pixels of candle at night');
        if (o.wager > o.orange / 4) f(o.wager + ' pixels of pumpkin in a wager');
      } finally {
        DECOR_FORCE = null; DAY_FORCE = null; SEASON_FORCE = -1; HOUR_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    const views = r.views + ' views down the home courses in every season, ' + r.pix + ' pixels of them, none under the ground\'s line';
    return ['over 40 holes each: ' + Object.entries(r.per).map(([k, v]) => k + ' by the tee on ' + v[0] + ', ' + v[1] + ' a hole').join('; ') + '; none on the short grass, in a hazard, a wood or another hole',
      views,
      'autumn in October, carved from the 24th; summer only June to August; none on a course without a season',
      r.orange + ' pixels of the display by the tee, ' + r.candle + ' of candle at night, ' + r.wager + ' in a wager'];
  }
};
