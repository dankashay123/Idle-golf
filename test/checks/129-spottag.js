/* The "Spotted!" tag (the user asked: "a little indicator when an animal is
 * spotted above the minimap. Like 'Fox Spotted!' And the reward if there is
 * one"):
 *
 *   - an animal seen on a hole shows "Fox Spotted!"; two are named, more are
 *     the first and how many more; the new ones first
 *   - under it what came of it: the sovereigns for a first sighting, the
 *     week's hunt counted ("Hunt 2/3") or done with its pay; nothing under a
 *     sighting that pays nothing
 *   - anything else seen the first time (the weather, a season) is a toast
 *     as before, and shows no tag; no tag quietly or away
 *   - the Spotted Tag switch in Settings turns it off (what it said goes
 *     back to a toast)
 *   - it stands just above the map, inside the field, at 320, 390, 440 and on
 *     its side, and is gone after a few seconds
 */
'use strict';
module.exports = {
  name: 'spottag',
  async run(page) {
    const one = () => page.evaluate(async () => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step, tw = window.toast;
      const said = [];
      try {
        hideSheet(); window.step = () => {}; window.toast = m => said.push(String(m)); QUIET = false; OFFLINE = false;
        Scene.placeMap();
        const tag = document.getElementById('spotTag'), txt = () => tag.style.display === 'none' ? '' : tag.textContent;
        const reset = () => { tag.style.display = 'none'; said.length = 0; };
        // one new animal: named, and its pay
        S.guide = {}; delete S.hunt; DAY_FORCE = 20000; const want = huntOf(weekNow());
        const plain = HUNT_DAY.concat(['hedgehog', 'squirrel', 'pheasant']).find(id => !want.includes(id) && GUIDE.some(g => g.id === id));
        reset(); guideAdd([plain]); const nm = GUIDE.find(g => g.id === plain).n;
        if (txt() !== nm + ' Spotted!+' + B.GUIDE_SOV) f('a first ' + nm + ' shows "' + txt() + '"');
        o.first = txt();
        if (said.length) f('a first animal also made a toast: ' + said.join(' | '));
        // seen again: named, nothing under it
        reset(); guideAdd([plain]); if (txt() !== nm + ' Spotted!') f('a second ' + nm + ' shows "' + txt() + '"');
        // two, and three
        const two = GUIDE.filter(g => 'wng'.includes(g.g) && !want.includes(g.id) && g.id !== plain).slice(0, 2).map(g => g.id);
        S.guide[two[0]] = 1; S.guide[two[1]] = 1;
        reset(); guideAdd([plain, two[0]]); if (!/ & /.test(txt()) || !/Spotted!$/.test(txt())) f('two animals show "' + txt() + '"');
        reset(); guideAdd([plain, two[0], two[1]]); if (!/ \+2 Spotted!$/.test(txt())) f('three animals show "' + txt() + '"');
        // the new one named first
        const nw = GUIDE.find(g => g.g === 'w' && !S.guide[g.id] && !want.includes(g.id)).id;
        reset(); guideAdd([plain, nw]); if (!txt().startsWith(GUIDE.find(g => g.id === nw).n + ' & ')) f('a new one with an old one shows "' + txt() + '"');
        // the hunt: counted, then done and paid
        S.guide[want[0]] = 1; S.guide[want[1]] = 1; S.guide[want[2]] = 1;
        reset(); guideAdd([want[0]]); if (!/Hunt 1\/3$/.test(txt())) f('a hunted one shows "' + txt() + '"');
        guideAdd([want[1]]); reset(); guideAdd([want[2]]);
        if (!txt().includes('+' + B.HUNT_SOV) || !/Hunt Done$/.test(txt())) f('the hunt done shows "' + txt() + '"');
        o.hunt = txt();
        // not an animal: a toast, no tag
        reset(); guideAdd(['rain']); if (txt()) f('rain seen the first time shows a tag: "' + txt() + '"');
        if (!said.some(m => /Field Guide/.test(m) && /Rain/.test(m))) f('rain seen the first time said ' + JSON.stringify(said));
        // the switch in Settings off: no tag, a toast as before; back on
        toggleSpotTag(); hideSheet(); const sw = S.spotTag; S.guide[nw] = 0; delete S.guide[nw]; reset(); guideAdd([nw]);
        if (sw !== 0 || txt()) f('with the tag off: switch ' + sw + ', tag "' + txt() + '"');
        if (!said.some(m => /Field Guide/.test(m))) f('with the tag off a first sighting said ' + JSON.stringify(said));
        toggleSpotTag(); hideSheet(); if (S.spotTag !== undefined) f('the switch back on left ' + S.spotTag);
        S.spotTag = 'x'; migrate(); if (S.spotTag !== undefined) f('a junk switch kept');
        // quietly, away
        reset(); QUIET = true; guideAdd([plain]); QUIET = false; if (txt()) f('a tag while quiet');
        reset(); OFFLINE = true; guideAdd([plain]); OFFLINE = false; if (txt()) f('a tag while away');
        // where: just over the map, inside the field
        reset(); guideAdd([plain]);
        const st = document.getElementById('stage').getBoundingClientRect(), tb = tag.getBoundingClientRect(), mp = document.getElementById('holeMap');
        if (tb.left < st.left || tb.right > st.right + 0.5 || tb.top < st.top) f('the tag lies outside the field: ' + JSON.stringify([tb.left, tb.top, tb.right]));
        if (Scene.mapOn) { const mb = mp.getBoundingClientRect(); if (tb.bottom > mb.top + 0.5 || mb.top - tb.bottom > 12) f('the tag ends at ' + tb.bottom + ', the map starts at ' + mb.top);
          if (Math.abs(tb.right - mb.right) > 2) f('the tag\'s right edge ' + tb.right + ' is off the map\'s ' + mb.right); }
        o.at = [Math.round(tb.top - st.top), Math.round(tb.width), !!Scene.mapOn];
        // gone after a few seconds
        await new Promise(r => setTimeout(r, 2900)); if (txt()) f('the tag still up after 2.9s');
      } finally {
        window.step = keep; window.toast = tw; QUIET = false; OFFLINE = false; DAY_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    const out = [];
    for (const [w, h] of [[320, 640], [390, 844], [440, 956], [844, 390]]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(250);
      const r = await one();
      if (r.fails.length) throw new Error(w + 'x' + h + ': ' + r.fails.join('\n'));
      out.push(w + 'x' + h + ' ' + r.at[1] + ' wide at ' + r.at[0] + (r.at[2] ? ' over the map' : ''));
      if (w === 320) out.unshift('"' + r.first + '", the hunt done "' + r.hunt + '"');
    }
    return [out[0], 'two named, three as the first +2, the new first; rain a toast; none quiet or away; gone in a few seconds', out.slice(1).join('; ')];
  }
};
