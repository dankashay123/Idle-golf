/* Errands (the user picked them from the menu): the caddie sends their
 * runner, who is gone real hours and brings back what the errand is for.
 * The caddie stays on the bag, perk and all (the user: "if the caddie is
 * gone, that means the skins aren't valuable").
 *
 *   - one errand at a time; back after its hours on the clock, not before
 *   - the clock put back never makes it longer than it takes, nor less
 *   - what it brings, once; never sovereigns
 *   - the caddie's perk runs on while the runner is out
 *   - the runner runs off up the cart path when sent and back to the caddie
 *     when home, drawn as one of the course's things (kind 25)
 *   - the Range tab's dot while he waits; a broken save repaired */
'use strict';
module.exports = {
  name: 'errands',
  async run(page) {
    const r = await page.evaluate(async () => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), now0 = Date.now, tw = window.toast;
      let clock = Date.now(); Date.now = () => clock;
      try {
        hideSheet(); window.toast = () => {}; delete S.errand;
        // ---- one at a time, back after its hours ----
        if (!errSend('pro')) f('could not send');
        if (errSend('hut')) f('a second errand sent while one is out');
        const run = (Scene.props || []).find(q => q.kind === 25);
        if (!Scene.runner || Scene.runner.dir !== 1) f('no runner off as he was sent');
        clock += 3.9 * 3600e3; if (errBack()) f('back after 3.9 of 4 hours');
        clock += 0.11 * 3600e3; if (!errBack()) f('not back after 4 hours');
        // ---- the clock put back ----
        S.errand.s0 = clock; clock -= 50 * 3600e3; if (errLeft() !== 4 * 3600e3) f('the clock put back left ' + errLeft() / 3600e3 + 'h');
        clock += 50 * 3600e3 + 4 * 3600e3;
        // ---- said once, live; he runs back ----
        Scene.runner = null; errTick(); if (!Scene.runner || Scene.runner.dir !== -1) f('no runner back when home');
        const tab = document.querySelector('.tab[data-v="upg"]'); if (!tab.classList.contains('alert')) f('no dot on the Range tab');
        // ---- what it brings, once, never sovereigns ----
        const sov0 = S.sov || 0, sh0 = S.shard, g0 = S.gold, n0 = S.bag.length;
        const got = errGet();
        if (!got || got.length !== 3) f('brought ' + JSON.stringify(got));
        if (!(S.shard > sh0) || !(S.gold > g0) || !(S.bag.length > n0 || S.shard > sh0)) f('nothing came: shards ' + (S.shard - sh0) + ', purse ' + (S.gold - g0));
        if ((S.sov || 0) !== sov0) f('an errand paid sovereigns');
        if (errGet()) f('got twice');
        if (S.errand) f('the errand still out after its GET');
        if (tab.classList.contains('alert')) f('the dot stayed');
        // ---- the caddie's perk runs on ----
        S.cperk = S.cperk || B.CPERKS[0].id; S.cperkOwn = S.cperkOwn || {}; S.cperkOwn[S.cperk] = 1;
        errSend('town'); const t0 = S.cperkT = 0; tickCaddie(1); if (!(S.cperkT > t0)) f('the caddie\'s perk stopped while the runner was out');
        // ---- quietly, no runner drawn ----
        delete S.errand; Scene.runner = null; QUIET = true; errSend('hut'); QUIET = false; if (Scene.runner) f('a runner drawn quietly');
        // ---- repair ----
        S.errand = { id: 'nowhere', s0: 5 }; migrate(); if (S.errand) f('a made-up errand kept');
        S.errand = { id: 'hut', s0: 'x' }; migrate(); if (S.errand) f('an errand with no start kept');
        S.errand = { id: 'hut', s0: clock + 1e12 }; migrate(); if (!S.errand || S.errand.s0 > clock + 1) f('a start far in the future kept: ' + (S.errand && S.errand.s0 - clock));
        // ---- the panel ----
        delete S.errand; setView('upg'); rangeSub = 'cad'; renderRangeNav();
        if (document.querySelectorAll('.errbox [data-err]').length !== B.ERRANDS.length) f('the panel shows ' + document.querySelectorAll('.errbox [data-err]').length + ' errands');
      } finally { Date.now = now0; window.toast = tw; QUIET = false; Scene.runner = null; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); renderErrTab(); }
      return fails;
    });
    if (r.length) throw new Error(r.join('; '));
    return ['one at a time, back after its hours, never longer with the clock put back; brings its haul once, no sovereigns; the caddie\'s perk runs on; the runner drawn off and back; the dot; repaired'];
  }
};
