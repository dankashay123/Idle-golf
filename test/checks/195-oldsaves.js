/* Real saves from older builds (test/saves: played in the build of that day,
 * three twelve-hour absences and a few developer boosts) load into this one
 * with nothing lost and nothing paid twice (the user asked for an old-save
 * pass after the pace changes):
 *   - no part of the save dropped but the counts since replaced (the bags'
 *     one count toward a Mythic, carried to the Tour Bag's own)
 *   - the level, money, legacy, cups, clubs worn and in the locker, grit,
 *     shards, upgrades, heirlooms and the Bench as they were; the card too
 *     (a save from before holes were fixed to their card is put on the card
 *     that matches the golfer, as it always has been: not compared)
 *   - sovereigns held and waiting at least what they were (honours already
 *     earned under today's rules may be added, to take with GET)
 *   - saved and loaded again, the same: nothing added twice */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'saves');
module.exports = {
  name: 'oldsaves',
  async run(page) {
    const saves = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort().map(f => ({ f, s: fs.readFileSync(path.join(DIR, f), 'utf8') }));
    const r = await page.evaluate((saves) => {
      const SNAP = JSON.stringify(S), RAW = localStorage.getItem(KEY), out = [], fails = [], f = m => { if (fails.length < 20) fails.push(m); };
      const owed = o => (o.owed || []).reduce((a, x) => a + (x.n || 0), 0);
      const loadRaw = raw => { localStorage.setItem(KEY, raw); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, defaultState()); load(); initState(); migrate(); };
      const MAY_GO = ['pity'];
      try {
        hideSheet(); QUIET = true;
        for (const { f: name, s } of saves) {
          const old = JSON.parse(s); old.t = Date.now() / 1000;
          loadRaw(JSON.stringify(old));
          const w = name.replace('.json', '');
          for (const k of Object.keys(old)) if (!(k in S) && !MAY_GO.includes(k)) f(w + ': ' + k + ' dropped');
          for (const k of ['lv', 'xp', 'legacy', 'retires', 'cups', 'statPts', 'talPts', 'para']) if (typeof old[k] === 'number' && S[k] !== old[k]) f(w + ': ' + k + ' ' + old[k] + ' became ' + S[k]);
          for (const k of ['gold', 'grit', 'shard']) if (typeof old[k] === 'number' && Math.abs((S[k] || 0) - old[k]) > Math.abs(old[k]) * 1e-9 + 1e-9) f(w + ': ' + k + ' ' + old[k] + ' became ' + S[k]);
          if (old.holesFixed && (S.tier !== old.tier || S.tierMax !== old.tierMax)) f(w + ': the card ' + old.tier + '/' + old.tierMax + ' became ' + S.tier + '/' + S.tierMax);
          if ((old.bag || []).length !== S.bag.length) f(w + ': ' + (old.bag || []).length + ' clubs in the locker became ' + S.bag.length);
          for (const sl in (old.equip || {})) if (old.equip[sl] && (!S.equip[sl] || S.equip[sl].uid !== old.equip[sl].uid)) f(w + ': the club worn as ' + sl + ' changed');
          for (const g of ['upg', 'relic', 'perm', 'stat', 'tal', 'styleOwn', 'majorWins'])
            for (const k in (old[g] || {})) if (JSON.stringify((S[g] || {})[k] ?? 0) !== JSON.stringify(old[g][k] ?? 0)) f(w + ': ' + g + '.' + k + ' ' + JSON.stringify(old[g][k]) + ' became ' + JSON.stringify((S[g] || {})[k]));
          const sov0 = (old.sov || 0) + owed(old), sov1 = (S.sov || 0) + owed(S);
          if (sov1 < sov0) f(w + ': sovereigns held and waiting ' + sov0 + ' became ' + sov1);
          // again: saved and loaded, the same
          save(); const again = localStorage.getItem(KEY); const keep = JSON.stringify(S);
          loadRaw(again); const sov2 = (S.sov || 0) + owed(S);
          if (sov2 !== sov1) f(w + ': loaded again, sovereigns ' + sov1 + ' became ' + sov2);
          if (S.bag.length !== JSON.parse(keep).bag.length || S.lv !== JSON.parse(keep).lv || S.gold !== JSON.parse(keep).gold) f(w + ': loaded again, something changed');
          out.push(w.slice(0, 10) + ' ' + sov0 + '→' + sov1);
        }
      } finally { QUIET = false; if (RAW !== null) localStorage.setItem(KEY, RAW); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); Scene.newHole(S.hole, S.tier); }
      return { fails, out };
    }, saves);
    if (r.fails.length) throw new Error(r.fails.join('; '));
    if (r.out.length < 5) throw new Error('only ' + r.out.length + ' old saves read');
    return [r.out.length + ' saves from older builds loaded with nothing lost and nothing twice (sovereigns held and waiting: ' + r.out.join(', ') + ')'];
  }
};
