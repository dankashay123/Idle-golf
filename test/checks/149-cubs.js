/* Fox cubs (the user picked them from the menu): in spring, one fox in two
 * has two cubs beside her at the edge of the woods; never on their own,
 * never out of spring, at night or in the rain; laid once the hole is laid,
 * so nothing else on it moves; spotted, they fill a Guide entry. */
'use strict';
module.exports = {
  name: 'cubs',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), keep = window.courseFor, keepD = DAY_FORCE;
      try {
        QUIET = true; const cs = courseById('willow'); window.courseFor = () => cs; S.chaos = { n: 'Fair' };
        const lay = (sea, h) => { SEASON_FORCE = sea; Scene.newHole(h, 3); return Scene.props; };
        let fox = 0, withCubs = 0, alone = 0, moved = 0;
        for (let h = 1; h < 500; h++) {
          const P = lay(3, h), foxes = P.filter(q => q.kind === 15 && q.an === 'fox'), cubs = P.filter(q => q.kind === 15 && q.an === 'cub');
          fox += foxes.length;
          for (const c of cubs) { const m = foxes.find(x => Math.abs(x.d - c.d) < 1 && Math.abs(x.x - c.x) < 1.2); if (!m) alone++; }
          withCubs += foxes.filter(x => cubs.some(c => Math.abs(x.d - c.d) < 1 && Math.abs(x.x - c.x) < 1.2)).length;
          // nothing else moved: the same hole laid with cubs off
          if (cubs.length) { const key = P.filter(q => q.an !== 'cub').map(q => q.kind + ':' + q.d.toFixed(3) + ':' + q.x.toFixed(3)).join(); CUB_P = 0; const P2 = lay(3, h); CUB_P = 0.5;
            if (P2.map(q => q.kind + ':' + q.d.toFixed(3) + ':' + q.x.toFixed(3)).join() !== key) moved++; }
          for (const s of [0, 1, 2]) if (lay(s, h).some(q => q.an === 'cub')) { f('cubs in season ' + s + ' on hole ' + h); break; }
        }
        if (alone) f(alone + ' cubs with no fox beside them');
        if (moved) f(moved + ' holes laid differently for the cubs');
        if (fox < 15 || withCubs / fox < 0.25 || withCubs / fox > 0.75) f(withCubs + ' of ' + fox + ' spring foxes with cubs, not about half');
        S.chaos = { n: 'Night Round' }; for (let h = 1; h < 200; h++) if (lay(3, h).some(q => q.an === 'cub')) { f('cubs at night'); break; }
        S.chaos = { n: 'Fair' };
        if (!GUIDE.find(g => g.id === 'cub')) f('no Guide entry');
        // spotted: the Guide counts them
        const sp = { hole: S.hole, props: [{ kind: 15, an: 'cub' }] }; QUIET = false; S.guide = S.guide || {}; const n0 = S.guide.cub || 0;
        { const tw = window.toast; window.toast = () => {}; try { guideSpot(Object.assign(sp, { course: cs })); } finally { window.toast = tw; } }
        if ((S.guide.cub || 0) !== n0 + 1) f('spotted, the Guide counted ' + ((S.guide.cub || 0) - n0));
        return { fails, fox, withCubs };
      } finally { window.courseFor = keep; SEASON_FORCE = -1; QUIET = false; DAY_FORCE = keepD; CUB_P = 0.5; }
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['in spring ' + r.withCubs + ' of ' + r.fox + ' foxes with two cubs beside them; none alone, out of spring or at night; nothing else moved; in the Guide'];
  }
};
