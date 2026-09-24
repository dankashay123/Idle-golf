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
 *     and a thump; a holed ball is the cup alone, with no gallery;
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
      // the recordings decode in the background once audio has started
      for (let i = 0; i < 40 && o.running && !(Sfx.recs.strike && Sfx.recs.cup && Sfx.recs.music); i++)
        await new Promise(r => setTimeout(r, 50));
      o.recs = Object.keys(Sfx.recs).filter(k => Sfx.recs[k]);
      // count what reaches the speaker: tones, bursts of noise and recordings,
      let n = 0; const played = [];
      const real = Sfx.tone.bind(Sfx), realH = Sfx.hiss.bind(Sfx), realR = Sfx.rec.bind(Sfx);
      Sfx.tone = function () { n++; return real.apply(null, arguments); };
      Sfx.hiss = function () { n++; return realH.apply(null, arguments); };
      Sfx.rec = function (k, t, vol, rate, len) {
        const ok = realR.apply(null, arguments);
        if (ok) { n++; played.push(k); }
        return ok;
      };
      const all = () => { n = 0; for (const k of ['strike', 'hole', 'ach', 'coin', 'level', 'cup', 'buy'])
        { Sfx.lastSwing = -1; Sfx.play(k, -2); } Sfx.birdT = 0.001; Sfx.tick(0.01); return n; };
      // what each course sound is made of, with sound on
      const count = f => { n = 0; played.length = 0; f(); return n; };
      o.parts = { strike: count(() => { Sfx.lastSwing = -1; Sfx.play('strike'); }), strikeRec: played.slice(),
                  holedRec: (count(() => Sfx.play('hole', -1)), played.slice()),
                  birds: count(() => { Scene.night = false; Scene.rain = false; Sfx.birdT = 0.001; Sfx.tick(0.01); }) };
      // and the synthesised sounds still stand in for any recording that cannot decode
      const keep = Sfx.recs; Sfx.recs = {};
      o.synth = { strike: count(() => { Sfx.lastSwing = -1; Sfx.play('strike'); }),
                  holed: count(() => Sfx.play('hole', -2)) };
      Sfx.recs = keep;
      o.errs = [];
      try { o.onCount = all(); } catch (e) { o.errs.push(e.message); }
      toggleSound(); o.offFlag = S.sound; o.offCount = all();
      save(); o.savedOff = JSON.parse(localStorage.getItem(KEY)).sound;
      toggleSound(); o.backOn = S.sound;
      QUIET = true; o.quietCount = all(); QUIET = false;
      Sfx.hold++; o.holdCount = all(); Sfx.hold--;
      Sfx.tone = real; Sfx.hiss = realH; Sfx.rec = realR;
      try { hideSheet(); } catch (e) {}
      return o;
    });
    if (!snd.open) throw new Error('the settings button did not open the settings sheet');
    if (snd.errs.length) throw new Error('playing a sound threw: ' + snd.errs.join('; '));
    if (snd.running && snd.recs.join() !== 'strike,cup,music')
      throw new Error('the recordings that decoded were ' + JSON.stringify(snd.recs) + ', not the strike, the cup and the music');
    // and no gallery: a fast bag holes out every few seconds, and the
    // applause after each hole never stopped. A holed ball is the cup alone.
    if (snd.running && !(snd.parts.strikeRec.join() === 'strike'
        && snd.parts.holedRec.join() === 'cup' && snd.parts.birds >= 1))
      throw new Error('the course sounds are not right: ' + JSON.stringify(snd.parts)
        + ' (a strike is the recorded crack; a holed ball is the cup and nothing else; birds sing)');
    if (snd.running && !(snd.synth.strike >= 4 && snd.synth.holed >= 1 && snd.synth.holed <= 8))
      throw new Error('without the recordings the stand-in sounds are not all there: ' + JSON.stringify(snd.synth));
    if (snd.running && !(snd.onCount >= 7))
      throw new Error('with audio running only ' + snd.onCount + ' notes reached the speaker for 7 sounds');
    if (snd.offFlag !== 0 || snd.offCount || snd.savedOff !== 0)
      throw new Error('switching sound off left ' + snd.offCount + ' notes playing, or did not save');
    if (snd.backOn !== 1) throw new Error('sound would not switch back on');
    if (snd.quietCount || snd.holdCount)
      throw new Error('sound played during a catch-up (' + snd.quietCount + ' / ' + snd.holdCount + ' notes)');

    // ---- the music -------------------------------------------------------------
    const mus = await page.evaluate(async () => {
      const o = {};
      await (Sfx.ctx && Sfx.ctx.resume ? Sfx.ctx.resume().catch(() => {}) : null);
      o.running = !!Sfx.ctx && Sfx.ctx.state === 'running';
      for (let i = 0; i < 60 && o.running && !Sfx.recs.music; i++) await new Promise(r => setTimeout(r, 50));
      o.len = Sfx.recs.music ? +Sfx.recs.music.duration.toFixed(1) : 0;
      const n = () => Sfx.mus.length;
      S.sound = 1; S.music = 1; Sfx.mus = []; Sfx.musicTick(); o.on = n();
      Sfx.musicTick(); o.again = n();                              // one play at a time, not one a frame
      // near its end the next play goes in, overlapping it
      const m = Sfx.mus[0]; if (m) { m.end = Sfx.ctx.currentTime + Sfx.MUS_XF + 0.5; Sfx.musicTick(); } o.looped = n();
      toggleMusic(); o.offFlag = S.music; o.off = n();
      toggleMusic(); o.backOn = n();
      S.sound = 0; Sfx.musicTick(); o.soundOff = n(); S.sound = 1; Sfx.musicTick();
      QUIET = true; Sfx.musicTick(); o.quiet = n(); QUIET = false;
      Sfx.hold++; Sfx.musicTick(); o.hold = n(); Sfx.hold--;
      save(); o.saved = JSON.parse(localStorage.getItem(KEY)).music;
      S.music = 'loud'; initState(); o.repaired = S.music;
      // the app going away fades the music there and then, whether or not
      // the page keeps getting frames
      Sfx.musicTick(); const was = n();
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      o.hidden = was + '/' + n();
      delete document.hidden;
      S.music = 0; Sfx.musicTick(); S.music = 1;
      o.row = /Music/.test((settingsSheet(), document.getElementById('sheet').textContent)); try { hideSheet(); } catch (e) {}
      return o;
    });
    if (mus.running) {
      if (!(mus.len > 60)) throw new Error('the music did not decode (' + mus.len + 's)');
      if (mus.on !== 1 || mus.again !== 1) throw new Error('the music started ' + mus.on + ' plays, then ' + mus.again);
      if (mus.looped !== 2) throw new Error('near the end of the track the next play did not go in under it (' + mus.looped + ')');
      if (mus.offFlag !== 0 || mus.off !== 0 || mus.backOn !== 1) throw new Error('the Music switch: ' + JSON.stringify(mus));
      if (mus.soundOff || mus.quiet || mus.hold)
        throw new Error('music played with sound off, or through a catch-up: ' + JSON.stringify(mus));
    }
    if (mus.running && mus.hidden !== '1/0') throw new Error('the music played on with the app away (' + mus.hidden + ')');
    if (!mus.row) throw new Error('Settings has no Music switch');
    if (mus.repaired !== undefined) throw new Error('a save with music set to junk loaded as ' + mus.repaired);

    // ---- waking audio the way an iPhone allows ------------------------------
    // An iPhone only lets a tap start sound once the finger lifts (touchend
    // or click), hands the audio back 'interrupted' after the app has been
    // away, and wakes it fully only if something plays inside the tap. The
    // game listened on pointerdown alone and resumed only 'suspended', so it
    // never made a sound on one. A stand-in context counts what each tap did.
    const wake = await page.evaluate(() => {
      const real = Sfx.ctx, out = {};
      const fake = state => ({ state, resumes: 0, played: 0,
        resume(){ this.resumes++; return Promise.resolve(); },
        createBuffer(){ return {}; }, destination: {},
        createBufferSource(){ const f = this; return { connect(){}, start(){ f.played++; } }; } });
      try {
        for (const [ev, state] of [['touchend', 'interrupted'], ['click', 'suspended'], ['touchend', 'running']]) {
          const f = fake(state); Sfx.ctx = f;
          document.body.dispatchEvent(new Event(ev, { bubbles: true }));
          out[ev + '/' + state] = f.resumes + '/' + f.played;
        }
      } finally { Sfx.ctx = real; }
      return out;
    });
    if (wake['touchend/interrupted'] !== '1/1' || wake['click/suspended'] !== '1/1')
      throw new Error('a tap did not wake the audio the way an iPhone needs (resumes/silent plays): ' + JSON.stringify(wake));
    if (wake['touchend/running'] !== '0/0') throw new Error('a tap poked audio that was already running: ' + JSON.stringify(wake));

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
      'settings opens from its button; sound ' + (snd.running ? 'plays ' + snd.onCount + ' notes, the '
        + snd.recs.length + ' recordings among them, ' : '')
      + 'goes off and stays off, and is silent through a catch-up',
      'the music plays, loops by overlapping itself, and stops with music or sound off and through a catch-up',
      'a tap wakes audio the way an iPhone needs: on touchend and click, from interrupted and suspended',
      'the Home Screen tip shows once, on an iPhone, after a real session'];
  }
};
