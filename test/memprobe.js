// The phone's memory for pictures over hours of play (HANDOFF rule 77): plays
// 54 holes on each of N courses, drawn as it goes, and after each course
// counts what every live canvas holds (gc first). It should level off.
//
//   node test/serve.js &   then   node test/memprobe.js [courses] [save code file]
//
// One line of JSON a course: MB held, live canvases, game minutes so far.
// 10 October, his save (Card 13), 60 courses, 3.3 game hours: 49 to 91 MB,
// no climb (geometric mean of each ten 54 to 62).
const { chromium } = require('playwright');
const fs = require('fs'); const N = +(process.argv[2] || 30), CODEF = process.argv[3];
(async () => {
  const b = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
  const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:3 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.addInitScript(() => { window.__noShimmer = 1;
    window.__cv = []; const ce = document.createElement.bind(document);
    document.createElement = function(t, o){ const e = ce(t, o); if(String(t).toLowerCase() === 'canvas') window.__cv.push(new WeakRef(e)); return e; };
    window.__mem = () => { gc(); let px = 0, n = 0; window.__cv = window.__cv.filter(r => { const c = r.deref(); if(!c) return false; px += c.width * c.height; if(c.width * c.height) n++; return true; }); return { mb: +(px * 4 / 1048576).toFixed(1), n }; };
  });
  await p.goto('http://localhost:8080/'); await p.waitForTimeout(1500);
  await p.evaluate(async code => { DEV_OFF = true; if(code) loadSaveObject(await readCode(code)); hideSheet(); }, CODEF ? fs.readFileSync(CODEF, 'utf8') : '');
  await p.waitForTimeout(1000);
  const rows = [];
  const nC = await p.evaluate(() => B.COURSE.length);
  let gameT = 0;
  for (let i = 0; i < N; i++) {
    const r = await p.evaluate(([i, nC]) => {
      window.toast = () => {}; hideSheet();
      DEV.course(i % nC);
      let t = 0;
      // play 18 holes: out of sight between, a stretch of drawn frames on each
      const h0 = S.hole;
      for (let h = 0; h < 54; h++) {
        const at = S.hole;
        let D = derive();
        for (let k = 0; k < 60; k++) { step(1/30, D); Scene.draw(1/30, D); t += 1/30; }
        QUIET = true; for (let k = 0; k < 20000 && S.hole === at; k++) { step(B.TICK_MAX, derive()); t += B.TICK_MAX; } QUIET = false;
      }
      hideSheet();
      return { course: B.COURSE[i % nC].n, holes: S.hole - h0, t, ...window.__mem() };
    }, [i, nC]);
    gameT += r.t; r.gameMin = Math.round(gameT / 60); delete r.t;
    rows.push(r); console.log(JSON.stringify(r));
  }
  console.log('errors', errs.slice(0, 5)); await b.close();
})();
