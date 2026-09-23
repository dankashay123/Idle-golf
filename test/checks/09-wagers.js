/* The wager reward model, and the away model that shares the course with it.
 *
 * Three things went wrong here and all three had the same shape: a reward
 * priced off the RAW floor number. The floor number climbs about two rungs per
 * Tour Card for a carry that is merely keeping pace, so anything priced off it
 * drifts against the ladder it is supposed to sit beside -- and two of the four
 * modes were anchored to their own last recorded floor, which is not a drift
 * but a loop.
 *
 *   1. The Island Green and the Floodlit Green scored themselves from
 *      dgnStartFloor, the LAST floor they recorded minus three. Both of their
 *      gates are capped (94% make, 88% drop), so past the caps each run
 *      recorded a deeper floor than the one before on nothing at all. Measured
 *      on Tour Card I with a full bag: nine floors a run, forever.
 *   2. Every Depths run paid floor/8 sponsor tickets. A Sponsor Exemption costs
 *      six and refills every entry in the book, which is twelve more runs, so past
 *      about card twenty five the wagers bought their own entries.
 *   3. (Written when holes were stretched to the golfer by a handicap; they
 *      are fixed to their card now, and the rule below still holds.)
 *      offline() sized an away hole off the CARDED yardage while the live game
 *      sizes it off the handicapped yardage, so an away session ignored the
 *      floor that pins a live hole at HCP of par time however hard you hit it.
 *      It then read both the pace AND the purse off the single hole you parked
 *      on, and every one of those figures carries the par, the closing hole and
 *      the Sunday multipliers with the weather on top: park on a closing Sunday
 *      hole in a Mythic Pin and twelve hours were paid as that hole. Both are
 *      now walked over seventy two holes -- one full cycle of positions, days
 *      and weathers -- so the away hole is compared here against the same
 *      average rather than against whichever hole the check happened to pick.
 *
 * And that a wager's furniture lives in the prop list. The gallery ropes and
 * the floodlights were first drawn in an overlay after the props, at distances
 * measured from the camera, which is two bugs at once: anchored to the camera
 * they slide along with you instead of being passed, and drawn after the props
 * they cut through the spectators standing in front of them. Anything standing
 * on the ground down here belongs in the one depth-sorted list.
 *
 * And that a rope span outlives the post it hangs from. Each span is drawn by
 * the post at its near end, so once that post went behind the camera the span
 * went with it and the gallery stopped dead at the golfer's feet while the
 * rope was still crossing the bottom of the frame.
 *
 * And that the four are four. They shared one readout template and one "best
 * floor N" line, so a drive contest and an endurance crawl differed by the
 * words in them and nothing else. Each now reports in its own units and fills
 * the readout strip with its own shape.
 *
 * Which left the opposite problem: four contests reported in four units --
 * yards, per cent of greens, per cent of chips, carry a second -- cannot be
 * compared, and the entries are the scarce thing. Each now also says what one
 * entry is worth in what that currency BUYS, off the shopPrice scale yieldAt
 * is already built on. A projection is only worth showing if the game keeps
 * it, so the check below plays each contest out and compares.
 *
 * The first version of that projection was 5 to 6 times over on the Island
 * Green, because it priced the pot at the bank target as though you always got
 * there. You do not: the make chance decays 3.5 points a green and a miss
 * costs three quarters of the pot. Only playing it out caught that.
 *
 * These assert on shape, not on tuning: floors settle, currencies come in
 * linearly, the away hole matches the live hole. Retuning the payout numbers
 * should not move any of them.
 */
'use strict';

// Sixty rather than twenty four. The ticket rate below is counted over the
// back half of these, and tickets only land on a new personal best, so at
// twelve runs the figure came back anywhere from 0.00 to 0.33 against a
// threshold of 0.50 -- close enough to the line to be luck, and a printed
// number nobody can read a direction off.
const RUNS = 60;

