/* Home courses in season.
 *
 * There are ten home courses, one to a Tour Card, so Card XI is home at Willow
 * Creek again. Each time round a home course comes back in a new season: as it
 * was built (Cards I to X), autumn (XI to XX), winter (XXI to XXX), blossom
 * (XXXI to XL), then round again.
 *
 *   - every season of every home course is its own look: the fairway and the
 *     trees change, and no two seasons of a course are the same
 *   - only home courses turn; the others look the same on every card
 *   - the course is the same course: its hazards are where they were
 *   - the fairway still stands out from the rough as well as it did as built
 *     (Castle Dunes is built with the two close, so this is relative)
 *   - winter snows, unless it is raining; the other seasons do not
 *   - the banner names the season
 *   - the regular stops with seasons of their own turn with the real month
 *     instead (autumn from September, winter from December, blossom from
 *     March, as built in the summer); the desert, the tropics, Snowline and
 *     Blossom, the majors and the finale never do; their banner names it too
 *   - the sounds: wind gusting in autumn; in winter a hush, the birds quiet
 *     and only a thin breath of air; more birdsong in blossom (played for
 *     five minutes through a stand-in audio context, with a fixed random)
 */
'use strict';
module.exports = {
  name: 'seasons',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { same: [], moved: [], faint: [], other: [], snow: [], banner: [] };
      const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const dist = (a, b) => rgb(a).reduce((t, v, i) => t + Math.abs(v - rgb(b)[i]), 0);
      const mid = a => a[Math.floor(a.length / 2)];
      // hue in degrees and lightness 0-1: a season has to turn the trees to
      // another colour or another lightness, not another shade of the same
      const hsl = h => { const [r, g, b] = rgb(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        let hu = 0;
        if (d) hu = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return [(hu * 60 + 360) % 360, (mx + mn) / 2, d]; };
      const turned = (a, b) => { const x = hsl(a), y = hsl(b), dh = Math.min(Math.abs(x[0] - y[0]), 360 - Math.abs(x[0] - y[0]));
        return (dh > 25 && x[2] > 0.08 && y[2] > 0.08) || Math.abs(x[1] - y[1]) > 0.18; };
      const N = COURSE_HOME.length;
      try {
        QUIET = true;
        // midsummer, so the regular stops that turn with the month hold still
        DAY_FORCE = Math.floor(Date.UTC(2026, 6, 15) / 864e5);
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const looks = [];
          // each season on the same card (a hole is laid out from its card
          // as well as its number, so across cards the holes differ anyway)
          S.tier = 2;
          for (let s = 0; s < 4; s++) {
            SEASON_FORCE = cs.slot === 'home' ? s : -1;
            if (cs.slot !== 'home') S.tier = s * N + 2;
            Scene.newHole(S.hole, S.tier);
            looks.push({ fw: mid(Scene.theme.fw), tree: Scene.look.tree.join(), sky: Scene.theme.sky.join(),
                         haz: JSON.stringify([Scene.water && [Scene.water.d, Scene.water.x], Scene.bunkers.map(b => [b.d, b.x])]),
                         snow: Scene.snow, rain: Scene.rain, id: Scene.course.id, fall: Scene.fall, ice: Scene.ice });
            if (cs.slot === 'home') for (const mode of ['day', 'night', 'rain']) {
              const T0 = buildTheme(cs, mode), T = buildTheme(seasonLook(cs, s), mode);
              const d0 = dist(mid(T0.fw), mid(T0.rg)), d = dist(mid(T.fw), mid(T.rg));
              if (d < Math.min(20, d0 * 0.6)) o.faint.push(cs.id + ' ' + SEASONS[s].n + ' ' + mode + ' ' + d + ' (built ' + d0 + ')');
            }
          }
          if (looks.some(l => l.id !== cs.id)) o.moved.push(cs.id + ' became another course');
          if (cs.slot === 'home') {
            for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
              if (looks[a].fw === looks[b].fw || looks[a].tree === looks[b].tree)
                o.same.push(cs.id + ' seasons ' + a + ' and ' + b + (looks[a].fw === looks[b].fw ? ' fairway' : ' trees'));
            for (let s = 1; s < 4; s++) if (!turned(cs.tree[0], seasonLook(cs, s).tree[0]))
              o.same.push(cs.id + ' ' + SEASONS[s].n + ' trees barely change (' + cs.tree[0] + ' to ' + seasonLook(cs, s).tree[0] + ')');
            if (new Set(looks.map(l => l.haz)).size > 1) o.moved.push(cs.id + ' hazards moved with the season');
            looks.forEach((l, s) => { if (l.snow !== (s === 2 && !l.rain)) o.snow.push(cs.id + ' season ' + s + ' snow ' + l.snow); });
            // leaves blowing in autumn, petals in blossom, ponds frozen in winter
            const wantFall = [null, 'leaves', null, 'petals'];
            looks.forEach((l, s) => {
              if (l.fall !== (l.rain ? null : wantFall[s])) o.snow.push(cs.id + ' season ' + s + ' falling ' + l.fall);
              if (l.ice !== (s === 2)) o.snow.push(cs.id + ' season ' + s + ' ice ' + l.ice);
            });
            // which season a card is: as built on I to X, then a season a pass,
            // and round again after blossom
            SEASON_FORCE = -1;
            for (const [t, want] of [[0, 0], [N - 1, 0], [N, 1], [2 * N + 5, 2], [3 * N, 3], [4 * N + 1, 0]])
              if (homeSeason(cs, t) !== want) o.same.push(cs.id + ' on card ' + (t + 1) + ' is season ' + homeSeason(cs, t) + ', not ' + want);
          } else if (new Set(looks.map(l => l.fw + l.tree + l.sky)).size > 1) o.other.push(cs.id);
        }

        // the banner, on a home course's first hole
        QUIET = false;
        const home = B.COURSE.findIndex(c => c.slot === 'home');
        for (const [tier, want] of [[3, null], [N + 3, 'AUTUMN'], [2 * N + 3, 'WINTER'], [3 * N + 3, 'BLOSSOM']]) {
          DEV.course(home); hideSheet();
          S.tier = tier; S.courseSeen = -1; announceCourse();
          const sub = Scene.announce ? Scene.announce.sub : '';
          if (want ? sub.indexOf(want + ' ') !== 0 : /AUTUMN|WINTER|BLOSSOM/.test(sub)) o.banner.push('card ' + (tier + 1) + ': "' + sub + '"');
          if (!/HOME OF TOUR CARD/.test(sub)) o.banner.push('card ' + (tier + 1) + ' lost its home line: "' + sub + '"');
        }
        // ---- the calendar ---------------------------------------------------
        const MONTH = ['Winter', 'Winter', 'Blossom', 'Blossom', 'Blossom', null, null, null, 'Autumn', 'Autumn', 'Autumn', 'Winter'];
        const TURN = ['coastal', 'sandbelt', 'highlands', 'blackwater', 'riverbend', 'moorland'];
        o.cal = []; o.calSeen = {};
        for (let m = 0; m < 12; m++) for (const day of [1, 28]) {
          DAY_FORCE = Math.floor(Date.UTC(2027, m, day) / 864e5);
          for (let ci = 0; ci < B.COURSE.length; ci++) {
            const cs = B.COURSE[ci];
            if (cs.slot === 'home') continue;
            DEV.course(ci); hideSheet(); Scene.newHole(S.hole, S.tier);
            const want = TURN.includes(cs.id) ? MONTH[m] : null, got = Scene.look.season || null;
            if (got !== want) o.cal.push(cs.id + ' on ' + (m + 1) + '/' + day + ' is ' + got + ', not ' + want);
            if (got) o.calSeen[got] = (o.calSeen[got] || 0) + 1;
            if (want === 'Winter' && Scene.snow !== !Scene.rain) o.cal.push(cs.id + ' in winter snow ' + Scene.snow);
          }
        }
        // and on them too the fairway still stands out from the rough
        for (const id of TURN) for (let s = 1; s < 4; s++) for (const mode of ['day', 'night', 'rain']) {
          const cs = courseById(id), T0 = buildTheme(cs, mode), T = buildTheme(seasonLook(cs, s), mode);
          const d0 = dist(mid(T0.fw), mid(T0.rg)), d = dist(mid(T.fw), mid(T.rg));
          if (d < Math.min(20, d0 * 0.6)) o.faint.push(id + ' ' + SEASONS[s].n + ' ' + mode + ' ' + d + ' (built ' + d0 + ')');
        }
        // the banner on a regular stop, and today's month read off the real clock
        QUIET = false;
        DAY_FORCE = Math.floor(Date.UTC(2027, 9, 10) / 864e5);
        DEV.course(B.COURSE.findIndex(c => c.id === 'coastal')); hideSheet();
        S.courseSeen = -1; announceCourse();
        o.calBanner = Scene.announce ? Scene.announce.sub : '';
        DAY_FORCE = null;
        o.today = { want: MONTH[new Date().getUTCMonth()], got: seasonLook(courseById('coastal'), courseSeason(courseById('coastal'), 0)).season || null };
        QUIET = true;

        // a frozen pond: drawn as ice, and nothing rippling on it
        SEASON_FORCE = 2; DEV.course(home); hideSheet();
        for (let i = 0; i < 80 && !(Scene.water && !Scene.water.lake && !Scene.water.canyon && !Scene.water.river); i++) { S.hole++; Scene.newHole(S.hole, S.tier); }
        if (Scene.water && !Scene.water.lake) {
          Scene.camD = Math.max(0, Scene.water.d - 14); Scene.gGen++; Scene._rips = [];
          const used = []; const h0 = Scene.hazSlice;
          Scene.hazSlice = function(c, T, hz, P){ if (hz === Scene.water) used.push(P); return h0.apply(this, arguments); };
          Scene.drawGround(); Scene.hazSlice = h0;
          o.iceP = used.length > 0 && used.every(P => P === P_ICE);
          o.iceRips = (Scene._rips || []).length;
        } else o.iceP = 'no pond';
      } finally {
        SEASON_FORCE = -1; DAY_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; Scene.announce = null; startHole();
      }
      o.homes = N;
      return o;
    });
    const snd = await page.evaluate(() => {
      const keep = { ctx: Sfx.ctx, gust: Sfx.gust, chirp: Sfx.chirp, mt: Sfx.musicTick, rnd: Math.random,
                     look: Scene.look, night: Scene.night, rain: Scene.rain, heli: Scene.heli, crossing: Scene.crossing, sound: S.sound };
      const out = {};
      try {
        S.sound = 1; QUIET = false; S.dgnRun = null; Scene.night = false; Scene.rain = false; Scene.heli = 0; Scene.crossing = 0;
        Sfx.ctx = { state: 'running', currentTime: 1 }; Sfx.musicTick = () => {};
        const home = COURSE_HOME[0];
        for (let s = 0; s < 4; s++) {
          let seed = 12345;
          Math.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x80000000; };
          const n = { gust: 0, hush: 0, chirp: 0 };
          Sfx.gust = (t, dur, vol) => { if (vol === Sfx.SEASON_VOL.gust) n.gust++; else n.hush++; };
          Sfx.chirp = () => { n.chirp++; };
          Sfx.windT = undefined; Sfx.birdT = undefined;
          Scene.look = seasonLook(home, s);
          for (let t = 0; t < 300; t += 0.1) Sfx.tick(0.1);
          out[s] = n;
        }
      } finally {
        Math.random = keep.rnd; Sfx.ctx = keep.ctx; Sfx.gust = keep.gust; Sfx.chirp = keep.chirp; Sfx.musicTick = keep.mt;
        Scene.look = keep.look; Scene.night = keep.night; Scene.rain = keep.rain; Scene.heli = keep.heli; Scene.crossing = keep.crossing; S.sound = keep.sound;
      }
      return out;
    });

    const f = m => { throw new Error(m); };
    const [built, autumn, winter, bloom] = [0, 1, 2, 3].map(k => snd[k]);
    if (built.gust || built.hush) f('a course as built made season sounds: ' + JSON.stringify(built));
    if (autumn.gust < 15 || autumn.hush) f('five minutes of autumn: ' + autumn.gust + ' gusts, ' + autumn.hush + ' winter breaths (want 15 or more gusts)');
    if (winter.chirp || winter.hush < 10 || winter.gust) f('five minutes of winter: ' + winter.chirp + ' birds, ' + winter.hush + ' breaths, ' + winter.gust + ' gusts (want silence from the birds)');
    if (!(bloom.chirp > built.chirp * 1.5)) f('blossom birdsong ' + bloom.chirp + ' against ' + built.chirp + ' as built (want half as much again)');
    if (r.same.length) f('home course seasons that look alike: ' + r.same.slice(0, 4).join('; '));
    if (r.other.length) f('courses that are not home courses changed with the card: ' + r.other.join(', '));
    if (r.moved.length) f(r.moved.slice(0, 3).join('; '));
    if (r.faint.length) f('a season where the fairway sinks into the rough: ' + r.faint.slice(0, 4).join('; '));
    if (r.snow.length) f('weather in the wrong season: ' + r.snow.slice(0, 4).join('; '));
    if (r.iceP !== true || r.iceRips) f('a pond in winter: drawn as ice ' + r.iceP + ', ripples ' + r.iceRips);
    if (r.banner.length) f('the banner: ' + r.banner.join('; '));
    if (r.cal.length) f('the regular stops by the month: ' + r.cal.slice(0, 4).join('; '));
    if (Object.keys(r.calSeen).length !== 3) f('over a year the regular stops showed ' + JSON.stringify(r.calSeen));
    if (!/^AUTUMN - TOUR CARD/.test(r.calBanner)) f('a regular stop in October has the banner "' + r.calBanner + '"');
    if (r.today.want !== r.today.got) f('today the Coastal Classic is ' + r.today.got + ', not ' + r.today.want);
    return [r.homes + ' home courses in four seasons each, all different, round again after blossom; other courses unchanged by the card',
      'six regular stops turn with the month (' + Object.entries(r.calSeen).map(([k, v]) => k + ' ' + v).join(', ') + ' over a year), the rest never; the banner says so',
      'sounds over five minutes: autumn ' + autumn.gust + ' gusts; winter ' + winter.hush + ' breaths and no birds; blossom ' + bloom.chirp + ' chirps to ' + built.chirp,
      'hazards stay put; the fairway stands out as well as it does as built; snow and ice in winter, leaves in autumn, petals in blossom; the banner names the season'];
  }
};
