/* Golden animals (the user asked for "something new for the course or the
 * Field Guide"): now and then one of twelve kinds of animal is a golden
 * one, the same creature in gold with a glint on its outline, and spotting
 * it fills its own entry in the Field Guide.
 *
 *   - the rate: about one hole in 150 to 200 of those a kind is on, from
 *     the hole's hash (the same on the same hole, whatever else is drawn)
 *   - the lay is untouched: every hole of a sweep laid with every golden
 *     forced and with none holds the same things in the same places, only
 *     the flag differs; a golden one is laid exactly where the hash says
 *   - every kind is golden somewhere over a sweep of the seasons, night,
 *     the signature holes and a dry course
 *   - nothing under the ground's line: each golden one alone over a blank,
 *     its glint on, from eight places down every home course's first four
 *     holes and a dry course, by day and night; the glint a pixel or two of
 *     white, on for under a fifth of the time
 *   - spotted live only: never away, in a wager or on another hole; a first
 *     sighting pays as the others do
 *   - each in the Field Guide on a shelf of its own, a picture each, not the
 *     plain one's; the shelf fits at 320, 390, 440 and on its side
 *   - the developer menu's rows: this hole, and the next with one
 */
'use strict';
module.exports = {
  name: 'golden',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], laid: {}, natural: 0, holes: 0 }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); HOUR_FORCE = 14; QUIET = true; GOLD_FORCE = null; GOLD_AT = null;
        // the rate, from the hash, per kind
        o.rate = {};
        for (const k of GOLD_KINDS) { let m = 0; const N = 60000; for (let h = 1; h <= N; h++) if (goldRoll(h, k)) m++;
          o.rate[k] = N / Math.max(1, m); if (o.rate[k] < 150 || o.rate[k] > 200) f('a golden ' + k + ' on one hole in ' + Math.round(o.rate[k])); }
        // the lay untouched; golden exactly where the hash says
        const strip = P => JSON.stringify(P.map(p => { const q = Object.assign({}, p); delete q.gold; return q; }));
        const lay = (h, ch) => { S.hole = h; S.chaos = { n: ch || 'Fair' }; Scene.newHole(h, S.tier); return Scene.props; };
        const sweep = (h, ch) => {
          o.holes++;
          GOLD_FORCE = null; const P0 = lay(h, ch), plain = strip(P0), flags = P0.filter(p => p.gold);
          for (const k of new Set(P0.map(goldKind).filter(Boolean))) { const want = goldRoll(h, k), got = P0.some(p => p.gold && goldKind(p) === k);
            if (want !== got) f('hole ' + h + ': a golden ' + k + (got ? ' the hash did not give' : ' the hash gave was not laid')); }
          if (P0.some(p => p.gold && !goldKind(p))) f('hole ' + h + ': a golden one of a kind that has none');
          if (P0.filter(p => p.gold).length > new Set(P0.filter(p => p.gold).map(goldKind)).size) f('hole ' + h + ': two golden ones of a kind');
          o.natural += flags.length;
          GOLD_FORCE = -1; const P1 = lay(h, ch); GOLD_FORCE = null;
          if (strip(P1) !== plain) f('hole ' + h + (ch ? ' (' + ch + ')' : '') + ': the lay changed with a golden one forced');
          for (const p of P1) if (p.gold) { const k = goldKind(p); o.laid[k] = (o.laid[k] || 0) + 1; }
          if (P1.some(goldKind) && !P1.some(p => p.gold)) f('hole ' + h + ': forced, no golden one');
          const again = lay(h, ch); if (strip(again) !== plain || JSON.stringify(again.map(p => !!p.gold)) !== JSON.stringify(P0.map(p => !!p.gold))) f('hole ' + h + ': laid twice, not the same');
        };
        const h0 = S.hole;
        for (const s of [0, 1, 2, 3]) { SEASON_FORCE = s; for (let h = h0; h < h0 + 30; h++) sweep(h); for (let h = h0; h < h0 + 12; h++) sweep(h, 'Night'); }
        SEASON_FORCE = -1;
        for (const k of SIG_KINDS) for (let h = h0, m = 0; m < 6 && h < h0 + 20000; h++) if (sigKind(h) === k) { sweep(h); m++; }
        DEV.course(B.COURSE.findIndex(c => c.id === CRIT_DRY[0])); hideSheet();
        for (let h = S.hole, e = S.hole + 30; h < e; h++) sweep(h);
        // (and the hash's own holes: a sweep of holes the hash makes golden)
        SEASON_FORCE = 1; for (let h = h0, m = 0; m < 60 && h < h0 + 40000; h++) if (GOLD_KINDS.some(k => goldRoll(h, k))) { sweep(h); m++; }
        SEASON_FORCE = -1;
        const miss = GOLD_KINDS.filter(k => !o.laid[k]);
        if (miss.length) f('never golden: ' + miss.join(', '));
        if (!o.natural) f('no golden one from the hash over ' + o.holes + ' holes');
        // none in a wager
        S.dgnRun = { id: B.DGN[0].id }; GOLD_FORCE = -1; lay(h0); if (Scene.props.some(p => p.gold)) f('a golden one in a wager'); S.dgnRun = null; GOLD_FORCE = null;
        // nothing through a hill, the glint on
        const D = derive(), c = Scene.b, keep = window.step; window.step = () => {}; FROST_FORCE = 0;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const drawn = Q => { const was = Scene.props; blank(); Scene.props = [Q]; Scene.drawProps(); Scene.props = was;
          return c.getImageData(0, 0, VW, VH).data; };
        const glintAt = (k, on) => (Math.floor(Scene.t * 0.5 + hr(k, 691)) + (on ? 0.05 : 0.5) - hr(k, 691)) / 0.5;
        o.views = 0; o.pix = 0; o.white = 0; o.whiteOff = 0;
        const courses = COURSE_HOME.concat([B.COURSE.find(c => c.id === CRIT_DRY[0])]);
        for (const cs of courses) for (const night of [0, 1]) {
          DEV.course(B.COURSE.indexOf(cs)); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 4; hh++) {
            GOLD_FORCE = -1; S.hole = hh; S.chaos = { n: night ? 'Night' : 'Fair' }; Scene.newHole(hh, S.tier); Scene.announce = null; GOLD_FORCE = null;
            const P = Scene.props.filter(p => p.gold);
            if (!P.length) continue;
            for (let v = 0; v < 8; v++) {
              Scene.camD = LEN * v / 8; Scene.walkTo = Scene.camD; Scene.t = 1 + v * 0.7; Scene.critUp = {}; Scene.deerUp = {}; Scene.draw(0, D); o.views++;
              for (const Q of P) {
                if (Q.d < Scene.camD - 5) continue;
                const C = CRIT[Q.an];
                if ((Q.kind === 13 && Q.d - Scene.camD < 5) || (C && C.flee && Q.d - Scene.camD < 4.5)) continue;
                if (Q.kind === 13 && Scene.night) continue;
                const t0 = Scene.t;
                for (const on of [1, 0]) {
                  Scene.t = glintAt(Q.k, on); Scene.critUp = {}; Scene.deerUp = {};
                  const lim = Scene.clipAt(Q.kind === 15 && C.at === 'air' ? Q.d - 4 : Q.d) + 1, d = drawn(Q);
                  // (a flyer is cut where it is as it circles: the line of the nearest it comes)
                  let n = 0, w = 0, low = -1;
                  for (let i = 0; i < d.length; i += 4) { if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue; n++;
                    if (d[i] === 255 && d[i + 1] === 255 && d[i + 2] === 255) w++;
                    const y = Math.floor(i / 4 / VW); if (y > low) low = y; }
                  if (on) { o.pix += n; o.white += w; } else o.whiteOff += w;
                  if (w > 2) f('a glint of ' + w + ' white pixels on a golden ' + goldKind(Q));
                  if (n && low > lim && !(C && C.at === 'air')) f(cs.id + ' hole ' + holeInRound(hh) + (night ? ' at night' : '') + ', camera at ' + Scene.camD.toFixed(1) + ': a golden ' + goldKind(Q) + ' at ' + Q.d.toFixed(1) + ' shows at row ' + low + ', under the line ' + Math.round(lim));
                }
                Scene.t = t0;
              }
            }
          }
        }
        window.step = keep; FROST_FORCE = null;
        if (o.pix < 400) f('the golden ones showed only ' + o.pix + ' pixels over ' + o.views + ' views');
        if (!o.white) f('no glint seen with it on');
        if (o.whiteOff) f(o.whiteOff + ' white pixels with the glint off');
        // the glint's share of the time
        { let on = 0; const N = 4000; for (let i = 0; i < N; i++) { const u = i * 0.013 * 0.5 + hr(7, 691); if (u - Math.floor(u) <= 0.1) on++; } o.glint = on / N;
          if (o.glint > 0.2) f('the glint on ' + Math.round(o.glint * 100) + '% of the time'); }
        // spotted live only, and paid (no find by the tee to pay as well)
        S.guide = {}; QUIET = false; OFFLINE = false;
        let hl = h0; while (hl < h0 + 400) { GOLD_FORCE = -1; lay(hl); GOLD_FORCE = null; if (Scene.props.some(p => p.gold && (p.kind === 15 || !Scene.night))) break; hl++; }
        const gk = goldKind(Scene.props.find(p => p.gold)); S.findHole = hl;
        const was = JSON.stringify(S.guide);
        OFFLINE = true; GOLD_AT = hl; lay(hl); OFFLINE = false;
        QUIET = true; lay(hl); QUIET = false;
        S.dgnRun = { id: B.DGN[0].id }; lay(hl); S.dgnRun = null;
        S.hole = hl; Scene.newHole(hl + 1, S.tier);
        if (JSON.stringify(S.guide) !== was) f('spotted away, quiet, in a wager or on another hole: ' + JSON.stringify(S.guide));
        const sov0 = S.sov || 0; S.guide = {}; lay(hl);
        if (S.guide[goldId(gk)] !== 1) f('a golden ' + gk + ' played live was not spotted');
        if ((S.sov || 0) - sov0 !== B.GUIDE_SOV * Object.keys(S.guide).length) f('the first sightings paid ' + ((S.sov || 0) - sov0) + ' for ' + Object.keys(S.guide).length);
        GOLD_AT = null;
        // the developer menu: this hole, the next with one
        QUIET = true; lay(hl); S.hole = hl; GOLD_AT = null; DEV.gold(1); if (!Scene.props.some(p => p.gold)) f('"this hole" laid no golden one');
        GOLD_AT = null; DEV.gold(); QUIET = false; o.devNext = GOLD_FORCE === hl + 1;
        let hn = hl + 1; for (; hn < hl + 400; hn++) { S.hole = hn; Scene.newHole(hn, S.tier); if (Scene.props.some(p => p.gold)) break; }
        if (!o.devNext || GOLD_FORCE !== null || GOLD_AT !== hn) f('"next hole with one" did not land once (' + GOLD_FORCE + ', ' + GOLD_AT + ', ' + hn + ')');
        S.hole = hn; Scene.newHole(hn, S.tier); if (!Scene.props.some(p => p.gold)) f('the developer\'s golden one went when the hole was laid again');
        QUIET = true; GOLD_AT = null;
        // the Guide
        for (const k of GOLD_KINDS) { const g = GUIDE.find(x => x.id === goldId(k));
          if (!g) { f('no Guide entry for a golden ' + k); continue; }
          if (g.g !== 'g') f('the golden ' + k + ' is not on the golden shelf');
          const u = guideUrl(g.id); if (!u.startsWith('data:image')) f('no picture for the golden ' + k);
          if (u === guideUrl(k === 'stag' ? 'stag' : k)) f('the golden ' + k + '\'s picture is the plain one'); }
        if (GUIDE.length !== new Set(GUIDE.map(g => g.id)).size) f('two Guide entries share an id');
      } finally {
        SEASON_FORCE = -1; HOUR_FORCE = null; FROST_FORCE = null; S.dgnRun = null; GOLD_FORCE = null; GOLD_AT = null; OFFLINE = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    // the shelf at phone widths
    const fit = [];
    for (const [w, h] of [[320, 640], [390, 844], [440, 956], [844, 390]]) {
      await page.setViewportSize({ width: w, height: h });
      const q = await page.evaluate(() => {
        const keep = JSON.stringify(S.guide || {}); S.guide = { g_fox: 3, g_stag: 1 }; QUIET = false; trophyRoom('guide');
        const body = document.getElementById('roomBody'), bw = body.getBoundingClientRect();
        const heads = [...body.querySelectorAll('.eyebrow')].map(e => e.textContent);
        const shelf = [...body.querySelectorAll('.guide')][heads.findIndex(t => /^Golden\b/.test(t)) - 1];
        const tiles = shelf ? [...shelf.querySelectorAll('.gtile')] : [];
        const bad = tiles.filter(t => { const b = t.getBoundingClientRect(); return b.left < bw.left - 0.5 || b.right > bw.right + 0.5 || t.scrollWidth > t.clientWidth + 1
          || [...t.querySelectorAll('b, i')].some(e => e.scrollWidth > e.clientWidth + 1); }).map(t => t.querySelector('b').textContent);
        const seen = tiles.filter(t => !t.classList.contains('un')).length;
        hideSheet(); S.guide = JSON.parse(keep);
        return { n: tiles.length, kinds: GOLD_KINDS.length, bad, seen, heads, wide: document.documentElement.scrollWidth > window.innerWidth + 1 };
      });
      if (q.n !== q.kinds) fit.push(w + 'x' + h + ': ' + q.n + ' tiles on the golden shelf (' + q.heads.join(', ') + ')');
      if (q.bad.length) fit.push(w + 'x' + h + ': out of its tile or the page: ' + q.bad.join(', '));
      if (q.seen !== 2) fit.push(w + 'x' + h + ': ' + q.seen + ' golden tiles shown as seen, not 2');
      if (q.wide) fit.push(w + 'x' + h + ': the page scrolls sideways');
    }
    if (fit.length) throw new Error(fit.join('\n'));
    const rates = Object.values(r.rate), lo = Math.min(...rates), hi = Math.max(...rates);
    return ['a golden one on one hole in ' + Math.round(lo) + ' to ' + Math.round(hi) + ' of those its kind is on, from the hash; ' + r.natural + ' from the hash over ' + r.holes + ' holes',
      'every hole laid the same with all forced and none; all ' + Object.keys(r.laid).length + ' kinds golden somewhere',
      r.views + ' views, ' + r.pix + ' pixels of them, none under the ground\'s line; the glint ' + r.white + ' white pixels, on ' + Math.round(r.glint * 100) + '% of the time',
      'spotted live only and paid; the developer rows work; twelve on their own shelf at 320, 390, 440 and on its side'];
  }
};
