/* Settings: sound, backing up and loading a save, erasing it.
 *
 * The save lives only in the browser, and Safari clears a website's storage
 * after seven days away unless it is on the Home Screen. Before this there was
 * no way to take a copy, and erasing the save lived in the developer menu.
 *
 *   - a save code round-trips: export, change everything, import, and the
 *     save comes back as it was -- compressed and plain codes both
 *   - a bad code is refused and the current save is untouched
 *   - loading a code keeps the save it replaced, one step from undone
 *   - the settings button opens the sheet; sound switches off and stays off
 *   - no sound plays switched off, during a catch-up, or while muted by QUIET,
 *     and every sound plays without throwing once audio is running
 *   - the course sounds like a course: a strike is a swoosh, a crack, a ring
 *     and a thump; an eagle brings the gallery in far more than a par does;
 *     and the birds sing on a fine day
 *   - the Home Screen tip turns up once, on an iPhone, after a real session
 */
'use strict';
module.exports = {
  name: 'settings',
  async run(page) {
    // ---- save codes ------------------------------------------------------
    const code = await page.evaluate(async () => {
      try { hideSheet(); } catch (e) {}
      QUIET = true; DEV.gold(200); DEV.lv(30); DEV.set(3); DEV.tierSet(5); QUIET = false;
      try { hideSheet(); } catch (e) {}
      const before = { gold: S.gold, lv: S.lv, tier: S.tier, bag: S.bag.length,
                       equip: B.SLOTS.map(sl => S.equip[sl.id] ? S.equip[sl.id].uid : 0).join(',') };
      const z = await saveCode();
      // a plain code, the kind a browser without compression makes
      const raw = new TextEncoder().encode(JSON.stringify(S));
      const plain = 'MM1.' + b64(raw);
      // change everything, then load the compressed code back
      S.gold = 1; S.lv = 1; S.tier = 0; S.bag = [];
      const o = await readCode(z);
      loadSaveObject(o);
      const after = { gold: S.gold, lv: S.lv, tier: S.tier, bag: S.bag.length,
                      equip: B.SLOTS.map(sl => S.equip[sl.id] ? S.equip[sl.id].uid : 0).join(',') };
      const kept = JSON.parse(localStorage.getItem(KEY + ':before-import') || 'null');
      // and the plain one reads the same
      const p = await readCode(plain);
      // a bad code is refused, and nothing changes
      const g0 = S.gold; let refused = [];
      for (const bad of ['', 'hello', 'MM1.!!!!', 'MM1.' + btoa('{"no":"ver"}'), 'MM1z.AAAA'])
        try { await readCode(bad); } catch (e) { refused.push(e.message); }
      return { before, after, keptGold: kept && kept.gold, plainGold: p.gold, plainLv: p.lv,
               zLen: z.length, plainLen: plain.length, zIs: z.slice(0, 5),
               refused: refused.length, untouched: S.gold === g0, oldT: o.t };
    });
    const b = code.before, a = code.after;
    if (Math.abs(a.gold - b.gold) > 1e-6 * b.gold || a.lv !== b.lv || a.tier !== b.tier
        || a.bag !== b.bag || a.equip !== b.equip)
      throw new Error('a save code did not come back as it went out: ' + JSON.stringify(b)
        + ' became ' + JSON.stringify(a));
    if (code.keptGold !== 1)
      throw new Error('loading a code did not keep the save it replaced');
    if (code.plainLv !== b.lv || Math.abs(code.plainGold - b.gold) > 1e-6 * b.gold)
      throw new Error('a plain (uncompressed) code did not read back the same save');
    if (code.refused !== 5)
      throw new Error('only ' + code.refused + ' of 5 bad codes were refused');
    if (!code.untouched) throw new Error('a refused code changed the save anyway');

    // ---- the sheet, and sound --------------------------------------------
    await page.evaluate(() => { try { hideSheet(); } catch (e) {} });
    await page.click('#setBtn');                 // a real tap: audio may start from here
    const snd = await page.evaluate(async () => {
      const o = {};
      o.open = document.getElementById('veil').classList.contains('on')
        && /Settings/.test(document.getElementById('sheet').textContent);
      await (Sfx.ctx && Sfx.ctx.resume ? Sfx.ctx.resume().catch(() => {}) : null);
      o.running = !!Sfx.ctx && Sfx.ctx.state === 'running';
      // count what reaches the speaker
      // tones and bursts of noise both, since the course sounds are mostly air
      let n = 0; const real = Sfx.tone.bind(Sfx), realH = Sfx.hiss.bind(Sfx);
      Sfx.tone = function () { n++; return real.apply(null, arguments); };
      Sfx.hiss = function () { n++; return realH.apply(null, arguments); };
      const all = () => { n = 0; for (const k of ['strike', 'hole', 'ach', 'coin', 'level', 'cup', 'buy'])
        { Sfx.lastSwing = -1; Sfx.play(k, -2); } Sfx.birdT = 0.001; Sfx.tick(0.01); return n; };
      // what each course sound is made of, with sound on
      const count = f => { n = 0; f(); return n; };
      o.parts = { strike: count(() => { Sfx.lastSwing = -1; Sfx.play('strike'); }),
                  eagle: count(() => Sfx.play('hole', -2)), par: count(() => Sfx.play('hole', 0)),
                  birds: count(() => { Scene.night = false; Scene.rain = false; Sfx.birdT = 0.001; Sfx.tick(0.01); }) };
      o.errs = [];
      try { o.onCount = all(); } catch (e) { o.errs.push(e.message); }
      toggleSound(); o.offFlag = S.sound; o.offCount = all();
      save(); o.savedOff = JSON.parse(localStorage.getItem(KEY)).sound;
      toggleSound(); o.backOn = S.sound;
      QUIET = true; o.quietCount = all(); QUIET = false;
      Sfx.hold++; o.holdCount = all(); Sfx.hold--;
      Sfx.tone = real; Sfx.hiss = realH;
      try { hideSheet(); } catch (e) {}
      return o;
    });
    if (!snd.open) throw new Error('the settings button did not open the settings sheet');
    if (snd.errs.length) throw new Error('playing a sound threw: ' + snd.errs.join('; '));
    if (snd.running && !(snd.parts.strike >= 4 && snd.parts.eagle > snd.parts.par * 3 && snd.parts.birds >= 1))
      throw new Error('the course sounds are not all there: ' + JSON.stringify(snd.parts)
        + ' (a strike is a swoosh, a crack, a ring and a thump; an eagle brings the gallery a par does not; birds sing)');
    if (snd.running && !(snd.onCount >= 7))
      throw new Error('with audio running only ' + snd.onCount + ' notes reached the speaker for 7 sounds');
    if (snd.offFlag !== 0 || snd.offCount || snd.savedOff !== 0)
      throw new Error('switching sound off left ' + snd.offCount + ' notes playing, or did not save');
    if (snd.backOn !== 1) throw new Error('sound would not switch back on');
    if (snd.quietCount || snd.holdCount)
      throw new Error('sound played during a catch-up (' + snd.quietCount + ' / ' + snd.holdCount + ' notes)');

    // ---- the Home Screen tip ----------------------------------------------
    const tip = await page.evaluate(() => {
      const ua = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent');
      Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (iPhone)' });
      try {
        try { hideSheet(); } catch (e) {}
        delete S.homeTip; S.totalHoles = 10; homeTip();
        const early = document.getElementById('veil').classList.contains('on');
        S.totalHoles = 200; homeTip();
        const shown = document.getElementById('veil').classList.contains('on')
          && /Home Screen/.test(document.getElementById('sheet').textContent);
        hideSheet(); homeTip();
        const again = document.getElementById('veil').classList.contains('on');
        return { early, shown, again };
      } finally { delete navigator.userAgent; }
    });
    if (tip.early) throw new Error('the Home Screen tip showed before a real session');
    if (!tip.shown) throw new Error('the Home Screen tip never showed on an iPhone');
    if (tip.again) throw new Error('the Home Screen tip showed twice');

    return ['a save code round-trips (' + code.zIs + ' ' + code.zLen + ' chars, plain '
      + code.plainLen + '), bad codes refused, the replaced save kept',
      'settings opens from its button; sound ' + (snd.running ? 'plays ' + snd.onCount + ' notes, ' : '')
      + 'goes off and stays off, and is silent through a catch-up',
      'the Home Screen tip shows once, on an iPhone, after a real session'];
  }
};
