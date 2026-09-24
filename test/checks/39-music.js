/* The two music tracks.
 *
 * The town theme plays by day; a calmer track ("Meadow Thoughts", CC0) plays
 * on night rounds and in the wagers. When the round changes from one to the
 * other, the track playing fades out as the other comes in.
 *
 *   - the calm track is in the file and decodes, about two minutes long
 *   - day picks the town theme, a night round or a wager the calm one
 *   - a change of track fades the old one out and starts the new one, and
 *     staying on the same track does not restart it
 * Played through a stand-in audio context: a check's browser may not start
 * real sound.
 */
'use strict';
module.exports = {
  name: 'music',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = {};
      const el = document.getElementById('rec-music2');
      if (el) {
        const bin = atob(el.textContent.trim()), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        const oc = new OfflineAudioContext(1, 44100, 44100);
        try { o.secs = Math.round((await oc.decodeAudioData(u.buffer)).duration); } catch (e) { o.secs = 'fails: ' + e.message; }
      } else o.secs = 'missing';

      const keep = { ctx: Sfx.ctx, master: Sfx.master, recs: Sfx.recs, mus: Sfx.mus, key: Sfx.musKey,
                     night: Scene.night, dgn: S.dgnRun, sound: S.sound, music: S.music };
      try {
        // a stand-in that notes every play started and every fade
        const log = [];
        const param = () => ({ value: 1, setValueAtTime(){}, linearRampToValueAtTime(){ log.push('ramp'); }, cancelScheduledValues(){ log.push('fade'); } });
        const ctx = { state: 'running', currentTime: 10,
          createBufferSource(){ const s = { buffer: null, connect(){}, start(){ log.push('start ' + s.buffer.k); }, stop(){} }; return s; },
          createGain(){ return { gain: param(), connect(){} }; } };
        Sfx.ctx = ctx; Sfx.master = {}; Sfx.mus = []; Sfx.musKey = null;
        Sfx.recs = { music: { duration: 100, k: 'music' }, music2: { duration: 120, k: 'music2' } };
        S.sound = 1; S.music = 1; QUIET = false; S.dgnRun = null;
        const pick = () => Sfx.musicTrack();
        Scene.night = false; o.day = pick();
        Scene.night = true; o.night = pick();
        Scene.night = false; S.dgnRun = { id: 'water' }; o.wager = pick(); S.dgnRun = null;

        Scene.night = false; Sfx.musicTick(); ctx.currentTime += 1; Sfx.musicTick();
        o.dayRun = log.filter(x => x.startsWith('start')).join(',');
        log.length = 0;
        Scene.night = true; ctx.currentTime += 1; Sfx.musicTick();
        o.swap = { faded: log.includes('fade'), started: log.filter(x => x.startsWith('start')).join(',') };
        o.playing = Sfx.mus.map(m => m.key).join(',');
      } finally {
        Sfx.ctx = keep.ctx; Sfx.master = keep.master; Sfx.recs = keep.recs; Sfx.mus = []; Sfx.musKey = keep.key;
        Scene.night = keep.night; S.dgnRun = keep.dgn; S.sound = keep.sound; S.music = keep.music;
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (!(r.secs >= 100 && r.secs <= 140)) f('the calm track: ' + r.secs + ' (want it to decode, about two minutes)');
    if (r.day !== 'music' || r.night !== 'music2' || r.wager !== 'music2') f('tracks picked: day ' + r.day + ', night ' + r.night + ', wager ' + r.wager);
    if (r.dayRun !== 'start music') f('by day the music started ' + (r.dayRun || 'nothing') + ' (want the town theme, once)');
    if (!r.swap.faded || r.swap.started !== 'start music2' || r.playing !== 'music2')
      f('night falling: faded ' + r.swap.faded + ', started ' + (r.swap.started || 'nothing') + ', now playing ' + r.playing);
    return ['the calm track decodes (' + r.secs + 's); town theme by day, the calm one at night and in wagers, faded across on the change'];
  }
};
