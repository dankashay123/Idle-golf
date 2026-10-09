/* The pop-ups wait for the course's name (the user asked: at a new event the
 * honours and sightings piled onto the big name across the field). A pop-up
 * raised while the name is up does not show until it has gone, then shows; one
 * raised with the menu pulled up over the field (the name out of sight) shows
 * at once; at most four wait. */
'use strict';
module.exports = {
  name: 'toastwait',
  async run(page) {
    const r = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms)), T = document.getElementById('toasts'), o = {};
      hideSheet(); T.innerHTML = ''; QUIET = false; document.getElementById('app').classList.remove('big');
      Scene.announce = { name: [], sub: [], label: 'X', subLabel: 'Y', t: 0, dur: 1.2, w0: performance.now() };
      toast('first'); toast('second');
      o.during = T.children.length;
      await wait(1500); o.after = [...T.children].map(e => e.textContent).join('|');
      T.innerHTML = '';
      Scene.announce = { name: [], sub: [], label: 'X', subLabel: 'Y', t: 0, dur: 1.2, w0: performance.now() };
      document.getElementById('app').classList.add('big'); toast('menu'); o.menu = T.children.length;
      document.getElementById('app').classList.remove('big'); Scene.announce = null; T.innerHTML = '';
      return o;
    });
    const f = [];
    if (r.during) f.push(r.during + ' pop-ups over the course\'s name');
    if (!/first/.test(r.after)) f.push('after the name had gone: ' + r.after);
    if (r.menu !== 1) f.push('with the menu up a pop-up waited for a name out of sight');
    if (f.length) throw new Error(f.join('\n'));
    return ['pop-ups held while the course\'s name is up and shown after it (' + r.after + '); none held under the menu'];
  }
};
