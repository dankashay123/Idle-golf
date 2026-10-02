/* His footprints in the snow of a winter hole:
 *
 *   - walking on a winter hole leaves the length walked marked; in any
 *     other season, in a wager or flying over water, nothing
 *   - drawn, they show behind him, a few pixels to a print
 *   - a new hole starts clean
 */
'use strict';
module.exports = {
  name: 'tracks',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], frames: 0, seen: 0 };
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      const keepStep = window.step, keepSea = SEASON_FORCE, keepHour = HOUR_FORCE;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14;
        const D = derive(), c = Scene.b, home = B.COURSE.findIndex(cs => cs.slot === 'home');
        for (const sea of [0, 1, 2, 3]) {
          SEASON_FORCE = sea; DEV.course(home); hideSheet(); startHole(); S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); Scene.announce = null;
          Scene.noteTrack(0, 10);
          const snow = Scene.snow;
          if (sea === 2 && !(snow && Scene.tracks && Scene.tracks.hi === 10)) f('a winter walk left no tracks');
          if (sea !== 2 && Scene.tracks) f((SEASONS[sea] ? SEASONS[sea].n : 'Summer') + ': tracks without snow');
        }
        SEASON_FORCE = 2; DEV.course(home); hideSheet();
        const first = S.hole;
        for (let h = first; h < first + 14; h++) {
          S.hole = h; startHole(); S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.draw(0, D);
          if (Scene.tracks) f('hole ' + h + ' started with tracks on it');
          if (!Scene.snow || Scene.night) continue;
          for (let cam = 6; cam < LEN - 6; cam += 9) {
            Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.flock = null; Scene.flockNext = 1e9;
            const keep = Scene.drawGolfer; Scene.drawGolfer = () => {};
            Scene.tracks = null; Scene.draw(0, D); const A = c.getImageData(0, 0, VW, VH).data;
            Scene.tracks = { lo: 0, hi: cam }; Scene.draw(0, D); const Bd = c.getImageData(0, 0, VW, VH).data;
            Scene.drawGolfer = keep; o.frames++;
            let n = 0;
            for (let i = 0; i < A.length; i += 4) if (A[i] !== Bd[i] || A[i + 1] !== Bd[i + 1] || A[i + 2] !== Bd[i + 2]) n++;
            if (n) o.seen++;
            if (n > 60) f('hole ' + h + ' at ' + cam + ': ' + n + ' pixels of tracks, more than prints');
          }
          // a wager: none
          S.dgnRun = { id: 'x' }; Scene.tracks = null; Scene.noteTrack(0, 10); if (Scene.tracks) f('tracks laid in a wager'); delete S.dgnRun;
        }
        if (o.frames < 10 || o.seen < o.frames * 0.6) f('tracks seen in only ' + o.seen + ' of ' + o.frames + ' frames');
        Scene.tracks = { lo: 0, hi: 1 }; S.hole++; startHole(); Scene.draw(0, D); if (Scene.tracks) f('the next hole kept the last one\'s tracks');
      } finally {
        SEASON_FORCE = keepSea; HOUR_FORCE = keepHour; window.step = keepStep;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['a walk in winter leaves tracks, in other seasons and wagers none; a new hole starts clean',
      'tracks seen behind him in ' + r.seen + ' of ' + r.frames + ' frames, a few pixels each'];
  }
};
