/* The game boots, plays itself, and everything downstream of that is alive.
 *
 * This runs first and it is the one check that asserts on the game as a whole
 * rather than on one part of it: the sim produces, the numbers stay numbers,
 * the canvas paints, every screen renders its rows, a Depths run pays out, and
 * the result reaches the save. If this fails, nothing below it means anything.
 *
 * Every figure it asserts against was measured rather than guessed -- a fresh
 * save cards its first hole at about 7.7s, so the wait is generous but bounded,
 * and the row counts come off the data tables so they cannot drift apart. */
'use strict';

const CARD_FIRST_MS = 25000;     // measured at ~7.7s on a fresh save

module.exports = {
  name: 'smoke',
  async run(page) {
    // ---- the numbers are numbers -------------------------------------------
    const bad = await page.evaluate(() => {
      const D = derive(), out = [];
      for (const k in D) {
        const v = D[k];
        if (typeof v !== 'number') continue;
        if (!isFinite(v)) out.push(k + ' = ' + v);
        else if (v < 0) out.push(k + ' = ' + v + ' (negative)');
      }
      if (!(D.dps > 0)) out.push('dps = ' + D.dps);
      return out;
    });
    if (bad.length) throw new Error('derive() came back wrong: ' + bad.join(', '));

    // ---- the canvas is painting, and painting something ---------------------
    const px = await page.evaluate(async () => {
      const grab = () => {
        const g = Scene.buf.getContext('2d');
        const d = g.getImageData(0, 0, Scene.buf.width, Scene.buf.height).data;
        let sum = 0; const seen = new Set();
        for (let i = 0; i < d.length; i += 4 * 97) {
          sum += d[i] + d[i + 1] + d[i + 2];
          seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]);
        }
        return { sum, colours: seen.size };
      };
      const a = grab();
      await new Promise(r => setTimeout(r, 400));
      return { a, b: grab() };
    });
    if (px.a.colours < 20)
      throw new Error('the frame is nearly flat: ' + px.a.colours + ' distinct colours sampled');
    if (px.a.sum === px.b.sum)
      throw new Error('the frame did not change in 400ms -- the scene is frozen');

    // ---- every screen renders its rows, counted off the data tables ---------
    const rows = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const n = id => $(id).children.length;
      const o = {};
      setView('upg');    await sleep(120); o.upg    = [n('upgRows'),   B.UPG.length];
      setView('bag');    await sleep(120); o.slots  = [n('bagGrid'),   B.SLOTS.length];
                                           // the course, the rarity sets, the named sets you hold a piece
                                           // of, and a hint line until you hold one
                                           o.sets   = [n('setBox'), 1 + B.SETS.filter(x => !x.named || x.id in ownedSets()).length
                                                                    + (Object.keys(ownedSets()).length ? 0 : 1)];
                                           o.purse  = [n('purseStrip'), 4];
      setView('skl');    await sleep(120); o.shots  = [n('sklRows'),   B.SKILL.length];
      setView('dgn');    await sleep(120); o.depths = [n('dgnRows'),   B.DGN.length];
      setView('tour');   await sleep(120); o.calendar = [n('seasonBox'), B.SEASON];
      trophyRoom('case'); await sleep(60);   o.record = [n('statRows'), 9 + 1 + 5];   // Seasons Seen, the Signature Week, and a row for each kind of signature hole
                                           o.cabinet = [document.querySelectorAll('#cabBox .shelf').length, 3];
      hideSheet();
      setView('career'); await sleep(120); o.subs   = [n('careerNav'), 4];
                                           o.attrs  = [n('careerBody'), B.STATS.length + 1 + (S.statPts ? 1 : 0)];
      setView('leg');    await sleep(120); o.relics = [n('relicRows'), -1];   // grows as you find them
      setView('upg');
      return o;
    });
    for (const [what, [got, want]] of Object.entries(rows)) {
      if (want === -1) { if (got < 1) throw new Error(what + ' rendered nothing'); continue; }
      if (got !== want) throw new Error(what + ' rendered ' + got + ' rows, expected ' + want);
    }

    // ---- the loop actually produces ----------------------------------------
    // S.t is the timestamp the save was written at, not a clock -- Scene.t is
    // the one that ticks.
    const t0 = await page.evaluate(() => ({ gold: S.gold, holes: S.totalHoles, t: Scene.t }));
    await page.waitForFunction(() => S.totalHoles >= 1, null, { timeout: CARD_FIRST_MS })
      .catch(() => { throw new Error('no hole was carded in ' + (CARD_FIRST_MS / 1000) + 's'); });
    const t1 = await page.evaluate(() => ({
      gold: S.gold, holes: S.totalHoles, t: Scene.t,
      carded: S.scores.filter(Boolean).length,
      cells: document.querySelectorAll('#card .cell.done').length,
      swings: S.swings || null
    }));
    if (!(t1.gold > t0.gold)) throw new Error('purse did not move: ' + t0.gold + ' -> ' + t1.gold);
    if (!(t1.t > t0.t)) throw new Error('the scene clock did not advance: ' + t0.t + ' -> ' + t1.t);
    if (!(t1.holes > t0.holes)) throw new Error('no hole was added: ' + t0.holes + ' -> ' + t1.holes);
    if (!(t1.carded >= 1)) throw new Error('a hole was counted but the scorecard is empty');
    if (t1.cells !== t1.carded)
      throw new Error('scorecard shows ' + t1.cells + ' played holes, state says ' + t1.carded);

    // ---- a Depths contest starts, finishes, and pays ------------------------
    const before = await page.evaluate(() => { setView('dgn'); startDgn(B.DGN[0]); return S.grit; });
    await page.waitForTimeout(800);
    if (!await page.evaluate(() => !!S.dgnRun)) throw new Error('a Depths run would not start');
    await page.waitForFunction(() => !S.dgnRun, null, { timeout: 30000 })
      .catch(() => { throw new Error('the Depths run never finished'); });
    const grit = await page.evaluate(() => S.grit);
    if (!(grit > before)) throw new Error('the Depths run paid nothing: grit ' + before + ' -> ' + grit);

    // ---- and it reaches the save -------------------------------------------
    const saved = await page.evaluate(() => {
      save();
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');   // the game's own key
      if (!raw) return null;
      return { gold: raw.gold, holes: raw.totalHoles, grit: raw.grit };
    });
    if (!saved) throw new Error('nothing was written to localStorage');
    if (!(saved.gold > 0) || saved.holes < 1 || !(saved.grit > 0))
      throw new Error('the save does not hold the progress: ' + JSON.stringify(saved));

    return ['purse ' + Math.round(t1.gold) + ', ' + t1.carded + ' carded, grit '
            + before + '->' + grit + ', ' + px.a.colours + ' colours on the frame',
            Object.keys(rows).length + ' screens rendered their rows, derive() all finite'];
  }
};
