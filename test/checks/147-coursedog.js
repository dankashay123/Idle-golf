/* The course dog, put aside for later (the user: "Don't do the dog, sorry.
 * We will save that for later"): while DOG_ON is off, no dog is drawn and
 * none is offered. What follows is what it does once it is back on.
 *
 * The course dog (the user said "do them all" to the menu): a dog sits
 * behind him as he plays and trots beside him as he walks; the Golden
 * Retriever from the start, a breed more for courses' collections done,
 * picked in the Cabinet, or none. Only for its looks.
 *
 *   - drawn, sitting and walking, standing on the ground (its lowest pixel
 *     at the ground's line where it is, give or take its shadow)
 *   - none with "none", none in a wager, none while he flies
 *   - a breed not yet open falls back to the Golden; the picker; repaired
 *   - nothing it does touches the golfer's stats */
'use strict';
module.exports = {
  name: 'coursedog',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), keep = Scene.drawDog;
      try {
        hideSheet(); QUIET = true; Scene.announce = null;
        const D = derive(), d0 = JSON.stringify(D);
        // ---- put aside: none drawn, none offered ----
        if (DOG_ON) f('the dog is on (put aside for later, the user asked)');
        { DOG_ON = false; S.dog = 'golden';
          const shot0 = () => { Scene.draw(0, D); return Scene.b.getImageData(0, 0, VW, VH).data; };
          const a = shot0(), keepDraw = Scene.drawDog; Scene.drawDog = () => {}; const b = shot0(); Scene.drawDog = keepDraw;
          let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
          if (n) f('put aside, the dog still drew ' + n + ' pixels');
          QUIET = false; trophyRoom('case'); recOpen.wild = 1; renderWild(); if (document.querySelectorAll('#wildRows .dogt').length) f('put aside, the dog still offered'); hideSheet(); QUIET = true;
          DOG_ON = true; }
        const shot = () => { Scene.draw(0, D); return Scene.b.getImageData(0, 0, VW, VH).data; };
        const diff = (on) => { Scene.drawDog = on ? keep : () => {}; const a = shot(); Scene.drawDog = () => {}; const b = shot(); Scene.drawDog = keep;
          let n = 0, lo = -1; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { n++; lo = Math.max(lo, Math.floor(i / 4 / VW)); } return { n, lo }; };
        S.dog = 'golden'; Scene.walkOn = false;
        const sit = diff(true); if (sit.n < 25) f('sitting, the dog drew ' + sit.n + ' pixels');
        const gy = Math.round(Scene.proj(Scene.camD + 0.35, -0.8).y); if (Math.abs(sit.lo - gy) > 2) f('sitting, its foot at ' + sit.lo + ', the ground at ' + gy);
        let walk; { const gp = Scene.golferPose; let kinds = new Set(); const ds = window.dogSprite;
          Scene.golferPose = function () { return Object.assign(gp.apply(this, arguments), { walking: true }); };
          window.dogSprite = function (br, kind) { kinds.add(kind); return ds.apply(this, arguments); };
          try { walk = diff(true); } finally { Scene.golferPose = gp; window.dogSprite = ds; }
          if (!kinds.has('trot')) f('walking, the dog did not trot: ' + [...kinds]); }
        if (walk.n < 20) f('walking, the dog drew ' + walk.n + ' pixels');
        S.dog = 'none'; if (diff(true).n) f('a dog drawn with none');
        S.dog = 'golden'; S.dgnRun = { id: 'x' }; if (dogNow() && Scene.drawDog() !== undefined) f('drawn in a wager'); S.dgnRun = null;
        { const gp = Scene.golferPose; Scene.golferPose = function () { return Object.assign(gp.apply(this, arguments), { heli: true }); };
          try { const fl = diff(true).n; if (fl) f('a dog drawn while he flies: ' + fl); } finally { Scene.golferPose = gp; } }
        // breeds
        S.cwildDone = {}; S.dog = 'dalmatian'; if (dogNow().id !== 'golden') f('a breed not open: ' + dogNow().id);
        B.COURSE.slice(0, 10).forEach(c => S.cwildDone[c.id] = 1); if (dogNow().id !== 'dalmatian') f('ten courses done, the Dalmatian not open');
        if (JSON.stringify(derive()) !== d0 && false) f('');
        { const keepD = S.dog; S.dog = 'golden'; const a = JSON.stringify(derive()); S.dog = 'none'; if (JSON.stringify(derive()) !== a) f('the dog changed the golfer'); S.dog = keepD; }
        // picker
        QUIET = false; trophyRoom('case'); recOpen.wild = 1; renderWild();
        const tiles = document.querySelectorAll('#wildRows .dogt'); if (tiles.length !== DOG_BREED.length + 1) f(tiles.length + ' dog tiles');
        const none = [...tiles].find(t => t.dataset.dog === 'none'); none.click(); if (S.dog !== 'none') f('none not picked');
        hideSheet(); QUIET = true;
        // repair
        S.dog = 'wolf'; migrate(); if (S.dog !== undefined) f('a made-up breed kept');
        return { fails, sit: sit.n, walk: walk.n };
      } finally { DOG_ON = false; Scene.drawDog = keep; QUIET = false; S.dgnRun = null; Scene.heli = 0; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); }
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['put aside: none drawn or offered; switched on: sitting ' + r.sit + ' and walking ' + r.walk + ' pixels, on the ground; none with none, in a wager or in flight; breeds open by collections; the picker; repaired'];
  }
};
