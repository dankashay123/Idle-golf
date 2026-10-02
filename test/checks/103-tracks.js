/* His footprints in the snow of a winter hole:
 *
 *   - walking on a winter hole leaves the length walked marked; in any
 *     other season, in a wager or flying over water, nothing
 *   - drawn, they show behind him, a few pixels to a print
 *   - a ball coming down in the snow leaves its mark (the last dozen kept),
 *     drawn ahead of him, none of it below the ground's line at its own
 *     distance; none in other seasons or a wager
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
          Scene.noteTrack(0, 10); Scene.noteMark(12, 1);
          const snow = Scene.snow;
          if (sea === 2 && !(Scene.marks && Scene.marks.length === 1)) f('a ball down in the snow left no mark');
          if (sea !== 2 && Scene.marks) f('a ball marked the ground with no snow');
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
          // its marks, ahead of him
          { const cam = 10; Scene.camD = cam; Scene.walkTo = cam; Scene.tracks = null; Scene.restBall = null; Scene.balls = [];
            const keep = Scene.drawGolfer; Scene.drawGolfer = () => {};
            Scene.marks = null; Scene.draw(0, D); const A = c.getImageData(0, 0, VW, VH).data;
            for (let k = 0; k < 16; k++) Scene.noteMark(cam + 2 + k * 0.6, (k % 5 - 2) * 1.3);
            if (Scene.marks.length !== 12) f('marks kept: ' + Scene.marks.length);
            Scene.draw(0, D); const Bd = c.getImageData(0, 0, VW, VH).data; Scene.drawGolfer = keep;
            const lim = Math.max(...Scene.marks.map(m => Scene.clipAt(m.d)));
            let n = 0, under = 0; for (let i = 0; i < A.length; i += 4) if (A[i] !== Bd[i] || A[i + 1] !== Bd[i + 1] || A[i + 2] !== Bd[i + 2]) { n++; if (((i >> 2) / VW | 0) > lim + 1) under++; }
            o.marks = (o.marks || 0) + (n ? 1 : 0); o.markHoles = (o.markHoles || 0) + 1;
            if (under) f('hole ' + h + ': ' + under + ' mark pixels below the ground\'s line'); Scene.marks = null; }
          // a wager: none
          S.dgnRun = { id: 'x' }; Scene.marks = null; Scene.noteMark(5, 0); if (Scene.marks) f('a mark laid in a wager'); delete S.dgnRun;
          S.dgnRun = { id: 'x' }; Scene.tracks = null; Scene.noteTrack(0, 10); if (Scene.tracks) f('tracks laid in a wager'); delete S.dgnRun;
        }
        if (!o.markHoles || o.marks < o.markHoles * 0.6) f('marks seen on only ' + o.marks + ' of ' + o.markHoles + ' holes');
        if (o.frames < 10 || o.seen < o.frames * 0.6) f('tracks seen in only ' + o.seen + ' of ' + o.frames + ' frames');
        Scene.tracks = { lo: 0, hi: 1 }; Scene.marks = [{ d: 5, lat: 0, t: 0 }]; S.hole++; startHole(); Scene.draw(0, D); if (Scene.tracks || Scene.marks) f('the next hole kept the last one\'s tracks or marks');
      } finally {
        SEASON_FORCE = keepSea; HOUR_FORCE = keepHour; window.step = keepStep;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['a walk in winter leaves tracks and a ball its mark, in other seasons and wagers none; a new hole starts clean',
      'marks seen on ' + r.marks + ' of ' + r.markHoles + ' holes, none below the ground',
      'tracks seen behind him in ' + r.seen + ' of ' + r.frames + ' frames, a few pixels each'];
  }
};
