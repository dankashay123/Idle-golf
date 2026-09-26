/* The signature hole of the week.
 *
 * One kind of signature hole a real week (Monday to Sunday, like the majors
 * of the week) pays its holes double. Where it is played it is marked: a
 * brass frame and a sparkle on the hole map, "x2" after its name in the
 * corner, and the tee says so. The Trophy Room's Today page names it.
 *
 *   - which kind: every block of five weeks holds all five, no kind comes two
 *     weeks running, and each major of the week meets each kind; it turns on
 *     the real Monday, and the developer menu can pin it
 *   - its holes are priced at twice the purse, on every course, and nothing
 *     else is; played out stroke for stroke on the same random numbers, the
 *     hole pays twice the money of the same hole in another week
 *   - the away model is the live model: what it takes a hole of this event
 *     to pay is what the holes are played at, the week's doubled ones and the
 *     first hole of every round included (that one was paid at the round
 *     before's weather)
 *   - nothing else priced off the purse moves: the event's cheque
 *   - the map's frame and sparkle, the corner's x2 and the tee's words come
 *     with the week's kind and with nothing else, and the sparkle never sits
 *     on the green, at any phone size, standing or on its side
 */
'use strict';
const SIZES = [[320, 568], [360, 740], [390, 844], [430, 932], [740, 360], [844, 390]];
const BRASS = '#E3B457', GOLD = '#FFD66B', PALE = '#FFF6D8';

