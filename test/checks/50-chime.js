/* A short chime when a course's season turns (the user asked).
 *
 * The home courses come round in a new season every ten cards, and six
 * regular stops turn with the real month. The game keeps the season each of
 * those courses was last seen in; seen in another, it chimes in the new
 * season's manner (autumn falling, winter ringing high, blossom climbing,
 * back to as built two plain notes).
 *
 *   - the first time a course is seen, and the same season again: no chime
 *   - a home course come round in autumn, a regular stop gone into winter
 *     with the month and back to autumn, and a month that turns part way
 *     through an event: one chime each, in that season's manner
 *   - not in a catch-up or a wager, and a turn not seen there chimes on the
 *     next hole played; a course that never turns is never noted
 *   - junk in the save loads clean
 *   - each chime about as loud as the coin, under the honour fanfare
 *     (rendered offline and measured)
 */
'use strict';
module.exports = {
  name: 'chime',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = {}, SNAP = JSON.stringify(S), keep = { ctx: Sfx.ctx, season: Sfx.season, mt: Sfx.musicTick, sound: S.sound };
      const heard = [];
      try {
        hideSheet(); QUIET = false; S.sound = 1;
        Sfx.ctx = { state: 'running', currentTime: 1 };
        Sfx.season = s => { heard.push(s); }; Sfx.musicTick = () => {};
        const idx = id => B.COURSE.findIndex(c => c.id === id);
        const home = COURSE_HOME[0];
        const took = f => { heard.length = 0; f(); try { hideSheet(); } catch (e) {} return heard.join(',') || 'none'; };
        S.seasonSeen = {}; DAY_FORCE = null; SEASON_FORCE = -1;

        // ---- a home course: as built on Card I, autumn on Card XI ----
        S.tier = 0; S.tierMax = 12;
        o.first = took(() => DEV.course(idx(home.id)));
        o.again = took(() => { S.hole++; startHole(); });
        o.autumn = took(() => { S.tier = 10; DEV.course(idx(home.id)); });
        o.homeSeen = S.seasonSeen[home.id];

        // ---- a regular stop with the month: November, December, November ----
        const nov = 20774, dec = 20790;            // 15 Nov 2026 and 1 Dec 2026
        DAY_FORCE = nov; S.tier = 3;
        o.calFirst = took(() => DEV.course(idx('coastal')));
        DAY_FORCE = dec;
        o.winter = took(() => DEV.course(idx('coastal')));
        DAY_FORCE = nov;
        o.backAutumn = took(() => DEV.course(idx('coastal')));
        // the month turning part way through an event, between two holes
        o.midHole = took(() => { S.hole += 3; startHole(); });
        DAY_FORCE = dec;
        o.midTurn = took(() => { S.hole += 1; startHole(); });
        o.midLook = Scene.look && Scene.look.season;

        // ---- not in a catch-up or a wager; the next hole played hears it ----
        DAY_FORCE = nov;
        QUIET = true; o.quiet = took(() => { S.hole += 1; startHole(); }); QUIET = false;
        o.quietSeen = S.seasonSeen.coastal;
        o.after = took(() => { S.hole += 1; startHole(); });
        DAY_FORCE = dec;
        S.dgnRun = { id: 'water' }; o.wager = took(() => { startHole(); }); S.dgnRun = null;
        o.afterWager = took(() => { S.hole += 1; startHole(); });
        // a course that never turns
        o.dunes = took(() => DEV.course(idx('dunes')));
        o.dunesNoted = 'dunes' in S.seasonSeen;

        // ---- sound off: noted, not heard ----
        DAY_FORCE = nov; S.sound = 0;
        o.soundOff = took(() => DEV.course(idx('coastal')));
        S.sound = 1;

        // ---- junk in the save ----
        S.seasonSeen = { coastal: 2, willow: 1.5, dunes: 1, nope: 1, sandbelt: 7, riverbend: '2', [home.id]: 3 };
        initState(); o.repaired = JSON.stringify(Object.keys(S.seasonSeen).sort().map(k => k + ':' + S.seasonSeen[k]));
        S.seasonSeen = [1, 2]; initState(); o.repairedArr = JSON.stringify(S.seasonSeen);
        Sfx.ctx = keep.ctx; Sfx.season = keep.season;

        // ---- how loud ----
        const loud = async fn => {
          const oc = new OfflineAudioContext(1, 88200, 44100), k2 = { ctx: Sfx.ctx, master: Sfx.master, nz: Sfx._nz };
          Sfx.ctx = oc; Sfx.master = oc.destination; Sfx._nz = null;
          try { fn(); } finally { Sfx.ctx = k2.ctx; Sfx.master = k2.master; Sfx._nz = k2.nz; }
          const d = (await oc.startRendering()).getChannelData(0), W = 13230; let sum = 0, best = 0;
          for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; if (i >= W) sum -= d[i - W] * d[i - W]; if (i >= W - 1) best = Math.max(best, sum / W); }
          return +(10 * Math.log10(best + 1e-12)).toFixed(1);
        };
        o.db = [];
        for (let s = 0; s < SEASONS.length; s++) o.db.push(await loud(() => Sfx.season(s)));
        o.coinDb = await loud(() => Sfx.notes([1318.5, 1760], 'square', 0.045, 0.06));
        o.achDb = await loud(() => Sfx.notes([659.25, 783.99, 987.77, 1318.5], 'square', 0.05, 0.08));
      } finally {
        Sfx.ctx = keep.ctx; Sfx.season = keep.season; Sfx.musicTick = keep.mt; S.sound = keep.sound;
        DAY_FORCE = null; SEASON_FORCE = -1; QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.first !== 'none' || r.again !== 'none') f('a first look at a course, or the same season again, chimed: ' + r.first + ' / ' + r.again);
    if (r.autumn !== '1' || r.homeSeen !== 1) f('a home course come round in autumn chimed ' + r.autumn + ' (noted as ' + r.homeSeen + ')');
    if (r.calFirst !== 'none') f('the first look at the Coastal Classic chimed: ' + r.calFirst);
    if (r.winter !== '2') f('the Coastal Classic gone into winter with the month chimed ' + r.winter);
    if (r.backAutumn !== '1') f('back to autumn it chimed ' + r.backAutumn);
    if (r.midHole !== 'none' || r.midTurn !== '2' || r.midLook !== 'Winter') f('the month turning mid-event: ' + r.midHole + ' then ' + r.midTurn + ', the course looking ' + r.midLook);
    if (r.quiet !== 'none' || r.quietSeen !== 2) f('in a catch-up the turn was ' + (r.quiet !== 'none' ? 'heard' : 'noted') + ' (' + r.quiet + ', ' + r.quietSeen + ')');
    if (r.after !== '1') f('the hole after a catch-up did not chime the turn it passed: ' + r.after);
    if (r.wager !== 'none' || r.afterWager !== '2') f('a wager chimed (' + r.wager + '), or the hole after it did not (' + r.afterWager + ')');
    if (r.dunes !== 'none' || r.dunesNoted) f('a course that never turns chimed or was noted: ' + r.dunes + ', ' + r.dunesNoted);
    if (r.soundOff !== 'none') f('with the sound off a chime was played: ' + r.soundOff);
    // kept: a turning course at a season that exists; gone: a fraction, a
    // course that never turns, one that does not exist, a season past the
    // last, and a season written as words
    if (r.repaired !== '["coastal:2","willow:3"]') f('junk in the save loaded as ' + r.repaired);
    if (r.repairedArr !== '{}') f('a list for the seasons seen loaded as ' + r.repairedArr);
    for (let s = 0; s < r.db.length; s++)
      if (Math.abs(r.db[s] - r.coinDb) > 3 || !(r.db[s] < r.achDb)) f('the chime for season ' + s + ' is ' + r.db[s] + ' dB against the coin\'s ' + r.coinDb + ' and the honour\'s ' + r.achDb);
    return ['no chime on a first look or the same season; a home course in autumn, the Coastal Classic into winter and back, and a month turning mid-event each chime once, in their season\'s manner',
      'none in a catch-up or a wager (the next hole hears it), none on a course that never turns, none with the sound off; junk in the save cleaned',
      'loudness ' + r.db.join(' / ') + ' dB, against the coin\'s ' + r.coinDb + ' and the honour\'s ' + r.achDb];
  }
};
