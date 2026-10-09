/* The sound's balance by measure (the user asked for a sound check): every
 * sound rendered alone, offline, through the game's own gains, and its
 * loudest tenth of a second read.
 *
 *   - the animals and the ambience at least 12dB under the club's strike:
 *     quiet, now and then, under everything else
 *   - the skins' moments no louder than the cup's tune
 *   - the night track's loudness within 2dB of the day's (it was meant a
 *     shade quieter and measured 5dB over) */
'use strict';
module.exports = {
  name: 'mix',
  async run(page) {
    const r = await page.evaluate(async () => {
      hideSheet(); Sfx.init();
      for (let i = 0; i < 80 && (!Sfx.recs.strike || !Sfx.recs.music || !Sfx.recs.music2); i++) await new Promise(r => setTimeout(r, 100));
      const real = { ctx: Sfx.ctx, out: Sfx.out, master: Sfx.master, recBus: Sfx.recBus, musBus: Sfx.musBus, init: Sfx.init, on: Sfx.on };
      const rnd = Math.random; let sd = 7; Math.random = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const measure = async (fn, secs) => {
        const off = new OfflineAudioContext(1, Math.round(44100 * secs), 44100);
        const px = new Proxy(off, { get: (o, k) => k === 'state' ? 'running' : (typeof o[k] === 'function' ? o[k].bind(o) : o[k]) });
        Sfx.ctx = px; Sfx.out = off.createGain(); Sfx.out.gain.value = 0.35; Sfx.out.connect(off.destination);
        Sfx.master = off.createGain(); Sfx.master.connect(Sfx.out); Sfx.recBus = off.createGain(); Sfx.recBus.connect(Sfx.master);
        Sfx.musBus = off.createGain(); Sfx.musBus.connect(Sfx.out); Sfx.init = () => px; Sfx.on = () => true; Sfx.lastSwing = -9;
        fn(0.05);
        const d = (await off.startRendering()).getChannelData(0), W = 4410; let best = 0;
        for (let i = 0; i + W < d.length; i += 441) { let s = 0; for (let j = i; j < i + W; j += 2) s += d[j] * d[j]; best = Math.max(best, Math.sqrt(s / (W / 2))); }
        return best > 0 ? 20 * Math.log10(best) : -200;
      };
      const S2 = Sfx, o = {};
      const mus = k => t => { const s = S2.ctx.createBufferSource(), g = S2.ctx.createGain(); g.gain.value = S2.MUS_VOL * (S2.MUS_GAIN[k] || 1); s.buffer = S2.recs[k]; s.connect(g); g.connect(S2.musBus); s.start(t, 20); };
      try {
        o.strike = await measure(t => S2.play('strike'), 2);
        o.cup = await measure(t => S2.play('cup'), 3);
        o.calls = {};
        for (const [k, fn] of [['gull', t => S2.gull(t)], ['quack', t => S2.quack(t)], ['hawk', t => S2.hawk(t)], ['chirp', t => S2.chirp(t)], ['cricket', t => S2.cricket(t)],
          ['frogs', t => S2.frogs(t)], ['crow', t => S2.crow(t)], ['gameBird', t => S2.gameBird(t)], ['fox', t => S2.foxBark(t)], ['owl', t => S2.owl(t)], ['cheer', t => S2.play('cheer')]])
          o.calls[k] = await measure(fn, 3);
        o.moments = {};
        for (const [k, fn] of [['hellfire', t => S2.hellfire(t, true)], ['choir', t => S2.choir(t, true)], ['ascend', t => S2.ascend(t, true)], ['inferno', t => S2.flourishSnd(t, 'inferno')]])
          o.moments[k] = await measure(fn, 3);
        o.day = await measure(mus('music'), 8); o.night = await measure(mus('music2'), 8);
      } finally { Object.assign(Sfx, real); Math.random = rnd; }
      return o;
    });
    const f = [], dB = x => x.toFixed(1);
    for (const k in r.calls) if (r.calls[k] > r.strike - 12) f.push(k + ' at ' + dB(r.calls[k]) + 'dB, within 12dB of the strike (' + dB(r.strike) + ')');
    for (const k in r.moments) if (r.moments[k] > r.cup + 0.5) f.push(k + ' at ' + dB(r.moments[k]) + 'dB over the cup\'s tune (' + dB(r.cup) + ')');
    if (Math.abs(r.night - r.day) > 2) f.push('the night track ' + dB(r.night) + 'dB against the day\'s ' + dB(r.day));
    if (f.length) throw new Error(f.join('\n'));
    return ['strike ' + dB(r.strike) + 'dB, cup ' + dB(r.cup) + ', calls ' + dB(Math.min(...Object.values(r.calls))) + ' to ' + dB(Math.max(...Object.values(r.calls)))
      + ', moments to ' + dB(Math.max(...Object.values(r.moments))) + ', music day ' + dB(r.day) + ' night ' + dB(r.night)];
  }
};
