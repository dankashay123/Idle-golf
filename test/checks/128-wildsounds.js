/* Animal calls round the course (the user picked them from the menu: "for
 * the sounds please use free sound packs from online"): frogs by the water,
 * a crow in the woods by day, a game bird's call where a pheasant is out and
 * an owl in the woods at night.
 *
 *   - the six recordings (three frogs, the crow, the game bird, the fox)
 *     decode; the fox barks at night only where its eyes are out
 *   - each by what the hole has: frogs on a hole with water (more often at
 *     night), none on a dry one, none in winter; the crow by day by the
 *     woods, not at night or in the rain; the owl at night by the woods, not
 *     by day; the game bird only on a hole with a pheasant; none of them in a
 *     wager or on a frozen course
 *   - the Animal Sounds switch in Settings silences them all
 *   - now and then over two minutes, never all the time
 *   - quiet: each under the autumn gust and still heard, measured offline
 * Their sounds are counted through a stand-in, as `ambience` does.
 */
'use strict';
module.exports = {
  name: 'wildsounds',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, SNAP = JSON.stringify(S);
      const AN = ['frogs', 'owl', 'crow', 'gameBird', 'foxBark'], OTHER = ['pines', 'surf', 'stream', 'river', 'moor', 'drift', 'lap', 'piper', 'gull', 'chirp', 'cricket', 'gust', 'quack', 'hop', 'plop', 'hawk'];
      const keep = { fns: Object.fromEntries(AN.concat(OTHER).map(k => [k, Sfx[k]])), ctx: Sfx.ctx, master: Sfx.master, recs: Sfx.recs, mt: Sfx.musicTick, rnd: Math.random,
        night: Scene.night, rain: Scene.rain };
      try {
        hideSheet(); QUIET = true; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0;
        // ---- the recordings ----
        const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext, recs = {};
        for (const k of ['frogA', 'frogB', 'frogC', 'crow', 'quail', 'fox']) {
          const el = document.getElementById('rec-' + k); if (!el) { f('no ' + k + ' recording'); continue; }
          const bin = atob(el.textContent.trim()), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          try { recs[k] = await new AC(1, 22050, 22050).decodeAudioData(u.buffer); } catch (e) { f('the ' + k + ' recording does not decode'); }
          if (recs[k] && !(recs[k].duration > 0.2 && recs[k].duration < 2)) f('the ' + k + ' recording lasts ' + recs[k].duration.toFixed(2) + 's');
        }
        if (o.fails.length) return o;
        // ---- what plays where ----
        const home = B.COURSE.findIndex(cs => cs.slot === 'home');
        DEV.course(home); hideSheet();
        const lay = h => { S.hole = h; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier); Scene.announce = null; Scene.heli = 0; Scene.crossing = 0; };
        const has = () => { const fl = Scene.fills || [], W = Scene.water;
          return { woods: fl.some(F => F.kind === 'wood'), wet: !!((W && !W.canyon && !W.rail) || Scene.pond || fl.some(F => F.kind === 'lake')),
            pheasant: Scene.props.some(p => p.kind === 15 && p.an === 'pheasant') }; };
        const find = (season, want) => { SEASON_FORCE = season; const h0 = S.hole; for (let h = h0; h < h0 + 600; h++) { if (sigKind(h)) continue; lay(h); if (want(has())) { S.hole = h0; return h; } } S.hole = h0; return 0; };
        const n = Object.fromEntries(AN.map(k => [k, 0]));
        S.sound = 1; QUIET = false; Sfx.ctx = { state: 'running', currentTime: 1, createGain() {}, createOscillator() {} };
        for (const k of AN) Sfx[k] = () => n[k]++;
        for (const k of OTHER) Sfx[k] = () => {};
        Sfx.musicTick = () => {}; Math.random = seeded(5521);
        const run = (secs, night, rain) => { Scene.night = night; Scene.rain = rain; const n0 = Object.assign({}, n);
          for (const k of ['frogT', 'owlT', 'crowT', 'gbirdT', 'foxT']) Sfx[k] = undefined;
          for (let t = 0; t < secs; t += 0.1) Sfx.tick(0.1);
          return Object.fromEntries(AN.map(k => [k, n[k] - n0[k]])); };
        const say = c => AN.filter(k => c[k]).map(k => k + ' ' + c[k]).join(', ') || 'none';
        const hWet = find(0, x => x.wet && x.woods && !x.pheasant), hDry = find(0, x => !x.wet && x.woods && !x.pheasant),
          hBare = find(0, x => !x.wet && !x.woods && !x.pheasant), hPh = find(1, x => x.pheasant);
        if (!hWet || !hDry || !hPh) { f('no hole found: by water ' + hWet + ', dry ' + hDry + ', with a pheasant ' + hPh); return o; }
        o.c = {};
        SEASON_FORCE = 0; lay(hWet); o.c.wetDay = run(120, false, false); o.c.wetNight = run(120, true, false); o.c.wetRain = run(120, false, true);
        S.dgnRun = { id: B.DGN[0].id }; o.c.wager = run(120, false, false); o.c.wagerNight = run(120, true, false); delete S.dgnRun;
        // (the Animal Sounds switch in Settings: off, none; on again, back)
        toggleWild(); hideSheet(); o.c.off = run(120, false, false); o.c.offNight = run(120, true, false); const offFlag = S.wild; toggleWild(); hideSheet();
        if (offFlag !== 0 || S.wild !== undefined) f('the switch set ' + offFlag + ' then ' + S.wild);
        if (say(o.c.off) !== 'none' || say(o.c.offNight) !== 'none') f('with Animal Sounds off: ' + say(o.c.off) + ' by day, ' + say(o.c.offNight) + ' at night');
        S.wild = 'x'; migrate(); if (S.wild !== undefined) f('a junk switch kept: ' + S.wild);
        S.wild = 0; migrate(); const kept = S.wild; delete S.wild; if (kept !== 0) f('the switch off was not kept in the save');
        lay(hDry); o.c.dryDay = run(120, false, false); o.c.dryNight = run(120, true, false);
        if (hBare) { lay(hBare); o.c.bareDay = run(120, false, false); o.c.bareNight = run(120, true, false); }
        SEASON_FORCE = 2; lay(hWet); o.c.winterDay = run(120, false, false); o.c.winterNight = run(120, true, false);
        SEASON_FORCE = 1; lay(hPh); o.c.pheasant = run(120, false, false); o.c.pheasantNight = run(120, true, false);
        // (the fox: a hole laid at night with its eyes out)
        { SEASON_FORCE = 0; const h0 = S.hole; let hf = 0; for (let h = h0; h < h0 + 600 && !hf; h++) { if (sigKind(h)) continue; S.hole = h; S.chaos = { n: 'Night Round' }; Scene.newHole(h, S.tier); Scene.heli = 0; Scene.crossing = 0;
            if (Scene.props.some(p => p.kind === 15 && p.an === 'eyes')) hf = h; } S.hole = h0;
          if (!hf) f('no night hole with a fox\'s eyes'); else { o.c.fox = run(120, true, false); o.c.foxDay = run(120, false, false); } }
        Scene.night = false; Scene.rain = false;
        const C = o.c, inr = (v, a, b) => v >= a && v <= b;
        if (!inr(C.wetDay.frogs, 4, 14)) f('frogs by the water by day: ' + say(C.wetDay));
        if (!(C.wetNight.frogs > C.wetDay.frogs) || !inr(C.wetNight.frogs, 8, 24)) f('frogs by the water at night: ' + say(C.wetNight) + ' (by day ' + C.wetDay.frogs + ')');
        if (!inr(C.wetDay.crow, 2, 8) || C.wetDay.owl) f('by the woods by day: ' + say(C.wetDay) + ' (want the crow, no owl)');
        if (!inr(C.wetNight.owl, 3, 11) || C.wetNight.crow) f('by the woods at night: ' + say(C.wetNight) + ' (want the owl, no crow)');
        if (C.wetRain.crow || !C.wetRain.frogs) f('in the rain: ' + say(C.wetRain) + ' (want the frogs, no crow)');
        if (say(C.wager) !== 'none' || say(C.wagerNight) !== 'none') f('in a wager: ' + say(C.wager) + ' by day, ' + say(C.wagerNight) + ' at night');
        if (C.dryDay.frogs || C.dryNight.frogs) f('frogs on a hole with no water: ' + C.dryDay.frogs + ' by day, ' + C.dryNight.frogs + ' at night');
        if (C.bareDay && (C.bareDay.crow || C.bareNight.owl)) f('crow or owl with no woods: ' + say(C.bareDay) + ' / ' + say(C.bareNight));
        if (C.dryDay.gameBird || C.wetDay.gameBird) f('a game bird with no pheasant out');
        if (!inr(C.pheasant.gameBird, 4, 16) || C.pheasantNight.gameBird) f('with a pheasant out: ' + C.pheasant.gameBird + ' by day, ' + C.pheasantNight.gameBird + ' at night');
        if (say(C.winterDay) !== 'none' && (C.winterDay.frogs || C.winterDay.crow)) f('in winter by day: ' + say(C.winterDay));
        if (C.winterNight.frogs) f('frogs in winter at night: ' + C.winterNight.frogs);
        if (C.fox && (!inr(C.fox.foxBark, 4, 14) || C.foxDay.foxBark)) f('the fox by its eyes: ' + C.fox.foxBark + ' at night, ' + C.foxDay.foxBark + ' by day');
        if (C.wetNight.foxBark || C.dryNight.foxBark) f('a fox barking with no eyes out: ' + say(C.wetNight) + ' / ' + say(C.dryNight));
        // ---- how loud ----
        Object.assign(Sfx, keep.fns, { ctx: keep.ctx, master: keep.master, musicTick: keep.mt }); Math.random = keep.rnd; QUIET = true; SEASON_FORCE = -1;
        Sfx.recs = Object.assign({}, keep.recs, recs);
        const loud = async fn => {
          const oc = new AC(1, 44100 * 5, 44100), k2 = { ctx: Sfx.ctx, master: Sfx.master, nz: Sfx._nz, live: Sfx.live };
          Sfx.ctx = oc; Sfx.master = oc.destination; Sfx._nz = null;
          const mr = Math.random; Math.random = seeded(9173);
          try { fn(0.05); } finally { Sfx.ctx = k2.ctx; Sfx.master = k2.master; Sfx._nz = k2.nz; Sfx.live = k2.live; Math.random = mr; }
          const d = (await oc.startRendering()).getChannelData(0), W = 4410; let sum = 0, best = 0;
          for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; if (i >= W) sum -= d[i - W] * d[i - W]; if (i >= W - 1) best = Math.max(best, sum / W); }
          return 10 * Math.log10(best + 1e-12);
        };
        o.db = { gust: await loud(t => Sfx.gust(t, 3, Sfx.SEASON_VOL.gust, 260, 900)), pines: await loud(t => Sfx.pines(t, 3.5, Sfx.AMB_VOL.pines)) };
        for (const k of AN) o.db[k] = await loud(t => Sfx[k](t));
        for (const k of AN) if (!(o.db[k] < o.db.gust) || !(o.db[k] > o.db.gust - 25)) f('the ' + k + ' at ' + o.db[k].toFixed(1) + ' dB against the autumn gust\'s ' + o.db.gust.toFixed(1));
      } finally {
        Object.assign(Sfx, keep.fns, { ctx: keep.ctx, master: keep.master, recs: keep.recs, musicTick: keep.mt });
        Math.random = keep.rnd; SEASON_FORCE = -1; HOUR_FORCE = null; FROST_FORCE = null; Scene.night = keep.night; Scene.rain = keep.rain; QUIET = false; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    const c = r.c, d = r.db;
    return ['by the water in two minutes: frogs ' + c.wetDay.frogs + ' by day, ' + c.wetNight.frogs + ' at night; the crow ' + c.wetDay.crow + ' by day, the owl ' + c.wetNight.owl + ' at night; a pheasant\'s call ' + c.pheasant.gameBird + '; the fox by its eyes ' + c.fox.foxBark,
      'none on a dry hole (frogs), with no woods (crow, owl), no pheasant (game bird), in winter, a wager or with the switch off',
      ['frogs', 'owl', 'crow', 'gameBird', 'foxBark'].map(k => k + ' ' + d[k].toFixed(1)).join(', ') + ' dB, under the autumn gust\'s ' + d.gust.toFixed(1) + ' (the pines ' + d.pines.toFixed(1) + ')'];
  }
};
