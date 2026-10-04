/* The wildlife round the course and the golfers on the other holes (the
 * user asked for twenty more animals "added places but not overcrowded",
 * for the Field Guide, and "it would be sweet if you could always see other
 * golfers playing on adjacent holes").
 *
 *   - every kind laid somewhere over a sweep of the seasons, night, the
 *     signature holes and a dry course; never more than two kinds or five
 *     animals on a hole, on about half the holes; each where it lives: the
 *     swimmers on the water, the rest on dry ground off the play, out of
 *     the hazards, the woods and the other holes; night's only at night
 *   - golfers on most holes with another hole beside them, on its green or
 *     its fairway, never on this hole's play, at night or in a wager
 *   - nothing through a hill: each alone over a blank from eight places down
 *     each home course's first four holes, by day and by night
 *   - the Field Guide has all twenty, a picture each
 */
'use strict';
module.exports = {
  name: 'critters',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], kinds: {}, holes: 0, with: 0, golf: 0, nb: 0 }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); HOUR_FORCE = 14;
        const wetAt = (d, x) => { const w = Scene.water; return (w && !w.canyon && !w.rail && Math.abs(d - w.d) < w.rd && Math.abs(x - w.x) < w.rx) || Scene.inPond(d, x, 0) || Scene.inFill(d, x, 0, 'lake'); };
        const look = (h, ch) => { S.hole = h; S.chaos = { n: ch || 'Fair' }; Scene.newHole(h, S.tier);
          const P = Scene.props, A = P.filter(p => p.kind === 15), at = ' on hole ' + h;
          o.holes++; if (A.length) o.with++;
          const kinds = new Set(A.map(p => p.an));
          if (kinds.size > 2) f(kinds.size + ' kinds' + at);
          if (A.length > 5) f(A.length + ' animals' + at);
          for (const p of A) { const C = CRIT[p.an]; o.kinds[p.an] = (o.kinds[p.an] || 0) + 1;
            const w = ' (' + p.an + ' at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1) + at + ')';
            if (!C.both && !!C.night !== !!Scene.night) f('out at the wrong time' + w);    // (the hedgehog: day and night)
            if (C.at === 'air') continue;
            const swim = C.at === 'water' || C.at === 'sea' && !C.shore;
            if (swim && !wetAt(p.d, p.x)) f('a swimmer on dry ground' + w);
            if (!swim && wetAt(p.d, p.x)) f('in the water' + w);
            if (!swim && (Scene.onPlay(p.d, p.x, 0.3) || Scene.hitsHazard(p.d, p.x, 0) || Scene.inFill(p.d, p.x, -0.3, 'wood') || Scene.onNbr(p.d, p.x, 0))) f('on the play, a hazard, a wood or another hole' + w);
          }
          const G = P.filter(p => p.kind === 16);
          if ((Scene.nbrs || []).some(N => N.gd < LEN + 100) && !Scene.night) { o.nb++; if (G.length) o.golf++; }
          for (const p of G) if (Scene.onPlay(p.d, p.x, 0.3) || Scene.hitsHazard(p.d, p.x, 0) || Scene.inFill(p.d, p.x, -0.3, 'wood')) f('a golfer on this hole, a hazard or a wood at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1) + at);
          if (Scene.night && G.length) f('golfers out at night' + at);
          return P; };
        const h0 = S.hole;
        for (const s of [0, 1, 2, 3]) { SEASON_FORCE = s; for (let h = h0; h < h0 + 40; h++) look(h); for (let h = h0; h < h0 + 15; h++) look(h, 'Night'); }
        SEASON_FORCE = -1;
        for (const k of SIG_KINDS) for (let h = h0, m = 0; m < 10 && h < h0 + 20000; h++) if (sigKind(h) === k) { look(h); m++; }
        DEV.course(B.COURSE.findIndex(c => c.id === CRIT_DRY[0])); hideSheet();
        for (let h = S.hole, e = S.hole + 40; h < e; h++) look(h);
        const miss = Object.keys(CRIT).filter(k => !o.kinds[k]);
        if (miss.length) f('never laid: ' + miss.join(', '));
        o.share = o.with / o.holes;
        if (o.share < 0.35 || o.share > 0.85) f('animals on ' + Math.round(o.share * 100) + '% of holes');
        if (o.golf < o.nb * 0.8) f('golfers on only ' + o.golf + ' of ' + o.nb + ' holes with another hole beside');
        S.dgnRun = { id: B.DGN[0].id }; Scene.newHole(h0, S.tier); if (Scene.props.some(p => p.kind === 15 || p.kind === 16)) f('animals or golfers in a wager'); S.dgnRun = null;
        // nothing through a hill
        const D = derive(), c = Scene.b, keep = window.step; window.step = () => {}; FROST_FORCE = 0;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const drawn = Q => { const was = Scene.props; blank(); Scene.props = [Q]; Scene.drawProps(); Scene.props = was;
          const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return { n, d }; };
        o.views = 0; o.pix = 0;
        for (const cs of COURSE_HOME) for (const night of [0, 1]) {
          DEV.course(B.COURSE.indexOf(cs)); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 4; hh++) {
            S.hole = hh; S.chaos = { n: night ? 'Night' : 'Fair' }; Scene.newHole(hh, S.tier); Scene.announce = null;
            const P = Scene.props.filter(p => (p.kind === 15 && CRIT[p.an].at !== 'air') || p.kind === 16);
            if (!P.length) continue;
            for (let v = 0; v < 8; v++) {
              Scene.camD = LEN * v / 8; Scene.walkTo = Scene.camD; Scene.t = 1 + v * 0.7; Scene.critUp = {}; Scene.draw(0, D); o.views++;
              for (const Q of P) {
                if (Q.d < Scene.camD - 5) continue;
                // (one that has run off is drawn where it ran to)
                if (CRIT[Q.an] && CRIT[Q.an].flee && Q.d - Scene.camD < 4.5) continue;
                const lim = Scene.clipAt(Q.d) + 1, { n, d } = drawn(Q); o.pix += n;
                for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
                  const i = (y * VW + x) * 4;
                  if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                  f(cs.id + ' hole ' + holeInRound(hh) + (night ? ' at night' : '') + ', camera at ' + Scene.camD.toFixed(1) + ': ' + (Q.an || 'a golfer') + ' at ' + Q.d.toFixed(1) + ' shows at row ' + y + ', under the line ' + Math.round(lim));
                  y = VH; break;
                }
              }
            }
          }
        }
        window.step = keep; FROST_FORCE = null;
        if (o.pix < 1500) f('the animals and golfers showed only ' + o.pix + ' pixels over ' + o.views + ' views');
        // the Field Guide
        const ids = Object.keys(CRIT).filter(k => !GUIDE.some(g => g.id === k));
        if (ids.length) f('not in the Field Guide: ' + ids.join(', '));
        for (const k of Object.keys(CRIT)) if (!guideUrl(k).startsWith('data:image')) f('no picture for ' + k);
      } finally {
        SEASON_FORCE = -1; HOUR_FORCE = null; FROST_FORCE = null; S.dgnRun = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['all ' + Object.keys(r.kinds).length + ' kinds laid over ' + r.holes + ' holes, on ' + Math.round(r.share * 100) + '% of them, two kinds and five animals at most, each where it lives',
      'golfers on ' + r.golf + ' of ' + r.nb + ' holes with another hole beside, none at night or in a wager',
      r.views + ' views down the home courses by day and night, ' + r.pix + ' pixels of them, none under the ground\'s line; all twenty in the Field Guide'];
  }
};
