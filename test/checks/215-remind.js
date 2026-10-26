/* Lock-screen reminders (the user chose them, readying the iPhone app):
 * with a stand-in for the app's Local Notifications,
 *
 *   - no Reminders row on the web; in the app a row, off at first
 *   - turned on, the phone is asked; refused, it stays off; allowed, on and
 *     kept in the save
 *   - on leaving the app: the free sovereigns at the time they are ready, the
 *     Membership's at its next day (none when it runs out first), his hours
 *     away used up, the Check-In at the next day; silent; none due between
 *     10pm and 8am (they wait for 9am); every earlier one cancelled first
 *   - coming back cancels them; off, leaving sets none */
'use strict';
module.exports = {
  name: 'remind',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {}, RN = Date.now;
      const tick = () => new Promise(res => setTimeout(res, 0));
      const set = () => document.getElementById('sheet').innerText;
      let pending = new Map(), cancels = 0, grant = 'denied', asked = 0;
      try {
        hideSheet(); QUIET = false;
        settingsSheet(); if (/Reminders/.test(set())) f('the web shows Reminders'); hideSheet();
        window.__inApp = 1;
        window.Capacitor = { Plugins: { LocalNotifications: {
          requestPermissions: () => { asked++; return Promise.resolve({ display: grant }); },
          schedule: o => { for (const n of o.notifications) pending.set(n.id, n); return Promise.resolve(); },
          cancel: o => { cancels++; for (const n of o.notifications) pending.delete(n.id); return Promise.resolve(); } } } };
        delete S.remind;
        settingsSheet(); if (!/Reminders/.test(set())) f('the app has no Reminders row');
        if (!/Reminders[\s\S]{0,80}Off/i.test(set())) f('Reminders are not off at first');
        toggleRemind(); await tick(); await tick(); if (S.remind === 1) f('refused, Reminders came on'); if (!asked) f('the phone was not asked');
        grant = 'granted'; toggleRemind(); await tick(); await tick(); if (S.remind !== 1) f('allowed, Reminders did not come on');
        if (JSON.parse(localStorage.getItem(KEY)).remind !== 1) f('Reminders on are not in the save');
        hideSheet();
        // ---- leaving at 2pm local, a member, the Check-In taken today ----
        const d = new Date(); d.setHours(14, 0, 0, 0); const T0 = d.getTime(); Date.now = () => T0;
        S.freeT = B.FREE_EVERY - 3 * 3600; S.member = 2; S.memberEnd = T0 + 5 * 86400000; S.memberT = 86400 - 5 * 3600;
        const C = checkinNow(); C.last = dayNow(); C.n = Math.min(C.n, 3);
        pending.set(999, { id: 101, body: 'stale' }); pending.set(101, { id: 101, body: 'stale' });
        const N = Remind.plan(); await tick(); await tick();
        const at = id => pending.get(id) && +pending.get(id).schedule.at;
        o.n = pending.size;
        if (pending.get(101) && pending.get(101).body === 'stale') f('an earlier reminder was not cancelled first');
        if (at(101) !== T0 + 3 * 3600000) f('the free sovereigns at ' + new Date(at(101)).toString().slice(16, 21) + ', not 5pm');
        if (at(102) !== T0 + 5 * 3600000) f('the Membership at ' + new Date(at(102)).toString().slice(16, 21) + ', not 7pm');
        const cap = (B.OFFLINE_CAP + permAdd('contract') * 3600) * 1000;
        if (!at(103)) f('no reminder for his hours away used up');
        else { const h = new Date(T0 + cap).getHours(); if (h >= 8 && h < 22 && at(103) !== T0 + cap) f('the hours away reminder not at the time they run out'); }
        if (!at(104)) f('no Check-In reminder');
        for (const [id, n] of pending) { if (id === 999) continue; const h = new Date(+n.schedule.at).getHours();
          if (h >= 22 || h < 8) f('reminder ' + id + ' at night (' + h + ':00)'); if (!n.sound || /default/.test(n.sound)) f('reminder ' + id + ' not silent'); }
        // ---- one that no longer applies is cancelled (the free sovereigns ready now) ----
        { const keepFree = S.freeT; S.freeT = B.FREE_EVERY; Remind.plan(); await tick(); await tick();
          if (pending.has(101)) f('a reminder that no longer applies was left set'); S.freeT = keepFree; }
        // ---- the Membership running out first: none for it ----
        S.memberEnd = T0 + 3600000; pending = new Map(); Remind.plan(); await tick(); await tick();
        if (pending.has(102)) f('a reminder for a Membership that runs out first');
        // ---- at night: wait for 9am ----
        const dn = new Date(T0); dn.setHours(21, 30, 0, 0); Date.now = () => dn.getTime(); S.freeT = B.FREE_EVERY - 3600; pending = new Map(); Remind.plan(); await tick(); await tick();
        { const a = new Date(at(101)); if (a.getHours() !== 9 || a.getDate() === dn.getDate()) f('a free sovereigns reminder due at 10:30pm came ' + a.toString().slice(0, 21)); }
        // ---- the app's own leaving and coming back ----
        let hid = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => hid });
        pending = new Map(); document.dispatchEvent(new Event('visibilitychange')); await tick(); await tick();
        if (!pending.size) f('leaving the app set no reminders');
        hid = false; document.dispatchEvent(new Event('visibilitychange')); await tick(); await tick();
        delete document.hidden;
        // ---- coming back clears; off sets none ----
        if (pending.size) f('coming back left ' + pending.size + ' reminders');
        toggleRemind(); hideSheet(); if (S.remind === 1) f('Reminders did not turn off');
        Remind.plan(); await tick(); await tick(); if (pending.size) f('with Reminders off, leaving set ' + pending.size);
      } finally {
        Date.now = RN; delete window.Capacitor; delete window.__inApp; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['in the app, off at first, the phone asked, kept; on leaving ' + r.o.n + ' set (free sovereigns, Membership, hours away, Check-In) at their times, silent, none at night (9am), earlier ones cancelled; a Membership running out first none; back, cleared; off, none; the web no row'];
  }
};
