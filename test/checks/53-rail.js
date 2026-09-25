/* The Railway Crossing, the fifth signature hole (the user asked for one).
 *
 * A railway line runs right across the hole a little short of half way. Now
 * and then a little steam train, an engine and two carriages, runs along it,
 * and one always comes as he first reaches the crossing: the lamps on the
 * crossing's posts flash and he waits at the line until it has gone by.
 *
 *   - where: on a home course the last par four of the front nine, one a
 *     round (the stones keep the round's last par four, on the back nine);
 *     on the Moorland, the Old Links and Ironbark, one a round on the round's
 *     last par four; nowhere else
 *   - the line: a band of ballast right across the view, the crossing's two
 *     sides either side of it, and no ball ever comes to rest on the line
 *   - the wait, played out in frames: a train sets off as he reaches the
 *     line; he does not step onto it while the train is near and crosses once
 *     it has passed; he is never on the crossing while the train is on it
 *   - a ball down early, played in the loop and watched: the hole waits for
 *     him to walk to the line, the train to go by, the crossing, the walk up
 *     and the putt, and moves on only then, in under half the stop on a
 *     hole's wait (the user saw a hole move on as the train came: the stop
 *     was 8s, and the longest wait for a train and a putt comes to 8.05s)
 *   - drawn: the rails and posts from the tee; the train, when one runs, with
 *     its smoke, and the lamps lit red only while it is near
 *   - drawn in its place, on all four courses with a railway: the trees and
 *     the gallery this side of the line are drawn over it and its train
 *     (the railway went over everything, and cut across the trees in front
 *     of it; the user saw it), and it over those beyond it; by pixels, the
 *     frame with the railway against the frame without
 *   - trains come on their own now and then with the course on screen, none
 *     in a wager, and none of it calls Math.random
 *   - sounds: a whistle as each train sets off, its chuff while it runs and
 *     the crossing's bell while the lamps flash, none on another hole; the
 *     whistle about as loud as the plank knocks' louder cousins (under the
 *     coin), the chuff about a bird, the bell under the plank's knock;
 *     rendered offline and measured
 *   - the Trophy Room's Record has a row for it; the honour All Aboard counts
 *     its birdies (the honours check); the sigview check holds it all above
 *     the ground in front
 */
