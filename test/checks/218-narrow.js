/* The smallest iPhone, 320 wide (found playing a new player's first hour
 * there): three rows broke into narrow columns.
 *
 *   - the Wager Book's note beside its heading is one line
 *   - the day's featured wager: its name, what it pays and when it changes
 *     are each one line (the time drops under when there is no room)
 *   - the Trophy Room's free sovereigns: the name is one line, with how often
 *     and how long to wait under it, the time never broken
 *   - the Guide's heading ("Seen 2/82 ...") is one line */
'use strict';
module.exports = {
  name: 'narrow',
  async run(page) {
    await page.setViewportSize({ width: 320, height: 640 });
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {};
      const lines = e => { const cs = getComputedStyle(e), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3; return Math.round(e.getBoundingClientRect().height / lh); };
      try {
        hideSheet(); delete S.dgnRun; S.tierMax = 0; S.tier = 0; S.freeT = 240;
        setView('dgn'); renderDgn();
        await new Promise(r => setTimeout(r, 60));
        const note = document.getElementById('dgnNote');
        if (!/Auto-play from Card/.test(note.innerText)) f('the note reads "' + note.innerText + '"');
        if (lines(note) !== 1) f('the Wager Book\'s note is on ' + lines(note) + ' lines');
        if (note.getBoundingClientRect().right > innerWidth) f('the note runs off the screen');
        const fb = document.getElementById('dgnFeat');
        for (const sp of fb.children) { if (lines(sp) !== 1) f('"' + sp.innerText + '" is on ' + lines(sp) + ' lines');
          if (sp.getBoundingClientRect().right > innerWidth - 4 || sp.getBoundingClientRect().left < 4) f('"' + sp.innerText + '" runs off the screen'); }
        o.featH = Math.round(fb.getBoundingClientRect().height);
        // the Trophy Room
        document.getElementById('roomBtn').click();
        const tab = t => { const e = document.querySelector('#sheet button[data-room="' + t + '"]'); if (e) e.click(); return !!e; };
        if (!tab('today')) f('no Today page');
        await new Promise(r => setTimeout(r, 60));
        const row = [...document.querySelectorAll('#sheet .lb.rep')].find(e => /^Free/.test(e.innerText));
        if (!row) f('no free sovereigns row');
        else { const name = row.firstElementChild, sub = name.querySelector('i.rd');
          if (!sub || !/Every 8 hours/.test(sub.innerText) || !/Next.in.\d/.test(sub.innerText)) f('under the name: "' + (sub ? sub.innerText : '') + '"');
          else { if (/ /.test(sub.textContent.split('Next')[1])) f('the time can break: ' + JSON.stringify(sub.textContent));
            o.sub = lines(sub); if (o.sub > 2) f('the line under the name runs to ' + o.sub);
            const nameH = name.getBoundingClientRect().height - sub.getBoundingClientRect().height, lh = parseFloat(getComputedStyle(name).lineHeight) || parseFloat(getComputedStyle(name).fontSize) * 1.3;
            if (nameH > lh * 1.5) f('"Free Sovereigns" is on more than one line (' + Math.round(nameH) + 'px)'); } }
        if (!tab('guide')) f('no Guide page');
        await new Promise(r => setTimeout(r, 60));
        const head = [...document.querySelectorAll('#sheet .eyebrow')].find(e => /^Seen/i.test(e.innerText));
        if (!head) f('no Guide heading'); else if (lines(head) !== 1) f('the Guide\'s heading is on ' + lines(head) + ' lines');
      } finally { hideSheet(); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); setView('upg'); renderAll(); }
      return { fl, o };
    });
    await page.setViewportSize({ width: 390, height: 844 });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['at 320 wide: the Wager Book\'s note on one line, the featured wager\'s three parts unbroken (' + r.o.featH + 'px), free sovereigns named on one line with their time under it, the Guide\'s heading on one line'];
  }
};
