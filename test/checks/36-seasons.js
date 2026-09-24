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
        SEASON_FORCE = -1;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; OFFLINE = false; Scene.announce = null; startHole();
      }
      o.homes = N;
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.same.length) f('home course seasons that look alike: ' + r.same.slice(0, 4).join('; '));
    if (r.other.length) f('courses that are not home courses changed with the card: ' + r.other.join(', '));
    if (r.moved.length) f(r.moved.slice(0, 3).join('; '));
    if (r.faint.length) f('a season where the fairway sinks into the rough: ' + r.faint.slice(0, 4).join('; '));
    if (r.snow.length) f('weather in the wrong season: ' + r.snow.slice(0, 4).join('; '));
    if (r.iceP !== true || r.iceRips) f('a pond in winter: drawn as ice ' + r.iceP + ', ripples ' + r.iceRips);
    if (r.banner.length) f('the banner: ' + r.banner.join('; '));
    return [r.homes + ' home courses in four seasons each, all different, round again after blossom; other courses unchanged',
      'hazards stay put; the fairway stands out as well as it does as built; snow and ice in winter, leaves in autumn, petals in blossom; the banner names the season'];
  }
};