module.exports = {
  name: 'sigweek',
  // an iPhone's: at 1x the corner's words take so much of a phone on its
  // side that the map gives way, and the mark would go unseen there
  dsf: 3,
  async run(page) {
    // ---- the rules, the prices and the money ---------------------------------
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {};
      const put = snap => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(snap)); };
      const force = (kind, h) => { ISLE_FORCE = kind === 'island' ? h : 0; CANYON_FORCE = kind === 'canyon' ? h : 0;
        STONES_FORCE = kind === 'stones' ? h : 0; PIER_FORCE = kind === 'pier' ? h : 0; RAIL_FORCE = kind === 'rail' ? h : 0; };
      const mr = Math.random;
      try {
        QUIET = true;
        // which kind, week by week
        const K = SIG_KINDS, n = K.length, W0 = weekNow() - 50;
        o.kinds = K.join();
        o.runs = []; o.blocks = []; o.unknown = [];
        for (let w = W0; w < W0 + 200; w++) {
          if (!K.includes(sigWeekOf(w))) o.unknown.push(w);
          if (sigWeekOf(w) === sigWeekOf(w + 1)) o.runs.push(w);
        }
        for (let m = Math.ceil(W0 / n); m < Math.ceil(W0 / n) + 40; m++) {
          const got = new Set(); for (let w = m * n; w < m * n + n; w++) got.add(sigWeekOf(w));
          if (got.size !== n) o.blocks.push(m);
        }
        const meet = {};
        for (let w = W0; w < W0 + 4 * n; w++) (meet[weekMajor(w).id] = meet[weekMajor(w).id] || new Set()).add(sigWeekOf(w));
        o.meet = Object.keys(meet).map(id => id + ' ' + meet[id].size); o.n = n;
        // it turns over on the Monday, with the major
        let mon = 20700; while ((mon + 3) % 7) mon++;
        DAY_FORCE = mon - 1; const sun = sigWeek();
        DAY_FORCE = mon; const monK = sigWeek(), wk = weekNow();
        DAY_FORCE = mon + 6; const sun2 = sigWeek();
        o.cal = { turns: sun !== monK, holds: monK === sun2, same: monK === sigWeekOf(wk) };
        DAY_FORCE = null;
        // and the developer menu pins it, and lets it go
        DEV.sigWeek('pier'); const pinned = sigWeek(); hideSheet();
        DEV.sigWeek(); const back = sigWeek(); hideSheet();
        o.dev = { pinned, back: back === sigWeekOf(weekNow()) };

        // ---- priced: every hole of every course, in each kind's week ----
        o.wrong = []; o.doubled = {}; K.forEach(k => { o.doubled[k] = 0; });
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            const sk = sigKind(h);
            for (const k of K) {
              SIGWEEK_FORCE = k;
              const x = holePurse(h, S.tier, 1) / purseFor(h, S.tier, 1), want = sk === k ? B.SIG_WEEK_MULT : 1;
              if (Math.abs(x - want) > 1e-9) o.wrong.push(B.COURSE[ci].id + ' hole ' + holeInRound(h) + ' (' + sk + ') in ' + k + ' week: x' + x);
              if (sk === k) o.doubled[k]++;
            }
          }
        }
        SIGWEEK_FORCE = null;

        // ---- and played at that price, live ----
        DEV.course(B.COURSE.findIndex(c => c.slot === 'event')); hideSheet();
        force(null, 0);
        let h2 = S.hole + 1; while (sigKind(h2)) h2++;
        S.hole = h2;
        const live = [];
        for (const [kind, wkK] of [['canyon', 'canyon'], ['canyon', 'island'], ['island', 'island'], [null, 'island']]) {
          force(kind, h2); SIGWEEK_FORCE = wkK; startHole();
          live.push({ kind, wk: wkK, x: +(S.purse / purseFor(h2, S.tier, derive().gold)).toFixed(6) });
        }
        o.live = live;

        // ---- played out: the same hole, the same random numbers, two weeks ----
        const seeded2 = s => { let x = s >>> 0; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
        force('canyon', h2);
        const SNAP2 = JSON.stringify(S);
        const playOut = wkK => {
          put(SNAP2); SIGWEEK_FORCE = wkK; Math.random = seeded2(12345);
          try {
            startHole();
            const D = derive(), h0 = S.hole, g0 = S.gold, purse = S.purse;
            let i = 0;
            for (; i < 30 * 600 && S.hole === h0; i++) step(1 / 30, D);
            return { gold: S.gold - g0, purse, done: S.hole !== h0, secs: i / 30,
                     card: JSON.stringify(S.scores[holeInRound(h0) - 1]) };
          } finally { Math.random = mr; }
        };
        const inWk = playOut('canyon'), outWk = playOut('island');
        o.play = { inWk, outWk, ratio: inWk.gold / outWk.gold };

        // ---- the away model: the price of a hole is the price it is played at ----
        put(SNAP2); force(null, 0);
        // a home course without the sea stack, so one of the weeks below has
        // none of its holes in the event
        const cs = B.COURSE.find(c => c.slot === 'home' && c.id !== 'harbour');
        DEV.course(B.COURSE.indexOf(cs)); hideSheet();
        const kindsHere = {};
        const first = awayFirstHole(S.hole);
        for (let h = first; h < first + B.ROUND * B.DAYS; h++) { const k = sigKind(h); if (k) kindsHere[k] = (kindsHere[k] || 0) + 1; }
        const parked = S.hole;
        const away = [];
        for (const wkK of ['canyon', 'island', 'pier']) {
          SIGWEEK_FORCE = wkK;
          let sum = 0, plain = 0;
          for (let h = first; h < first + B.ROUND * B.DAYS; h++) {
            S.hole = h; startHole(); sum += S.purse;
            plain += purseFor(h, S.tier, derive().gold);
          }
          S.hole = parked; startHole();
          const liveMean = sum / (B.ROUND * B.DAYS), A = roundRate();
          away.push({ wk: wkK, here: kindsHere[wkK] || 0, live: liveMean, away: A.purse,
                      diff: Math.abs(A.purse / liveMean - 1), lift: sum / plain });
        }
        o.away = away;

        // ---- the event's cheque is not the hole's purse ----
        put(SNAP2); force(null, 0);
        DEV.course(B.COURSE.findIndex(c => c.slot === 'event')); hideSheet();
        const last = awayFirstHole(S.hole) + B.ROUND * B.DAYS - 1;
        force(sigKind(last) || 'stones', last);
        const lastK = sigKind(last);
        S.hole = last; startHole();
        const SNAP3 = JSON.stringify(S);
        const cheque = wkK => { put(SNAP3); SIGWEEK_FORCE = wkK; S.hole = last + 1;
          const g0 = S.gold; endTournament(); try { hideSheet(); } catch (e) {} return S.gold - g0; };
        const other = K.find(k => k !== lastK);
        o.cheque = { kind: lastK, inWk: cheque(lastK), outWk: cheque(other) };
      } finally {
        Math.random = mr;
        SIGWEEK_FORCE = null; DAY_FORCE = null; force(null, 0);
        QUIET = false; OFFLINE = false;
        put(SNAP); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });

    const f = m => { throw new Error(m); };
    if (r.kinds !== 'island,canyon,stones,pier,rail') f('the kinds of signature hole are ' + r.kinds);
    if (r.unknown.length) f('weeks with no kind: ' + r.unknown.slice(0, 5).join(', '));
    if (r.runs.length) f('the same kind two weeks running at week ' + r.runs.slice(0, 5).join(', '));
    if (r.blocks.length) f('a block of five weeks without all five kinds: ' + r.blocks.slice(0, 5).join(', '));
    if (r.meet.length !== 4 || !r.meet.every(x => x.endsWith(' ' + r.n)))
      f('in twenty weeks each major of the week should meet all five kinds: ' + r.meet.join(', '));
    if (!r.cal.turns || !r.cal.holds || !r.cal.same)
      f('the kind does not turn over with the real week, Monday to Sunday: ' + JSON.stringify(r.cal));
    if (r.dev.pinned !== 'pier' || !r.dev.back) f('the developer menu does not pin the week\'s kind and let it go: ' + JSON.stringify(r.dev));
    if (r.wrong.length) f(r.wrong.length + ' holes priced wrong, e.g. ' + r.wrong.slice(0, 4).join('; '));
    for (const k of Object.keys(r.doubled))
      if (!(r.doubled[k] > 0)) f('no hole on any course is ' + k + ', so its week would pay nothing extra');
    const wantLive = { 'canyon/canyon': 2, 'canyon/island': 1, 'island/island': 2, 'null/island': 1 };
    for (const x of r.live)
      if (Math.abs(x.x - wantLive[x.kind + '/' + x.wk]) > 1e-6)
        f('a ' + (x.kind || 'plain') + ' hole in ' + x.wk + ' week tees off at x' + x.x + ' the purse, not x' + wantLive[x.kind + '/' + x.wk]);
    const P = r.play;
    if (!P.inWk.done || !P.outWk.done) f('the hole was not played out (' + P.inWk.secs + 's / ' + P.outWk.secs + 's)');
    if (P.inWk.card !== P.outWk.card) f('the same hole on the same numbers carded differently: ' + P.inWk.card + ' / ' + P.outWk.card);
    if (Math.abs(P.ratio - 2) > 1e-6) f('in its week the hole paid x' + P.ratio.toFixed(4) + ' the money, not x2 ('
      + P.inWk.gold + ' against ' + P.outWk.gold + ')');
    for (const a of r.away) {
      if (a.diff > 1e-9) f('in ' + a.wk + ' week the away model prices a hole at ' + a.away + ' and the holes are played at '
        + a.live + ' on average (x' + (a.away / a.live).toFixed(4) + ')');
      const want = a.here ? a.lift > 1.001 : Math.abs(a.lift - 1) < 1e-9;
      if (!want) f('in ' + a.wk + ' week, with ' + a.here + ' of those holes in the event, it paid x' + a.lift.toFixed(4) + ' over the plain purse');
    }
    if (!r.away.some(a => a.here) || !r.away.some(a => !a.here)) f('the away model was not tried both with and without the week\'s holes in the event');
    if (!(r.cheque.inWk > 0) || Math.abs(r.cheque.inWk / r.cheque.outWk - 1) > 1e-9)
      f('the event\'s cheque moved with the week, closing on a ' + r.cheque.kind + ': '
        + r.cheque.inWk + ' in its week against ' + r.cheque.outWk);

    // ---- on screen: the map, the corner and the tee, at every size -----------
    const screen = [];
    for (const [w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(250);
      screen.push(await page.evaluate(([w, h, BRASS, GOLD, PALE]) => {
        const SNAP = JSON.stringify(S), out = { size: w + 'x' + h, holes: [] };
        const force = (kind, hl) => { ISLE_FORCE = kind === 'island' ? hl : 0; CANYON_FORCE = kind === 'canyon' ? hl : 0;
          STONES_FORCE = kind === 'stones' ? hl : 0; PIER_FORCE = kind === 'pier' ? hl : 0; RAIL_FORCE = kind === 'rail' ? hl : 0; };
        const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        const og = window.drawTextS;
        try {
          try { hideSheet(); } catch (e) {}
          DEV.course(B.COURSE.findIndex(c => c.slot === 'event')); hideSheet();
          force(null, 0);
          let hl = S.hole + 1; while (sigKind(hl)) hl++;
          // the week's own kind, each in turn; then a signature hole that is
          // not the week's, and a plain hole
          const cases = SIG_KINDS.map(k => [k, k]);
          if (w === 390) cases.push(['stones', 'canyon'], [null, 'canyon']);
          for (const [kind, wkK] of cases) {
            SIGWEEK_FORCE = wkK; force(kind, hl); S.hole = hl;
            document.getElementById('toasts').innerHTML = '';
            QUIET = false; startHole();
            const toast = [...document.getElementById('toasts').children].map(t => t.textContent).join(' | ');
            const words = [];
            window.drawTextS = function (c, str) { words.push(String(str)); return og.apply(this, arguments); };
            const D = derive();
            Scene.draw(0.2, D); words.length = 0; Scene.draw(0.2, D);
            // (the words on the map are on the page, over the field)
            words.push(...[...document.getElementById('rWx').querySelectorAll('span')].map(e => e.textContent.toUpperCase()));
            window.drawTextS = og;
            const cv = document.getElementById('holeMap'), mw = cv.width, mh = cv.height;
            const shown = Scene.mapOn && cv.style.display !== 'none';
            const row = { kind, wk: wkK, toast, sig: words.find(s => kind && s.indexOf(SIG_NAME[kind].toUpperCase()) === 0) || null,
                          map: shown };
            if (shown) {
              const d = cv.getContext('2d').getImageData(0, 0, mw, mh).data;
              const st = Scene.mapStatic.getContext('2d').getImageData(0, 0, mw, mh).data;
              // the green and its apron as the map paints them
              const T = Scene.theme, greens = [T.gr[4], T.apron].map(c => c.toUpperCase());
              let edge = 0, brass = 0, spark = 0, onGreen = 0;
              for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
                const i = (y * mw + x) * 4, c = hex(d, i), under = hex(st, i);
                if (x === 0 || y === 0 || x === mw - 1 || y === mh - 1) { edge++; if (c === BRASS) brass++; continue; }
                if (c === under) continue;
                // the sparkle in its corner (its gold is the golfer's too, so
                // only there)
                if (x <= 8 && y <= 8 && (c === GOLD || c === PALE || c === '#12160F')) spark++;
                // and anything of it anywhere on the green: its pale centre and
                // its dark edge are its own colours
                if ((c === PALE || c === '#12160F') && greens.includes(under)) onGreen++;
              }
              Object.assign(row, { brass: brass / edge, spark, onGreen, centre: hex(d, (4 * mw + 4) * 4), mw, mh });
            }
            out.holes.push(row);
          }
        } finally {
          window.drawTextS = og;
          SIGWEEK_FORCE = null; force(null, 0); QUIET = false;
          Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
          try { hideSheet(); } catch (e) {}
        }
        return out;
      }, [w, h, BRASS, GOLD, PALE]));
    }
    await page.setViewportSize({ width: 400, height: 860 });
    await page.waitForTimeout(150);

    let maps = 0;
    for (const s of screen) if (!s.holes.some(x => x.map)) f('at ' + s.size + ' the map never showed, so its mark was not looked at');
    for (const s of screen) for (const x of s.holes) {
      const at = s.size + ', a ' + (x.kind || 'plain') + ' hole in ' + x.wk + ' week';
      const mine = !!x.kind && x.kind === x.wk;
      if (mine) {
        if (x.sig !== SIG_NAME_UP(x.kind) + ' ×2') f(at + ': the corner reads ' + JSON.stringify(x.sig) + ', not ' + SIG_NAME_UP(x.kind) + ' ×2');
        if (!/Hole of the Week/.test(x.toast) || !/pays\s2×/i.test(x.toast)) f(at + ': the tee said ' + JSON.stringify(x.toast));
      } else {
        if (x.kind && x.sig !== SIG_NAME_UP(x.kind)) f(at + ': the corner reads ' + JSON.stringify(x.sig));
        if (/Week|2×/.test(x.toast)) f(at + ': the tee said ' + JSON.stringify(x.toast));
        if (x.kind && !/Signature Hole/.test(x.toast)) f(at + ': the tee did not say it is a signature hole: ' + JSON.stringify(x.toast));
      }
      if (!x.map) continue;
      maps++;
      if (mine) {
        if (x.brass !== 1) f(at + ': ' + Math.round(x.brass * 100) + '% of the map\'s frame is brass, not all of it');
        if (!(x.spark >= 9) || x.centre !== PALE) f(at + ': no sparkle in the map\'s corner (' + x.spark + ' pixels, centre ' + x.centre + ')');
        if (x.onGreen) f(at + ': the sparkle covers ' + x.onGreen + ' pixels of the green on a ' + x.mw + 'x' + x.mh + ' map');
      } else if (x.brass > 0 || x.spark > 0) f(at + ': the map is marked (' + Math.round(x.brass * 100) + '% brass frame, ' + x.spark + ' sparkle pixels)');
    }

    // ---- the Trophy Room names it ----------------------------------------------
    const today = await page.evaluate(() => {
      const SNAP = JSON.stringify(S);
      try {
        const out = [];
        for (const k of SIG_KINDS) {
          SIGWEEK_FORCE = k; trophyRoom('today');
          const rows = [...document.querySelectorAll('#roomBody .row')].map(x => ({
            nm: (x.querySelector('.nm') || {}).textContent, ds: (x.querySelector('.ds') || {}).textContent }));
          const row = rows.find(x => /Signature Hole of the Week/.test(x.ds || ''));
          out.push({ k, nm: row && row.nm, ds: row && row.ds, n: rows.filter(x => /Signature Hole of the Week/.test(x.ds || '')).length });
          hideSheet();
        }
        return out;
      } finally {
        SIGWEEK_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
    });
    for (const x of today) {
      if (x.n !== 1 || x.nm !== SIG_NAME_T[x.k] || !/pays\s2×/i.test(x.ds))
        f('Today in ' + x.k + ' week shows ' + JSON.stringify(x) + ', not one row for ' + SIG_NAME_T[x.k] + ' that pays 2×');
    }

    const d = r.doubled;
    return ['all five kinds every five weeks, never twice running, each major meeting each; turns on the Monday; the dev menu pins it',
      'priced x2 on its own holes of every course and nowhere else (' + Object.keys(d).map(k => d[k] + ' ' + k).join(', ')
        + ' hole-weeks), and played out the same card pays x' + P.ratio.toFixed(2) + ' the money',
      'the away model prices holes as they are played, the week\'s and every round\'s first; the event\'s cheque does not move',
      'marked where it is played: brass frame and sparkle on the map (never on the green), x2 in the corner, the tee says so; '
        + maps + ' maps over ' + SIZES.length + ' sizes; Today names it'];
  }
};
const SIG_NAME_T = { island: 'Island Green', canyon: 'Canyon Carry', stones: 'Stepping Stones', pier: 'Sea Stack', rail: 'Railway Crossing' };
const SIG_NAME_UP = k => SIG_NAME_T[k].toUpperCase();
