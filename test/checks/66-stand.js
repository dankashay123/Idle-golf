/* A grandstand on the last hole (the user asked, from the menu).
 *
 *   - behind the green of the round's last hole, every day of an event, on
 *     every course, a signature hole's too; on no other hole, and not by the
 *     island's lake or the sea stack's sea
 *   - fuller through the week: the seats taken rise day by day, and on the
 *     final day it is full
 *   - nothing through a hill: the stand alone over a blank from eight places
 *     down the last hole of each home course, no pixel under the ground's
 *     line at its distance; and in view from near the green
 *   - never over the pin: the flag's pixels are the same with the stand drawn
 *     behind it and without it, from four places
 *   - darker at night; not in a wager
 *   - it cheers as the event's last putt drops (the user asked: once an
 *     event, not every hole): the sound once, the fans on their feet and
 *     waving for a moment, then sat again; on no other hole
 *   - lamps on posts over it, lit at night and not by day
 */
'use strict';
module.exports = {
  name: 'stand',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], lasts: 0, views: 0, pix: 0, pin: 0 }, keep = window.step;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive(), c = Scene.b;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const px = () => c.getImageData(0, 0, VW, VH).data;
        const drawn = props => { const was = Scene.props; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was;
          const d = px(); let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return { n, d }; };
        const fair = () => { S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); };
        const play = hh => { S.hole = hh; fair(); Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.night = false; Scene.rain = false; return Scene.props.filter(p => p.kind === 10); };
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let day = 0; day < B.DAYS; day++) {
            for (const hh of [first + day * B.ROUND + B.ROUND - 1, first + day * B.ROUND + B.ROUND - 2, first + day * B.ROUND]) {
              const st = play(hh), last = holeInRound(hh) === B.ROUND, where = cs.id + ' day ' + (day + 1) + ' hole ' + holeInRound(hh);
              const sk = sigKind(hh), want = last && sk !== 'island' && sk !== 'pier' ? 1 : 0;
              if (st.length !== want) f(where + ': ' + st.length + ' grandstands');
              if (!st.length) continue;
              o.lasts++;
              if (st[0].d < LEN + 10 || Math.abs(st[0].x) > 0.5) f(where + ': the stand not behind the green (' + st[0].d.toFixed(1) + ', ' + st[0].x.toFixed(1) + ')');
              if ((st[0].full === 1) !== (day === B.DAYS - 1)) f(where + ': full ' + st[0].full);
            }
          }
          // the seats, day by day (counted in the picture: the fans' colours)
          if (ci === 0) {
            const crowd = new Set(PX.crowd.concat(PX.crowdDk).map(x => x.toUpperCase())), seats = [];
            for (let day = 0; day < B.DAYS; day++) {
              const st = play(first + day * B.ROUND + B.ROUND - 1)[0], cv = standCv(24, st.full, false, st.k), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
              let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] && crowd.has('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase())) n++;
              seats.push(n);
            }
            o.seats = seats.join('/');
            for (let i = 1; i < seats.length; i++) if (!(seats[i] > seats[i - 1])) f('the stand does not fill through the week: ' + o.seats);
            if (!(seats[3] > seats[0] * 2)) f('the final day is not full beside the first: ' + o.seats);
          }
          if (cs.slot !== 'home') continue;
          const st = play(first + B.ROUND - 1);
          if (!st.length) continue;
          const Q = st[0], where = cs.id + ' hole 18';
          for (let k = 0; k < 8; k++) {
            Scene.camD = LEN * k / 8; Scene.walkTo = 0; Scene.t = 1 + k;
            Scene.draw(0, D); o.views++;
            const lim = Scene.clipAt(Q.d) + 1, { n, d } = drawn([Q]);
            o.pix += n;
            if (k === 7 && n < 200) f(where + ': the stand shows only ' + n + ' pixels from near the green');
            for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
              const i = (y * VW + x) * 4;
              if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
              f(where + ', camera at ' + Scene.camD.toFixed(1) + ': the stand shows at row ' + y + ', under the line ' + Math.round(lim)); y = VH; break;
            }
          }
          // never over the pin
          for (const at of [LEN * 0.4, LEN * 0.6, LEN - 12, LEN - 6]) {
            Scene.camD = at; Scene.walkTo = at; Scene.draw(0, D);
            blank(); Scene.drawFlagstick(); const m = px();
            const was = Scene.props; Scene.draw(0, D); const a = px();
            Scene.props = was.filter(p => p.kind !== 10); Scene.draw(0, D); const b = px(); Scene.props = was;
            for (let i = 0; i < m.length; i += 4) {
              if (m[i] === 1 && m[i + 1] === 2 && m[i + 2] === 3) continue;
              o.pin++;
              if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { f(where + ', camera at ' + at.toFixed(1) + ': the stand over the pin at ' + ((i / 4) % VW) + ',' + Math.floor(i / 4 / VW)); break; }
            }
          }
          // darker at night, and none in a wager
          if (!o.night) {
            Scene.camD = LEN - 8; Scene.draw(0, D);
            const lum = night => { Scene.night = night; const { d } = drawn([Q]); let t = 0, n = 0;
              for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) { t += d[i] + d[i + 1] + d[i + 2]; n++; }
              Scene.night = false; return n ? t / n : 0; };
            const day = lum(false), nt = lum(true); o.night = Math.round(day) + '/' + Math.round(nt);
            if (!(nt < day * 0.8)) f('the stand is not darker at night (' + o.night + ')');
            S.dgnRun = { id: 'x' }; const w = drawn([Q]).n; delete S.dgnRun;
            if (w) f('the stand drawn in a wager (' + w + ' pixels)');
          }
        }
        if (o.pin < 50) f('the pin was only ' + o.pin + ' pixels over the checks');
        // ---- the cheer, as the event's last putt drops, and only then ----
        {
          DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1, played = [];
          const kp = Sfx.play; Sfx.play = function (k) { played.push(k); };
          const drop = hh => { S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); Scene.newHole(S.hole, S.tier); Scene.announce = null;
            QUIET = false; S.yards = 0; Scene.cheerT = undefined; Scene.camD = LEN; Scene.walkTo = LEN; Scene.upT = Scene.t - 1;
            Scene.cupT = Scene.t - 0.01; Scene.cupHeard = 0; Scene.putt = null; Scene.balls = []; Scene.restBall = null; played.length = 0;
            Scene.draw(0.016, D); Scene.draw(0.016, D); QUIET = true; return played.filter(k => k === 'cheer').length; };
          try {
            o.cheer = [drop(first + 3 * B.ROUND + B.ROUND - 1), drop(first + B.ROUND - 1), drop(first + 3 * B.ROUND + B.ROUND - 2)].join('/');
            // and the fans on their feet, then sat again
            drop(first + 3 * B.ROUND + B.ROUND - 1);
            const Q = Scene.props.find(p => p.kind === 10), t0 = Scene.cheerT;
            Scene.camD = LEN - 8; Scene.draw(0, D);
            const pic = at => { Scene.t = t0 + at; return drawn([Q]).d; };
            const same = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
            const sat = pic(STAND_CHEER + 0.1), up1 = pic(0.1), up2 = pic(0.35), later = pic(STAND_CHEER + 2);
            o.cheerPix = [same(up1, sat), same(up1, up2), same(later, sat)].join('/');
          } finally { Sfx.play = kp; QUIET = true; }
          if (o.cheer !== '1/0/0') f('the grandstand cheered ' + o.cheer + ' times (the event\'s last putt / the first day\'s last hole / the last day\'s 17th; want 1/0/0)');
          const [a, b2, c2] = o.cheerPix.split('/').map(Number);
          if (!(a > 20) || !(b2 > 20) || c2) f('through the cheer the stand changed ' + a + ' pixels from seated, ' + b2 + ' between its two poses, ' + c2 + ' after (want some, some, none)');
          // lamps over it: lit at night, not by day
          const lampLit = night => { S.hole = first + B.ROUND - 1; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === (night ? 'Night Round' : 'Fair')));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.camD = LEN - 8; Scene.walkTo = Scene.camD; Scene.draw(0, D);
            const d = drawn([Scene.props.find(p => p.kind === 10)]).d; let n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i] === 0xFF && d[i + 1] === 0xF6 && d[i + 2] === 0xD0) n++; return n; };
          o.lamps = lampLit(false) + '/' + lampLit(true);
          if (o.lamps.split('/')[0] !== '0' || !(+o.lamps.split('/')[1] >= 3)) f('the stand\'s lamps lit by day or dark at night (' + o.lamps + ')');
        }
      } finally {
        window.step = keep; FROST_FORCE = null; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.lasts + ' last holes with a stand behind the green, none on any other hole or by the island or the sea stack; seats taken day by day ' + r.seats + ', full on the final day',
      r.views + ' views down the home courses\' 18th, ' + r.pix + ' pixels of stand, none under the ground\'s line; ' + r.pin + ' pixels of pin, none changed by it; day/night brightness ' + r.night + ', none in a wager', 'the cheer on the event\'s last putt and no other (' + r.cheer + '), on their feet and waving then sat again (' + r.cheerPix + '); lamps lit day/night ' + r.lamps];
  }
};