module.exports = {
  name: 'wagers',
  async run(page) {
    const r = await page.evaluate(RUNS => {
      const out = {};

      // Drive one run of a mode to its end without the animation frame loop.
      const runDgn = id => {
        const d = B.DGN.find(x => x.id === id);
        S.dgnRun = null; S.dgnKeys[id] = 1;
        startDgn(d);
        let guard = 0;
        while (S.dgnRun && guard++ < 6000) tickDgn(0.1, derive());
        try { hideSheet(); } catch (e) {}
        return guard < 6000;
      };

      // ---- 1. the same bag, run and run again -------------------------------
      // Crit and affinity chance pinned at their caps, so nothing the run does
      // can make the next one go better. The floors must settle and the
      // currencies must come in at a flat rate.
      DEV.maxCapped(); DEV.set(4); DEV.enhAll(); DEV.ach(); DEV.lv(60); DEV.para(400);
      try { hideSheet(); } catch (e) {}
      S.dgnFloor = {}; B.DGN.forEach(d => S.dgnFloor[d.id] = 0);
      S.scroll = 0; S.shard = 0; S.tickets = 0;

      const floors = [], scroll = [], tickets = [];
      for (let i = 0; i < RUNS; i++) {
        if (!runDgn('cellar')) out.stuck = 'cellar';
        if (!runDgn('water')) out.stuck = 'water';
        floors.push(S.dgnFloor.cellar || 0);
        scroll.push(S.scroll);
        tickets.push(S.tickets);
      }
      const half = RUNS >> 1;
      out.floorFirst = floors[half - 1];
      out.floorLast = floors[RUNS - 1];
      // What the bag alone is worth, and the most a single run can add on top
      // of it. A best-ever is the running maximum of a random draw, so it
      // creeps; it can never pass this. A run scored off its own last run can,
      // on its second lap.
      out.carry = carryFloor(derive());
      out.ceiling = out.carry + B.CHIP_SHOTS * B.CHIP_STEP;
      // a straight line doubles over the second half; an exponent does not
      out.scrollFirstHalf = scroll[half - 1];
      out.scrollSecondHalf = scroll[RUNS - 1] - scroll[half - 1];
      out.ticketsFirstHalf = tickets[half - 1];
      out.ticketsSecondHalf = tickets[RUNS - 1] - tickets[half - 1];
      // A ticket only lands on a new personal best, so this figure is a count
      // of rare events and not a rate: usually none over the back half, now and
      // then a short streak. Printing it as "0.22 a run" reads like a
      // measurement of something steady. The count is what it actually is.
      out.bestsSecondHalf = out.ticketsSecondHalf;
      out.exemptCost = B.PERKS.find(p => p.id === 'exempt').cost;
      out.keysPerExemption = B.DGN.reduce((n, d) => n + d.cap, 0);

      // ---- 2. the same run, two hundred cards apart -------------------------
      // A bag exactly on the pace line its card asks for. What one run is worth
      // has to be the same amount of progress at either end of the ladder.
      const onPaceYield = T => {
        S.tier = T; S.tierMax = Math.max(S.tierMax, T); S.hole = 2; S.retires = 0;
        S.relic = {};
        // Built by hand rather than rolled. makeItem picks the rarity and the
        // affixes at random, and one of those affixes is wager haul: whether it
        // turned up decided the answer, so this number came back anywhere from
        // 1.0x to 3.7x on identical code. The ladder is tuned to pace just
        // below, so plain clubs cost nothing and leave the CARD as the only
        // thing that differs between the two ends.
        B.SLOTS.forEach((sl, i) => S.equip[sl.id] = {
          uid: 90000 + i, slot: sl.id, rar: 0, ilvl: T, enh: 0, aff: [],
          el: sl.id === 'ball' ? 'ember' : null, name: 'probe'
        });
        startHole();
        const ch = { y:1, g:1, s:1, c:0, p:0, dl:0 };
        // the power that clears this card's hole in par time; holes are fixed
        // to their card now, so k is simply how far ahead of the card you are
        const pace = yardageFor(S.hole, S.tier, ch) / parTimeFor(S.hole);
        const setL = L => B.UPG.forEach(u => S.upg[u.id] = Math.min(capOf(u), Math.round(L)));
        let lo = 0, hi = 20000;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1; setL(mid);
          if (derive().dps < pace) lo = mid; else hi = mid;
        }
        setL(lo); startHole();
        const D = derive(), d = B.DGN.find(x => x.id === 'sand');
        // priced in the thing the currency buys, which is what has to stay put
        return yieldAt(carryFloor(D), D, d) / shopPrice('grit');
      };
      out.yieldEarly = onPaceYield(5);
      out.yieldLate = onPaceYield(200);

      // ---- 3. away holes against live holes ---------------------------------
      const away = [];
      for (const k of [1, 10, 1000]) {
        S.tier = 25; S.hole = 2; S.relic = {}; S.equip = {};
        B.UPG.forEach(u => S.upg[u.id] = 0);
        startHole();
        const ch = { y:1, g:1, s:1, c:0, p:0, dl:0 };
        const pace = yardageFor(S.hole, S.tier, ch) / parTimeFor(S.hole);
        let lo = 0, hi = 40000;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1; S.upg.drive = mid;
          if (derive().dps < pace * k) lo = mid; else hi = mid;
        }
        S.upg.drive = lo; startHole();
        // The live hole, averaged over the same seventy two the away model
        // averages over. One hole carries its own par, close and Sunday
        // multipliers and is not the rate either model runs at.
        const cycle = B.ROUND * B.DAYS;
        const parked = S.hole, first = awayFirstHole(parked);
        let live = 0;
        for (let i = 0; i < cycle; i++) {
          S.hole = first + i; startHole();
          live += Math.max(S.walkMin, S.yardsMax / derive().dps);
        }
        live /= cycle;
        S.hole = parked; startHole();
        const h0 = S.totalHoles;
        QUIET = true; S.t = Date.now() / 1000 - 3600; offline(); QUIET = false;
        try { hideSheet(); } catch (e) {}
        const holes = S.totalHoles - h0;
        away.push({ k, live: +live.toFixed(2),
                    awaySecs: +(3600 * B.OFFLINE_RATE / holes).toFixed(2) });
      }
      out.away = away;

      // ---- 3b. and it is the same hole whichever one you parked on ---------
      // The purse, the pace and the drop rate all carried the par, the closing
      // hole, the Sunday and the weather of whatever hole was under you when
      // you closed the tab. Every hole of an event has to give the same rate or
      // there is a hole worth walking to before going away.
      S.tier = 25; S.hole = 2; S.relic = {}; S.equip = {};
      B.UPG.forEach(u => S.upg[u.id] = 20);
      startHole();
      const park = [];
      const first2 = awayFirstHole(S.hole);
      for (let i = 0; i < B.ROUND * B.DAYS; i++) {
        S.hole = first2 + i; startHole();
        const a = roundRate();
        park.push({ h: S.hole, close: isClosing(S.hole), sun: isSunday(S.hole),
                    par: parOf(S.hole), weather: S.chaos.g,
                    rate: a.purse / a.secs, secs: a.secs, drop: a.drop });
      }
      out.park = park;
      // what the single parked hole USED to set the rate to, for the report
      const hi = park.reduce((m, x) => Math.max(m, purseFor(x.h, S.tier, 1)), 0);
      const lo2 = park.reduce((m, x) => Math.min(m, purseFor(x.h, S.tier, 1)), Infinity);
      out.parkSpread = hi / lo2;

      // and it puts the golfer back. It walks him over seventy two holes to
      // measure them, so a leak here would leave him standing on a hole of an
      // event he is not playing, in weather that is not overhead.
      S.hole = 40; startHole();
      const here = () => JSON.stringify([S.hole, S.chaos, S.courseEl, S.stretched,
                                         S.carded, S.yardsMax]);
      const parkedAt = here();
      roundRate();
      out.awayHeld = here() === parkedAt;
      let threw = false;
      const ogSets = window.activeSets;
      try { window.activeSets = () => { throw new Error("boom"); }; roundRate(); }
      catch (e) { threw = true; } finally { window.activeSets = ogSets; }
      out.awayThrew = threw;
      out.awayHeldThrow = here() === parkedAt;

      S.hole = 2; startHole();

      // ---- 3c. what one entry is worth, against what one entry pays --------
      const payRows = [];
      {
        S.tier = 20; S.hole = 2; S.relic = {}; S.equip = {};
        B.UPG.forEach(u => S.upg[u.id] = 0);
        B.SLOTS.forEach(sl => { S.equip[sl.id] = makeItem(14, 0, 2, sl.id); });
        S.autoEquip = 0; startNine(); startHole();
        // Tempo first, so the carry search below still lands the bag where it
        // should: at the tempo a fresh bag has the Twilight Putt fits about a
        // dozen putts in whatever it thinks, and a projection that ignored
        // tempo altogether passed. Three swings a second is twenty odd putts.
        {
          const su = B.UPG.find(u => u.k === 'spd');
          let lo = 0, hi = Math.min(capOf(su), 4000);
          while (hi - lo > 1) { const m = (lo + hi) >> 1; S.upg[su.id] = m;
            if (derive().spd < 3) lo = m; else hi = m; }
          S.upg[su.id] = hi; startHole();
        }
        // A bag four times what its card asks, because the Vault's payout is
        // flat until you get past what the card expects -- floor 44 at this
        // tier. A weaker bag sits on that floor and the projection cannot be
        // wrong there, which is a check that passes without checking.
        {
          const ch0 = { y:1, g:1, s:1, c:0, p:0, dl:0 };
          // the strength that cards a birdie on this card (0.52 of par time,
          // where the old handicap floor pinned a golfer ahead of the card)
          const pace = yardageFor(S.hole, S.tier, ch0) / (parTimeFor(S.hole) * 0.52);
          let lo = 0, hi = 60000;
          while (hi - lo > 1) { const m = (lo + hi) >> 1; S.upg.drive = m;
            if (derive().dps < pace * 4) lo = m; else hi = m; }
          S.upg.drive = lo; startHole();
        }
        // And provisionals, or the Scramble's whole mechanic -- one ball a hole
        // for every whole point, and a chance at another -- is never used: at
        // zero it plays one ball, and a projection that ignored provisionals
        // entirely passed. 1.6 exercises both the whole ball and the fraction.
        {
          const mu = B.UPG.find(u => u.k === 'mst');
          let lo = 0, hi = capOf(mu);
          while (hi - lo > 1) { const m = (lo + hi) >> 1; S.upg[mu.id] = m;
            if (derive().mst < 1.6) lo = m; else hi = m; }
          S.upg[mu.id] = hi; startHole();
        }
        FEAT_FORCE = '__none__';                 // no stake of the day in the comparison
        const SNAP = JSON.stringify(S);
        for (const d of B.DGN) {
          const proj = dgnPayout(d, derive());
          // The Island Green needs far more runs than the others: about one in
          // ten banks, and that one carries the whole average. The rest settle
          // in a hundred.
          let tot = 0; const N = d.mode === 'island' ? 700 : 120;
          for (let i = 0; i < N; i++) {
            Object.keys(S).forEach(x => delete S[x]); Object.assign(S, JSON.parse(SNAP));
            S.dgnRun = null; S.dgnKeys[d.id] = 1;
            const before = d.cur === 'gold' ? S.gold : S[d.cur];
            startDgn(d);
            const D = derive();
            for (let j = 0; j < 8000 && S.dgnRun; j++) tickDgn(0.1, D);
            try { hideSheet(); } catch (e) {}
            const got = (d.cur === 'gold' ? S.gold : S[d.cur]) - before;
            tot += d.cur === 'gold'
              ? got / Math.max(1e-9, purseFor(S.hole, S.tier, D.gold))
              : got / Math.max(1e-9, shopPrice(d.cur));
          }
          payRows.push({ id: d.id, cur: d.cur, proj: proj.buys, actual: tot / N, n: N,
                         note: proj.note, floors: proj.floors || 0,
                         pastPace: proj.floors ? pastPace(dgnStartFloor(d.id) + proj.floors - 1) : 0 });
        }
        FEAT_FORCE = null;
        Object.keys(S).forEach(x => delete S[x]); Object.assign(S, JSON.parse(SNAP));
        startHole();
      }
      out.pay = payRows;
      out.buysNames = Object.keys(DGN_BUYS);
      renderDgn();
      out.nDgn = B.DGN.length;
      out.shown = Array.from(document.querySelectorAll('#dgnRows .dgn'))
        .map(e => /an entry/.test(e.textContent));

      // ---- 4. four contests, or one contest four times ----------------------
      S.tier = 20; S.hole = 2; startHole();
      renderDgn();
      out.rows = Array.from(document.querySelectorAll('#dgnRows .dgn'))
        .map(el => {
          const line = Array.from(el.querySelectorAll('.dm'))
            .map(x => x.textContent).join(' | ');
          return line;
        });
      out.strips = [];
      for (const d of B.DGN) {
        S.dgnRun = null; S.dgnKeys[d.id] = 1;
        startDgn(d);
        for (let i = 0; i < 40 && S.dgnRun; i++) tickDgn(0.1, derive());
        try { hideSheet(); } catch (e) {}
        renderReadout(derive());
        const st = document.getElementById('rStrip');
        out.strips.push({ id: d.id, hidden: !!st.hidden, cells: st.children.length });
        S.dgnRun = null;
      }
      renderReadout(derive());
      out.stripOffCourse = !!document.getElementById('rStrip').hidden;

      // ---- 5. furniture stands on the ground, in the one sorted list --------
      out.props = [];
      for (const d of B.DGN) {
        S.dgnRun = null; S.dgnKeys[d.id] = 1;
        startDgn(d);
        tickDgn(0.1, derive());
        Scene.newDepthsHole(S.dgnRun);
        const kinds = {};
        for (const p of Scene.props) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
        let sorted = true;
        for (let i = 1; i < Scene.props.length; i++)
          if (Scene.props[i].d > Scene.props[i - 1].d + 1e-9) sorted = false;
        // a post's place in the world cannot depend on where the camera is
        const posts = Scene.props.filter(p => p.kind === 2).map(p => p.d);
        Scene.camD = LEN * 0.6;
        const after = Scene.props.filter(p => p.kind === 2).map(p => p.d);
        Scene.camD = 0;
        out.props.push({ id: d.id, kinds, sorted,
                         fixed: posts.length === after.length
                                && posts.every((v, i) => v === after[i]) });
        S.dgnRun = null;
      }
      // ---- 6. the rope reaches the bottom of the frame ---------------------
      // Walk the camera a third of the way down a Vault floor, so the nearest
      // posts are behind it, and count rope on the lower half of the stage.
      S.dgnRun = null; S.dgnKeys.vault = 1;
      startDgn(B.DGN.find(x => x.id === 'vault'));
      tickDgn(0.1, derive());
      Scene.newDepthsHole(S.dgnRun);
      Scene.camD = LEN * 0.34;
      // the ground first: props are cut against the crests the ground march
      // records, and without it they were cut against whatever the live
      // frame had last drawn -- another hole, from another spot
      Scene.camH = Scene.hAt(Scene.camD);
      Scene.drawGround();
      Scene.b.clearRect(0, 0, VW, VH);
      Scene.drawProps();
      {
        const px = Scene.b.getImageData(0, 0, VW, VH).data;
        let low = 0, high = 0;
        for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++) {
          const i = (y*VW + x)*4;
          // the rope colour, day palette
          if (px[i] === 0xB9 && px[i+1] === 0xB2 && px[i+2] === 0xA0)
            (y > VH*0.5 ? low++ : high++, 0);
        }
        out.rope = { low, high, camD: Scene.camD };
      }
      S.dgnRun = null;
      return out;
    }, RUNS);

    if (r.stuck) throw new Error('a ' + r.stuck + ' run never ended');

    // 1. the floor is bounded by the bag plus one perfect run, whatever the
    // dice do. A best-ever creeps toward that ceiling; a loop walks past it.
    if (r.floorLast > r.ceiling + 1)
      throw new Error('after ' + RUNS + ' runs the Floodlit Green floor is ' + r.floorLast
        + ', past the ' + r.ceiling.toFixed(1) + ' this bag can reach with every one of '
        + 25 + ' chips dropping (carry floor ' + r.carry.toFixed(1)
        + '). It is scoring itself off its own last run.');

    // 1b. and so does what it pays: linear, not exponential
    const ratio = r.scrollSecondHalf / Math.max(1, r.scrollFirstHalf);
    if (!(ratio > 0.5 && ratio < 2.5))
      throw new Error('the same bag earned ' + r.scrollFirstHalf + ' scrolls over its first '
        + (RUNS >> 1) + ' runs and ' + r.scrollSecondHalf + ' over the next '
        + (RUNS >> 1) + ', a factor of ' + ratio.toFixed(1) + '. A flat bag pays a flat rate.');

    // 2. tickets cannot buy the keys that earned them
    const perRun = r.ticketsSecondHalf / (RUNS >> 1) / 2;   // two dungeons a lap
    const sustains = r.exemptCost / r.keysPerExemption;     // tickets a run to break even
    if (perRun >= sustains)
      throw new Error('the Depths pay ' + perRun.toFixed(2) + ' tickets a run at a depth '
        + 'already reached, and a Sponsor Exemption is ' + r.exemptCost + ' tickets for '
        + r.keysPerExemption + ' runs, so ' + sustains.toFixed(2)
        + ' a run sustains itself. The keys are unlimited.');

    // 3. two hundred cards apart, a run buys the same progress
    const drift = r.yieldLate / r.yieldEarly;
    // It reads 2.1x, the same 2.1x on every run now that the probe bag is built
    // rather than rolled. It used to come back anywhere from 1.0 to 3.7 on
    // identical code, which is why the bound was 0.1 to 10: a number that moves
    // by four can only be fenced by a factor of a hundred, and a fence that
    // wide catches nothing. The slack left here absorbs the integer step of the
    // upgrade ladder the bag is pinned with, coarse at card 5 and fine at 200.
    if (!(drift > 0.5 && drift < 4))
      throw new Error('an on-pace run pays ' + r.yieldEarly.toPrecision(3)
        + ' of a purchase at card 5 and ' + r.yieldLate.toPrecision(3)
        + ' at card 200, a factor of ' + drift.toPrecision(3)
        + '. Depths rewards are drifting against the ladder.');

    // 4. the away hole is the live hole
    for (const a of r.away) {
      const f = a.awaySecs / a.live;
      if (!(f > 0.8 && f < 1.25))
        throw new Error('at ' + a.k + 'x the power its card asks for, the average live hole '
          + 'takes ' + a.live + 's and an away hole ' + a.awaySecs + 's. The away model is '
          + 'reading its pace off a single hole instead of a round, or off a different '
          + 'hole length than the live game plays.');
    }

    // 4b. and no hole is worth parking on
    const rates = r.park.map(x => x.rate);
    const spread = Math.max.apply(null, rates) / Math.min.apply(null, rates);
    if (!(spread < 1.0001)) {
      const worst = r.park.reduce((a, b) => (b.rate > a.rate ? b : a));
      throw new Error('the away rate runs from ' + Math.min.apply(null, rates).toExponential(3)
        + ' to ' + Math.max.apply(null, rates).toExponential(3) + ' depending on which hole '
        + 'you parked on, a spread of ' + spread.toFixed(3) + 'x. The best of them is hole '
        + worst.h + ' (par ' + worst.par + (worst.close ? ', closing' : '')
        + (worst.sun ? ', Sunday' : '') + '), which is a hole worth walking to before '
        + 'closing the tab.');
    }
    if (!r.awayHeld)
      throw new Error('measuring the round left the golfer on a different hole');
    if (!r.awayThrew)
      throw new Error('the throw mid-measure never happened, so the restore is untested');
    if (!r.awayHeldThrow)
      throw new Error('a throw part way through measuring the round left the golfer on a '
        + 'hole of an event he is not playing, in weather that is not overhead');
    const drops = r.park.map(x => x.drop);
    if (!(Math.max.apply(null, drops) / Math.min.apply(null, drops) < 1.0001))
      throw new Error('the away drop rate still depends on the weather over the hole you '
        + 'parked on');
    if (!(r.park.some(x => x.close) && r.park.some(x => x.sun)))
      throw new Error('the parking sweep never covered a closing hole and a Sunday, so it '
        + 'proves nothing');
    if (!(r.parkSpread > 2))
      throw new Error('one hole of purse is only ' + r.parkSpread.toFixed(2) + 'x another, '
        + 'so there was never anything to park on and this check is not testing it');

    // 4c. the projection is kept. A wide bound on purpose -- these are averages
    //     over runs whose payout is dominated by the rare long one -- but wide
    //     enough to pass a 5x lie is not a check, and the first cut of the
    //     Island Green was exactly 5x.
    // and the Vault has to be past what its card expects, or its payout is the
    // flat floor and nothing about the projection is being tested
    const vaultPay = r.pay.find(q => q.id === 'vault');
    if (!(vaultPay && vaultPay.floors > 0 && vaultPay.pastPace > 0))
      throw new Error('the Vault sample never got past what its card expects, so its '
        + 'projection is being checked against a flat number');
    // The bound is per contest, because the four have nothing like the same
    // spread, and every one of these came off running the check repeatedly
    // rather than off a guess:
    //
    //   sand   1.00 every time          six swings, averaged, settles at once
    //   vault  0.92-0.95 over 5 runs    a clock and a carry, near enough exact
    //   cellar 0.94-1.13 over 5 runs    twenty five binomial chips
    //   water  0.87-1.07 over 5 runs    at 700 samples; at 120 it swung 0.81-1.58
    //   scramble 0.93-1.03 over 4 runs  nine holes, a binomial on provisionals
    //   twilight 0.96-1.01 over 4 runs  a binomial over putts set by tempo
    //
    // A single loose bound is a check that catches nothing: dropping the
    // Vault's event drag reads 1.23x, which 0.6-1.4 waves straight through.
    const BOUND = { sand:[0.85,1.15], vault:[0.85,1.15], cellar:[0.8,1.3], water:[0.7,1.35],
                    scramble:[0.8,1.25], twilight:[0.8,1.25] };
    for (const q of r.pay) {
      if (!(q.actual > 0))
        throw new Error(q.id + ' paid nothing over the sample, so there is nothing to check');
      const f = q.proj / q.actual, bd = BOUND[q.id] || [0.6, 1.4];
      if (!(f > bd[0] && f < bd[1]))
        throw new Error('the wager book says one entry in ' + q.id + ' is worth '
          + q.proj.toPrecision(3) + ' but ' + q.n + ' runs of it paid ' + q.actual.toPrecision(3)
          + ' on average, a factor of ' + f.toFixed(2) + ' against a bound of '
          + bd[0] + '-' + bd[1] + '. A number on the screen that is out by that much is '
          + 'worse than no number.');
    }
    if (r.shown.length !== r.nDgn || r.shown.some(x => !x))
      throw new Error('only ' + r.shown.filter(Boolean).length + ' of the ' + r.nDgn + ' contests say '
        + 'what an entry is worth');
    if (r.buysNames.length !== 4)
      throw new Error('DGN_BUYS names ' + r.buysNames.length + ' currencies, not four');

    // 5. the contests read as different contests
    const shapes = r.strips.map(x => x.cells);
    if (new Set(shapes).size !== shapes.length)
      throw new Error('the readout strip is the same shape for '
        + r.strips.map(x => x.id + ':' + x.cells).join(', ')
        + '. Two contests are drawing the same picture.');
    if (r.strips.some(x => x.hidden || x.cells === 0))
      throw new Error('a running wager left the readout strip empty: '
        + JSON.stringify(r.strips));
    if (!r.stripOffCourse)
      throw new Error('the wager strip is still on the readout out on the course');
    const bests = r.rows.map(t => (t.match(/\u00b7 ([^\u00b7]+?) \u00b7/) || [,''])[1].trim());
    if (new Set(bests).size !== bests.length)
      throw new Error('two contests post the same kind of best: ' + bests.join(' / ')
        + '. A best is only a best in the units the contest is played in.');

    // 6. the gallery does not stop at the golfer
    if (!(r.rope.low > 12))
      throw new Error('with the camera ' + r.rope.camD.toFixed(0) + ' down the hole there are '
        + r.rope.low + ' rope pixels on the near half of the stage against ' + r.rope.high
        + ' on the far half. The span is being culled with the post it hangs from, so the '
        + 'gallery ends at the golfer instead of running out of frame.');

    // 7. furniture is laid, not painted on
    const vault = r.props.find(x => x.id === 'vault');
    const cellar = r.props.find(x => x.id === 'cellar');
    if (!(vault.kinds['2'] > 0))
      throw new Error('the Vault has no gallery ropes in its prop list, so they are being '
        + 'painted on after the props and will cut through the crowd');
    if (!(vault.kinds['1'] > 0))
      throw new Error('the Vault has ropes but nobody behind them');
    if (!(cellar.kinds['3'] > 0))
      throw new Error('the Floodlit Green has no floodlights in its prop list');
    for (const x of r.props) {
      if (!x.sorted)
        throw new Error(x.id + ' props are not sorted far to near, so they will draw '
          + 'through each other');
      if (!x.fixed)
        throw new Error(x.id + ' furniture moved when the camera did. It is anchored to '
          + 'the camera, so it slides along with the player instead of being passed.');
    }

    return ['rope near/far ' + r.rope.low + '/' + r.rope.high
      + ', ropes ' + vault.kinds['2'] + ' + gallery ' + vault.kinds['1']
      + ', lamps ' + cellar.kinds['3'] + ', all sorted and world fixed'
      + ', ' + shapes.length + ' strips ' + shapes.join('/') + ', ' + shapes.length + ' kinds of best'
      + ', floor ' + r.floorFirst + '->' + r.floorLast + ' under a ceiling of '
      + r.ceiling.toFixed(0)
      + ', pay flat to ' + ratio.toFixed(2) + 'x, ' + perRun.toFixed(2)
      + ' tickets/run (' + r.bestsSecondHalf + ' new bests over the back ' + (RUNS >> 1)
      + ' runs) against ' + sustains.toFixed(2) + ' self-sustaining'
      + ', card 5 vs 200 within ' + drift.toPrecision(2) + 'x'
      + ', away hole ' + r.away.map(a => a.awaySecs + '/' + a.live).join(' '),
      'away rate identical from all ' + r.park.length + ' holes of an event, across '
      + r.parkSpread.toFixed(1) + 'x of single-hole purse',
      'entry worth vs the runs: ' + r.pay.map(q =>
        q.id + ' ' + (q.proj / q.actual).toFixed(2) + 'x').join(', ')];
  }
};
