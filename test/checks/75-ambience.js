/* Ambience by the course (the user asked: ambience is the one kind of sound
 * they still want):
 *
 *   - wind in the pines on the mountain courses, the sea on the coast and
 *     round the sea stack, the stream by the stepping stones; nothing of it
 *     on the other courses or in a wager, and no stream when the stones'
 *     river is frozen
 *   - now and then: every few seconds, not all the time
 *   - quiet: each under the autumn gust already there, and none silent
 *   - then (the user asked, from the menu): the river at Riverbend, a wader
 *     piping by it by day only; the wind over the Moorland and over the
 *     Dunes; the lake lapping at an island green, and none frozen
 */
'use strict';
module.exports = {
  name: 'ambience',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = { fails: [] }, f = m => o.fails.push(m), SNAP = JSON.stringify(S);
      const KINDS = ['pines', 'surf', 'stream', 'river', 'moor', 'drift', 'lap', 'piper'];
      const keep = { fns: Object.fromEntries(KINDS.map(k => [k, Sfx[k]])), ctx: Sfx.ctx, pines: Sfx.pines, surf: Sfx.surf, stream: Sfx.stream, gull: Sfx.gull, chirp: Sfx.chirp, cricket: Sfx.cricket, gust: Sfx.gust, quack: Sfx.quack, hop: Sfx.hop, plop: Sfx.plop, mt: Sfx.musicTick, sound: S.sound, rnd: Math.random };
      try {
        hideSheet(); QUIET = true;
        const at = id => { DEV.course(B.COURSE.findIndex(c => c.id === id)); hideSheet(); S.hole = awayFirstHole(S.hole) + 1; STONES_FORCE = 0; PIER_FORCE = 0; startHole(); Scene.announce = null; return Sfx.ambOf(); };
        // (a stand-in for the sound: the tick only asks what it is and counts)
        const n = Object.fromEntries(KINDS.map(k => [k, 0]));
        S.sound = 1; QUIET = false; Sfx.ctx = { state: 'running', currentTime: 1, createGain() {} };
        for (const k of KINDS) Sfx[k] = () => n[k]++;
        for (const k of ['gull', 'chirp', 'cricket', 'gust', 'quack', 'hop', 'plop']) Sfx[k] = () => {};
        Sfx.musicTick = () => {}; Math.random = seeded(4417);
        const run = secs => { const n0 = Object.assign({}, n); Sfx.ambT = undefined; for (let t = 0; t < secs; t += 0.1) Sfx.tick(0.1);
          return Object.keys(n).slice(0, 3).map(k => n[k] - n0[k]); };
        // the new ones, counted by kind: what played in two minutes
        const runK = secs => { const n0 = Object.assign({}, n); Sfx.ambT = undefined; for (let t = 0; t < secs; t += 0.1) Sfx.tick(0.1);
          return KINDS.filter(k => n[k] > n0[k]).map(k => k + ' ' + (n[k] - n0[k])).join(', ') || 'none'; };
        o.where = {};
        for (const id of ['highlands', 'coastal', 'willow', 'sandbelt']) { o.where[id] = (at(id) || '-') + ' ' + run(120).join('/'); }
        if (!/^pines \d+\/0\/0$/.test(o.where.highlands)) f('on the Highlands: ' + o.where.highlands + ' (want the pines)');
        if (!/^surf 0\/\d+\/0$/.test(o.where.coastal)) f('on the Coastal Classic: ' + o.where.coastal + ' (want the sea)');
        for (const id of ['willow', 'sandbelt']) if (o.where[id] !== '- 0/0/0') f('on ' + id + ': ' + o.where[id] + ' (want none)');
        const [pn] = o.where.highlands.split(' ')[1].split('/').map(Number), [, sn] = o.where.coastal.split(' ')[1].split('/').map(Number);
        if (!(pn >= 6 && pn <= 20) || !(sn >= 8 && sn <= 24)) f('two minutes gave ' + pn + ' gusts in the pines and ' + sn + ' waves (want now and then)');
        o.more = {};
        for (const id of ['riverbend', 'moorland', 'dunes']) { at(id); ISLE_FORCE = 0; CANYON_FORCE = 0; RAIL_FORCE = 0; STONES_FORCE = 0;
          let h = S.hole; while (sigKind(h)) h++; S.hole = h; startHole(); Scene.announce = null; Scene.night = false; o.more[id] = runK(120); }
        at('riverbend'); { let h = S.hole; while (sigKind(h)) h++; S.hole = h; } startHole(); Scene.announce = null; Scene.night = true; o.more.riverNight = runK(120); Scene.night = false;
        Scene.ice = 1; o.more.riverIce = Sfx.ambOf() || 'none'; Scene.ice = 0;
        at('willow'); ISLE_FORCE = S.hole; startHole(); Scene.announce = null; o.more.island = runK(60);
        Scene.ice = 1; o.more.islandIce = Sfx.ambOf() || 'none'; Scene.ice = 0; ISLE_FORCE = 0;
        const cnt = (str, k) => +((str.match(new RegExp(k + ' (\\d+)')) || [])[1] || 0);
        if (!/^river \d+, piper \d+$/.test(o.more.riverbend) || !(cnt(o.more.riverbend, 'river') >= 8 && cnt(o.more.riverbend, 'river') <= 24)) f('at Riverbend: ' + o.more.riverbend + ' (want the river now and then, and the wader)');
        if (!/^river \d+$/.test(o.more.riverNight)) f('at Riverbend by night: ' + o.more.riverNight + ' (want the river and no wader)');
        if (!/^moor \d+$/.test(o.more.moorland) || !(cnt(o.more.moorland, 'moor') >= 6 && cnt(o.more.moorland, 'moor') <= 20)) f('on the Moorland: ' + o.more.moorland + ' (want the moor wind now and then)');
        if (!/^drift \d+$/.test(o.more.dunes) || !(cnt(o.more.dunes, 'drift') >= 6 && cnt(o.more.dunes, 'drift') <= 20)) f('on the Dunes: ' + o.more.dunes + ' (want the dune wind now and then)');
        if (!/^lap \d+$/.test(o.more.island) || !(cnt(o.more.island, 'lap') >= 6 && cnt(o.more.island, 'lap') <= 16)) f('at an island green: ' + o.more.island + ' (want the lake lapping)');
        if (o.more.riverIce !== 'none' || o.more.islandIce !== 'none') f('frozen: the river ' + o.more.riverIce + ', the island\'s lake ' + o.more.islandIce);
        // the signature holes: the stream by the stones, the sea round the stack, and nothing in a wager
        at('willow'); STONES_FORCE = S.hole; startHole(); Scene.announce = null; o.stones = (Sfx.ambOf() || '-') + ' ' + run(60).join('/');
        Scene.ice = 1; o.frozen = Sfx.ambOf(); Scene.ice = 0;
        STONES_FORCE = 0; PIER_FORCE = S.hole; startHole(); Scene.announce = null; o.pier = Sfx.ambOf();
        PIER_FORCE = 0; at('highlands'); S.dgnRun = { id: 'x' }; o.wager = Sfx.ambOf(); delete S.dgnRun;
        if (!/^stream 0\/0\/\d+$/.test(o.stones) || !(+o.stones.split('/')[2] >= 10 && +o.stones.split('/')[2] <= 30)) f('by the stepping stones: ' + o.stones + ' (want the stream)');
        if (o.frozen || o.pier !== 'surf' || o.wager) f('frozen stones ' + o.frozen + ', the sea stack ' + o.pier + ', a wager ' + o.wager);
        // ---- how loud ----
        Object.assign(Sfx, keep.fns, { ctx: keep.ctx, gust: keep.gust }); Math.random = keep.rnd; QUIET = true;
        const loud = async fn => {
          const oc = new OfflineAudioContext(1, 44100 * 5, 44100), k2 = { ctx: Sfx.ctx, master: Sfx.master, nz: Sfx._nz };
          Sfx.ctx = oc; Sfx.master = oc.destination; Sfx._nz = null;
          const mr = Math.random; Math.random = seeded(9173);
          try { fn(0.05); } finally { Sfx.ctx = k2.ctx; Sfx.master = k2.master; Sfx._nz = k2.nz; Math.random = mr; }
          const d = (await oc.startRendering()).getChannelData(0), W = 13230; let sum = 0, best = 0;
          for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; if (i >= W) sum -= d[i - W] * d[i - W]; if (i >= W - 1) best = Math.max(best, sum / W); }
          return 10 * Math.log10(best + 1e-12);
        };
        o.db = { gust: await loud(t => Sfx.gust(t, 3, Sfx.SEASON_VOL.gust, 260, 900)), pines: await loud(t => Sfx.pines(t, 3.5, Sfx.AMB_VOL.pines)),
                 surf: await loud(t => Sfx.surf(t, 4, Sfx.AMB_VOL.surf)), stream: await loud(t => Sfx.stream(t, 2, Sfx.AMB_VOL.stream)),
                 river: await loud(t => Sfx.river(t, 3.7, Sfx.AMB_VOL.river)), piper: await loud(t => Sfx.piper(t, Sfx.AMB_VOL.piper)),
                 moor: await loud(t => Sfx.moor(t, 4.5, Sfx.AMB_VOL.moor)), drift: await loud(t => Sfx.drift(t, 4, Sfx.AMB_VOL.drift)), lap: await loud(t => Sfx.lap(t, 1.8, Sfx.AMB_VOL.lap)) };
        for (const k of ['pines', 'surf', 'stream', 'river', 'piper', 'moor', 'drift', 'lap']) if (!(o.db[k] < o.db.gust) || !(o.db[k] > o.db.gust - 25)) f('the ' + k + ' at ' + o.db[k].toFixed(1) + ' dB against the autumn gust\'s ' + o.db.gust.toFixed(1) + ' (want quieter, but heard)');
      } finally {
        Object.assign(Sfx, keep.fns, { ctx: keep.ctx, pines: keep.pines, surf: keep.surf, stream: keep.stream, gull: keep.gull, chirp: keep.chirp, cricket: keep.cricket, gust: keep.gust, quack: keep.quack, hop: keep.hop, plop: keep.plop, musicTick: keep.mt });
        Math.random = keep.rnd; STONES_FORCE = 0; PIER_FORCE = 0; ISLE_FORCE = 0; Scene.ice = 0; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const d = r.db;
    return ['over two minutes (pines/sea/stream): ' + Object.entries(r.where).map(([k, v]) => k + ' ' + v).join(', ') + '; by the stones ' + r.stones + ', the sea round the stack, none frozen or in a wager',
      'Riverbend ' + r.more.riverbend + ' (by night ' + r.more.riverNight + '), Moorland ' + r.more.moorland + ', Dunes ' + r.more.dunes + ', an island green ' + r.more.island + '; none frozen',
      Object.keys(d).filter(k => k !== 'gust').map(k => k + ' ' + d[k].toFixed(1)).join(', ') + ' dB, all under the autumn gust\'s ' + d.gust.toFixed(1)];
  }
};
