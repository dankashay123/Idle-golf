/* The purse a second in the corner holds steady through a hole. It was the
 * last 90 frames (a second and a half), so it read 0 for most of every hole
 * and leapt as the purse landed; it is half-second lots over the last 30s.
 * What pays by the rate (a bank, the Check-In) keeps the short one.
 */
'use strict';
module.exports = {
  name: 'rate',
  async run(page) {
    const r = await page.evaluate(() => {
      const keep = { buf: Meter.buf.slice(), acc: Meter.acc }, o = {};
      try {
        Meter.clear();
        // a purse of 100 every 10s, at 60 frames a second, for a minute
        const seen = [];
        for (let f = 0; f < 3600; f++) {
          if (f % 600 === 599) Meter.add(100);
          Meter.tick(1 / 60);
          if (f >= 1800 && f % 30 === 0) seen.push(Meter.shown());
        }
        o.lo = Math.min(...seen); o.hi = Math.max(...seen);
        // and the corner shows it
        renderLive(derive()); o.text = document.getElementById('rate').textContent;
        o.want = fmt(Meter.shown()) + ' purse/sec';
        // the short one left as it was for what pays
        Meter.clear(); Meter.add(90); Meter.tick(1); o.short = Meter.rate();
        Meter.clear(); o.empty = Meter.shown();
      } finally { Meter.clear(); Meter.buf.push(...keep.buf); Meter.acc = keep.acc; }
      return o;
    });
    if (!(r.lo > 7) || !(r.hi < 13)) throw new Error('a steady 10 a second read from ' + r.lo + ' to ' + r.hi);
    if (r.text !== r.want) throw new Error('the corner reads "' + r.text + '", not "' + r.want + '"');
    if (r.short !== 90) throw new Error('the short rate is ' + r.short + ', not 90');
    if (r.empty !== 0) throw new Error('nothing earned reads ' + r.empty);
    return ['a purse of 100 every 10s reads ' + r.lo.toFixed(1) + ' to ' + r.hi.toFixed(1) + ' a second all the way through', 'the short rate kept for what pays'];
  }
};
