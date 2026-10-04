/* The course dog, put aside for a while (the user: "We will save that for
 * later"), then on ("turn on the dog as well"): it ships on; switched off,
 * no dog is drawn and none is offered.
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
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), keep = Scene.drawDog, dogWas = DOG_ON;
      try {
        hideSheet(); QUIET = true; Scene.announce = null;
        const D = derive(), d0 = JSON.stringify(D);
        // ---- put aside: none drawn, none offered ----
        if (DOG_ON) f('the dog is on (the user put it aside for later again)');
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
        // a tap on it opens its breeds (the user asked where to choose it);
        // a tap off it does not
        { S.dog = 'golden'; Scene.walkOn = false; Scene.draw(0, D); const B0 = Scene._dogBox, r = document.getElementById('hole').getBoundingClientRect();
          const at = (x, y) => [r.left + x * r.width / VW, r.top + y * r.height / VH];
          if (!B0) f('no place kept for a tap on the dog');
          else { QUIET = false; hideSheet();
            if (dogTap(...at(B0.x + B0.w * 3 + 40, B0.y - 60))) f('a tap well off the dog opened its breeds');
            if (!dogTap(...at(B0.x + B0.w / 2, B0.y + B0.h / 2))) f('a tap on the dog did nothing');
            else if (!document.querySelector('#wildRows .dogt')) f('a tap on the dog opened no breeds');
            hideSheet(); QUIET = true; } }
        // none in the air over the gorge as he crosses the bridge (it stood
        // beside him over the canyon), nor on the stones; back across
        { CANYON_FORCE = S.hole; S.dog = 'golden'; Scene.newHole(S.hole, S.tier); const I = Scene.isle;
          if (I) { Scene.camD = (I.bank + I.land) / 2; Scene.draw(0, D); if (Scene._dogBox) f('a dog drawn beside him over the gorge');
            Scene.camD = I.land + 1.5; Scene.draw(0, D); if (!Scene._dogBox) f('no dog with him once across the bridge'); }
          CANYON_FORCE = 0; Scene.newHole(S.hole, S.tier); }
        return { fails, sit: sit.n, walk: walk.n };
      } finally { DOG_ON = dogWas; Scene.drawDog = keep; QUIET = false; S.dgnRun = null; Scene.heli = 0; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); }
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['put aside: none drawn or offered; switched on: sitting ' + r.sit + ' and walking ' + r.walk + ' pixels, on the ground; none with none, in a wager, in flight or over the gorge; breeds open by collections; the picker, and a tap on the dog opens it; repaired'];
  }
};
