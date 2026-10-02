/* The user's own sounds for the strike, the putt and the cup (the user:
 * "Club hit.mp3: Any shot from the tee box and fairway"; the putting file's
 * "first sound ... for putting ... The rest of the sound is the ball going in
 * the cup ... split the .mp3 into 2 sounds"; "I just don't want the sound
 * cut off when a new hole starts, but I also don't want the sound to bleed
 * over to a new hole either"):
 *
 *   - all three recordings decode, each in its own slot
 *   - the strike's crack comes at once (it was cut so it lands as he swings)
 *   - the cup's sound is heard out before the next hole: played at its
 *     slowest it falls silent before the wait after the ball drops is up
 *   - a new hole lets go of any cup sound still playing; the same hole
 *     drawn again does not
 */
'use strict';
module.exports = {
  name: 'golfsounds',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = { fails: [] }, f = m => o.fails.push(m);
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const dec = async k => { const el = document.getElementById('rec-' + k); if (!el) return null;
        const bin = atob(el.textContent.trim()), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        try { return await new AC(1, 32000, 32000).decodeAudioData(u.buffer); } catch (e) { return null; } };
      const B = {};
      for (const k of ['strike', 'putt', 'cup']) { B[k] = await dec(k); if (!B[k]) f('the ' + k + ' recording does not decode'); }
      if (o.fails.length) return o;
      // where it is loud, and where it last is more than a whisper
      const shape = b => { const d = b.getChannelData(0); let pk = 0, at = 0; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > pk) { pk = Math.abs(d[i]); at = i; }
        let last = 0; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > pk * 0.03) last = i;
        return { peak: +(at / b.sampleRate).toFixed(3), last: +(last / b.sampleRate).toFixed(3), len: +b.duration.toFixed(3) }; };
      const S2 = {}; for (const k in B) S2[k] = shape(B[k]);
      o.shape = S2;
      if (S2.strike.peak > 0.12) f('the strike\'s crack comes ' + S2.strike.peak + 's into it');
      if (S2.putt.peak > 0.15) f('the putt\'s tap comes ' + S2.putt.peak + 's into it');
      // (played at its slowest, 0.95 of its speed: see Sfx.play)
      const heard = S2.cup.last / 0.95;
      o.cup = heard.toFixed(2) + 's against ' + CUP_HOLD + 's';
      if (heard > CUP_HOLD - 0.03) f('the cup\'s sound is heard for ' + heard.toFixed(2) + 's, and the next hole comes ' + CUP_HOLD + 's after the ball drops');
      if (S2.cup.last < 0.3) f('the cup\'s sound is over in ' + S2.cup.last + 's: cut short');
      // a new hole lets the cup's sound go
      const keep = Sfx.hush; let hushed = 0; Sfx.hush = k => { if (k === 'cup') hushed++; };
      try { const h = Scene.hole; Scene.newHole(h, Scene.tier); const same = hushed; Scene.newHole(h + 1, Scene.tier); o.hush = [same, hushed - same];
        if (same) f('the same hole drawn again let the cup\'s sound go');
        if (hushed - same !== 1) f('a new hole did not let the cup\'s sound go'); }
      finally { Sfx.hush = keep; QUIET = false; startHole(); }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['strike, putt and cup decode: ' + JSON.stringify(r.shape), 'the cup heard for ' + r.cup + '; a new hole lets it go'];
  }
};
