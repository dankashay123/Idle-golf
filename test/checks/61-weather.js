/* Weather on the ordinary holes, and the dearest skins lighting the grass at
 * night (the user asked for both, from the menu).
 *
 *   - frost: on the Snowline, or an autumn or winter course, from five to
 *     eleven by the player's clock, on a dry day and not at night; not on a
 *     summer course, not in the afternoon. The grass pales (the fairway's
 *     middle tone lighter than the same hole's by day) and frost specks lie
 *     over it, some glinting; none on a day without frost
 *   - puddles: in the rain, on the fairway, never in a hazard or on the
 *     green, with rain rings in them (the drawn puddle changes between
 *     moments); none dry, none on a frozen course, none in a wager
 *   - a puddle is whole: drawn alone where nothing in front cuts it, no row
 *     is missing between its far end and its near (a row's distance guessed
 *     as a straight share fell behind the ground's line and left rows out)
 *   - nothing through a hill: on every home course's first four holes, the
 *     camera at eight places, a frame of the hole first, then each speck and
 *     each puddle alone over a blank; every pixel on or above the ground's
 *     line at its own distance (a puddle's, the most open over its length)
 *   - at night the Divine, the Demonic and the Ascended light the grass
 *     round his feet in their own colours, under their own ground; by day
 *     none, and none for a plain skin
 */
