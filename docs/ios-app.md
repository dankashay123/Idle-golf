# The iPhone app

The plan the user decided on (8 October), and what the game already does for
it. Nothing of the app is built yet: the first session on his Mac starts it.

## Decisions

- **Wrap, don't rewrite.** `index.html` stays the whole game, unchanged in
  shape; **Capacitor** puts it in an Xcode project. No Unity, no Swift
  rewrite. The checks (`node test/run.js`) keep running on `index.html`.
- **Name:** Mythic Mulligan. **Seller:** the user, as an individual.
- **Apple account:** the **free** one first (his own iPhone through Xcode,
  each install lasting 7 days; Run again in Xcode renews it and keeps the
  save, deleting the app loses it). The $99 Developer Program only when he
  wants TestFlight or the store.
- **Where the work happens:** Claude Code on his Mac (Xcode needs a Mac),
  in his clone of the repo. Game changes can still be made in cloud
  sessions; the app picks them up when the Mac pulls `main` and rebuilds.
- **Bundle ID:** ask him before choosing (something like
  `com.<name>.mythicmulligan`); it can never change once on the store, and
  changing it makes a different app (an empty save, another of the free
  account's few app slots).
- **Sound:** starts as the app opens (he asked) and **follows the silent
  switch** (he chose to keep that).

## Starting the Mac session

He opens Terminal, `cd` into his clone, pulls `main` and runs `claude`.
A first message that works:

> Read HANDOFF.md and docs/ios-app.md. Then check my Mac is ready for the
> iPhone app (Xcode, its command line tools, Node.js) and tell me in plain
> steps anything I need to install or click. Then build the Capacitor
> shell as the note says, ask me for the bundle ID first, and get it
> running in the simulator and then on my iPhone.

Afterwards, a game change made in a cloud session reaches the phone with:
"pull main, rebuild the iPhone app and run it on my phone". The free
account's install lasts 7 days; running it again from Xcode renews it and
keeps the save.

## What the game already does for the app

- **Never a developer copy in the app.** Capacitor serves the page from
  `capacitor://localhost`, which `devOK()` read as this computer: the
  developer menu (free sovereigns) would have been on for every player.
  `inApp()` (protocol `capacitor:`, or `Capacitor.isNativePlatform()`, or
  `window.__inApp` for the checks) now turns it off; `exploits` checks it.
- **No "Add to Home Screen" prompt in the app:** `isStandalone()` counts
  `inApp()`, so the Settings line and the Keep Your Save Safe sheet stay
  hidden, and the status bar's top padding (`--topPad`) applies.
- **Sound at once:** `Sfx.unlock()` runs at boot and on coming back
  (`visibilitychange`). A browser refuses until the first tap; the app must
  allow it: set the web view's `mediaTypesRequiringUserActionForPlayback`
  to none (in Capacitor, a small `CAPBridgeViewController` subclass or the
  iOS config). The game sets `navigator.audioSession.type = 'ambient'`,
  which follows the silent switch (keep it).
- **Loading screen:** `#boot` draws its first frame from a small script at
  the top of `<body>` before the 3.6 MB page finishes, then `bootGo` plays
  the tee shot at the end of `boot()`. iOS also shows a still launch screen
  first: make it the loader's night-to-dawn colour (`#20234F` at the top)
  so the change is seamless. Under `navigator.webdriver` (the checks) the
  loader removes itself.
- **Fonts are inside the file** (Libre Caslon, Josefin Sans, base64), so
  the app needs no network for them.
- **The page already** has `viewport-fit=cover`, `env(safe-area-inset-*)`
  in its CSS, and a home screen icon drawn at 180x180 (`setIcons`) that can
  be exported for the app icon (the store needs 1024x1024: draw it at that
  size, no transparency).

## Order of work

1. **Check the Mac:** Xcode (opened once, signed in to his Apple ID for a
   free Personal Team), its command line tools, Node.js LTS; on the
   iPhone, Developer Mode on (Settings, Privacy & Security; it appears
   after the phone has been plugged into the Mac once).
2. **The shell:** `npm install @capacitor/core @capacitor/cli
   @capacitor/ios`, `npx cap init "Mythic Mulligan" <bundle id>
   --web-dir www`, a small script that copies `index.html` into `www/`
   before `npx cap sync ios` (keep the repo's own layout as it is), `npx
   cap add ios`. Commit the `ios/` folder and the config; `www/` is built.
3. **Phone fit:** run in the simulator at the small and large iPhones,
   upright and on its side; status bar and home bar clear; sound on at
   open; the game pausing and catching up as the app leaves and returns
   (`visibilitychange` already drives it; check it fires in the app).
4. **On his phone:** Xcode, the phone as the run target, his Personal
   Team for signing, then on the phone trust the developer (Settings,
   General, VPN & Device Management).
5. **Later sessions:** saves kept by the app too (Capacitor Preferences,
   iCloud key-value backup, carrying over the web save); real purchases
   with StoreKit (sovereign packs, Starter Pack, Tour Pass monthly,
   Membership monthly subscription, Founder's items, Restore Purchases),
   replacing "nothing charged" (`buyPack`, `buyStarter`, `passBuy`, `buyMember`, the
   `usd` looks); then TestFlight, the store page (privacy policy, age
   rating, screenshots, description) and review.

Write here how to build and run it once it exists, and keep `HANDOFF.md`'s
line about the app pointing at this file.
