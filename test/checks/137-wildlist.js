/* Course collections: every animal a course lists as its own can be seen
 * there, and a course seen whole pays once, live only.
 *
 * The lists were taken from a sweep of each course's holes, every season,
 * day and night (sixty holes each way). The same sweep is run again here:
 * the layout is a hash of the hole, so it gives the same animals unless the
 * course's laying changes, and then a listed animal that no longer appears
 * there fails it (a collection that could never be finished). */
'use strict';

module.exports = {
  name: 'wildlist',
  async run(page) {
    const r = await page.evaluate(async () => {
      QUIET = true; const keep = window.courseFor, ch = S.chaos, out = { miss: [], extra: [] };
      try {
        for (const cs of B.COURSE) {
          const seen = {}; window.courseFor = () => cs;
          for (const sea of [0, 1, 2, 3]) { SEASON_FORCE = sea;
            for (const night of [0, 1]) { S.chaos = { n: night ? 'Night' : 'Fair' };
              for (let i = 0; i < 60; i++) { const h = 1 + i * 7 + sea * 101 + night * 53; Scene.newHole(h, 3 + (i % 5));
                for (const q of Scene.props || []) if (q.kind === 15) seen[q.an] = (seen[q.an] || 0) + 1; } } }
          for (const an of wildOf(cs.id)) if (!seen[an]) out.miss.push(cs.id + ':' + an);
          if (!COURSE_WILD[cs.id]) out.miss.push(cs.id + ': no list');
          await new Promise(r => setTimeout(r, 0));
        }
      } finally { window.courseFor = keep; S.chaos = ch; SEASON_FORCE = -1; QUIET = false; }
      return out;
    });
    if (r.miss.length) throw new Error('listed but never seen on its course: ' + r.miss.join(', '));

    // ---- paid once, live only ----------------------------------------------
    const pay = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), was = window.__sovAuto;
      try {
        const cs = courseById('willow'), want = wildOf('willow');
        S.cwild = { willow: {} }; S.cwildDone = {}; S.owed = [];
        for (const an of want.slice(1)) S.cwild.willow[an] = 1;
        const sc = { course: cs, props: [{ kind: 15, an: want[0] }] };
        const sov0 = S.sov || 0;
        OFFLINE = true; let n0 = 0; try { courseWildSee(sc); } finally { OFFLINE = false; }
        // (OFFLINE only quiets its toast: guideSpot never calls it away)
        const once = S.cwildDone.willow ? (S.sov || 0) - sov0 : -1;
        courseWildSee(sc);
        const twice = (S.sov || 0) - sov0;
        return { once, twice, want: B.WILD_SOV, done: !!S.cwildDone.willow };
      } finally { const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); OFFLINE = false; QUIET = false; }
    });
    if (!pay.done) throw new Error('a course seen whole was not marked done: ' + JSON.stringify(pay));
    if (pay.once !== pay.want) throw new Error('a course seen whole paid ' + pay.once + ', not ' + pay.want);
    if (pay.twice !== pay.want) throw new Error('a course seen whole paid again: ' + JSON.stringify(pay));

    // ---- never away: guideSpot does nothing in a catch-up ------------------
    const away = await page.evaluate(() => {
      const SNAP = JSON.stringify(S);
      try {
        S.cwild = {}; OFFLINE = true;
        guideSpot({ hole: S.hole, course: courseById('willow'), props: [{ kind: 15, an: 'fox' }] });
        return Object.keys(S.cwild).length;
      } finally { OFFLINE = false; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); }
    });
    if (away) throw new Error('an animal was counted for a course in a catch-up');
  }
};
