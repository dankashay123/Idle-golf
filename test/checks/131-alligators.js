/* Alligators (the user asked: "make them pretty common on lakes, and make
 * one a gold alligator that is a hunt animal too"):
 *
 *   - on most holes with a lake (ALLIGATOR_P), in the water, by day and by
 *     night; never in winter, on the ice or on a hole with no water
 *   - a golden one now and then, as the other golden animals
 *   - in the weekly hunt's pool from the week after they came (the weeks
 *     already set keep their three); a golden one counts for the hunt
 */
'use strict';
module.exports = {
  name: 'alligators',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; FROST_FORCE = 0;
        const wetOf = () => (Scene.fills || []).some(F => F.kind === 'lake') || !!Scene.pond || !!(Scene.water && !Scene.water.canyon && !Scene.water.rail);
        const bigOf = () => (Scene.fills || []).some(F => F.kind === 'lake') || !!(Scene.water && Scene.water.lake) || (Scene.water && !Scene.water.canyon && !Scene.water.rail && Scene.water.rd > 4) || (Scene.pond && Scene.pond.rd > 4);
        o.day = { lake: 0, gat: 0 }; o.night = { lake: 0, gat: 0 }; o.dry = 0;
        for (const s of [0, 1, 3]) for (const night of [false, true]) { SEASON_FORCE = s;
          for (let h = 1; h < 600; h += 4) { S.hole = h; S.chaos = { n: night ? 'Night Round' : 'Fair' }; Scene.newHole(h, S.tier);
            const g = Scene.props.filter(p => p.kind === 15 && p.an === 'alligator'), k = night ? o.night : o.day;
            if (bigOf()) { k.lake++; if (g.length) k.gat++; }
            if (g.length && !wetOf()) { o.dry++; f('an alligator on hole ' + h + ' with no water'); }
            for (const p of g) if (!(Scene.inPond(p.d, p.x, 0) || Scene.inFill(p.d, p.x, 0, 'lake') || (Scene.water && Math.abs(p.d - Scene.water.d) < Scene.water.rd && Math.abs(p.x - Scene.water.x) < Scene.water.rx))) f('an alligator out of the water on hole ' + h);
          } }
        for (const k of ['day', 'night']) if (!(o[k].gat > o[k].lake * 0.4)) f('by ' + k + ' alligators on ' + o[k].gat + ' of ' + o[k].lake + ' holes with a lake');
        // never in winter
        SEASON_FORCE = 2; let win = 0, wn = 0; for (let h = 1; h < 600; h += 4) { S.hole = h; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier);
          if (Scene.look && Scene.look.season === 'Winter') { wn++; if (Scene.props.some(p => p.an === 'alligator')) win++; } }
        if (win || wn < 20) f(win + ' of ' + wn + ' winter holes with an alligator');
        // golden now and then
        SEASON_FORCE = 0; GOLD_FORCE = -1; let gold = 0; for (let h = 1; h < 300; h += 4) { S.hole = h; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier); if (Scene.props.some(p => p.an === 'alligator' && p.gold)) gold++; }
        GOLD_FORCE = null; SEASON_FORCE = -1;
        if (!gold) f('no golden alligator, forced'); if (!GUIDE.some(g => g.id === 'g_alligator') || !GUIDE.some(g => g.id === 'alligator')) f('no alligator in the Guide');
        o.gold = gold;
        // the hunt: from HUNT_GATOR_WK, not before; a golden one counts
        let before = 0, after = 0; for (let w = HUNT_GATOR_WK - 300; w < HUNT_GATOR_WK; w++) if (huntOf(w).includes('alligator')) before++;
        for (let w = HUNT_GATOR_WK; w < HUNT_GATOR_WK + 300; w++) if (huntOf(w).includes('alligator')) after++;
        if (before || after < 30) f('alligator hunts: ' + before + ' before, ' + after + ' after in 300 weeks');
        o.hunts = after;
        let wk = HUNT_GATOR_WK; while (!huntOf(wk).includes('alligator')) wk++;
        HUNTWK_FORCE = wk; delete S.hunt; S.tier = 0; const res = huntSee(['g_alligator']); HUNTWK_FORCE = null;
        if (!res || !res.fresh.includes('alligator')) f('a golden alligator did not count for the hunt: ' + JSON.stringify(res));
      } finally {
        window.step = keep; FROST_FORCE = null; SEASON_FORCE = -1; GOLD_FORCE = null; HUNTWK_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['on ' + r.day.gat + ' of ' + r.day.lake + ' lake holes by day, ' + r.night.gat + ' of ' + r.night.lake + ' at night, always in the water; none in winter or on a dry hole',
      'golden ones on ' + r.gold + ' holes forced; in ' + r.hunts + ' of 300 weeks\' hunts from their week, none before; a golden one counts'];
  }
};
