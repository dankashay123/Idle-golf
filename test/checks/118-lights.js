/* December's lights (the user picked "holiday lights: strings of lights on
 * the clubhouse and grandstand in December, lit at night" from the menu).
 *
 *   - by the date: in December only (and the developer's force either way)
 *   - baked into the clubhouse's and the stand's pictures at every size: the
 *     bulbs only where the building already is (nothing hung in the air past
 *     its outline), the picture no bigger; by day small coloured dots, lit at
 *     night with a glow, and the night's two pictures differ (the twinkle),
 *     which turns in turn, slowly, while lit and never by day
 *   - on the course: the last hole's frame shows them in December by day and
 *     at night, more lit pixels at night; none in November, none in a wager
 *   - nothing through a hill: the stand and the clubhouse with their lights
 *     drawn alone over a blank from eight places down each home course's
 *     18th, no pixel under the ground's line at their distance
 *   - the frame's canvas calls: the lights add none once baked (the
 *     battery's budget)
 */
'use strict';
module.exports = {
  name: 'lights',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step;
      const day = (m, d) => Math.round(Date.UTC(2026, m, d) / 86400000);
      try {
        hideSheet(); QUIET = true; window.step = () => {}; FROST_FORCE = 0; HOUR_FORCE = 14;
        // ---- by the date ----
        const by = [[11, 1, true], [11, 31, true], [10, 30, false], [0, 1, false], [6, 15, false]];
        for (const [m, d, w] of by) { DAY_FORCE = day(m, d); if (lightsOn() !== w) f('lights on ' + (m + 1) + '/' + d + ': ' + lightsOn()); }
        DAY_FORCE = day(6, 15); LIGHTS_FORCE = 1; if (!lightsOn()) f('forced on, they are off in July');
        DAY_FORCE = day(11, 15); LIGHTS_FORCE = 0; if (lightsOn()) f('forced off, they are on in December');
        LIGHTS_FORCE = null; DAY_FORCE = null;
        // ---- the baked pictures ----
        const pix = cv => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        o.bulbs = { day: 0, night: 0 }; o.tw = 0;
        for (const kind of ['stand', 'club']) for (const sh of [4, 6, 9, 14, 20, 30, 44]) for (const night of [false, true]) {
          const make = L => kind === 'stand' ? standCv(sh, 0.6, night, 7, 0, false, false, L) : clubhouseCv(sh, night, 1, 7, night, false, L);
          const a = make(0), b = make(1), b2 = make(2), A = pix(a), Bp = pix(b), B2 = pix(b2);
          if (a.width !== b.width || a.height !== b.height) { f(kind + ' at ' + sh + ': the picture grew with its lights'); continue; }
          let n = 0, out = 0, tw = 0;
          for (let i = 0; i < A.length; i += 4) {
            const ch = A[i] !== Bp[i] || A[i + 1] !== Bp[i + 1] || A[i + 2] !== Bp[i + 2] || A[i + 3] !== Bp[i + 3];
            if (ch) { n++; if (!A[i + 3]) out++; }
            if (Bp[i] !== B2[i] || Bp[i + 1] !== B2[i + 1] || Bp[i + 2] !== B2[i + 2]) tw++;
          }
          const at = kind + ' at ' + sh + (night ? ' at night' : ' by day');
          if (out) f(at + ': ' + out + ' pixels of lights outside the building');
          if (sh >= 9 && n < 6) f(at + ': only ' + n + ' pixels of lights');
          if (sh >= 14) o.bulbs[night ? 'night' : 'day'] += n;
          if (night && sh >= 9 && !tw) f(at + ': the two pictures of the twinkle are the same');
          if (night) o.tw += tw;
        }
        if (!(o.bulbs.night > o.bulbs.day * 1.5)) f('bulb pixels day/night ' + o.bulbs.day + '/' + o.bulbs.night + ': no glow at night');
        if (o.bulbs.day < 40) f('by day only ' + o.bulbs.day + ' bulb pixels');
        // the twinkle: two pictures in turn, about once a second, only while lit
        { const p = { k: 3 }; LIGHTS_FORCE = 1; const seen = { 1: 0, 2: 0 }; let flips = 0, last = 0;
          for (let t = 0; t < 8; t += 0.05) { Scene.t = t; const v = Scene.lightsNow(true, p); seen[v] = (seen[v] || 0) + 1; if (last && v !== last) flips++; last = v; }
          if (!seen[1] || !seen[2]) f('the twinkle does not turn: ' + JSON.stringify(seen));
          if (flips < 4 || flips > 20) f('the twinkle turned ' + flips + ' times in 8 seconds');
          Scene.t = 1.3; if (Scene.lightsNow(false, p) !== 1) f('by day the lights are on picture ' + Scene.lightsNow(false, p));
          S.dgnRun = { id: 'x' }; if (Scene.lightsNow(true, p)) f('lights on in a wager'); delete S.dgnRun;
          LIGHTS_FORCE = null; }
        // ---- on the course ----
        const D = derive(), c = Scene.b, grab = () => c.getImageData(0, 0, VW, VH).data;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const drawn = props => { const was = Scene.props; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was;
          return grab(); };
        const home = B.COURSE.findIndex(cs => cs.slot === 'home');
        DEV.course(home); hideSheet();
        const t0 = tournamentOf(S.hole), first = (t0 - 1) * B.ROUND * B.DAYS + 1;
        let last = first + B.ROUND - 1; while (sigKind(last)) last += B.ROUND;
        const lay = (night, wager) => { S.hole = last; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === (night ? 'Night Round' : 'Fair')));
          S.dgnRun = null; Scene.newHole(last, S.tier); Scene.announce = null; Scene.balls = []; Scene.restBall = null;
          Scene.camD = LEN - 10; Scene.walkTo = Scene.camD; Scene.t = 2; if (wager) S.dgnRun = { id: B.DGN[0].id }; };
        const diff = (night, setA, setB, wager) => {
          setA(); lay(night, wager); Scene.draw(0, D); Scene.draw(0, D); const a = grab();
          setB(); Scene.draw(0, D); const b = grab(); S.dgnRun = null;
          // (lit: lighter than the picture without them, by a good step)
          let n = 0, lit = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { n++;
            if (a[i] + a[i + 1] + a[i + 2] > b[i] + b[i + 1] + b[i + 2] + 120) lit++; }
          return [n, lit]; };
        const on = () => { LIGHTS_FORCE = 1; }, off = () => { LIGHTS_FORCE = 0; };
        const dec = () => { LIGHTS_FORCE = null; DAY_FORCE = day(11, 12); }, nov = () => { LIGHTS_FORCE = null; DAY_FORCE = day(10, 12); };
        const [dn, dl] = diff(false, dec, off), [nn, nl] = diff(true, dec, off);
        o.frame = dn + '/' + nn + ' (' + dl + '/' + nl + ' lit)';
        if (dn < 15) f('in December by day the frame shows ' + dn + ' pixels of lights');
        if (nn < 15) f('in December at night the frame shows ' + nn + ' pixels of lights');
        if (!(nl >= 6)) f('only ' + nl + ' pixels at night lit well over the building behind them');
        const [vn] = diff(true, nov, off); if (vn) f('in November the frame shows ' + vn + ' pixels of lights');
        DAY_FORCE = null;
        // (a wager: nothing of the course's buildings, lights or not)
        { lay(true, true); on(); const w1 = Scene.lightsNow(true, { k: 1 }); S.dgnRun = null; if (w1) f('in a wager the lights are ' + w1); }
        // the canvas calls: none more once baked
        { const P = CanvasRenderingContext2D.prototype, orig = {}; let calls = 0;
          const count = set => { set(); lay(true); Scene.t = 2; Scene.draw(0, D); Scene.draw(0, D);
            for (const k of Object.getOwnPropertyNames(P)) { const d = Object.getOwnPropertyDescriptor(P, k); if (typeof d.value !== 'function') continue;
              orig[k] = d.value; P[k] = function () { calls++; return orig[k].apply(this, arguments); }; }
            try { calls = 0; Scene.draw(0, D); } finally { for (const k in orig) P[k] = orig[k]; }
            return calls; };
          const cOn = count(on), cOff = count(off); o.calls = cOff + '/' + cOn;
          if (cOn > cOff + 2) f('the lights cost ' + (cOn - cOff) + ' canvas calls a frame (' + o.calls + ')'); }
        // ---- nothing through a hill ----
        LIGHTS_FORCE = 1; o.views = 0; o.pix = 0;
        for (const cs of COURSE_HOME) {
          DEV.course(B.COURSE.indexOf(cs)); hideSheet();
          const t = tournamentOf(S.hole), fh = (t - 1) * B.ROUND * B.DAYS + 1;
          let hh = fh + B.ROUND - 1; while (sigKind(hh) && hh < fh + B.ROUND * B.DAYS) hh += B.ROUND;
          for (const night of [false, true]) {
            S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === (night ? 'Night Round' : 'Fair'))); Scene.newHole(hh, S.tier); Scene.announce = null;
            const Q = Scene.props.filter(p => p.kind === 10 || p.kind === 11);
            if (!Q.length) continue;
            for (let v = 0; v < 8; v++) {
              Scene.camD = LEN * v / 8; Scene.walkTo = Scene.camD; Scene.t = 1 + v * 0.7; Scene.draw(0, D); o.views++;
              for (const q of Q) {
                const lim = Scene.clipAt(q.d) + 1, d = drawn([q]);
                for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
                  const i = (y * VW + x) * 4; if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                  o.pix++;
                  if (y > lim) { f(cs.id + (night ? ' at night' : '') + ', camera at ' + Scene.camD.toFixed(1) + ': the ' + (q.kind === 10 ? 'stand' : 'clubhouse') + ' shows at row ' + y + ', under ' + Math.round(lim)); y = VH; break; }
                }
              }
            }
          }
        }
        if (o.pix < 2000) f('the lit buildings showed only ' + o.pix + ' pixels over ' + o.views + ' views');
      } finally {
        window.step = keep; LIGHTS_FORCE = null; DAY_FORCE = null; FROST_FORCE = null; HOUR_FORCE = null; QUIET = false; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['in December only (forced either way by the menu); baked into the clubhouse and the stand at seven sizes, never outside the building or growing its picture',
      'bulb pixels by day/night (the glow) ' + r.bulbs.day + '/' + r.bulbs.night + ', the twinkle\'s two pictures ' + r.tw + ' pixels apart, turning while lit only; none in a wager',
      'the last hole\'s frame in December by day/night: ' + r.frame + ' pixels of lights; none in November',
      'canvas calls a night frame without/with them ' + r.calls,
      r.views + ' views down the home courses\' 18th, ' + r.pix + ' pixels of the buildings, none under the ground\'s line'];
  }
};
