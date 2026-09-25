/* Night on the ordinary holes (the user asked, from the menu).
 *
 * On a night round every hole gets a lamp either side of the tee, fireflies
 * blinking in the rough down both sides, a lit clubhouse far off on the
 * foothills, and the flag glowing with a light on top of the pin.
 *
 *   - at night, each is drawn, counted by its own colours in the part drawn
 *     alone (the night relights the whole frame, so a whole-frame count
 *     measures the sky): the lamps' flame from the tee, the fireflies over
 *     a few seconds, the clubhouse's windows in the far hills, the flag's
 *     red halo; by day none of it, and none in a wager
 *   - the clubhouse stands away from the course's landmark
 *   - nothing shows through a hill in front: on every home course's first
 *     four holes, the camera at eight places from the tee to the green, a
 *     frame of the hole drawn first (it sets the ground's line), then each
 *     lamp and each spot of fireflies alone over a blank; every pixel it
 *     puts down lies on or above the line where its own distance is hidden
 *     (a firefly drifts half a pace either way, so the most open of those)
 *   - the hole's own dice are untouched: its trees and gallery are where
 *     they were before the night's props were laid
 */
'use strict';
module.exports = {
  name: 'nightholes',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, pix: 0 }, keep = { step: window.step, layNight: Scene.layNight };
      const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites();
        const NIGHT = B.CHAOS.find(c => /Night/.test(c.n)), DAY = B.CHAOS.find(c => c.n === 'Fair') || B.CHAOS.find(c => !/Night/.test(c.n));
        const D = derive(), c = Scene.b;
        const count = (cols, x0, y0, w, h) => {
          const d = c.getImageData(x0, y0, w, h).data; let n = 0;
          for (let i = 0; i < d.length; i += 4) if (cols.has(hex(d, i))) n++;
          return n;
        };
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const alone = (props, t) => { const was = Scene.props; Scene.t = t; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was; };
        const LAMP = new Set(['#FFD36A', '#FFF6D0']), FLY = new Set(['#E8FF8A', '#9ACB3A']), WIN = new Set(['#FFD36A', '#F2B84A']);
        const HALO = new Set(['#D0564A', '#9A3A32', '#6A2A28']);
        const look = (night) => {
          S.chaos = Object.assign({}, night ? NIGHT : DAY);
          Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.camD = 0; Scene.t = 1;
          Scene.draw(1 / 30, D);
          const P = Scene.props, lamps = P.filter(p => p.kind === 4), flies = P.filter(p => p.kind === 5);
          const res = {};
          alone(lamps, 1); res.lamp = count(LAMP, 0, 0, VW, VH);
          res.fly = 0; for (const t of [0.5, 1.7, 3.1, 4.4]) { alone(flies, t); res.fly += count(FLY, 0, 0, VW, VH); }
          res.win = Scene.ridge ? (() => { const g = Scene.ridge.getContext('2d'), d = g.getImageData(0, 0, Scene.ridge.width, Scene.ridge.height).data; let n = 0, sx = 0;
            for (let i = 0; i < d.length; i += 4) if (WIN.has(hex(d, i))) { n++; sx += (i / 4) % Scene.ridge.width; } res.winX = n ? sx / n : -1; return n; })() : 0;
          // the flag, from near the green, drawn alone over a blank
          Scene.camD = LEN - 6; Scene.draw(1 / 30, D); blank(); Scene.drawFlagstick();
          res.halo = count(HALO, 0, 0, VW, VH);
          return res;
        };
        // ---- drawn at night, and not by day --------------------------------
        const home = B.COURSE.findIndex(cs => cs.slot === 'home');
        DEV.course(home); hideSheet();
        const t0 = tournamentOf(S.hole); S.hole = (t0 - 1) * B.ROUND * B.DAYS + 2;
        const N = look(true), Dy = look(false);
        o.night = N; o.day = Dy;
        if (!(N.lamp >= 6)) o.fails.push('the tee\'s lamps drew ' + N.lamp + ' pixels of flame at night');
        if (!(N.fly >= 8)) o.fails.push('the fireflies drew ' + N.fly + ' pixels at night over four moments');
        if (!(N.win >= 6)) o.fails.push('the clubhouse showed ' + N.win + ' lit window pixels at night');
        if (!(N.halo >= 8)) o.fails.push('the flag\'s halo drew ' + N.halo + ' pixels at night');
        if (Dy.lamp || Dy.fly || Dy.win || Dy.halo) o.fails.push('by day: lamps ' + Dy.lamp + ', fireflies ' + Dy.fly + ', windows ' + Dy.win + ', halo ' + Dy.halo);
        // the clubhouse away from the landmark
        if (Scene.theme && Scene.theme.lm && N.winX >= 0) {
          const lr = seeded(hash32(Scene.hole * 131 + 7)), lmX = Math.round(VW * (0.24 + lr() * 0.52));
          o.gap = Math.round(Math.abs(N.winX - lmX));
          if (o.gap < VW * 0.12) o.fails.push('the clubhouse stands ' + o.gap + ' pixels from the landmark');
        }
        // ---- none in a wager ----------------------------------------------
        {
          S.chaos = Object.assign({}, NIGHT);
          const R = { id: 'cellar', floor: 2 };
          Scene.newDepthsHole(R);
          const was = S.dgnRun; S.dgnRun = { id: 'cellar' };
          Scene.camD = 0; Scene.buildRidge();
          alone(Scene.props || [], 2); const n1 = count(new Set([...LAMP, ...FLY]), 0, 0, VW, VH);
          blank(); Scene.camD = LEN - 12; Scene.drawFlagstick(); const n2 = count(HALO, 0, 0, VW, VH);
          S.dgnRun = was;
          if (n1 || n2) o.fails.push('in a wager: ' + n1 + ' pixels of lamps and fireflies, ' + n2 + ' of the flag\'s halo');
        }
        // ---- the hole's own dice untouched ----------------------------------
        {
          S.chaos = Object.assign({}, NIGHT);
          Scene.newHole(S.hole, S.tier);
          const a = Scene.props.filter(p => p.kind < 4 && !p.extra).map(p => p.kind + ':' + p.d.toFixed(3) + ':' + p.x.toFixed(3)).join('|');
          Scene.layNight = function () {};
          Scene.newHole(S.hole, S.tier);
          const b = Scene.props.map(p => p.kind + ':' + p.d.toFixed(3) + ':' + p.x.toFixed(3)).join('|');
          Scene.layNight = keep.layNight;
          if (a !== b) o.fails.push('laying the night\'s props moved the hole\'s own trees or gallery');
        }
        // ---- nothing through a hill ------------------------------------------
        S.chaos = Object.assign({}, NIGHT);
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          if (cs.slot !== 'home') continue;
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 4; hh++) {
            S.hole = hh; S.chaos = Object.assign({}, NIGHT);
            Scene.newHole(S.hole, S.tier); Scene.announce = null;
            for (let k = 0; k < 8; k++) {
              Scene.camD = LEN * k / 8; Scene.t = 1 + k * 0.7; Scene.walkTo = 0;
              Scene.draw(1 / 30, D);
              o.views++;
              for (const P of Scene.props.filter(p => p.kind >= 4)) {
                if (P.d < Scene.camD - 5) continue;
                alone([P], Scene.t);
                const lim = Math.max(Scene.clipAt(P.d - 0.5), Scene.clipAt(P.d), Scene.clipAt(P.d + 0.5)) + 1;
                const d = c.getImageData(0, 0, VW, VH).data;
                for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
                  const i = (y * VW + x) * 4;
                  if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                  if (o.fails.length < 12) o.fails.push(cs.id + ' hole ' + holeInRound(hh) + ', camera at ' + Scene.camD.toFixed(1) + ': a ' + (P.kind === 4 ? 'lamp' : 'firefly') + ' at ' + P.d.toFixed(1) + ' shows at row ' + y + ', under the line ' + Math.round(lim));
                  y = VH; break;
                }
                for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) o.pix++;
              }
            }
          }
        }
        if (o.pix < 500) o.fails.push('the night\'s props showed only ' + o.pix + ' pixels over ' + o.views + ' views: too few to mean anything');
      } finally {
        window.step = keep.step; Scene.layNight = keep.layNight;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['at night: lamps ' + r.night.lamp + ', fireflies ' + r.night.fly + ', clubhouse windows ' + r.night.win + ', flag halo ' + r.night.halo + ' pixels; by day none',
            'clubhouse ' + r.gap + ' pixels from the landmark',
            r.views + ' views on the home courses, ' + r.pix + ' pixels of lamps and fireflies, none under the ground\'s line'];
  }
};
