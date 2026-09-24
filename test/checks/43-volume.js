/* The volume sliders in Settings: one for the sounds, one for the music.
 *
 *   - a new save is at full on both, and says nothing about it
 *   - each slider sets its own gain and only its own: the music goes out
 *     through the music's gain, every other sound through the effects'
 *   - heard as loudness: half way is a quarter of the gain, 0 is silence
 *   - dragging does not redraw the sheet (that drops the drag), only the
 *     figure beside it changes
 *   - the slider under a sound that is switched off is dimmed
 *   - a save with junk in them loads them at full
 */
'use strict';
module.exports = {
  name: 'volume',
  async run(page) {
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), o = {};
      const keepMus = Sfx.mus;
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const conn = GainNode.prototype.connect;
      try {
        o.def = { fx: S.volFx, mus: S.volMus, f: Sfx.volOf('volFx'), m: Sfx.volOf('volMus') };
        Sfx.init(); const AC = Sfx.ctx;
        for (let i = 0; i < 100 && !Sfx.recs.music; i++) await sleep(50);
        o.decoded = !!Sfx.recs.music;
        // the gains asked for, as each slider moves
        const asked = { fx: [], mus: [] };
        const spy = (bus, k) => { const f = bus.gain.setTargetAtTime.bind(bus.gain);
          bus.gain.setTargetAtTime = (v, t, c) => { asked[k].push(+v.toFixed(3)); return f(v, t, c); }; };
        spy(Sfx.master, 'fx'); spy(Sfx.musBus, 'mus');
        S.sound = 1; S.music = 1; settingsSheet();
        const inp = k => document.querySelector('#sheet input[aria-label="' + k + ' volume"]');
        const a = inp('Sound'), m = inp('Music');
        o.found = !!a && !!m;
        const drag = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
        drag(m, 5);
        o.m5 = { s: S.volMus, fx: asked.fx.slice(), mus: asked.mus.slice(-1)[0], pct: $('volMusPct').textContent, same: m.isConnected };
        drag(m, 0); o.m0 = asked.mus.slice(-1)[0];
        drag(a, 3); o.a3 = { s: S.volFx, fx: asked.fx.slice(-1)[0], pct: $('volFxPct').textContent, same: a.isConnected };
        drag(a, 10); o.a10 = { has: 'volFx' in S, fx: asked.fx.slice(-1)[0] };
        // a reload carries them
        S.volMus = 0.5; Sfx.setVol(); o.reload = asked.mus.slice(-1)[0];

        // where the sounds go: the music through its gain, the rest through the effects'
        const to = [];
        GainNode.prototype.connect = function(d){ to.push(d === Sfx.musBus ? 'mus' : d === Sfx.master ? 'fx' : d === Sfx.out ? 'out' : 'other'); return conn.apply(this, arguments); };
        Sfx.mus = []; QUIET = false;
        const keepWanted = Sfx.musicWanted; Sfx.musicWanted = () => true;
        if (o.decoded) { to.length = 0; Sfx.musicTick(); o.music = to.slice(); }
        Sfx.musicWanted = keepWanted; Sfx.musicFade(AC.currentTime, 0.01);
        to.length = 0; const h = Sfx.hold; Sfx.hold = 0; Sfx.tone(880, AC.currentTime, 0.02, 'square', 0.01); Sfx.hold = h;
        o.tone = to.slice();
        GainNode.prototype.connect = conn;

        // dimmed under a sound switched off
        S.music = 0; settingsSheet();
        o.dimMusic = !!document.querySelector('#sheet .vol.off input[aria-label="Music volume"]');
        o.fxLit = !document.querySelector('#sheet .vol.off input[aria-label="Sound volume"]');
        hideSheet();

        // junk in the save
        o.junk = [];
        for (const v of ['0.5', -0.1, 1, 1.5, NaN, null, {}]) { S.volFx = v; initState(); if (S.volFx !== undefined) o.junk.push(String(v) + ' loaded as ' + S.volFx); }
        for (const [v, w] of [[0, 0], [0.5, 0.5], [0.33, 0.3]]) { S.volMus = v; initState(); if (S.volMus !== w) o.junk.push(v + ' loaded as ' + S.volMus); }
      } finally {
        GainNode.prototype.connect = conn;
        Sfx.mus = keepMus || [];
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        Sfx.setVol(); hideSheet(); QUIET = false; OFFLINE = false; startHole();
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.def.fx !== undefined || r.def.mus !== undefined || r.def.f !== 1 || r.def.m !== 1) f('a new save is not at full volume: ' + JSON.stringify(r.def));
    if (!r.found) f('Settings has no volume sliders');
    if (r.m5.s !== 0.5 || r.m5.mus !== 0.25 || r.m5.pct !== '50%') f('music half way: saved ' + r.m5.s + ', gain ' + r.m5.mus + ', reads ' + r.m5.pct);
    if (r.m5.fx.some(v => v !== 1)) f('moving the music slider set the sounds to ' + r.m5.fx.join(', '));
    if (!r.m5.same || !r.a3.same) f('dragging a slider redrew the sheet');
    if (r.m0 !== 0) f('music at 0 left a gain of ' + r.m0);
    if (r.a3.s !== 0.3 || r.a3.fx !== 0.09 || r.a3.pct !== '30%') f('sounds at 3: saved ' + r.a3.s + ', gain ' + r.a3.fx + ', reads ' + r.a3.pct);
    if (r.a10.has || r.a10.fx !== 1) f('sounds back at full kept a setting in the save, or a gain of ' + r.a10.fx);
    if (r.reload !== 0.25) f('a save at half music loads with a gain of ' + r.reload);
    if (!r.decoded) f('the music never decoded, so where it goes was not tried');
    if (!r.music.includes('mus') || r.music.includes('fx')) f('the music went out through ' + r.music.join(', '));
    if (!r.tone.includes('fx') || r.tone.includes('mus')) f('a sound went out through ' + r.tone.join(', '));
    if (!r.dimMusic || !r.fxLit) f('with the music off its slider is ' + (r.dimMusic ? 'dimmed' : 'lit') + ' and the sounds\' ' + (r.fxLit ? 'lit' : 'dimmed'));
    if (r.junk.length) f('junk in the save: ' + r.junk.join('; '));
    return ['full on a new save; half way is a quarter of the gain, 0 is silence, full leaves nothing in the save',
      'each slider moves only its own: the music through its gain, the other sounds through theirs; the sheet stays put while dragging',
      'dimmed under a sound switched off; junk in the save loads at full'];
  }
};
