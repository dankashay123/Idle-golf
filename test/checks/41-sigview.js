/* Nothing on a signature hole shows through the ground in front of it.
 *
 * A canyon's rope bridge, a river's stepping stones and the pier out to a sea
 * stack (with the stack's rocks) are drawn over the field, after the ground. The ground itself hides whatever a crest stands in
 * front of, row by row (Scene.clipAt), and anything drawn afterwards has to
 * keep to the same line: the bridge's posts and hand-ropes were drawn on top
 * of a hill that hid the gorge itself, on a rolling course seen from the tee.
 *
 * The life on them is held to it too: the pier's spray and gulls, the
 * canyon's hawk and the river's fish (drawn with their holes), and the
 * island's ducks, whose holes are played as well; and the railway crossing,
 * its line, posts and a train on it in every view, every kind in turn; and
 * the weather on them (snow settled on them, a storm's spray) in turn, and
 * the night (the pier's lanterns, the bridge's lights, the island's lamps,
 * the fireflies by the river).
 *
 * Every course with a canyon, stones or a sea stack is played (the home courses and the
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
      const SNAP = JSON.stringify(S), o = { frames: 0, seen: 0, bad: [], holes: 0, cut: [], onIt: 0 };
      const keep = { bridge: Scene.drawBridge, stones: Scene.drawStones, pier: Scene.drawPier, ducks: Scene.drawDucks, rail: Scene.drawRail, step: window.step };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites();
        const D = derive(), c = Scene.b;
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          if (cs.slot !== 'home' && !['canyon', 'stones', 'pier', 'rail'].includes(B.SIG_HOLE[cs.id])) continue;
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          const want = { canyon: 2, stones: 2, pier: 2, island: 2, rail: 2 };
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            const k = sigKind(h);
            if (!want[k]) continue;
            want[k]--;
            S.hole = h; startHole(); Scene.announce = null;
            const I = Scene.isle;
            o.holes++;
            for (const cam of [0, I.bank * 0.3, I.bank * 0.6, I.bank - 3, I.bank, I.bank + 1.2, (I.bank + I.land) / 2, I.land, I.land + 3]) {
              // the clock on a little each view, so the wildlife is caught at
              // many points of its rounds (a fish is only out of the water now
              // and then)
              Scene.t += 0.37;
              // a railway's train somewhere along the line in every view,
              // each way in turn
              // (every kind of train in turn)
              if (k === 'rail') { Scene.trainMet = 1; Scene.trainNext = 1e9;
                Scene.train = { t0: Scene.t - (2 + (o.frames % 4) * 1.1), dir: o.frames & 1 ? 1 : -1, kind: ['steam', 'goods', 'express', 'night'][(o.frames >> 1) % 4] }; }
              // and the weather on them in turn: snow settled on them, a storm
              // throwing spray over the pier
              Scene.snow = o.frames % 3 === 0; Scene.rain = o.frames % 3 === 1; if (Scene.rain) Scene.wind = 1.2;
              // and at night in turn, its lamps, lights and fireflies
              Scene.night = o.frames % 4 === 2;
              Scene.camD = cam; Scene.walkTo = cam; S.yards = S.yardsMax * (1 - Math.min(0.999, cam / LEN));
              Scene.draw(0, D);
              const a = c.getImageData(0, 0, VW, VH).data;
              Scene.drawBridge = () => {}; Scene.drawStones = () => {}; Scene.drawPier = () => {}; Scene.drawDucks = () => {}; Scene.drawRail = () => {};
              Scene.draw(0, D);
              Scene.drawBridge = keep.bridge; Scene.drawStones = keep.stones; Scene.drawPier = keep.pier; Scene.drawDucks = keep.ducks; Scene.drawRail = keep.rail;
              const b = c.getImageData(0, 0, VW, VH).data;
              // and the other way: standing at it or out on it, nothing lies
              // between him and it, so none of it may be cut away (out on the
              // bridge the canyon's sunk rim cut each plank to a slat, and on
              // the crossing its boards lost their middle and its sleepers were
              // dashes: the user saw the bridge)
              if (cam >= I.bank - 0.3 && k !== 'island') {
                const one = { canyon: 'drawBridge', stones: 'drawStones', pier: 'drawPier', rail: 'drawRail' }[k];
                const solo = () => { c.clearRect(0, 0, VW, VH); Scene[one](); const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; };
                const cut = solo(), ck = Scene.clipAt; Scene.clipAt = () => 1e6; const whole = solo(); Scene.clipAt = ck;
                if (whole - cut > 3) o.cut.push(cs.id + ' hole ' + holeInRound(h) + ' (' + k + ') from ' + cam.toFixed(1) + ': ' + (whole - cut) + ' of its ' + whole + ' pixels cut away');
                o.onIt++;
              }
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
        Scene.drawBridge = keep.bridge; Scene.drawStones = keep.stones; Scene.drawPier = keep.pier; Scene.drawDucks = keep.ducks; Scene.drawRail = keep.rail; window.step = keep.step;
        QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
      }
      return o;
    });
    if (r.cut.length) throw new Error(r.cut.length + ' views from on or at a signature hole\'s bridge, stones, pier or crossing with some of it cut away: ' + r.cut.slice(0, 4).join('; '));
    if (r.bad.length) throw new Error(r.bad.length + ' frames with a bridge, stones or pier drawn through the ground: ' + r.bad.slice(0, 4).join('; '));
    if (r.seen < r.frames * 0.4) throw new Error('the bridge, stones or pier were seen in only ' + r.seen + ' of ' + r.frames + ' frames');
    return [r.holes + ' canyon, stepping-stone, sea stack, island and railway holes over every course that has them, ' + r.frames + ' views from the tee to past the crossing',
      'the bridge, stones, pier or the life on them in view in ' + r.seen + ' of them, and never a pixel below the ground in front',
      'from on them or at them (' + r.onIt + ' views) none of them cut away'];
  }
};
