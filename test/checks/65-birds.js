/* Birds (the user asked, from the menu): a flock crossing the sky now and
 * then, and birds on the fairway that scatter when a ball lands near them.
 *
 *   - on the fairway of most ordinary holes, a group or two, never in a
 *     hazard, on the green or on a signature hole (it has its own life)
 *   - nothing through a hill: every bird alone over a blank, standing and
 *     in flight, from eight places down each home course's first four
 *     holes; no pixel under the ground's line at its own distance
 *   - a ball coming to rest among them sends the group up and away, gone in
 *     two seconds; he walking up does too; the other group stays
 *   - none at night, in the rain or in a wager
 *   - the flock: two or more cross in three minutes, over the hills and
 *     clear of the readout (the first flew behind it), none at night or in
 *     the rain; and none of it calls Math.random (the pacing checks count
 *     on its sequence)
 */
'use strict';
module.exports = {
  name: 'birds',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], holes: 0, withBirds: 0, views: 0, pix: 0, flocks: 0 }, keep = window.step, mr = Math.random;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive(), c = Scene.b;
        let rnd = 0, inB = 0; Math.random = () => { if (inB) rnd++; return mr(); };
        const ob = Scene.drawBird, of = Scene.drawFlock;
        Scene.drawBird = function () { inB++; try { return ob.apply(this, arguments); } finally { inB--; } };
        Scene.drawFlock = function () { inB++; try { return of.apply(this, arguments); } finally { inB--; } };
        o.restore = () => { Scene.drawBird = ob; Scene.drawFlock = of; };
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const drawn = (props) => { const was = Scene.props; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was;
          const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return { n, d }; };
        const under = (d, lim) => { for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
          const i = (y * VW + x) * 4; if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) return y; } return -1; };
        const fair = () => { S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); };
        let sample = null;
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 4; hh++) {
            S.hole = hh; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.night = false; Scene.rain = false;
            const P = Scene.props, where = cs.id + ' hole ' + holeInRound(hh), bs = P.filter(p => p.kind === 9);
            o.holes++;
            if (sigKind(hh)) { if (bs.length) f(where + ': birds on a signature hole'); continue; }
            if (bs.length) o.withBirds++;
            for (const p of bs) if (!Scene.onPlay(p.d, p.x, 0) || Scene.hitsHazard(p.d, p.x, 0.3) || p.d > LEN - 10) f(where + ': a bird off the fairway, in a hazard or on the green at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1));
            if (bs.length && !sample) sample = { ci, hh };
            if (cs.slot !== 'home') continue;
            for (let k = 0; k < 8; k++) {
              Scene.camD = LEN * k / 8; Scene.walkTo = 0; Scene.restBall = null; Scene.t = 1 + k * 0.7;
              Scene.draw(0, D); o.views++;
              for (const Q of bs) {
                if (Q.d < Scene.camD - 5) continue;
                // standing, and at two moments in flight
                for (const up of [null, 0.5, 1.1]) {
                  Scene.birdUp = up === null ? {} : { [Q.g]: Scene.t - up };
                  const fl = up === null ? 0 : Math.max(0, up - hr(Q.k, 336) * 0.18);
                  if (up === null && Q.d - Scene.camD < 5.5 && Q.d - Scene.camD > -3) continue;   // (he is on them: they are off)
                  const lim = Scene.clipAt(Q.d + fl * 1.2) + 1, { n, d } = drawn([Q]);
                  o.pix += n;
                  const y = under(d, lim);
                  if (y >= 0) f(where + ', camera at ' + Scene.camD.toFixed(1) + ': a bird ' + (up === null ? 'on the ground' : up + 's up') + ' at ' + Q.d.toFixed(1) + ' shows at row ' + y + ', under the line ' + Math.round(lim));
                }
              }
            }
          }
        }
        if (o.withBirds < o.holes * 0.5) f('birds on only ' + o.withBirds + ' of ' + o.holes + ' holes');
        if (o.pix < 800) f('the birds showed only ' + o.pix + ' pixels over ' + o.views + ' views');
        // the scatter, played in frames
        if (!sample) f('no hole with birds to play');
        else {
          DEV.course(sample.ci); hideSheet(); S.hole = sample.hh; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null;
          Scene.night = false; Scene.rain = false;
          const bs = Scene.props.filter(p => p.kind === 9), g0 = bs[0].g, other = bs.filter(p => p.g !== g0);
          const mine = bs.filter(p => p.g === g0), gd = mine.reduce((a, p) => a + p.d, 0) / mine.length, gx = mine.reduce((a, p) => a + p.x, 0) / mine.length;
          Scene.camD = Math.max(0, gd - 14); Scene.walkTo = Scene.camD; Scene.birdUp = {}; Scene.restBall = null;
          const px = ps => drawn(ps).n;
          const still = px(mine);
          if (!(still > 0)) f('the group does not show before the ball (' + still + ')');
          Scene.restBall = { d: gd + 1.5, lat: gx + 0.8 };
          const t0 = Scene.t; px(mine);
          if (Scene.birdUp[g0] === undefined) f('a ball among them did not send them up');
          if (other.length && other.some(p => Scene.birdUp[p.g] !== undefined) && Math.abs(other[0].d - gd) > 8) f('the other group went up with them');
          Scene.t = t0 + 0.8; const mid = px(mine);
          Scene.t = t0 + 2.2; const gone = px(mine);
          if (!(mid > 0) || gone !== 0) f('the group did not fly and go (' + mid + ' pixels at 0.8s, ' + gone + ' at 2.2s)');
          // walking up to them
          Scene.birdUp = {}; Scene.restBall = null; Scene.t = t0 + 5;
          Scene.camD = gd - 4; px(mine);
          if (Scene.birdUp[g0] === undefined) f('he walked up to them and they stayed');
          // none at night, in the rain or in a wager
          Scene.birdUp = {}; Scene.camD = Math.max(0, gd - 14);
          for (const [k, set] of [['night', () => { Scene.night = true; }], ['rain', () => { Scene.rain = true; }], ['a wager', () => { S.dgnRun = { id: 'x' }; }]]) {
            set(); const n = px(mine); Scene.night = false; Scene.rain = false; delete S.dgnRun;
            if (n) f(n + ' pixels of birds ' + (k === 'a wager' ? 'in ' : 'in the ') + k);
          }
        }
        // the flock, over three minutes of the scene's own clock
        {
          const st = $('stage').getBoundingClientRect(), rd = $('readout').getBoundingClientRect();
          const kk = (parseFloat(Scene.cv.style.height) || st.height) / VH, top = (rd.bottom - st.top) / kk;
          Scene.flock = null; Scene.flockNext = undefined; Scene.night = false; Scene.rain = false;
          let low = VH, high = 0, seen = 0, was = null;
          for (let i = 0; i < 1800; i++) {
            Scene.t += 0.1; blank(); Scene.drawFlock();
            if (Scene.flock && Scene.flock !== was) { o.flocks++; was = Scene.flock; }
            if (i % 5) continue;
            const d = c.getImageData(0, 0, VW, VH).data;
            for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) { const j = (y * VW + x) * 4;
              if (!(d[j] === 1 && d[j + 1] === 2 && d[j + 2] === 3)) { seen++; low = Math.min(low, y); high = Math.max(high, y); } }
          }
          o.flockRows = low + '-' + high; o.readout = Math.round(top);
          if (o.flocks < 2) f(o.flocks + ' flocks in three minutes');
          if (!seen) f('no flock drawn in three minutes');
          if (low <= top) f('the flock flew at row ' + low + ', behind the readout (to row ' + Math.round(top) + ')');
          if (high >= HORIZON * 0.7) f('the flock flew low, at row ' + high + ' (the horizon at ' + HORIZON + ')');
          for (const [k, set] of [['night', () => { Scene.night = true; }], ['rain', () => { Scene.rain = true; }]]) {
            set(); let n = 0;
            for (let i = 0; i < 600; i++) { Scene.t += 0.1; blank(); Scene.drawFlock(); if (Scene.flock) n++; }
            Scene.night = false; Scene.rain = false;
            if (n) f('a flock in the ' + k);
          }
        }
        if (rnd) f('the birds called Math.random ' + rnd + ' times');
      } finally {
        if (o.restore) o.restore(); delete o.restore;
        Math.random = mr; window.step = keep; FROST_FORCE = null; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.withBirds + ' of ' + r.holes + ' holes with birds on the fairway, none off it or on a signature hole; ' + r.views + ' views, ' + r.pix + ' pixels of birds standing and flying, none under the ground\'s line',
      'a ball among them sends the group up and gone in 2s, and so does he; none at night, in the rain or a wager',
      r.flocks + ' flocks in three minutes, at rows ' + r.flockRows + ' (the readout ends at ' + r.readout + '); none at night or in the rain; no Math.random'];
  }
};
