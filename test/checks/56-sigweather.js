/* Life on the railway and weather on the signature holes (the user asked
 * for both from the menu).
 *
 *   - the trains: by day the steam train, a goods train and an express all
 *     come, and never the sleeper; at night mostly the sleeper, and never the
 *     express. The goods is slower and longer than the steam train, the
 *     express quicker. Each is drawn, and each looks unlike the others; the
 *     sleeper's lamp throws light down the line; in snow every roof wears a
 *     cap of it
 *   - waiting at the line as a train goes by, he waves (his arm up over his
 *     head), and his caddie waves once for it; not with the train far off,
 *     nor when he is not at the line; the driver waves from his cab while it
 *     is near the crossing, and not far out
 *   - sounds: the express sets off with its horn, the goods with a lower
 *     whistle; a toot as the engine passes him at the line (none when he is
 *     not there); no chuff from the express
 *   - rain: rings on the water of the island's lake, the river by the stones
 *     and the sea round the stack, only ever on the water; none out of the
 *     rain or on ice
 *   - snow settles on the bridge, the stones and the pier
 *   - a storm (rain and wind) throws more spray over the pier than the wind
 *     alone; the bridge sways more in a strong wind
 */
'use strict';
module.exports = {
  name: 'sigweather',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S);
      const keep = { whistle: Sfx.whistle, horn: Sfx.horn, chuff: Sfx.chuff, ding: Sfx.ding, tone: Sfx.tone, hiss: Sfx.hiss, ctx: Sfx.ctx,
                     gull: Sfx.gull, chirp: Sfx.chirp, gust: Sfx.gust, quack: Sfx.quack, hawk: Sfx.hawk, plop: Sfx.plop, mt: Sfx.musicTick,
                     wave: Scene.railWave, dw: Scene.driverWave, rings: Scene.rainRings, weather: Scene.drawWeather, rr: Scene._railRnd };
      try {
        hideSheet(); QUIET = true;
        const c = Scene.b;
        const px = () => c.getImageData(0, 0, VW, VH).data;
        const diff = (A, B2) => { const pts = []; for (let i = 0; i < A.length; i += 4)
          if (A[i] !== B2[i] || A[i + 1] !== B2[i + 1] || A[i + 2] !== B2[i + 2]) pts.push([(i >> 2) % VW, (i >> 2) / VW | 0]); return pts; };
        const chaos = n => { S.chaos = Object.assign({}, S.chaos || {}, { n }); Scene.newHole(S.hole, S.tier); Scene.announce = null; };
        const frame = (cam, T) => { Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.trainMet = 1; Scene.trainNext = 1e9;
          Scene.fairyMove = null; Scene.moveT = 999; Scene.announce = null; Scene.restBall = null; Scene.balls.length = 0;
          if (T !== undefined) Scene.train = T; Scene.draw(0, derive()); return px(); };
        const mid = kind => { const K = trainKind({ kind }); return (RAIL_X + K.len / 2) / K.v; };   // its middle at the fairway

        // ---- which trains come ----
        DEV.rail(); hideSheet(); chaos('Fair');
        const I = Scene.isle;
        const kinds = night => {
          const n = { steam: 0, goods: 0, express: 0, night: 0 }, was = Scene.night;
          Scene.night = night; Scene._railRnd = seeded(night ? 71 : 37); Scene.camD = 0;
          for (let i = 0; i < 400; i++) { Scene.t += 40; Scene.train = null; Scene.trainNext = Scene.t; Scene.tickRail(); if (Scene.train) n[Scene.train.kind]++; }
          Scene.night = was; Scene.train = null; return n;
        };
        o.day = kinds(false); o.night = kinds(true);
        o.K = {}; for (const k in TRAINS) o.K[k] = { v: TRAINS[k].v, len: TRAINS[k].len };

        // ---- each drawn, and each unlike the others ----
        Scene.drawWeather = () => {};
        Scene.t = 50;
        const bare = frame(I.bank - 0.1, null), F = {};
        o.drawn = {};
        for (const k of ['steam', 'goods', 'express', 'night']) {
          Scene.waveTrain = null;
          F[k] = frame(I.bank - 0.1, { t0: Scene.t - mid(k), dir: 1, kind: k });
          o.drawn[k] = diff(F[k], bare).length;
        }
        // and each in its own colours, the train alone on a clear canvas
        const OWN = { steam: ['#8A3228', '#2E5A3A'], goods: ['#5A5E66', '#8A5A32', '#2A2E34'], express: ['#D8DCE2', '#27384A'], night: ['#22305A', '#1E3A2A'] };
        const alone = T => { Scene.train = T; c.clearRect(0, 0, VW, VH); Scene.drawTrain(Scene.water.d, Scene.camD - CAM_BACK + 0.7);
          const d = px(), n = {}; for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue;
            const hx = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); n[hx] = (n[hx] || 0) + 1; }
          return n; };
        o.own = {};
        for (const k in OWN) { const n = alone({ t0: Scene.t - mid(k), dir: 1, kind: k });
          o.own[k] = { mine: OWN[k].map(h => n[h] || 0), theirs: Object.keys(OWN).filter(q => q !== k).flatMap(q => OWN[q]).filter(h => h !== '#2A2E34' || k !== 'goods').reduce((a, h) => a + (n[h] || 0), 0) }; }
        o.unlike = [];
        const ks = Object.keys(F);
        for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) o.unlike.push([ks[i] + '/' + ks[j], diff(F[ks[i]], F[ks[j]]).length]);
        // the sleeper's lamp: light down the line ahead of its engine, at night
        chaos('Night');
        {
          const T = { t0: Scene.t - mid('night') + 0.4, dir: 1, kind: 'night' };
          const on = frame(I.bank - 0.1, T), Ahead = Scene.railAt(), g = Scene.proj(Scene.water.d, Ahead.head + 0.4);
          // compared with the steam train in the same place (the same engine, no lamp)
          const off = frame(I.bank - 0.1, { t0: T.t0, dir: 1, kind: 'steam' });
          o.lamp = diff(on, off).filter(([x]) => x > g.x + 2).length;
        }
        chaos('Fair');
        // snow on its roofs
        {
          const T = { t0: Scene.t - mid('goods'), dir: 1, kind: 'goods' };
          Scene.camD = I.bank - 0.1;
          const one = () => { Scene.train = T; c.clearRect(0, 0, VW, VH); Scene.drawTrain(Scene.water.d, Scene.camD - CAM_BACK + 0.7); return px(); };
          Scene.snow = false; const dry = one(); Scene.snow = true; const wet = one(); Scene.snow = false;
          o.trainSnow = diff(wet, dry).length;
        }

        // ---- waving ----
        {
          QUIET = false; Scene.waveTrain = null; Scene.fairyMove = null;
          const T = { t0: Scene.t - mid('steam'), dir: 1, kind: 'steam' };
          const G = () => { const k = SPRITE.caddie; SPRITE.caddie = null; c.clearRect(0, 0, VW, VH); Scene.drawGolfer(derive()); SPRITE.caddie = k; return px(); };
          Scene.camD = I.bank - 0.1; Scene.walkTo = Scene.camD; Scene.swingT = 0; Scene.train = T;
          Scene.fairyMove = null; Scene.moveT = 999;
          const w1 = Scene.railWave();
          o.cadWave = Scene.fairyMove && Scene.fairyMove.kind;
          Scene.fairyMove = null; Scene.railWave(); o.cadAgain = !!Scene.fairyMove;
          QUIET = true;
          const waving = G(); Scene.railWave = () => 0; const still = G(); Scene.railWave = keep.wave;
          const p = Scene.proj(Scene.camD, 0), h = Math.max(6, Math.round(B_GOLFER * US * p.s));
          const arm = diff(waving, still);
          o.wave = { w: +w1.toFixed(2), arm: arm.length, up: arm.filter(([, y]) => y < p.y - h * 0.9).length };
          // not with the train far off, nor away from the line, nor with none
          Scene.train = { t0: Scene.t - 0.5, dir: 1 }; o.waveFar = Scene.railWave();
          Scene.train = T; Scene.camD = I.bank - 3; o.waveAway = Scene.railWave();
          Scene.camD = I.bank - 0.1; Scene.train = null; o.waveNone = Scene.railWave();
          // the driver: his hand out of the cab near the crossing, and not far out
          // (the train alone, seen from twelve short of the line: its cab at the crossing, and then ten out, still in view)
          const drv = cab => { const Tq = { t0: Scene.t - (RAIL_X + cab + RAIL_LEN - 5.4) / RAIL_V, dir: 1, kind: "steam" }; Scene.camD = I.bank - 12;
            const one = () => { Scene.train = Tq; c.clearRect(0, 0, VW, VH); Scene.drawTrain(Scene.water.d, Scene.camD - CAM_BACK + 0.7); return px(); };
            const a = one(); Scene.driverWave = () => {}; const b = one(); Scene.driverWave = keep.dw;
            let seen = 0; for (let i = 3; i < a.length; i += 4) if (a[i]) seen++;
            return { n: diff(a, b).length, seen }; };
          const d0 = drv(0), d1 = drv(10); o.driver = d0.n; o.driverFar = d1.n; o.driverFarSeen = d1.seen;
        }

        // ---- sounds ----
        {
          S.sound = 1; QUIET = false;
          Sfx.ctx = { state: 'running', currentTime: 1 };
          const heard = [];
          Sfx.whistle = (t, low, once) => heard.push('whistle' + (low ? '-low' : '') + (once ? '-toot' : ''));
          Sfx.horn = (t, once) => heard.push('horn' + (once ? '-toot' : ''));
          Sfx.chuff = () => heard.push('chuff'); Sfx.ding = () => {};
          Sfx.tone = () => {}; Sfx.hiss = () => {}; Sfx.gull = () => {}; Sfx.chirp = () => {}; Sfx.gust = () => {}; Sfx.musicTick = () => {};
          const run = (kind, cam) => {
            heard.length = 0; Sfx.trainT0 = null; Scene.camD = cam; Scene.walkTo = cam;
            Scene.train = { t0: Scene.t, dir: 1, kind }; Scene.trainMet = 1; Scene.trainNext = 1e9;
            for (let i = 0; i < 10 * 12; i++) { Scene.t += 0.1; Scene.tickRail(); Sfx.tick(0.1); }
            const n = {}; heard.forEach(k => n[k] = (n[k] || 0) + 1); return n;
          };
          o.snd = { express: run('express', I.bank - 0.1), goods: run('goods', I.bank - 0.1), steam: run('steam', I.bank - 0.1), away: run('steam', 0) };
          QUIET = true;
          Object.assign(Sfx, { whistle: keep.whistle, horn: keep.horn, chuff: keep.chuff, ding: keep.ding, tone: keep.tone, hiss: keep.hiss,
                               gull: keep.gull, chirp: keep.chirp, gust: keep.gust, musicTick: keep.mt, ctx: keep.ctx });
        }
        Scene.train = null;

        // ---- rain on the water ----
        const rings = (dev, cam) => {
          DEV[dev](); hideSheet(); chaos('Crosswind');
          const I2 = Scene.isle, at = cam(I2);
          let n = 0, off = 0;
          for (let k = 0; k < 6; k++) {
            Scene.t = 60 + k * 0.23;
            const a = frame(at, null), R = Scene._rips.slice();
            Scene.rainRings = () => {}; const b = frame(at, null); Scene.rainRings = keep.rings;
            const rows = new Map(); for (let i = 0; i < R.length; i += 3) { const L = rows.get(R[i]) || []; L.push([R[i + 1], R[i + 1] + R[i + 2]]); rows.set(R[i], L); }
            const wet = (x, y) => { for (let dy = -2; dy <= 2; dy++) { const L = rows.get(y + dy); if (L && L.some(([l, rr]) => x >= l && x < rr)) return true; } return false; };
            const d = diff(a, b); n += d.length; off += d.filter(([x, y]) => !wet(x, y)).length;
          }
          return { n, off, rain: Scene.rain };
        };
        o.rain = { island: rings('isle', I2 => 30), stones: rings('stones', I2 => I2.bank - 4), pier: rings('pier', I2 => I2.bank + 4) };
        // none out of the rain, none on ice
        {
          DEV.isle(); hideSheet(); chaos('Fair');
          const a = frame(30, null); Scene.rainRings = () => {}; const b = frame(30, null); Scene.rainRings = keep.rings;
          o.dryRings = diff(a, b).length;
          chaos('Crosswind'); Scene.ice = true; Scene.gGen++;
          const called = []; Scene.rainRings = function () { called.push(1); };
          frame(30, null); Scene.rainRings = keep.rings; Scene.ice = false; Scene.gGen++;
          o.iceRings = called.length;
        }

        // ---- snow ----
        const snowy = (dev, cam) => {
          DEV[dev](); hideSheet(); chaos('Fair');
          const at = cam(Scene.isle);
          Scene.snow = false; const a = frame(at, null); Scene.snow = true; const b = frame(at, null); Scene.snow = false;
          return diff(a, b).length;
        };
        o.snow = { bridge: snowy('canyon', I2 => I2.bank - 3), stones: snowy('stones', I2 => I2.bank - 4), pier: snowy('pier', I2 => I2.bank + 4) };

        // ---- a storm over the pier; the bridge in the wind ----
        {
          DEV.pier(); hideSheet(); chaos('Fair');
          const spray = rain => { Scene.rain = rain; Scene.wind = 1.0; let n = 0;
            for (let k = 0; k < 12; k++) { Scene.t = 80 + k * 0.17; c.clearRect(0, 0, VW, VH);
              const posts = []; for (let d = LEN - 8.3; d >= Scene.isle.bank + 0.5 - 0.01; d -= 2.4) posts.push(d);
              Scene.drawSpray(posts, 0.55, 0.12, Scene.camD - CAM_BACK + 0.7);
              const d = px(); for (let i = 3; i < d.length; i += 4) if (d[i]) n++; }
            Scene.rain = false; return n; };
          Scene.camD = Scene.isle.bank + 2;
          o.spray = { wind: spray(false), storm: spray(true), mph: Math.round(Scene.windMph()) };
          DEV.canyon(); hideSheet(); chaos('Fair');
          Scene.camD = Scene.isle.bank - 3;
          const sway = wind => { Scene.wind = wind; let n = 0;
            for (let k = 0; k < 6; k++) { Scene.t = 90 + k * 0.4; c.clearRect(0, 0, VW, VH); Scene.drawBridge(); const a = px();
              Scene.t += 0.6; c.clearRect(0, 0, VW, VH); Scene.drawBridge(); n += diff(a, px()).length; }
            return n; };
          o.sway = { calm: sway(0), gale: sway(1.6) };
        }
      } finally {
        Object.assign(Sfx, { whistle: keep.whistle, horn: keep.horn, chuff: keep.chuff, ding: keep.ding, tone: keep.tone, hiss: keep.hiss,
                             gull: keep.gull, chirp: keep.chirp, gust: keep.gust, quack: keep.quack, hawk: keep.hawk, plop: keep.plop, musicTick: keep.mt, ctx: keep.ctx });
        Scene.railWave = keep.wave; Scene.driverWave = keep.dw; Scene.rainRings = keep.rings; Scene.drawWeather = keep.weather; Scene._railRnd = keep.rr;
        RAIL_FORCE = 0; ISLE_FORCE = 0; CANYON_FORCE = 0; STONES_FORCE = 0; PIER_FORCE = 0;
        Scene.train = null; Scene.snow = false; Scene.ice = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    const J = x => JSON.stringify(x);
    const { day, night, K } = r;
    if (!(day.steam >= 100 && day.goods >= 60 && day.express >= 40) || day.night) f('by day the trains that come: ' + J(day) + ' (the steam train, goods and express, never the sleeper)');
    if (!(night.night >= 200) || night.express || night.steam) f('at night the trains that come: ' + J(night) + ' (mostly the sleeper, never the express)');
    if (!(K.goods.v < K.steam.v && K.goods.len > K.steam.len && K.express.v > K.steam.v * 1.4)) f('the trains\' speeds and lengths: ' + J(K));
    for (const k in r.drawn) if (!(r.drawn[k] >= 800)) f('the ' + k + ' train drawn: ' + r.drawn[k] + ' pixels');
    for (const k in r.own) if (r.own[k].mine.some(n => n < 10) || r.own[k].theirs) f('the ' + k + ' train is not in its own colours: ' + J(r.own[k]));
    const alike = r.unlike.filter(([, n]) => n < 400);
    if (alike.length) f('trains that look alike: ' + J(alike));
    if (!(r.lamp >= 30)) f('the sleeper\'s lamp down the line: ' + r.lamp + ' pixels ahead of the engine');
    if (!(r.trainSnow >= 40)) f('snow on the train\'s roofs: ' + r.trainSnow + ' pixels');
    if (!(r.wave.w > 0.9 && r.wave.arm >= 6 && r.wave.up >= 2)) f('he does not wave at the train: ' + J(r.wave) + ' (his arm up over his head)');
    if (r.cadWave !== 'wave' || r.cadAgain) f('his caddie\'s wave: ' + r.cadWave + ', again for the same train ' + r.cadAgain);
    if (r.waveFar || r.waveAway || r.waveNone) f('waving with the train far off ' + r.waveFar + ', away from the line ' + r.waveAway + ', with none ' + r.waveNone);
    if (!(r.driver >= 2) || r.driverFar || !(r.driverFarSeen >= 100)) f('the driver\'s wave: ' + r.driver + ' pixels at the crossing, ' + r.driverFar + ' far out (the train ' + r.driverFarSeen + ' pixels in view there)');
    const s = r.snd;
    if (!(s.express.horn === 1 && s.express['horn-toot'] === 1) || s.express.chuff || s.express.whistle) f('the express\'s sounds: ' + J(s.express) + ' (its horn setting off, a toot passing him, no chuff)');
    if (!(s.goods['whistle-low'] === 1 && s.goods['whistle-low-toot'] === 1 && s.goods.chuff >= 20)) f('the goods train\'s sounds: ' + J(s.goods) + ' (a lower whistle, a toot, its chuff)');
    if (!(s.steam.whistle === 1 && s.steam['whistle-toot'] === 1)) f('the steam train\'s sounds: ' + J(s.steam));
    if (s.away['whistle-toot'] || s.away['horn-toot']) f('a toot with him not at the line: ' + J(s.away));
    for (const k in r.rain) { const R = r.rain[k];
      if (!R.rain || !(R.n >= 300) || R.off) f('rain rings on the ' + k + ': ' + J(R) + ' (on the water only)'); }
    if (r.dryRings || r.iceRings) f('rain rings out of the rain ' + r.dryRings + ', or on ice ' + r.iceRings);
    for (const k in r.snow) if (!(r.snow[k] >= 30)) f('snow on the ' + k + ': ' + r.snow[k] + ' pixels');
    if (!(r.spray.storm >= r.spray.wind * 1.4)) f('a storm over the pier: ' + J(r.spray) + ' (more spray than the wind alone)');
    if (!(r.sway.gale >= r.sway.calm * 1.3)) f('the bridge in the wind: ' + J(r.sway) + ' (it sways more)');
    return ['trains by day ' + J(day) + ', at night ' + J(night) + '; the goods ' + K.goods.v + ' fast and ' + K.goods.len + ' long, the express ' + K.express.v,
      'each drawn (' + J(r.drawn) + '), each unlike the others (the nearest ' + Math.min(...r.unlike.map(([, n]) => n)) + ' pixels apart); the sleeper\'s lamp ' + r.lamp + 'px, snow on the roofs ' + r.trainSnow + 'px',
      'he waves (' + r.wave.arm + 'px, his arm up over his head), his caddie once, the driver from his cab near the crossing; none far off or away from the line',
      'the express\'s horn, the goods\' lower whistle, a toot passing him, no toot when he is elsewhere',
      'rain rings on the water: ' + Object.entries(r.rain).map(([k, v]) => k + ' ' + v.n).join(', ') + ', none off it, none dry or on ice',
      'snow on the bridge ' + r.snow.bridge + ', stones ' + r.snow.stones + ', pier ' + r.snow.pier + 'px; storm spray ' + r.spray.storm + ' against ' + r.spray.wind + ' at ' + r.spray.mph + ' mph; the bridge swaying ' + r.sway.gale + ' against ' + r.sway.calm];
  }
};
