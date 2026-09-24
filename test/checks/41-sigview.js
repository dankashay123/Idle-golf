/* Nothing on a signature hole shows through the ground in front of it.
 *
 * A canyon's rope bridge and a river's stepping stones are drawn over the
 * field, after the ground. The ground itself hides whatever a crest stands in
 * front of, row by row (Scene.clipAt), and anything drawn afterwards has to
 * keep to the same line: the bridge's posts and hand-ropes were drawn on top
 * of a hill that hid the gorge itself, on a rolling course seen from the tee.
 *
 * Every course with a canyon or stones is played (the home courses and the
 * others, rolling ground included): two holes of each kind, and on each the
 * camera stands at eight places, from the tee to past the crossing. The frame
 * is drawn with and without the bridge or the stones, and every pixel they
 * add has to lie on or above the clip line of the nearest of them to be seen.
 * The check fails as well if the bridge or stones were seen in too few frames
 * for that to mean anything.
 */
'use strict';
module.exports = {
  name: 'sigview',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { frames: 0, seen: 0, bad: [], holes: 0 };
      const keep = { bridge: Scene.drawBridge, stones: Scene.drawStones, step: window.step };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites();
        const D = derive(), c = Scene.b;
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          if (cs.slot !== 'home' && !['canyon', 'stones'].includes(B.SIG_HOLE[cs.id])) continue;
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          const want = { canyon: 2, stones: 2 };
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            const k = sigKind(h);
            if (!want[k]) continue;
            want[k]--;
            S.hole = h; startHole(); Scene.announce = null;
            const I = Scene.isle;
            o.holes++;
            for (const cam of [0, I.bank * 0.3, I.bank * 0.6, I.bank - 3, I.bank, (I.bank + I.land) / 2, I.land, I.land + 3]) {
              Scene.camD = cam; Scene.walkTo = cam; S.yards = S.yardsMax * (1 - Math.min(0.999, cam / LEN));
              Scene.draw(0, D);
              const a = c.getImageData(0, 0, VW, VH).data;
              Scene.drawBridge = () => {}; Scene.drawStones = () => {};
              Scene.draw(0, D);
              Scene.drawBridge = keep.bridge; Scene.drawStones = keep.stones;
              const b = c.getImageData(0, 0, VW, VH).data;
              const limit = Scene.clipAt(Math.max(I.bank - 0.2, cam - CAM_BACK + 0.7)) + 1;
              let n = 0, low = 0, worst = 0;
              for (let i = 0; i < a.length; i += 4) {
                if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2]) continue;
                n++;
                const y = (i / 4 / VW) | 0;
                if (y > limit) { low++; worst = Math.max(worst, y - limit); }
              }
              o.frames++;
              if (n > 4) o.seen++;
              if (low) o.bad.push(cs.id + ' hole ' + holeInRound(h) + ' (' + k + ') from ' + cam.toFixed(1) + ': ' + low + ' pixels up to ' + worst + ' rows below the ground in front');
            }
          }
        }
      } finally {
        Scene.drawBridge = keep.bridge; Scene.drawStones = keep.stones; window.step = keep.step;
        QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
      }
      return o;
    });
    if (r.bad.length) throw new Error(r.bad.length + ' frames with a bridge or stones drawn through the ground: ' + r.bad.slice(0, 4).join('; '));
    if (r.seen < r.frames * 0.4) throw new Error('the bridge or stones were seen in only ' + r.seen + ' of ' + r.frames + ' frames');
    return [r.holes + ' canyon and stepping-stone holes over every course that has them, ' + r.frames + ' views from the tee to past the crossing',
      'the bridge or stones in view in ' + r.seen + ' of them, and never a pixel below the ground in front'];
  }
};
