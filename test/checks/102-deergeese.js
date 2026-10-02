/* Wildlife for autumn and winter (the user asked: "geese overhead, a deer
 * at the edge of the woods"):
 *
 *   - in autumn and winter about half the flocks going over are geese in a
 *     V; in the other seasons none
 *   - deer are laid on most autumn and winter holes and on no other: each
 *     in the rough just in front of a wood, clear of the play, hazards,
 *     other holes, lakes and the cart path; their pictures stand on their
 *     bottom row, shrunk or not
 *   - drawn by day from several places down the hole, a deer adds pixels
 *     (it is seen), and none of them below the ground's line at its own
 *     distance (nothing through a hill in front); none at night
 */
'use strict';
module.exports = {
  name: 'deergeese',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], holes: {}, deer: 0, seen: 0, frames: 0, geese: {} };
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const keepStep = window.step, keepSea = SEASON_FORCE, keepHour = HOUR_FORCE;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14;
        // their pictures stand on the ground
        for (const g of [0, 1]) for (const s of [0, 1]) for (const w of [0, 1]) { const sp = deerSprite(g, s, w);
          if (!/[^.]/.test(sp.rows[sp.rows.length - 1])) f('a deer stands above its bottom row');
          for (let h = 4; h < sp.h; h += 2) { const sm = shrinkSprite(sp, Math.round(h * 26 / 22), h); if (sm && !/[^. ]/.test(sm.rows[sm.rows.length - 1])) f('a deer shrunk to ' + h + 'px stands above the ground'); } }
        const D = derive(), c = Scene.b, home = B.COURSE.findIndex(cs => cs.slot === 'home');
        for (const sea of [0, 1, 2, 3]) {
          SEASON_FORCE = sea; DEV.course(home); hideSheet();
          const first = S.hole, name = SEASONS[sea] ? SEASONS[sea].n : 'Summer';
          let laid = 0, n = 0, gz = 0, fl = 0;
          for (let h = first; h < first + 36; h++) {
            S.hole = h; startHole(); Scene.announce = null; n++;
            // the flocks: geese or not
            for (let i = 0; i < 6; i++) { Scene.flock = null; Scene.flockNext = Scene.t - 1; Scene.night = false; Scene.rain = false; Scene.flockN = h * 6 + i; Scene.drawFlock(); if (Scene.flock) { fl++; if (Scene.flock.geese) gz++; } }
            const deer = (Scene.props || []).filter(q => q.kind === 13);
            if (deer.length) laid++;
            for (const p of deer) { o.deer++;
              const wood = Scene.fills.some(F => F.kind === 'wood' && F.sd === Math.sign(p.x) && p.d > F.d0 && p.d < F.d1 && Math.abs(Math.abs(p.x) - Scene.fillIn(F, p.d)) < 1.5);
              if (!wood) f(name + ' hole ' + h + ': a deer at ' + p.d.toFixed(1) + ',' + p.x.toFixed(1) + ' is not at a wood\'s edge');
              if (Scene.onPlay(p.d, p.x, 0.5) || Scene.hitsHazard(p.d, p.x, 0.5) || Scene.onNbr(p.d, p.x, 0.2) || Scene.inFill(p.d, p.x, 0, 'lake'))
                f(name + ' hole ' + h + ': a deer stands on play, a hazard, another hole or a lake');
              if (Scene.cart && Math.sign(p.x) === Scene.cart.sd && Math.abs(Math.abs(p.x) - Math.abs(Scene.cartX(p.d))) < 0.8) f(name + ' hole ' + h + ': a deer on the cart path');
            }
            // drawn: with and without them, from several places
            if (deer.length && !Scene.night && (sea === 1 || sea === 2) && o.frames < 60) {
              const all = Scene.props.slice(), dmin = Math.min(...deer.map(p => p.d));
              for (const back of [24, 14, 8, 4]) {
                Scene.camD = Math.max(0, dmin - back); Scene.walkTo = Scene.camD; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.flock = null; Scene.flockNext = 1e9;
                Scene.props = all.filter(q => q.kind !== 13); Scene.draw(0, D); const A = c.getImageData(0, 0, VW, VH).data;
                Scene.props = all; Scene.draw(0, D); const Bd = c.getImageData(0, 0, VW, VH).data;
                o.frames++;
                const lim = Math.max(...deer.map(p => Scene.clipAt(p.d)));
                let add = 0, under = 0;
                for (let i = 0; i < A.length; i += 4) if (A[i] !== Bd[i] || A[i + 1] !== Bd[i + 1] || A[i + 2] !== Bd[i + 2]) { add++; if (((i >> 2) / VW | 0) > lim + 1) under++; }
                if (add) o.seen++;
                if (under) f(name + ' hole ' + h + ' from ' + Scene.camD.toFixed(1) + ': ' + under + ' deer pixels below the ground\'s line');
                // and at night none
                if (back === 8) { Scene.night = true; Scene.props = all.filter(q => q.kind !== 13); Scene.draw(0, D); const N1 = c.getImageData(0, 0, VW, VH).data;
                  Scene.props = all; Scene.draw(0, D); const N2 = c.getImageData(0, 0, VW, VH).data; Scene.night = false;
                  let nd = 0; for (let i = 0; i < N1.length; i += 4) if (N1[i] !== N2[i]) nd++; if (nd) f('a deer drawn at night (' + nd + ' pixels)'); }
              }
            }
          }
          o.holes[name] = laid + '/' + n; o.geese[name] = gz + '/' + fl;
          if ((sea === 1 || sea === 2) && laid < n * 0.4) f(name + ': deer on only ' + laid + ' of ' + n + ' holes');
          if (sea !== 1 && sea !== 2 && laid) f(name + ': deer on ' + laid + ' holes');
          if ((sea === 1 || sea === 2) && (gz < fl * 0.3 || gz > fl * 0.7)) f(name + ': geese in ' + gz + ' of ' + fl + ' flocks');
          if (sea !== 1 && sea !== 2 && gz) f(name + ': geese in ' + gz + ' flocks');
        }
        if (o.seen < 8) f('deer seen in only ' + o.seen + ' of ' + o.frames + ' frames');
      } finally {
        SEASON_FORCE = keepSea; HOUR_FORCE = keepHour; window.step = keepStep;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['deer on holes: ' + JSON.stringify(r.holes) + ', ' + r.deer + ' in all, at a wood\'s edge and clear of play',
      'geese in flocks: ' + JSON.stringify(r.geese), 'deer seen in ' + r.seen + ' of ' + r.frames + ' frames, none through the ground, none at night'];
  }
};
