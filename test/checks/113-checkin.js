/* The Daily Check-In (the user asked): a calendar of 28 rewards a month, one
 * claim a day, from a button under the settings (in the column down the left) that opens by itself once
 * a day while a claim waits.
 *
 *   - 28 claims over 28 days pay exactly the table, in order
 *   - a second claim the same day pays nothing; day 29 of a month has none
 *   - a new month starts the calendar again; a clock put back opens nothing
 *   - wager entries go past the cap when they are full, and stay there
 *   - the button: under the cog (beside it where the column splits), clear of everything at 320 to 440 wide
 *     and on its side, its dot while a claim waits
 *   - the sheet: 28 tiles, nothing wider than the sheet at 320 wide
 *   - it opens by itself while a claim waits (after the away card), never
 *     once claimed; a broken save is repaired
 */
'use strict';
const SIZES = [[320, 640], [390, 844], [440, 956], [844, 390]];
module.exports = {
  name: 'checkin',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet();
        const d0 = Date.UTC(2027, 2, 1) / 86400000;           // 1 March 2027
        delete S.checkin; DAY_FORCE = d0;
        const cur = k => k === 'gold' ? S.gold : k === 'tick' ? S.tickets || 0 : k === 'sov' ? S.sov || 0
          : k === 'keys' ? B.DGN.map(d => S.dgnKeys[d.id]) : k === 'bag' ? S.bagsOpened || 0 : S[k];
        let sov = 0, keysOver = 0;
        B.CHECKIN.forEach((rw, i) => {
          DAY_FORCE = d0 + i;
          if (rw.k === 'keys') B.DGN.forEach(d => { S.dgnKeys[d.id] = entryCap(d); });   // full: it goes past
          if (rw.k === 'tick') S.tickets = 0;
          const want = ciAmt(rw), was = cur(rw.k), sov0 = S.sov || 0;
          if (!checkinReady()) f('day ' + (i + 1) + ' was not open');
          checkinClaim();
          const now = cur(rw.k);
          if (rw.k === 'keys') { B.DGN.forEach((d, j) => { if (now[j] !== was[j] + want) f('day ' + (i + 1) + ': ' + d.id + ' entries ' + was[j] + ' to ' + now[j]); });
            keysOver++; }
          else if (rw.k === 'bag') { if (now !== was + 1) f('day ' + (i + 1) + ' opened ' + (now - was) + ' bags');
            const h = (document.querySelector('#sheet h3') || {}).textContent;
            if (h !== ciBag(rw).n) f('day ' + (i + 1) + ' showed "' + h + '", not the ' + ciBag(rw).n); }
          else if (Math.abs(now - was - want) > 1e-6 * Math.max(1, want)) f('day ' + (i + 1) + ' (' + rw.k + ') paid ' + (now - was) + ', not ' + want);
          if (rw.k !== 'sov' && (S.sov || 0) !== sov0) f('day ' + (i + 1) + ' paid sovereigns');
          sov += (S.sov || 0) - sov0;
          // a second claim the same day: nothing
          const again = JSON.stringify([S.checkin, S.gold, S.sov, S.grit, S.shard, S.scroll, S.tickets, S.dgnKeys]);
          if (checkinClaim() !== null || checkinReady()) f('day ' + (i + 1) + ' could be claimed twice');
          if (JSON.stringify([S.checkin, S.gold, S.sov, S.grit, S.shard, S.scroll, S.tickets, S.dgnKeys]) !== again) f('a second claim on day ' + (i + 1) + ' paid');
          hideSheet();
        });
        o.sov = sov;
        const want = B.CHECKIN.reduce((t, x) => t + (x.k === 'sov' ? x.v : 0), 0);
        if (sov !== want) f('the month paid ' + sov + ' sovereigns, not ' + want);
        // entries past the cap stay past it
        B.DGN.forEach(d => { S.dgnKeys[d.id] = entryCap(d) + 2; S.dgnKeyT[d.id] = 0; }); regenKeys(1e5);
        if (B.DGN.some(d => S.dgnKeys[d.id] !== entryCap(d) + 2)) f('entries past the cap did not hold: ' + JSON.stringify(S.dgnKeys));
        // day 29: the calendar is done
        DAY_FORCE = d0 + 28;
        if (checkinReady() || checkinClaim()) f('a 29th claim in March');
        // a new month starts again; a clock put back opens nothing
        const a1 = Date.UTC(2027, 3, 1) / 86400000; DAY_FORCE = a1;
        if (!checkinReady() || S.checkin.n !== 0) f('April did not start again: ' + JSON.stringify(S.checkin));
        checkinClaim(); hideSheet();
        for (const back of [a1 - 1, a1 - 40, a1 - 400]) {
          DAY_FORCE = back;
          if (checkinReady() || checkinClaim()) f('the clock put back to ' + back + ' opened a claim');
        }
        if (S.checkin.n !== 1 || S.checkin.last !== a1) f('putting the clock back changed the calendar: ' + JSON.stringify(S.checkin));
        DAY_FORCE = a1; if (checkinReady()) f('the day already claimed opened again after the clock came back');
        DAY_FORCE = a1 + 1; if (!checkinReady()) f('the next day did not open');
        // the dot
        renderStageBtns();
        if (!$('calBtn').classList.contains('ready')) f('no dot while a claim waits');
        checkinClaim(); hideSheet(); renderStageBtns();
        if ($('calBtn').classList.contains('ready')) f('a dot once claimed');
        // the sheet opens by itself while a claim waits, once, and not once claimed
        DAY_FORCE = a1 + 2; CHECKIN_POPPED = null; CHECKIN_AFTER = false; checkinPop();
        const up = () => $('veil').classList.contains('on') && /Daily Check-In/.test($('sheet').textContent);
        if (!up()) f('it did not open while a claim waited');
        hideSheet(); checkinPop(); if (up()) f('it opened twice in a day');
        checkinClaim(); hideSheet(); CHECKIN_POPPED = null; checkinPop();
        if (up()) f('it opened with today claimed');
        // behind the away card: after it
        DAY_FORCE = a1 + 3; CHECKIN_POPPED = null;
        S.t = Date.now() / 1000 - 3600; offline(); checkinPop();
        if (up() || !/While You Were Away/i.test($('sheet').textContent)) f('it stacked over the away card');
        const play = [...document.querySelectorAll('#sheet button')].find(b => /Play on/.test(b.textContent));
        if (!play) f('no Play on button'); else play.click();
        if (!up()) f('it did not open after the away card closed');
        hideSheet();
        // broken saves
        S.checkin = { m: 'x', n: 1, last: 3 }; migrate(); if (S.checkin !== undefined) f('a month of "x" was kept');
        S.checkin = [1]; migrate(); if (S.checkin !== undefined) f('a list was kept');
        S.checkin = { m: 24327.5, n: 99, last: 20500.7 }; migrate();
        if (JSON.stringify(S.checkin) !== '{"m":24327,"n":28,"last":20500}') f('repaired to ' + JSON.stringify(S.checkin));
      } finally {
        DAY_FORCE = null; CHECKIN_AFTER = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    const fails = r.fails.slice();
    // the button and the sheet at phone widths and on its side
    for (const [w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate(() => { S.perkOn = Object.assign({}, S.perkOn, { hot: 300 }); });
      await page.waitForTimeout(450);
      const L = await page.evaluate(() => {
        renderStageBtns();
        const R = id => { const e = document.getElementById(id); const b = e && e.getBoundingClientRect(); return b && { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width }; };
        const out = { set: R('setBtn'), cal: R('calBtn'), stage: R('stage'), others: ['shopBtn', 'roomBtn', 'perkBtn', 'readout', 'hudClimb'].map(id => [id, R(id)]),
          tip: [...document.querySelectorAll('#buffTip .bl')].filter(e => e.textContent.trim()).map(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; }) };
        checkinSheet();
        const sh = document.getElementById('sheet'), tiles = [...sh.querySelectorAll('.citile')];
        out.tiles = tiles.length;
        out.wide = sh.scrollWidth - sh.clientWidth;
        out.cut = tiles.filter(t => { const b = t.querySelector('b'); return b.scrollWidth > b.clientWidth + 1; }).map(t => t.textContent);
        hideSheet(); delete S.perkOn.hot;
        return out;
      });
      const at = w + '×' + h;
      if (!L.cal || L.cal.w < 20) { fails.push(at + ': no check-in button'); continue; }
      // (under the cog in the column down the left, or beside it where the column splits in two)
      const under = Math.abs(L.cal.l - L.set.l) <= 3 && L.cal.t >= L.set.b - 1 && L.cal.t - L.set.b < 16;
      const beside = L.cal.l >= L.set.r && Math.abs((L.cal.t + L.cal.b) - (L.set.t + L.set.b)) <= 3;
      if (!under && !beside) fails.push(at + ': the button is not under the cog, nor beside it');
      const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      for (const [id, b] of L.others) if (b && b.w > 0 && hit(L.cal, b)) fails.push(at + ': the button overlaps ' + id);
      for (const t of L.tip) if (hit(L.cal, t)) fails.push(at + ': the perk countdown runs over the button');
      if (L.cal.r > L.stage.r) fails.push(at + ': the button is off the stage');
      if (!L.tip.length) fails.push(at + ': no perk countdown to measure');
      if (L.tiles !== 28) fails.push(at + ': ' + L.tiles + ' tiles');
      if (L.wide > 0) fails.push(at + ': the sheet is ' + L.wide + 'px too wide');
      if (L.cut.length) fails.push(at + ': cut short: ' + L.cut.join(', '));
    }
    await page.setViewportSize({ width: 400, height: 860 });
    // a reload opens it while a claim waits, and not once today is claimed
    await page.evaluate(() => { hideSheet(); delete S.checkin; save(); });
    await page.reload();
    await page.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
    const boot1 = await page.evaluate(() => {
      const up = $('veil').classList.contains('on') && /Daily Check-In/.test($('sheet').textContent);
      hideSheet(); checkinClaim(); hideSheet(); save(); return up; });
    if (!boot1) fails.push('it did not open on a load with a claim waiting');
    await page.reload();
    await page.waitForFunction(() => typeof Scene !== 'undefined' && !!Scene.buf, null, { timeout: 15000 });
    const boot2 = await page.evaluate(() => $('veil').classList.contains('on') && /Daily Check-In/.test($('sheet').textContent));
    if (boot2) fails.push('it opened on a load with today claimed');
    if (fails.length) throw new Error(fails.join('\n'));
    return ['28 days pay the table (' + r.sov + ' sovereigns a month); one claim a day, none on day 29, none with the clock put back',
      'entries go past a full cap and stay; a new month starts again; a broken save repaired',
      'the button right of the cog at 320 to 440 and on its side, its dot; 28 tiles at 320; it opens by itself after the away card, not once claimed'];
  }
};