'use strict';
module.exports = {
  name: 'weather',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], views: 0, pix: 0 }, keep = window.step;
      const f = m => o.fails.push(m);
      const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites();
        const D = derive(), c = Scene.b;
        const CH = n => Object.assign({}, B.CHAOS.find(x => x.n === n));
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const alone = (props, t) => { const was = Scene.props; Scene.t = t; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was; };
        const count = (cols) => { const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (cols ? cols.has(hex(d, i)) : !(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return n; };
        const snow = B.COURSE.findIndex(cs => cs.id === 'snowline');
        const home = B.COURSE.findIndex(cs => cs.slot === 'home');
        const hole = (ci, k) => { DEV.course(ci); hideSheet(); const t = tournamentOf(S.hole); S.hole = (t - 1) * B.ROUND * B.DAYS + (k || 2); };
        const setup = (chaos) => { S.chaos = CH(chaos); Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.camD = 0; Scene.t = 1; Scene.draw(0, D); };

        // ---- when frost comes ----
        FROST_FORCE = null;
        const when = (ci, season, hr, chaos) => { SEASON_FORCE = season; HOUR_FORCE = hr; hole(ci); setup(chaos || 'Fair'); return Scene.frost; };
        o.when = {
          snowMorning: when(snow, -1, 8), snowAfternoon: when(snow, -1, 15), snowDawn: when(snow, -1, 4),
          autumnMorning: when(home, 1, 9), winterMorning: when(home, 2, 7), summerMorning: when(home, 0, 8),
          snowRain: when(snow, -1, 8, 'Crosswind'), snowNight: when(snow, -1, 8, 'Night Round')
        };
        const want = { snowMorning: true, snowAfternoon: false, snowDawn: false, autumnMorning: true, winterMorning: true, summerMorning: false, snowRain: false, snowNight: false };
        for (const k in want) if (o.when[k] !== want[k]) f('frost ' + k + ': ' + o.when[k] + ', not ' + want[k]);
        SEASON_FORCE = -1; HOUR_FORCE = null;

        // ---- frost drawn ----
        hole(home); FROST_FORCE = 1; setup('Fair');
        const lum = h => { const v = parseInt(h.slice(1), 16); return (v >> 16) + (v >> 8 & 255) + (v & 255); };
        const frostFw = lum(pickC(Scene.theme._fw, 0.5));
        const specks = Scene.props.filter(p => p.kind === 6);
        let sp = 0, glint = 0;
        for (const t of [0.4, 1.3, 2.9, 4.1]) { alone(specks, t); sp += count(new Set(['#EEF6FA'])); glint += count(new Set(['#FFFFFF', '#CFE8F4'])); }
        FROST_FORCE = 0; setup('Fair');
        const dayFw = lum(pickC(Scene.theme._fw, 0.5));
        let dsp = 0; alone(Scene.props.filter(p => p.kind === 6), 1); Scene.drawProps.call(Scene); dsp = 0;
        { blank(); Scene.drawProps(); dsp = count(new Set(['#EEF6FA'])); }
        o.frost = { fw: frostFw - dayFw, specks: sp, glint, day: dsp };
        if (!(frostFw > dayFw + 40)) f('the frosted fairway is not paler: ' + frostFw + ' against ' + dayFw);
        if (!(sp >= 80)) f('frost specks: ' + sp + ' pixels over four moments');
        if (!(glint >= 4)) f('frost glints: ' + glint + ' pixels over four moments');
        if (dsp) f('frost specks on a day without frost: ' + dsp);
        FROST_FORCE = null;

        // ---- puddles ----
        hole(home); FROST_FORCE = 0; setup('Crosswind');
        const pud = Scene.props.filter(p => p.kind === 7);
        o.puddles = pud.length;
        if (pud.length < 2) f('only ' + pud.length + ' puddles laid on a hole');
        for (const p of pud) {
          if (Scene.hitsHazard(p.d, p.x, 0)) f('a puddle in a hazard at ' + p.d.toFixed(1));
          if (p.d + p.rd > LEN - 6) f('a puddle on the green at ' + p.d.toFixed(1));
          if (Math.abs(p.x) > Scene.fwWidth(p.d)) f('a puddle off the fairway at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(2));
        }
        // the nearest in view, drawn alone at two moments: water, and rings moving
        const P0 = pud.find(p => p.d > 4) || pud[0];
        Scene.camD = Math.max(0, P0.d - 7); Scene.draw(0, D);
        alone([P0], 3.0); const a = c.getImageData(0, 0, VW, VH).data, na = count();
        alone([P0], 3.35); const b = c.getImageData(0, 0, VW, VH).data;
        let moved = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) moved++;
        o.pud = { n: na, rings: moved };
        if (na < 20) f('a puddle close by drew ' + na + ' pixels');
        if (moved < 3) f('no rain rings moving in a puddle (' + moved + ' pixels changed)');
        // whole: no missing row where nothing cuts it
        {
          const near = Scene.proj(P0.d - P0.rd, P0.x), far = Scene.proj(P0.d + P0.rd, P0.x), open = Scene.clipAt(P0.d - P0.rd);
          alone([P0], 3.0); const d = c.getImageData(0, 0, VW, VH).data; const gaps = [];
          for (let y = far.y + 1; y < near.y; y++) {
            if (y > open) break;
            let any = false; for (let x = 0; x < VW && !any; x++) { const i = (y * VW + x) * 4; if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) any = true; }
            if (!any) gaps.push(y);
          }
          if (gaps.length) f('the puddle has rows missing: ' + gaps.join(','));
        }
        // none dry, frozen or in a wager
        const drawnKind = (k) => { blank(); Scene.drawProps(); return count(); };
        setup('Fair'); Scene.camD = Math.max(0, P0.d - 7); Scene.draw(0, D); { blank(); const was = Scene.props; Scene.props = Scene.props.filter(p => p.kind === 7); Scene.drawProps(); Scene.props = was; o.dry = count(); }
        setup('Crosswind'); Scene.camD = Math.max(0, P0.d - 7); Scene.draw(0, D); Scene.ice = true; { blank(); const was = Scene.props; Scene.props = Scene.props.filter(p => p.kind === 7); Scene.drawProps(); Scene.props = was; o.icy = count(); } Scene.ice = false;
        S.dgnRun = { id: 'water' }; { blank(); const was = Scene.props; Scene.props = was.filter(p => p.kind === 7); Scene.drawProps(); Scene.props = was; o.wager = count(); } S.dgnRun = null;
        if (o.dry || o.icy || o.wager) f('puddles drawn dry ' + o.dry + ', frozen ' + o.icy + ', in a wager ' + o.wager);

        // ---- nothing through a hill ----
        for (const [chaos, kind] of [['Crosswind', 7], ['Fair', 6]]) {
          FROST_FORCE = kind === 6 ? 1 : 0;
          for (let ci = 0; ci < B.COURSE.length; ci++) {
            if (B.COURSE[ci].slot !== 'home') continue;
            DEV.course(ci); hideSheet();
            const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
            for (let hh = first; hh < first + 4; hh++) {
              S.hole = hh; S.chaos = CH(chaos); Scene.newHole(S.hole, S.tier); Scene.announce = null;
              if (kind === 7) for (const p of Scene.props.filter(q => q.kind === 7)) {
                if (Scene.hitsHazard(p.d, p.x, 0) || Scene.hitsHazard(p.d + p.rd, p.x, 0) || Scene.hitsHazard(p.d - p.rd, p.x, 0)) f('a puddle in a hazard on ' + B.COURSE[ci].id + ' hole ' + holeInRound(hh) + ' at ' + p.d.toFixed(1));
                if (p.d + p.rd > LEN - 6 || Math.abs(p.x) > Scene.fwWidth(p.d)) f('a puddle off the fairway on ' + B.COURSE[ci].id + ' hole ' + holeInRound(hh) + ' at ' + p.d.toFixed(1));
              }
              for (let k = 0; k < 8; k++) {
                Scene.camD = LEN * k / 8; Scene.t = 1 + k * 0.7; Scene.walkTo = 0;
                Scene.draw(0, D); o.views++;
                for (const P of Scene.props.filter(p => p.kind === kind)) {
                  if (P.d < Scene.camD - 5) continue;
                  const span = P.rd || 0;
                  let lim = -1; for (let q = -1; q <= 1; q += 0.25) lim = Math.max(lim, Scene.clipAt(P.d + q * span));
                  lim += 1;
                  alone([P], Scene.t);
                  const d = c.getImageData(0, 0, VW, VH).data;
                  for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
                    const i = (y * VW + x) * 4;
                    if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                    if (o.fails.length < 12) f(B.COURSE[ci].id + ' hole ' + holeInRound(hh) + ', camera at ' + Scene.camD.toFixed(1) + ': a ' + (kind === 7 ? 'puddle' : 'frost speck') + ' at ' + P.d.toFixed(1) + ' shows at row ' + y + ', under the line ' + Math.round(lim));
                    y = VH; break;
                  }
                  for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) o.pix++;
                }
              }
            }
          }
        }
        FROST_FORCE = null;
        if (o.pix < 2000) f('puddles and frost showed only ' + o.pix + ' pixels over ' + o.views + ' views');

        // ---- the dearest skins' light on the grass at night ----
        hole(home);
        o.glow = {};
        for (const id of ['divine', 'demonic', 'ascended', 'inferno']) {
          S.styleOwn['o:' + id] = 1; S.outfit = id; buildSprites();
          const run = (chaos) => { setup(chaos); const G = Scene.golferPose(); blank(); Scene.golferGround(c, G);
            const cols = new Set((NIGHT_GLOW[id] || NIGHT_GLOW.divine).col); return count(cols); };
          const nt = run('Night Round'), dy = run('Fair');
          o.glow[id] = nt + '/' + dy;
          if (id !== 'inferno' && nt < 40) f('the ' + id + ' at night lit ' + nt + ' pixels of grass');
          if (dy) f('the ' + id + ' lit the grass by day: ' + dy);
          if (id === 'inferno' && nt) f('a plain effect skin lit the grass at night: ' + nt);
        }
      } finally {
        window.step = keep; FROST_FORCE = null; HOUR_FORCE = null; SEASON_FORCE = -1; S.dgnRun = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['frost on a cold morning, not in the afternoon, a summer course, rain or night; fairway ' + r.frost.fw + ' paler, ' + r.frost.specks + ' speck and ' + r.frost.glint + ' glint pixels, none without frost',
      r.puddles + ' puddles on the hole, on the fairway; one close by ' + r.pud.n + ' pixels, rings moving (' + r.pud.rings + '), whole; none dry, frozen or in a wager',
      r.views + ' views on the home courses, ' + r.pix + ' pixels of puddles and frost, none under the ground\'s line',
      'the skins\' light on the grass, night/day: ' + Object.entries(r.glow).map(([k, v]) => k + ' ' + v).join(', ')];
  }
};
