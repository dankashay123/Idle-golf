/* The five progression systems, and the rule that they do not repeat each other.
 *
 * The Range sold "+% swing power". So did the attributes, a talent, a paragon
 * line and three trophies. Four systems saying the same sentence is one system
 * with four front doors, and nothing in any of them is worth looking forward to.
 * Each now owns its own ground:
 *
 *   Range      gold, resets on retirement, the ten raw stats
 *   Attributes level points, the four basics plus one milestone each
 *   Talents    level points, the conditional family -- armour, clutch,
 *              cooldowns, pace, conditions, resonance, experience
 *   Paragon    endless, the systems AROUND the swing and nothing on a swing
 *   Trophies   legacy, the only permanent multiplying layer
 *
 * The checks below are the ones that would have caught this going wrong:
 * paragon must not name a stat another system sells, every paragon line must
 * be wired to something (a line in a table that nothing reads is a line that
 * silently does nothing), and every trophy must cost more per level than it
 * gains.
 *
 * The talent trees predated that rule and were not held to it: ten of the
 * twenty sold a flat percentage of a stat the Range sells on a five hundred
 * rung ladder, which is the same complaint with a different table. They are
 * held to it here now, both ways round -- a talent may not name a sold stat,
 * and every talent key has to be read somewhere outside its own table. The
 * second half of that caught `cond`, a career key that startHole read every
 * hole and that nothing in the game had granted since the trees were written.
 *
 * And no two tables may share an id. `compress`, `infuse` and `lantern` each
 * existed in B.UPG and B.TREES at once. It was never live -- S.upg and S.tal
 * are separate stores and migrate() prunes each against its own table -- but
 * this file has been bitten twice by name collisions already, and any future
 * code that reads a level by bare id would cross the wires silently.
 */
