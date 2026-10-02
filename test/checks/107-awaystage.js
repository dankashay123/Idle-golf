/* The away card's stage (the user asked for "a nice little animation of the
 * golfer throwing money above the 'play on' button. Matching whatever skin is
 * equipped"):
 *
 *   - the stage sits right above Play on, the two kept together at the foot
 *     of the card
 *   - he is drawn in what he wears: a skin draws him unlike the plain look,
 *     and her figure unlike his
 *   - he throws money: coins and notes go up over his head and come down,
 *     and none are left lying (they go at the grass)
 *   - the purse counts up to what was earned
 *   - drawing it leaves no pose behind for the course, and the loop stops
 *     once the card is closed
 */
'use strict';
module.exports = {
  name: 'awaystage',
  async run(page) {
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const raf = window.requestAnimationFrame;
      const away = (fit, g) => { hideSheet(); S.outfit = fit; if (fit) S.styleOwn['o:' + fit] = 1; S.gender = g;
        for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites();
        S.t = Date.now() / 1000 - 3 * 3600; QUIET = false; offline(); };
      const film = () => { const cv = document.getElementById('awCv'), fr = [];
        AWAY.t = 0; AWAY.bits = []; AWAY.tossN = -1;
        for (let i = 0; i < 90; i++) { awayDraw(cv, 1 / 30); fr.push(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data); }
        return fr; };
      try {
        window.requestAnimationFrame = () => 0;
        away(null, 'm');
        const cv = document.getElementById('awCv'), play = document.querySelector('#sheet .awplay');
        if (!cv || !play) f('the away card has ' + (cv ? '' : 'no stage') + (play ? '' : ' no Play on'));
        else {
          if (cv.closest('.awfoot') !== play.closest('.awfoot') || !cv.closest('.awfoot')) f('the stage and Play on are not kept together');
          const a = cv.getBoundingClientRect(), b = play.getBoundingClientRect();
          if (!(a.bottom <= b.top + 1 && b.top - a.bottom < 24)) f('the stage is not right above Play on (' + a.bottom + ' / ' + b.top + ')');
          if (a.height < 40) f('the stage is ' + a.height + 'px high');
          // the money: up over his head, then down, and never left lying
          AWAY.t = 0; AWAY.bits = []; AWAY.tossN = -1;
          let most = 0, high = 1e9, low = false, all = 0;
          for (let i = 0; i < 150; i++) { awayDraw(cv, 1 / 30); most = Math.max(most, AWAY.bits.length);
            for (const m of AWAY.bits) { high = Math.min(high, m.y); if (m.vy > 0 && m.t > 0.3) low = true; if (m.y > cv.height - 6) f('money lying on the grass'); } }
          if (most < 5) f('only ' + most + ' coins or notes in the air at once');
          if (high > cv.height - 8 - 36) f('the money never went over his head (highest at ' + high.toFixed(1) + ')');
          if (high < 0) f('the money flew off the top of the stage');
          if (!low) f('the money never came down');
          // drawn in what he wears
          const P = film();
          const diff = (A, B) => { let d = 0; for (let j = 0; j < A.length; j += 3) for (let i = 0; i < A[j].length; i += 16) if (A[j][i] !== B[j][i] || A[j][i + 1] !== B[j][i + 1]) d++; return d; };
          for (const [fit, g] of [['void', 'm'], ['divine', 'm'], [null, 'f'], ['void', 'f']]) {
            away(fit, g); const F = film(); const d = diff(F, P);
            if (d < 40) f((fit || 'plain') + ' ' + g + ' on the stage drawn like the plain look (' + d + ')');
          }
          if (HER_POSE) f('drawing the stage left a pose behind for the course');
          // the purse counts up to what was earned
          const pe = document.getElementById('awPurse'), want = fmt(AWAY.gain);
          AWAY.t = 0; awayDraw(cv, 0.1); const early = pe.textContent;
          for (let i = 0; i < 30; i++) awayDraw(cv, 1 / 30);
          if (AWAY.gain > 0 && early === want) f('the purse showed all of it from the start');
          if (pe.textContent !== want) f('the purse counted to ' + pe.textContent + ', not ' + want);
        }
        // the loop stops once the card is closed
        window.requestAnimationFrame = raf;
        away(null, 'm');
        await new Promise(res => setTimeout(res, 300));
        o.ran = !!AWAY && AWAY.t > 0;
        if (!o.ran) f('the stage never ran');
        hideSheet(); await new Promise(res => setTimeout(res, 200));
        if (AWAY) f('the stage kept running with the card closed');
      } finally {
        window.requestAnimationFrame = raf; HER_POSE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet();
        for (const k in SHOWSPR) delete SHOWSPR[k]; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['the stage sits right above Play on; he throws coins and notes over his head and they come down and go',
      'a skin and her figure are each drawn unlike the plain look; no pose is left for the course',
      'the purse counts up to what was earned; the loop stops when the card closes'];
  }
};
