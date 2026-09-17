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

    // 3. and the measurable ones actually move
    const dead = Object.keys(r.moved).filter(k => !r.moved[k].changed);
    if (dead.length)
      throw new Error('spending every point on ' + dead.join(', ') + ' changed nothing: '
        + dead.map(k => k + ' ' + r.moved[k].base + ' -> ' + r.moved[k].maxed).join('; '));

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

    return ['paragon ' + r.cats.length + ' categories, ' + r.paraKeys.length
      + ' lines, none sold elsewhere, all wired',
      Object.keys(r.moved).length + ' measured live; '
      + r.trophies.filter(t => t.g).length + ' trophies compound, '
      + r.trophies.filter(t => t.mech).length + ' are mechanics',
      'milestones ' + total + ' points against a ' + r.career + ' point career'];
  }
};
