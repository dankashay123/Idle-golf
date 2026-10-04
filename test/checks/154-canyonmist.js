/* Mist in the canyon on a cold morning (the user picked it from the menu):
 * white lying in its depths, thicker the deeper.
 *
 *   - on a frosty morning, or a dry autumn or winter morning by the real
 *     month on a course without seasons, five to eleven; never at night, in
 *     the rain, in summer or the afternoon, nor on a hole without a canyon
 *     (the month pinned to each season and the hour to 8 and 15)
 *   - drawn: its depths paler with it than without, its rim untouched */
'use strict';
module.exports = {
  name: 'canyonmist',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 10) fails.push(m); }, SNAP = JSON.stringify(S), o = {};
      const keepD = DAY_FORCE, keepH = HOUR_FORCE;
      QUIET = true;
      try {
        const cs = B.COURSE.find(c => B.SIG_HOLE[c.id] === 'canyon' && c.slot !== 'home');
        DEV.course(B.COURSE.indexOf(cs)); hideSheet();
        let h = S.hole; while (!isCanyon(h)) h++;
        const day = m => Math.floor(Date.UTC(2026, m, 15) / 86400000), seen = {};
        for (const [m, sea] of [[0, 'winter'], [3, 'spring'], [6, 'summer'], [9, 'autumn']])
          for (const hr of [8, 15]) for (const ch of ['Fair', 'Crosswind', 'Night Round']) {
            DAY_FORCE = day(m); HOUR_FORCE = hr; S.chaos = { n: ch }; Scene.newHole(h, S.tier);
            const want = (sea === 'winter' || sea === 'autumn') && hr === 8 && ch === 'Fair';
            if (!!Scene.cmist !== want) f(sea + ' at ' + hr + ' in ' + ch + ': mist ' + !!Scene.cmist);
            if (Scene.cmist) seen[sea] = 1;
          }
        o.seen = Object.keys(seen).join(', ');
        // never on a hole without a canyon
        DAY_FORCE = day(0); HOUR_FORCE = 8; S.chaos = { n: 'Fair' };
        let h2 = S.hole; while (isCanyon(h2)) h2++; Scene.newHole(h2, S.tier); if (Scene.cmist) f('mist on a hole with no canyon');
        // drawn: from the rim, its depths paler with it than without
        // (on the home course, whose canyon lies open from its rim: on some
        // others a rise in front hides its depths)
        DEV.course(0); hideSheet(); S.chaos = { n: 'Fair' }; DEV.canyon(); hideSheet();
        const I = Scene.isle, D = derive(), raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
        const shot = on => { Scene.cmist = on; for (let k = 0; k < 2; k++) { Scene.camD = I.bank - 1.5; Scene.draw(0, D); } return Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data; };
        const a = shot(true), b = shot(false); window.requestAnimationFrame = raf;
        let paler = 0, darker = 0; const lum = (q, i) => q[i] * 0.3 + q[i + 1] * 0.59 + q[i + 2] * 0.11;
        for (let i = 0; i < a.length; i += 4) { const d0 = lum(a, i) - lum(b, i); if (d0 > 6) paler++; else if (d0 < -6) darker++; }
        o.paler = paler;
        if (paler < 300) f('the mist made ' + paler + ' pixels paler');
        if (darker > paler * 0.05) f('the mist made ' + darker + ' pixels darker');
      } finally { CANYON_FORCE = 0; DAY_FORCE = keepD; HOUR_FORCE = keepH; CMIST_FORCE = null; QUIET = false; S.chaos = { n: 'Fair' }; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['mist in the canyon on dry mornings in ' + r.o.seen + ' only, none at 3pm, at night, in the rain or off the canyon; drawn ' + r.o.paler + ' pixels paler'];
  }
};
