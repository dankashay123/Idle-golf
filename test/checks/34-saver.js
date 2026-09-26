/* The battery saver.
 *
 * Left untouched for the wait chosen in the settings (2 minutes unless
 * changed), the screen goes black with a small golfer and a tally of what the
 * round has done since. A tap wakes it, and the settings can start it at once.
 *
 *   - it comes on after the wait and not before; set to Off it never does;
 *     any touch puts the wait back to the start
 *   - while it is on the round plays at full pace, the course is not drawn,
 *     and the frames come ten a second rather than sixty
 *   - the tally counts what happened since it came on: purse, holes, clubs
 *     and the best of them, levels and cups
 *   - the little golfer wears the outfit that is on
 *   - out of sight it plays nothing (the return is paid by the catch-up, and
 *     a timer left running would pay the same time twice)
 *   - a tap wakes it without the tap landing on the button underneath
 *   - the settings row cycles Off / 1 / 2 / 5 min, and Start turns it on
 *   - a save with junk in its setting loads it as the default
 */
'use strict';
module.exports = {
  name: 'saver',
  async run(page, opts) {
    const wait = ms => page.waitForTimeout(ms);
    const o = await page.evaluate(() => {
      window.__SNAP = JSON.stringify(S);
      const o = { def: defaultState().saver, mins: saverMins() };
      // spies: the course's drawing, the loop's steps, the saver's frames
      window.__draws = 0; window.__dt = 0; window.__frames = 0;
      const d0 = Scene.draw;
      Scene.draw = function(){ window.__draws++; return d0.apply(this, arguments); };
      const s0 = window.step;
      window.step = function(dt){ window.__dt += dt; return s0.apply(this, arguments); };
      const f0 = window.saverFrame;
      window.saverFrame = function(){ window.__frames++; return f0.apply(this, arguments); };
      SAVER_AUTO = true;
      // Off: never on its own, however long
      S.saver = 0; touchedAt = performance.now() - 3600e3;
      return o;
    });
    const f = m => { throw new Error(m); };
    if (o.def !== undefined || o.mins !== 2) f('a new save waits ' + o.mins + ' min, not 2');

    await wait(600);
    const offStays = await page.evaluate(() => !SAVER);
    if (!offStays) f('set to Off, the saver came on by itself');

    // a minute's wait, with 59.5s of it gone: not yet, then on
    await page.evaluate(() => { S.saver = 1; touchedAt = performance.now() - 59500; });
    await wait(150);
    const early = await page.evaluate(() => !!SAVER);
    // a touch puts the wait back to the start
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
    await wait(900);
    const touched = await page.evaluate(() => !!SAVER);
    if (early || touched) f('the saver came on ' + (early ? 'before its minute was up' : 'straight after a touch'));
    await page.evaluate(() => { touchedAt = performance.now() - 61000; });
    await wait(600);
    const on = await page.evaluate(() => !!SAVER && $('saver').classList.contains('on')
      && getComputedStyle($('saver')).display !== 'none');
    if (!on) f('a minute untouched on a one minute wait and the saver did not come on');

    // ---- while it is on ---------------------------------------------------
    await page.evaluate(() => { window.__draws = 0; window.__dt = 0; window.__frames = 0; window.__t0 = performance.now(); });
    await wait(3000);
    const run = await page.evaluate(() => ({ wall: (performance.now() - window.__t0) / 1000,
      dt: window.__dt, draws: window.__draws, frames: window.__frames }));
    if (run.draws) f('the course was drawn ' + run.draws + ' times behind the saver');
    const fps = run.frames / run.wall;
    if (fps > 14 || fps < 5) f('the saver ran at ' + fps.toFixed(1) + ' frames a second, not about ten');
    if (Math.abs(run.dt - run.wall) > 0.35) f('the round played ' + run.dt.toFixed(2) + 's in ' + run.wall.toFixed(2) + 's behind the saver');

    // the tally: counted from when it came on
    const tally = await page.evaluate(() => {
      S.gold += 5000; S.totalHoles += 7; S.lv += 2; S.cups = (S.cups || 0) + 1;
      const it = makeItem(S.tier + 3, 0, 3); it.rar = 3; it.aff = []; delete it.set;
      bagAdd(it);
      // (the round plays on behind it, and a club it drops in the next
      // second made two one run in twenty: none is kept while this counts)
      window.__bagAdd = bagAdd; window.bagAdd = () => false;
      return { name: it.name };
    });
    await wait(1300);
    // The tally is rewritten once a second while the round keeps earning, so
    // it is read, and what it should say worked out, in the same instant:
    // read a moment apart the two differed by a hole's purse, one run in forty.
    const both = await page.evaluate(() => {
      saverStats();
      const el = $('saverStats');
      const tile = k => { const t = [...el.querySelectorAll('.awst')].find(x => x.querySelector('.awk').textContent === k);
        return t ? t.querySelector('.awv').textContent : null; };
      const row = k => { const r = [...el.querySelectorAll('.lb')].find(x => x.children[1].textContent === k);
        return r ? r.children[2].textContent : null; };
      const V = SAVER;
      window.bagAdd = window.__bagAdd;
      return { shown: { purse: tile('purse'), holes: tile('holes'), clubs: tile('clubs'), lv: row('Career Levels'),
                        cups: row('Cups Won'), best: row('Best Club'), since: $('saverFor').textContent },
               purse: { want: fmt(Math.max(0, S.gold - V.gold)), holes: fmt(S.totalHoles - V.holes, 0) } };
    });
    const shown = both.shown, purse = both.purse;
    if (shown.purse !== '+' + purse.want) f('the tally says ' + shown.purse + ' purse, not +' + purse.want);
    if (shown.holes !== purse.holes || !(parseInt(shown.holes) >= 7)) f('the tally says ' + shown.holes + ' holes, not ' + purse.holes);
    if (shown.clubs !== '1' || shown.best !== tally.name) f('a club found shows as ' + shown.clubs + ' clubs, best "' + shown.best + '"');
    if (shown.lv !== '+2' || shown.cups !== '1') f('two levels and a cup show as ' + shown.lv + ' and ' + shown.cups);
    if (!/^For \d/.test(shown.since)) f('the time on reads "' + shown.since + '"');

    // the golfer wears what is on: each outfit's shirt is on the canvas, and
    // the other's is not
    const looks = await page.evaluate(async () => {
      const has = col => {
        const c = $('saverCv').getContext('2d'), d = c.getImageData(0, 0, SAVER_W, SAVER_H).data;
        const v = parseInt(col.slice(1), 16), r = v >> 16, g = v >> 8 & 255, b = v & 255;
        for (let i = 0; i < d.length; i += 4) if (d[i] === r && d[i + 1] === g && d[i + 2] === b) return true;
        return false;
      };
      const two = B.OUTFITS.filter(x => !x.fx && x.shirt).slice(0, 8);
      const a = two[0], b = two.find(x => x.shirt.toLowerCase() !== a.shirt.toLowerCase()
        && x.shirt2 !== a.shirt && x.shirt3 !== a.shirt && a.shirt2 !== x.shirt && a.shirt3 !== x.shirt);
      const out = [];
      for (const [on, off] of [[a, b], [b, a]]) {
        S.styleOwn['o:' + on.id] = 1; S.outfit = on.id; buildSprites();
        await new Promise(r => setTimeout(r, 250));
        out.push(on.id + ':' + has(on.shirt) + '/' + has(off.shirt));
      }
      return out;
    });
    if (looks.some(x => !x.endsWith(':true/false'))) f('the saver golfer did not change with the outfit: ' + looks.join(', '));

    // out of sight it plays nothing
    const hid = await page.evaluate(async () => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      window.__dt = 0;
      await new Promise(r => setTimeout(r, 800));
      const dt = window.__dt;
      delete document.hidden;
      return dt;
    });
    if (hid > 0) f('with the page out of sight the saver played ' + hid.toFixed(2) + 's');

    // A tap wakes it, and does not reach the settings button underneath. On a
    // touch screen: there the click that follows a touch lands on whatever is
    // under the finger by then, so a saver that went on the touch let the tap
    // through. A mouse never shows it.
    const ctx = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    let woke;
    try {
      const tp = await ctx.newPage();
      const errs = [];
      tp.on('pageerror', e => errs.push(e.message));
      await tp.goto(opts.url);
      await tp.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
      await tp.evaluate(() => { hideSheet(); saverNow(); });
      await tp.waitForTimeout(400);
      const at = await tp.evaluate(() => { const r = $('setBtn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await tp.evaluate(() => { const d0 = Scene.draw; window.__draws = 0;
        Scene.draw = function(){ window.__draws++; return d0.apply(this, arguments); }; });
      await tp.touchscreen.tap(at.x, at.y);
      await tp.waitForTimeout(400);
      woke = await tp.evaluate(() => ({ off: !SAVER && !$('saver').classList.contains('on'),
        sheet: $('veil').classList.contains('on'), draws: window.__draws }));
      if (errs.length) f(errs.join('; '));
    } finally { await ctx.close(); }
    if (!woke.off) f('a tap did not wake the saver');
    if (woke.sheet) f('the tap that woke the saver also opened the settings under it');
    if (!(woke.draws > 5)) f('the course was not drawn again after waking (' + woke.draws + ' frames)');
    await page.evaluate(() => saverOff());

    // ---- settings -----------------------------------------------------------
    const set = await page.evaluate(() => {
      S.saver = 2; settingsSheet();
      const find = () => [...document.querySelectorAll('#sheet .setrow')].find(x => x.querySelector('.nm').textContent === 'Battery Saver');
      const seen = [];
      for (let i = 0; i < 4; i++) { const r = find(); seen.push(r.querySelector('button').textContent); r.querySelector('button').click(); }
      const r = find();
      const start = [...r.querySelectorAll('button')].find(b => b.textContent === 'Start');
      start.click();
      return { seen: seen.join(','), after: S.saver, on: !!SAVER, sheet: $('veil').classList.contains('on') };
    });
    if (set.seen !== '2 min,5 min,Off,1 min' || set.after !== 2) f('the setting cycled ' + set.seen + ' and ended on ' + set.after);
    if (!set.on || set.sheet) f('Start left the saver ' + (set.on ? 'on' : 'off') + ' and the sheet ' + (set.sheet ? 'open' : 'shut'));

    // ---- a save with junk in it --------------------------------------------
    const rep = await page.evaluate(() => {
      saverOff();
      const out = [];
      for (const v of ['5', 3, -1, null, 1e9]) { S.saver = v; initState(); if (S.saver !== undefined) out.push(JSON.stringify(v) + ' loaded as ' + S.saver); }
      for (const v of [0, 1, 2, 5]) { S.saver = v; initState(); if (S.saver !== v) out.push(v + ' loaded as ' + S.saver); }
      return out;
    });
    if (rep.length) f('a save with junk in its saver setting: ' + rep.join('; '));

    await page.evaluate(() => {
      Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(window.__SNAP));
      SAVER_AUTO = false; QUIET = false; OFFLINE = false; startHole();
    });
    return ['off never, a minute untouched on, a touch puts it back; the round plays on at '
      + (run.dt / run.wall * 100).toFixed(0) + '% pace, ' + fps.toFixed(1) + ' frames a second, course not drawn',
      'tally: purse, holes, club and best club, levels, cups; the golfer changes with the outfit (' + looks.join(', ') + ')',
      'hidden plays nothing; a tap wakes it without reaching the button under it; settings cycle and Start'];
  }
};
