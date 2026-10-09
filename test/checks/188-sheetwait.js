/* An event's result waits for the sheet he has open (the user asked: it
 * closed the shop on him). An event ended with the shop open leaves the shop
 * as it was and shows nothing until it is closed; then the result comes up.
 * With nothing open it comes up at once. Two ended while he shops come one
 * after another as he closes each; a sheet opened from inside another (the
 * shop's tabs, Back to the shop) is not taken for closing it. */
'use strict';
module.exports = {
  name: 'sheetwait',
  async run(page) {
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), o = {}, wait = ms => new Promise(r => setTimeout(r, ms));
      const sheet = () => document.getElementById('veil').classList.contains('on') ? document.getElementById('sheet').textContent : '';
      try {
        hideSheet(); await wait(400); QUIET = false; S.hole = 73; S.tourScore = -5;
        // nothing open: at once
        endTournament(); o.open = /Next event/.test(sheet()); hideSheet(); await wait(400);
        // the shop open: it stays, nothing until it is closed
        openShop('offers'); endTournament();
        o.shopKept = /The Pro Shop/.test(sheet()) && !/Next event/.test(sheet());
        // moving round the shop (a sheet straight after another) is not closing it
        hideSheet(); openShop('bags'); await wait(450); o.stillShop = /The Pro Shop/.test(sheet()) && !/Next event/.test(sheet());
        hideSheet(); await wait(450); o.after = /Next event/.test(sheet());
        hideSheet(); await wait(450); o.none = sheet() === '';
        // two while in the Trophy Room: one after the other
        trophyRoom('today'); endTournament(); endTournament(); o.roomKept = /Trophy Room/.test(sheet());
        hideSheet(); await wait(450); const a = /Next event/.test(sheet()); hideSheet(); await wait(450); const b = /Next event/.test(sheet());
        hideSheet(); await wait(450); o.two = a && b && sheet() === '';
      } finally { hideSheet(); SHEET_LATER.length = 0; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); }
      return o;
    });
    const f = [];
    if (!r.open) f.push('with nothing open the result did not come up');
    if (!r.shopKept) f.push('an event ending closed the shop or showed over it');
    if (!r.stillShop) f.push('moving between the shop\'s tabs let the result over it');
    if (!r.after) f.push('the result did not come up once the shop was closed');
    if (!r.none) f.push('something more came up after the result');
    if (!r.roomKept || !r.two) f.push('two events in the Trophy Room: kept ' + r.roomKept + ', one after the other ' + r.two);
    if (f.length) throw new Error(f.join('\n'));
    return ['an event ending waits for the shop or the Trophy Room to close, then shows; none over a sheet opened from a sheet; two come one after another'];
  }
};