'use strict';
module.exports = {
  name: 'rail',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = {}, SNAP = JSON.stringify(S), mr = Math.random;
      const keep = { ctx: Sfx.ctx, whistle: Sfx.whistle, chuff: Sfx.chuff, ding: Sfx.ding, tone: Sfx.tone, hiss: Sfx.hiss,
                     gull: Sfx.gull, chirp: Sfx.chirp, gust: Sfx.gust, mt: Sfx.musicTick, sound: S.sound };
      try {
        hideSheet(); QUIET = true; SEASON_FORCE = 0;
        const c = Scene.b;
        const count = cols => { const d = c.getImageData(0, 0, VW, VH).data; let n = 0;
          for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue;
            const h = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
            if (cols.includes(h)) n++; }
          return n; };

        // ---- where ----
        o.bad = []; o.homeN = []; o.awayN = {};
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const first = awayFirstHole(S.hole);
          let n = 0;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            if (!isRail(h)) continue;
            n++;
            const r_ = holeInRound(h), par = parOf(h);
            let last = true;
            const end = cs.slot === 'home' ? 9 : B.ROUND;
            for (let k = r_ + 1; k <= end; k++) if (parOf(h + k - r_) === 4) last = false;
            if (par !== 4 || !last || (cs.slot === 'home' && r_ > 9) || sigKind(h) !== 'rail') o.bad.push(cs.id + ' hole ' + r_ + ' (par ' + par + ')');
          }
          if (cs.slot === 'home') o.homeN.push(n);
          else if (n) o.awayN[cs.id] = n;
        }

        // ---- the line, and no ball on it ----
        DEV.course(B.COURSE.findIndex(cs => cs.slot === 'home')); hideSheet();
        const first = awayFirstHole(S.hole);
        let h = first; while (!isRail(h)) h++;
        S.hole = h; startHole(); Scene.announce = null;
        const I = Scene.isle, W = Scene.water;
        o.line = { rail: !!(W && W.rail && I && I.rail), d: W.d, bank: I.bank, land: I.land, rx: W.rx };
        o.wet = 0;
        for (let p = 0; p <= 1.0001; p += 0.001) { const d = Scene.spot(p); if (d > I.bank + 0.01 && d < I.land - 0.01) o.wet++; }

        // ---- the wait, in frames ----
        S.yards = S.yardsMax * 0.3;            // his ball is well past the line
        Scene.camD = I.bank - 4; Scene.walkTo = LEN * 0.7; Scene.restBall = null; Scene.balls.length = 0; Scene.swingT = 0;
        Scene.train = null; Scene.trainMet = 0; Scene.trainNext = Scene.t + 1e6;
        const D = derive();
        let calls = 0; Math.random = () => { calls++; return mr(); };
        const log = [];
        try {
          for (let i = 0; i < 30 * 14; i++) {
            Scene.draw(1 / 30, D);
            const A = Scene.railAt();
            log.push({ t: Scene.t, cam: Scene.camD, cross: Scene.crossing, hold: Scene.railHold(), lights: Scene.railLights(),
                       on: A ? A.tail < 2 && A.head > -2 : false, train: !!Scene.train });
          }
        } finally { Math.random = mr; }
        o.frameRnd = calls;
        const firstTrain = log.findIndex(x => x.train);
        o.setOffAt = firstTrain < 0 ? null : +log[firstTrain].cam.toFixed(2);
        // on the line (past his side of it, short of the far one) with a train coming or going by
        o.steppedOn = log.filter(x => x.hold && x.cam > I.bank + 0.02 && x.cam < I.land - 0.02).length;
        o.onTogether = log.filter(x => x.on && x.cam > I.bank + 0.02 && x.cam < I.land - 0.02).length;
        const across = log.findIndex(x => x.cam >= I.land - 0.05);
        o.acrossAt = across < 0 ? null : +(log[across].t - log[0].t).toFixed(2);
        o.waited = log.filter(x => x.hold && x.cam <= I.bank + 0.02).length / 30;
        o.lightsOff = log.filter(x => x.lights && !x.train).length;

        // ---- a ball down early: the hole waits for the train ----
        // (the user saw a hole move on as the train came, its yardage long
        // beaten: the wait for him to reach the green had run out). Played in
        // the loop, watched: the ball down a second in, he walks to the line,
        // a train goes by, he crosses and putts out, and only then does the
        // hole move on. Once with the train that meets him, and once with the
        // longest wait there is, a train on its own just setting off as he
        // gets there (the goods train: the slowest and longest).
        const early = worst => {
          S.hole = h; startHole(); Scene.announce = null;
          for (let i = 0; i < 10; i++) Scene.draw(1 / 60, derive());
          // (carded a par, so he putts: an ace goes straight in off the tee)
          let q = 0.3; while (scoreFor(q).d !== 0) q += 0.01;
          S.elapsed = 0.95; S.parTime = S.elapsed / (q + 0.05); S.yards = 1e-9; S.swingT = 0.999; S.doneT = null;
          const fh = window.finishHole; let end = null, downCam = null, met = false, at = 0, forced = false;
          window.finishHole = function () {
            if (!end) end = { wait: +(S.elapsed - S.doneT).toFixed(2), short: +(LEN - Scene.camD).toFixed(2), cup: !!Scene.cupT,
                              putt: !!(Scene.putt && Scene.putt.hit), across: Scene.camD > I.land };
            return fh.apply(this, arguments); };
          try {
            for (let i = 0; i < 60 * 40 && !end; i++) {
              const Dn = derive(); step(1 / 60, Dn);
              if (end) break;
              Scene.draw(1 / 60, Dn);
              if (S.doneT != null && downCam === null) downCam = +Scene.camD.toFixed(2);
              if (worst && !forced && !Scene.train && Scene.camD >= I.bank - 0.3) { Scene.train = { t0: Scene.t, dir: 1, kind: 'goods' }; Scene.trainMet = 1; forced = true; }
              const there = Scene.camD >= I.bank - 0.35 && Scene.camD <= I.bank + 0.02;
              if (there && Scene.train) met = true;
              if (there && Scene.railHold()) at += 1 / 60;
            }
          } finally { window.finishHole = fh; }
          return Object.assign({ downCam, met, at: +at.toFixed(2) }, end || { ended: false });
        };
        QUIET = false; S.autoClimb = 0; S.saver = 0;
        try { o.early = early(false); o.earlyWorst = early(true); } finally { QUIET = true; }
        o.hold = B.ISLE_HOLD;
        S.hole = h; startHole(); Scene.announce = null;

        // ---- drawn ----
        // (counted by their own colours, so with the haze, which lifts the
        // far ground and the railway on it alike toward the sky, left off)
        const look = (cam, age, dir) => { Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.trainMet = 1; Scene.trainNext = 1e9;
          Scene.train = age === null ? null : { t0: Scene.t - age, dir }; Scene.draw(0, D); };
        const bh = Scene.buildHaze; Scene.buildHaze = function () { this.haze = null; };
        try {
          const TRAIN = ['#8A3228', '#2E5A3A', '#6A2420'], RAILS = ['#C8D0D8'], POSTS = ['#F2F2EA'], LIT = ['#FF3A2A'];
          look(0, null); o.tee = { rails: count(RAILS), posts: count(POSTS), train: count(TRAIN), lit: count(LIT) };
          // (crossing the fairway: out at the side it is behind the trees in front)
          look(0, 3.4, 1); o.teeTrain = { train: count(TRAIN), lit: count(LIT) };
          // its smoke, see-through, counted drawn on its own
          c.clearRect(0, 0, VW, VH); Scene.drawTrain(W.d, Scene.camD - CAM_BACK + 0.7);
          { const d = c.getImageData(0, 0, VW, VH).data; let n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] >= 225 && d[i + 1] >= 225 && d[i + 2] >= 220) n++;
            o.teeTrain.smoke = n; }
          look(I.bank - 0.1, 3.8, -1); o.nearTrain = { train: count(TRAIN), lit: count(LIT) };
          look(I.bank - 0.1, 30, 1); o.gone = { train: count(TRAIN), lit: count(LIT) };
        } finally { Scene.buildHaze = bh; Scene.hazeKey = null; }

        // ---- in its place among the trees and the gallery ----
        // Whatever stands this side of the line is drawn over it: where a tree
        // or a spectator nearer than the line stands in front of the rails,
        // the posts or the train, it is the tree that shows (the railway was
        // drawn over everything and cut across the trees in front of it; the
        // user saw it). And the line and its train are seen over what stands
        // beyond it. Compared pixel by pixel, the frame with the railway and
        // without it, where each lot stands on its own, from the tee to the
        // line, with a train and without.
        // (on each course with a railway: the home course and the three away;
        // the words, the map, the rain and the numbers floating up, all
        // printed over the picture, left off)
        {
          const px = () => c.getImageData(0, 0, VW, VH).data;
          const alone = fn => { c.clearRect(0, 0, VW, VH); fn(); return px(); };
          const dr = Scene.drawRail, over = { drawHud: Scene.drawHud, drawMap: Scene.drawMap, drawWeather: Scene.drawWeather, drawFx: Scene.drawFx, drawShots: Scene.drawShots };
          o.depth = { nearOver: 0, through: 0, farOver: 0, hidden: 0, views: 0, courses: [] };
          try {
            for (const k in over) Scene[k] = () => {};
            for (const id of ['home', 'ironbark', 'moorland', 'oldlinks']) {
              DEV.course(B.COURSE.findIndex(cs => id === 'home' ? cs.slot === 'home' : cs.id === id)); hideSheet();
              let hr = awayFirstHole(S.hole); while (!isRail(hr)) hr++;
              S.hole = hr; startHole(); Scene.announce = null;
              const IR = Scene.isle, Dr = derive(), D1 = o.depth, n0 = D1.nearOver;
              const view = (cam, age, dir) => { Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.trainMet = 1; Scene.trainNext = 1e9;
                Scene.train = age === null ? null : { t0: Scene.t - age, dir }; Scene.draw(0, Dr); };
              for (const cam of [0, 4, 8, 12, 16, IR.bank - 6, IR.bank - 3, IR.bank - 1]) for (const age of [null, 3.2, 3.8]) {
                const dir = cam % 8 ? 1 : -1;
                view(cam, age, dir); const F1 = px();
                const near = alone(() => Scene.drawProps(IR.bank, -1)), far = alone(() => Scene.drawProps(IR.bank, 1)), rl = alone(() => dr.call(Scene));
                Scene.drawRail = () => {}; view(cam, age, dir); const F0 = px(); Scene.drawRail = dr;
                // (right at the horizon the haze is solid: the line and what
                // stands beyond it come out the same colour there)
                const HZ = Scene.haze ? Scene.haze.getContext('2d').getImageData(0, 0, VW, VH).data : null;
                D1.views++;
                for (let i = 0; i < F1.length; i += 4) {
                  const differs = F1[i] !== F0[i] || F1[i + 1] !== F0[i + 1] || F1[i + 2] !== F0[i + 2];
                  if (near[i + 3] === 255) { if (rl[i + 3] === 255) D1.nearOver++; if (differs) D1.through++; }
                  else if (far[i + 3] === 255 && rl[i + 3] === 255 && !(HZ && HZ[i + 3] >= 250)) { D1.farOver++; if (!differs) D1.hidden++; }
                }
              }
              D1.courses.push(id + ' ' + (D1.nearOver - n0));
            }
          } finally { Scene.drawRail = dr; Object.assign(Scene, over); }
        }

        // ---- trains on their own; none in a wager ----
        Scene.train = null; Scene.trainMet = 1; Scene.trainNext = Scene.t + 5;
        let own = 0, was = null;
        for (let i = 0; i < 30 * 120; i++) { Scene.t += 1 / 30; Scene.tickRail(); if (Scene.train && Scene.train !== was) own++; was = Scene.train; }
        o.own = own;
        S.dgnRun = { id: 'water' }; Scene.train = { t0: Scene.t, dir: 1 }; Scene.tickRail(); o.wagerTrain = !!Scene.train; S.dgnRun = null;

        // ---- sounds ----
        S.sound = 1; QUIET = false;
        Sfx.ctx = { state: 'running', currentTime: 1 };
        const heard = { whistle: 0, chuff: 0, ding: 0 };
        Sfx.whistle = () => heard.whistle++; Sfx.chuff = () => heard.chuff++; Sfx.ding = () => heard.ding++;
        Sfx.tone = () => {}; Sfx.hiss = () => {}; Sfx.gull = () => {}; Sfx.chirp = () => {}; Sfx.gust = () => {}; Sfx.musicTick = () => {};
        Sfx.trainT0 = null;
        Scene.train = { t0: Scene.t, dir: 1 }; Scene.trainMet = 1; Scene.trainNext = 1e9;
        let lit = 0;
        for (let i = 0; i < 10 * 12; i++) { Scene.t += 0.1; Scene.tickRail(); Sfx.tick(0.1); if (Scene.railLights()) lit++; }
        o.sTrain = Object.assign({ litSecs: lit / 10 }, heard);
        const h0 = Object.assign({}, heard);
        let hp = S.hole + 1; while (sigKind(hp)) hp++;
        S.hole = hp; startHole(); Scene.announce = null;
        Scene.train = { t0: Scene.t, dir: 1 };
        for (let i = 0; i < 100; i++) { Scene.t += 0.1; Sfx.tick(0.1); }
        o.sPlain = { whistle: heard.whistle - h0.whistle, chuff: heard.chuff - h0.chuff, ding: heard.ding - h0.ding };
        Object.assign(Sfx, { whistle: keep.whistle, chuff: keep.chuff, ding: keep.ding, tone: keep.tone, hiss: keep.hiss, gull: keep.gull,
                             chirp: keep.chirp, gust: keep.gust, musicTick: keep.mt, ctx: keep.ctx });
        const loud = async fn => {
          const oc = new OfflineAudioContext(1, 88200, 44100), k2 = { ctx: Sfx.ctx, master: Sfx.master, nz: Sfx._nz };
          Sfx.ctx = oc; Sfx.master = oc.destination; Sfx._nz = null;
          const m = Math.random; let sd = 7; Math.random = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
          try { fn(0.05); } finally { Sfx.ctx = k2.ctx; Sfx.master = k2.master; Sfx._nz = k2.nz; Math.random = m; }
          const d = (await oc.startRendering()).getChannelData(0), Wn = 13230; let sum = 0, best = 0;
          for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; if (i >= Wn) sum -= d[i - Wn] * d[i - Wn]; if (i >= Wn - 1) best = Math.max(best, sum / Wn); }
          return +(10 * Math.log10(best + 1e-12)).toFixed(1);
        };
        o.db = { whistle: await loud(t => Sfx.whistle(t)), chuff: await loud(t => Sfx.chuff(t)), ding: await loud(t => Sfx.ding(t)),
                 chirp: await loud(t => Sfx.chirp(t)), plank: await loud(t => Sfx.plank(t, false)),
                 coin: await loud(t => Sfx.notes([1318.5, 1760], 'square', 0.045, 0.06)) };

        // ---- the Record ----
        const rw = document.createElement('div'); rw.id = 'statRows'; document.body.appendChild(rw);
        const old = document.getElementById('statRows') !== rw ? null : null;
        renderRecord();
        o.recRow = [...rw.querySelectorAll('.lb')].some(l => /Railway Crossing/.test(l.textContent));
        rw.remove();
      } finally {
        Math.random = mr;
        Object.assign(Sfx, { whistle: keep.whistle, chuff: keep.chuff, ding: keep.ding, tone: keep.tone, hiss: keep.hiss, gull: keep.gull,
                             chirp: keep.chirp, gust: keep.gust, musicTick: keep.mt, ctx: keep.ctx });
        S.sound = keep.sound; QUIET = false; OFFLINE = false; SEASON_FORCE = -1; S.dgnRun = null;
        Scene.train = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    const J = x => JSON.stringify(x);
    if (r.bad.length) f('railway crossings on the wrong holes: ' + r.bad.slice(0, 4).join('; '));
    if (!r.homeN.length || r.homeN.some(n => n !== 4)) f('railway crossings an event on each home course: ' + r.homeN.join(', ') + ' (want four, one a round)');
    if (J(Object.keys(r.awayN).sort()) !== J(['ironbark', 'moorland', 'oldlinks']) || Object.values(r.awayN).some(n => n !== 4))
      f('railway crossings on other courses: ' + J(r.awayN));
    const L = r.line;
    if (!L.rail || !(L.bank < L.d && L.d < L.land) || L.rx < 30) f('the line is not laid across the hole: ' + J(L));
    if (r.wet) f(r.wet + ' of 1001 places a ball can come to rest are on the line');
    if (r.setOffAt === null || r.setOffAt < L.bank - 0.35) f('no train set off as he reached the line (it came with him at ' + r.setOffAt + ', the line at ' + L.bank.toFixed(2) + ')');
    if (r.steppedOn) f('he stepped onto the line ' + r.steppedOn + ' times with a train near');
    if (r.onTogether) f('he and the train were on the crossing together in ' + r.onTogether + ' frames');
    if (r.acrossAt === null || !(r.waited >= 2)) f('the wait: ' + r.waited + 's at the line, across at ' + r.acrossAt + 's');
    if (r.lightsOff) f('the lamps were lit with no train, in ' + r.lightsOff + ' frames');
    // the hole waits for him, the train and the putt, well inside the stop
    for (const [k, E] of [['with the train that meets him', r.early], ['with the longest wait', r.earlyWorst]]) {
      if (E.ended === false) f('a ball down early ' + k + ': the hole never ended in forty seconds');
      if (!(E.downCam < 1) || !E.met || !(E.at >= (E === r.earlyWorst ? 4.2 : 2.5)))
        f('a ball down early ' + k + ': not set up as meant (down with him at ' + E.downCam + ', a train at the line ' + E.met + ', held there ' + E.at + 's)');
      if (!E.across || !(E.short <= 2.7) || !E.putt || !E.cup)
        f('a ball down early ' + k + ': the hole moved on with him ' + E.short + ' short of the pin (across the line ' + E.across + ', putted ' + E.putt + ', in the cup ' + E.cup + ')');
      if (!(E.wait <= r.hold / 2)) f('a ball down early ' + k + ': the hole waited ' + E.wait + 's, over half the ' + r.hold + 's stop');
    }
    const Dp = r.depth;
    if (!(Dp.nearOver >= 200) || !(Dp.farOver >= 100)) f('the railway never met a tree in front of it or beyond it on screen: ' + J(Dp));
    if (Dp.through) f('the railway was drawn over the trees and the gallery in front of it, ' + Dp.through + ' pixels of them in ' + Dp.views + ' views');
    if (Dp.hidden) f('the railway was hidden by what stands beyond it, ' + Dp.hidden + ' pixels of ' + Dp.farOver);
    if (r.frameRnd) f('drawing the railway called Math.random ' + r.frameRnd + ' times');
    if (!(r.tee.rails >= 20 && r.tee.posts >= 4) || r.tee.train || r.tee.lit) f('from the tee with no train: ' + J(r.tee));
    // (from the tee the whole train is some twenty pixels, a few of them
    // behind the gallery in front of the line)
    if (!(r.teeTrain.train >= 10 && r.teeTrain.lit >= 1 && r.teeTrain.smoke >= 1)) f('from the tee with a train crossing: ' + J(r.teeTrain));
    if (!(r.nearTrain.train >= 200 && r.nearTrain.lit >= 1)) f('at the line with a train crossing: ' + J(r.nearTrain));
    if (r.gone.train || r.gone.lit) f('a train long gone still drawn: ' + J(r.gone));
    if (!(r.own >= 3 && r.own <= 7)) f(r.own + ' trains came on their own in two minutes (want one every twenty to thirty five seconds)');
    if (r.wagerTrain) f('a train ran in a wager');
    const s = r.sTrain;
    if (s.whistle !== 1 || !(s.chuff >= 20) || !(s.ding >= Math.floor(s.litSecs / 0.45) - 1 && s.ding <= Math.ceil(s.litSecs / 0.45) + 1))
      f('a train went by to ' + J(s) + ' (one whistle, a chuff every quarter second, a bell every 0.45s the lamps were lit)');
    if (r.sPlain.whistle || r.sPlain.chuff || r.sPlain.ding) f('train sounds on another hole: ' + J(r.sPlain));
    const d = r.db;
    if (!(d.whistle < d.coin && d.whistle > d.plank) || Math.abs(d.chuff - d.chirp) > 3 || !(d.ding < d.plank && d.ding > d.chirp - 3))
      f('loudness: whistle ' + d.whistle + ', chuff ' + d.chuff + ', bell ' + d.ding + ' against the coin ' + d.coin + ', the plank ' + d.plank + ' and a bird ' + d.chirp);
    if (!r.recRow) f('the Record has no Railway Crossing row');
    return ['four a home event (hole nine, the last par four of the front nine) and four an event on ' + Object.keys(r.awayN).join(', ') + '; no ball comes to rest on the line',
      'a train sets off as he reaches the line; he waited ' + r.waited.toFixed(1) + 's and was across ' + r.acrossAt + 's in, never on the crossing with it; lamps only with a train',
      'a ball down early: the hole moved on ' + r.early.wait + 's later (' + r.earlyWorst.wait + 's with the longest wait for a train), him up and putted, the stop at ' + r.hold + 's',
      'drawn among the trees on four courses: ' + Dp.nearOver + ' pixels of trees and gallery in front of the line, none crossed by it; ' + Dp.farOver + ' beyond it, the line over all of them',
      r.own + ' trains on their own in two minutes, none in a wager; whistle ' + d.whistle + ', chuff ' + d.chuff + ', bell ' + d.ding + ' dB (coin ' + d.coin + ', plank ' + d.plank + ', bird ' + d.chirp + ')'];
  }
};