'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'progression',
  async run(page) {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

    const r = await page.evaluate(() => {
      const out = {};

      // what each system names
      out.paraKeys = [];
      for (const c of B.PARAGON) for (const a of c.a) out.paraKeys.push(a.k);
      out.rangeKeys = B.UPG.map(u => u.k);
      out.statKeys = [];
      for (const s of B.STATS) for (const k in B.STAT_V[s.id]) out.statKeys.push(k);
      out.trophyKeys = B.TROPHY.filter(t => t.g).map(t => t.k.slice(1));
      out.talKeys = [];
      for (const tree of B.TREES) for (const t of tree.t) out.talKeys.push(t.k);
      out.talents = B.TREES.reduce((n, tr) => n + tr.t.length, 0);
      // every key career() hands out, so a reader with no writer shows up too
      out.careerKeys = Object.keys(career());
      // honours land in the same table, so they count as a source
      out.achKeys = B.ACH.map(a => a.r.k);
      // the ten stats a swing and a purse are made of. career() carries a slot
      // for each because gearStats folds them in alongside the locker, so one
      // of them sitting at zero is a table with nothing in it today rather than
      // a reader with no writer.
      out.gearKeys = Object.keys(gearStats());

      // ids, by the table that owns them
      out.ids = {
        'B.UPG':     B.UPG.map(u => u.id),
        'B.TREES':   [].concat.apply([], B.TREES.map(t => t.t.map(x => x.id))),
        'B.TROPHY':  B.TROPHY.map(t => t.id),
        'B.SKILL':   B.SKILL.map(k => k.id),
        'B.STATS':   B.STATS.map(x => x.id),
        'B.PERKS':   B.PERKS.map(x => x.id),
        'B.DGN':     B.DGN.map(d => d.id),
        'B.ACH':     B.ACH.map(a => a.id),
        'B.ACH_REP': B.ACH_REP.map(a => a.id)
      };
      out.cats = B.PARAGON.map(c => ({ id: c.id, n: c.n, lines: c.a.length,
                                       uncapped: c.a.filter(a => a.cap === 0).length }));

      // trophies: every one compounds or runs a mechanic, and every ladder
      // outruns what it buys
      out.trophies = B.TROPHY.map(t => ({
        id: t.id, k: t.k, g: t.g || null, ratio: trophyRatio(t),
        mech: t.k[0] === '@'
      }));

      // attributes: a milestone each, and the gate actually flips
      out.noMile = B.STATS.filter(s => !s.mile).map(s => s.id);
      out.miles = B.STATS.filter(s => s.mile).map(s => {
        const keep = S.stat[s.id];
        S.stat[s.id] = s.mile.at - 1; const before = mileOn(s.id);
        S.stat[s.id] = s.mile.at;     const after = mileOn(s.id);
        S.stat[s.id] = keep;
        return { id: s.id, at: s.mile.at, n: s.mile.n, before, after };
      });
      out.career = B.LV_MAX * B.LV_STAT;
      out.mileTotal = B.STATS.reduce((n, s2) => n + (s2.mile ? s2.mile.at : 0), 0);

      // and the ones that can be measured by calling the game's own functions
      const zero = () => { for (const c of B.PARAGON) for (const a of c.a)
        S.paraSpent[c.id + '.' + a.id] = 0; };
      const set = (cid, aid, n) => { S.paraSpent[cid + '.' + aid] = n; };
      const it = makeItem(10, 0, 3, 'driver');
      const probe = () => {
        const D = derive();
        return {
          wisland: islandChance(D, 0),
          wchip:   chipChance(D),
          wvault:  floorWork(5),
          reforge: enhChance({ slot:'driver', rar:3, ilvl:10, enh:9, aff:[] }),
          attune:  rerollCost(it) + ascendCost(it),
          scrap:   scrapValue(it),
          fit:     makeItem(10, 0, 3, 'driver').ilvl,
          plegacy: (S.eventsPlayed = 99, legacyGain()),
          pdisc:   discoverCost(),
          pcurate: upgradeCost(B.TROPHY[0]),
          tick:    (S.tickets = 0, grantTickets(4), S.tickets)
        };
      };
      S.tier = 20; startHole();
      zero(); const base = probe();
      const moved = {};
      for (const c of B.PARAGON) for (const a of c.a) {
        if (base[a.k] === undefined) continue;
        zero(); set(c.id, a.id, a.cap || 400);
        const v = probe()[a.k];
        moved[a.k] = { base: base[a.k], maxed: v, changed: v !== base[a.k] };
      }
      zero();
      out.moved = moved;

      // ---- and the talents, measured the same way ----------------------
      // Each of the ten new ones names a moment rather than a stat, so the
      // probe has to put the golfer in that moment: a par five, a hole the
      // weather stretched, a Sunday, a ball that matches the course, a pure
      // strike that lands on armour.
      const findHole = f => { for (let h = 1; h <= B.ROUND*B.DAYS; h++) if (f(h)) return h; return 1; };
      const h5   = findHole(h => parOf(h) === 5 && !isClosing(h));
      const h4   = findHole(h => parOf(h) === 4 && !isClosing(h));
      const hSun = findHole(h => isSunday(h));
      const talZero = () => { for (const tr of B.TREES) for (const x of tr.t) S.tal[x.id] = 0; };
      const fair = { y:1, g:1, s:1, c:0, p:0, dl:0 };

      // the middle of 400 drops with no Sponsor Eye. Rolling twice and keeping
      // the better must put three quarters of the next 400 above that line
      // instead of half, whatever the shape of the distribution underneath --
      // which is a binomial to assert on rather than a heavy-tailed mean.
      const dropScores = n => { const a = [];
        for (let i = 0; i < n; i++) a.push(itemScore(dropItem(10, 0, 3, 'driver')));
        return a; };

      function probeTal(){
        S.chaos = fair; S.stretched = false;
        S.hole = h4; const p4 = derive().pow;
        S.hole = h5; const p5 = derive().pow;
        S.hole = h4; S.stretched = true; const pw = derive().pow; S.stretched = false;
        S.courseEl = 'ember';
        const o = { par5: p5 / p4, windy: pw / p4, surge: resonance('ember'),
                    cast: skillVal(B.SKILL[0], 1),
                    sunday: purseFor(hSun, 10, 1) };
        // a pure strike landing on armour, with the armour set by hand so the
        // figure is the talent and not the hole
        S.hole = h4; startHole();
        S.armor = 1000; S.armor0 = 1000; S.yards = 1e12; S.yardsMax = 1e12; S.purse = 0;
        const Da = derive(); Da.crit = 1;
        oneSwing(Da, false);
        o.shave = S.armor;
        // a ball that leaves a mark, with the affinity roll turned off: the
        // only thing that can set frost here is Sweet Contact reading the crit
        S.equip.ball = { uid: 99, slot:'ball', rar:3, ilvl:0, enh:0, aff:[], el:'frost' };
        const Dc = derive(); Dc.crit = 1; Dc.proc = 0;
        let fired = 0;
        for (let i = 0; i < 400; i++){
          S.yards = 1e12; S.yardsMax = 1e12; S.purse = 0; S.armor = 0; S.frost = 0;
          oneSwing(Dc, false);
          if (S.frost > 0) fired++;
        }
        o.critproc = fired;
        return o;
      }
      talZero(); const tBase = probeTal();
      const base400 = dropScores(400).sort((a,b) => a-b);
      const mid = base400[200];
      const tMoved = {};
      for (const tr of B.TREES) for (const x of tr.t){
        if (tBase[x.k] === undefined) continue;
        talZero(); S.tal[x.id] = x.max;
        const v = probeTal()[x.k];
        tMoved[x.k] = { base: tBase[x.k], maxed: v, changed: v !== tBase[x.k] };
      }
      // Sponsor Eye on its own scale
      talZero();
      out.dropMid = dropScores(400).filter(v => v > mid).length;
      const eye = B.TREES.find(t => t.id === 'card').t.find(x => x.k === 'look2');
      talZero(); S.tal[eye.id] = 9;                       // look2 past 1, so it always rolls twice
      out.dropEye = dropScores(400).filter(v => v > mid).length;
      talZero();
      out.talMoved = tMoved;
      return out;
    });

    // 1. paragon names nothing another system sells
    const sold = new Set([].concat(r.rangeKeys, r.statKeys, r.trophyKeys));
    const clash = r.paraKeys.filter(k => sold.has(k) && k !== 'pow' && k !== 'elm');
    if (clash.length)
      throw new Error('paragon sells ' + clash.join(', ') + ', which the Range, the '
        + 'attributes or the trophy room already sells. Paragon is the endless system: '
        + 'it gets the game around the swing, not another copy of the swing.');

    // pow and elm are the deliberate exception: a point owed to a full category
    // falls through to Core, so Core has to keep an uncapped line to land on
    const core = r.cats[0];
    if (!(core.uncapped > 0))
      throw new Error('Core has no uncapped line, so a point owed to a full category '
        + 'has nowhere to go');

    // 1b. and neither does a talent. The trees own the conditional family --
    //     a moment on the course, or a rule change -- and nothing that is a
    //     percentage of a number on the vitals panel.
    const talClash = r.talKeys.filter(k => sold.has(k));
    if (talClash.length)
      throw new Error('talent' + (talClash.length > 1 ? 's sell ' : ' sells ')
        + talClash.join(', ') + ', which the Range, the attributes or the trophy room '
        + 'already sells on a ladder. A talent point and a rung bought the same sentence.');

    // 1c. no id lives in two tables at once. Five do, and every one of them is
    //     a key in somebody's save -- S.upg.drive, S.relic.marker, S.dgnFloor
    //     .vault -- so moving one costs a migration to buy nothing that is
    //     broken today. They are listed rather than forgiven: the list is the
    //     record, and a collision that is not on it fails.
    const KNOWN = ['marker B.UPG/B.TROPHY', 'drive B.UPG/B.STATS', 'tempo B.UPG/B.STATS',
                   'ley B.TROPHY/B.PERKS', 'vault B.TROPHY/B.DGN'];
    const seen = {}, dupes = [];
    for (const table in r.ids) for (const id of r.ids[table]) {
      if (seen[id]) dupes.push(id + ' ' + seen[id] + '/' + table);
      else seen[id] = table;
    }
    const fresh = dupes.filter(d => KNOWN.indexOf(d) < 0);
    if (fresh.length)
      throw new Error('the same id is in two tables: ' + fresh.join('; ')
        + '. Nothing reads a level by bare id today, and the day something does '
        + 'it will cross the two silently.');
    const gone = KNOWN.filter(k => dupes.indexOf(k) < 0);
    if (gone.length)
      throw new Error('the known-collision list still carries ' + gone.join('; ')
        + ', which no longer collide. A stale exception is one that hides the next one.');

    // 2. every paragon line is wired to something
    const unwired = [];
    for (const k of r.paraKeys) {
      if (k === 'pow' || k === 'elm') continue;
      const used = new RegExp('(?:C|career\\(\\))\\.' + k + '\\b').test(src);
      if (!used) unwired.push(k);
    }
    if (unwired.length)
      throw new Error('paragon line' + (unwired.length > 1 ? 's ' : ' ') + unwired.join(', ')
        + (unwired.length > 1 ? ' appear' : ' appears') + ' in the table and nowhere else in '
        + 'the game. A line nothing reads is a line that silently does nothing when you '
        + 'spend on it.');

    // 2b. every talent key is read somewhere outside the table, and every key
    //     career() hands out has something that hands it out. A reader with no
    //     writer is dead weight that looks live; a writer with no reader is a
    //     talent point that buys nothing.
    const talUnwired = [];
    for (const k of r.talKeys) {
      if (sold.has(k)) continue;                    // folded into gear stats, read everywhere
      if (!new RegExp('(?:C|career\\(\\))\\.' + k + '\\b').test(src)) talUnwired.push(k);
    }
    if (talUnwired.length)
      throw new Error('talent key' + (talUnwired.length > 1 ? 's ' : ' ') + talUnwired.join(', ')
        + (talUnwired.length > 1 ? ' appear' : ' appears') + ' in the tree and nowhere else '
        + 'in the game.');
    const granted = new Set([].concat(r.talKeys, r.paraKeys, r.statKeys, r.achKeys, r.gearKeys));
    const ungranted = r.careerKeys.filter(k => !granted.has(k));
    if (ungranted.length)
      throw new Error('career() carries ' + ungranted.join(', ') + ', which no attribute, '
        + 'talent or paragon line grants. Something reads it every hole and it is '
        + 'always zero.');

    // 3. and the measurable ones actually move
    const dead = Object.keys(r.moved).filter(k => !r.moved[k].changed);
    if (dead.length)
      throw new Error('spending every point on ' + dead.join(', ') + ' changed nothing: '
        + dead.map(k => k + ' ' + r.moved[k].base + ' -> ' + r.moved[k].maxed).join('; '));

    // 3b. and so do the talents that can be put in front of a function
    const talDead = Object.keys(r.talMoved).filter(k => !r.talMoved[k].changed);
    if (talDead.length)
      throw new Error('maxing ' + talDead.join(', ') + ' changed nothing: '
        + talDead.map(k => k + ' ' + r.talMoved[k].base + ' -> ' + r.talMoved[k].maxed).join('; '));
    // Sponsor Eye rolls twice and keeps the better, so three quarters of its
    // drops should clear the line half of a plain run clears. Binomial on 400,
    // so the honest floor is well clear of 200 and well short of 300.
    if (!(r.dropEye > 240))
      throw new Error('Sponsor Eye put ' + r.dropEye + ' of 400 drops above the plain median '
        + 'against ' + r.dropMid + ' without it. Rolling twice and keeping the better should '
        + 'put about three hundred there.');

    // 4. every trophy compounds, or runs a mechanic, and none of them is a
    //    cheaper source of power at level two hundred than at level one
    for (const t of r.trophies) {
      if (!t.mech && !t.g)
        throw new Error('trophy ' + t.id + ' is a flat add (' + t.k + '), which is a Range '
          + 'upgrade bought in a different shop');
      if (t.g && !(t.ratio > t.g))
        throw new Error('trophy ' + t.id + ' gains x' + t.g + ' a level and costs x'
          + t.ratio.toFixed(3) + '. Cost has to outrun gain or every level is cheaper per '
          + 'unit of power than the one before.');
    }

    // 5. a milestone is a commitment, not a formality
    if (r.noMile.length)
      throw new Error('attribute' + (r.noMile.length > 1 ? 's' : '') + ' ' + r.noMile.join(', ')
        + ' grant a percentage and nothing else, which is what the Range is for. '
        + 'An attribute needs something at the end of it worth pouring points into.');
    for (const m of r.miles) {
      if (m.before || !m.after)
        throw new Error(m.id + ' milestone does not turn on at ' + m.at + ' points');
      if (!(m.at > 0)) throw new Error(m.id + ' has no milestone gate');
    }
    const total = r.mileTotal;
    if (!(total > r.career))
      throw new Error('all four milestones cost ' + total + ' points and a career is '
        + r.career + '. If you can have all four there is no choice in it.');

    // ---- every course is on the schedule ------------------------------------
    // Regular stops used to be picked off the event number, so a list whose
    // length shared a factor with the season (event, event, major, event,
    // event, finale) skipped courses for ever: at twelve, four were never
    // played. Over a long run of the schedule, every course has to come up,
    // and the regular ones about equally often.
    const sched = await page.evaluate(() => {
      const c = {}; B.COURSE.forEach(x => c[x.id] = 0);
      for (let t = 1; t <= 60 * B.SEASON; t++) c[courseFor(t).id]++;
      const reg = B.COURSE.filter(x => x.slot === 'event').map(x => c[x.id]);
      return { never: Object.keys(c).filter(k => !c[k]), regMin: Math.min(...reg), regMax: Math.max(...reg),
               n: B.COURSE.length };
    });
    if (sched.never.length)
      throw new Error('these courses never come up on the schedule: ' + sched.never.join(', '));
    if (sched.regMax - sched.regMin > 1)
      throw new Error('regular stops come up between ' + sched.regMin + ' and ' + sched.regMax
        + ' times over the same schedule; they should rotate evenly');

    // ---- honours pay sovereigns, once each or every time ---------------
    const H = await page.evaluate(() => {
      const o = {};
      o.bands = B.ACH.filter(a => [5, 10, 100].indexOf(a.sov) < 0).map(a => a.id + '=' + a.sov);
      o.rep = B.ACH_REP.filter(a => !(a.step > 0) || !(a.sov >= 2 && a.sov <= 10)).map(a => a.id);
      o.repMetrics = B.ACH_REP.filter(a => !isFinite(achMetric(a.m))).map(a => a.id + ':' + a.m);
      const fresh = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState());
        initState(); migrate(); };
      QUIET = true;
      try {
        // a new career: nothing back-paid, nothing paid for counting from zero
        fresh(); checkAch(); o.freshPaid = S.sov || 0;
        // 250 holes: Fairway Found once, and Steady Hand twice
        S.totalHoles = 250; const s0 = S.sov || 0; checkAch();
        o.at250 = (S.sov || 0) - s0;
        const s1 = S.sov; checkAch(); o.again = S.sov - s1;
        // a save from before honours paid: what it had already earned is paid
        // once, and the repeating ones start counting from where it stands
        fresh(); delete S.achSov; S.achRep = {};
        S.achDone = { h100: 1, lv60: 1 }; S.totalHoles = 25000; S.tally.birdie = 9000;
        checkAch(); o.backPay = S.sov || 0;
        const s2 = S.sov; checkAch(); o.backAgain = S.sov - s2;
        o.want = B.ACH.find(a => a.id === 'h100').sov + B.ACH.find(a => a.id === 'lv60').sov
          + B.ACH.filter(a => a.m === 'holes' && a.v <= 25000 && a.id !== 'h100').reduce((t, a) => t + a.sov, 0)
          + B.ACH.filter(a => a.m === 'birdie' && a.v <= 9000).reduce((t, a) => t + a.sov, 0);
        o.hSteady = B.ACH_REP.find(a => a.id === 'rHoles').sov;
        o.hFair = B.ACH.find(a => a.id === 'h100').sov;
      } finally { QUIET = false; }
      fresh();
      return o;
    });
    if (H.bands.length)
      throw new Error('one-off honours outside the 5 / 10 / 100 sovereign bands: ' + H.bands.join(', '));
    if (H.rep.length)
      throw new Error('repeating honours with no step or a payout outside 2-10: ' + H.rep.join(', '));
    if (H.repMetrics.length)
      throw new Error('repeating honours read a counter the game does not keep: ' + H.repMetrics.join(', '));
    if (H.freshPaid)
      throw new Error('a brand new career was paid ' + H.freshPaid + ' sovereigns before doing anything');
    if (H.at250 !== H.hFair + 2 * H.hSteady)
      throw new Error('250 holes paid ' + H.at250 + ' sovereigns; Fairway Found (' + H.hFair
        + ') and two Steady Hands (' + (2 * H.hSteady) + ') is ' + (H.hFair + 2 * H.hSteady));
    if (H.again) throw new Error('checking again straight after paid ' + H.again + ' more');
    if (H.backPay !== H.want)
      throw new Error('a save from before honours paid got ' + H.backPay + ' sovereigns back; what it '
        + 'had already earned comes to ' + H.want + ', and its 25,000 holes must not be paid as '
        + '250 Steady Hands');
    if (H.backAgain) throw new Error('the back pay was paid a second time: +' + H.backAgain);

    return ['all ' + sched.n + ' courses on the schedule, regular stops within one of each other',
      'honours pay sovereigns: one-offs 5/10/100, ' + 'repeating 2-10 every step, back pay ' + H.backPay + ' once, nothing for counting from zero',
      'paragon ' + r.cats.length + ' categories, ' + r.paraKeys.length
      + ' lines, none sold elsewhere, all wired',
      r.talents + ' talents, none sold elsewhere, all wired; '
      + Object.keys(r.talMoved).length + ' measured live, Sponsor Eye ' + r.dropEye
      + '/400 over the plain median against ' + r.dropMid,
      Object.keys(r.ids).length + ' tables, ' + Object.keys(seen).length + ' ids, '
      + dupes.length + ' known collisions and no new ones',
      Object.keys(r.moved).length + ' measured live; '
      + r.trophies.filter(t => t.g).length + ' trophies compound, '
      + r.trophies.filter(t => t.mech).length + ' are mechanics',
      'milestones ' + total + ' points against a ' + r.career + ' point career'];
  }
};
