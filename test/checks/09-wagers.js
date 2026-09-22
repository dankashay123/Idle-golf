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
 *   3. offline() sized an away hole off the CARDED yardage while the live game
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
 * These assert on shape, not on tuning: floors settle, currencies come in
 * linearly, the away hole matches the live hole. Retuning the payout numbers
 * should not move any of them.
 */
'use strict';

const RUNS = 24;

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
      out.exemptCost = B.PERKS.find(p => p.id === 'exempt').cost;
      out.keysPerExemption = B.DGN.reduce((n, d) => n + d.cap, 0);

      // ---- 2. the same run, two hundred cards apart -------------------------
      // A bag exactly on the pace line its card asks for. What one run is worth
      // has to be the same amount of progress at either end of the ladder.
      const onPaceYield = T => {
        S.tier = T; S.tierMax = Math.max(S.tierMax, T); S.hole = 2; S.retires = 0;
        S.relic = {};
        B.SLOTS.forEach(sl => S.equip[sl.id] = makeItem(T, 0, 3, sl.id));
        startHole();
        const ch = { y:1, g:1, s:1, c:0, p:0, dl:0 };
        const pace = yardageFor(S.hole, S.tier, ch) / (parTimeFor(S.hole) * B.HCP);
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
        const pace = yardageFor(S.hole, S.tier, ch) / (parTimeFor(S.hole) * B.HCP);
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
        const a = awayRound();
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
      awayRound();
      out.awayHeld = here() === parkedAt;
      let threw = false;
      const ogSets = window.activeSets;
      try { window.activeSets = () => { throw new Error('boom'); }; awayRound(); }
      catch (e) { threw = true; } finally { window.activeSets = ogSets; }
      out.awayThrew = threw;
      out.awayHeldThrow = here() === parkedAt;

      S.hole = 2; startHole();

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
    // Wide on purpose. Pinning the number would make this a tuning test; what
    // it is for is the drift, and the drift was twenty orders of magnitude.
    // The slack absorbs the integer step of the upgrade ladder the bag is
    // pinned with, which is coarse at card 5 and fine at card 200.
    if (!(drift > 0.1 && drift < 10))
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
          + 'ignoring the handicap floor that pins the live one, or reading its pace off a '
          + 'single hole instead of a round.');
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

    // 5. the four read as four
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
      + ', four strips ' + shapes.join('/') + ', four kinds of best'
      + ', floor ' + r.floorFirst + '->' + r.floorLast + ' under a ceiling of '
      + r.ceiling.toFixed(0)
      + ', pay flat to ' + ratio.toFixed(2) + 'x, ' + perRun.toFixed(2)
      + ' tickets/run against ' + sustains.toFixed(2) + ' self-sustaining'
      + ', card 5 vs 200 within ' + drift.toPrecision(2) + 'x'
      + ', away hole ' + r.away.map(a => a.awaySecs + '/' + a.live).join(' '),
      'away rate identical from all ' + r.park.length + ' holes of an event, across '
      + r.parkSpread.toFixed(1) + 'x of single-hole purse'];
  }
};
