# The iPhone app

The plan the user decided on (8 October), and what the game already does for
it. Nothing of the app is built yet: the first session on his Mac starts it
(the checklist below).

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
> steps anything I need to install or click. Then follow The Mac checklist:
> build the Capacitor shell, ask me for the bundle ID first, and get it
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
  in its CSS, and a home screen icon drawn at 180x180 (`setIcons`,
  `drawIconArt`, a crowned winged ball on a gold tee). **The app icon is
  `docs/app-icon-1024.png`** (1024x1024, no transparency, drawn from the
  same art): drop it into Xcode's AppIcon set.

## Real purchases: what the game expects (built 25 October)

Everything sold for money goes through one doorway, `STORE.buy(id)` (the
`PRODUCTS` list). On the web, and in the app until the store is wired,
nothing is charged and a buy is given at once. The app wires it by setting
`window.MMStore` before the game boots (a small bridge over a StoreKit
plugin, such as `@capgo/native-purchases` or `cordova-plugin-purchase`):

- `products(ids)` resolves to `[{ id, price }]`, the price as the store
  shows it in the player's own money; the shop shows those.
- `buy(id)` resolves to `{ ok, tx, end? }` once Apple has the payment (`tx`
  the transaction id; `end`, for Membership, when the month runs out, in
  milliseconds). `ok: false` for a cancel. Nothing is given until then.
- `restore()` resolves to `[{ id, tx, end? }]` of what he owns; the game
  gives back the Starter Pack's place, looks and Membership's days, never
  sovereigns.
- Call `STORE.paid(id, tx, end)` for a payment that lands later: a
  Membership renewal, a purchase interrupted. A `tx` is given once
  (`S.txSeen`), so passing every transaction at launch is safe.

Product ids to create in App Store Connect: `mm.sov.p1` to `mm.sov.p6`
(consumable, the sovereign packs), `mm.starter` (non-consumable),
`mm.member.month` (auto-renewable subscription, a month), `mm.pass.month`
(the Tour Pass, a month: consumable or non-renewing subscription),
`mm.look.<k>.<id>` for any look sold for money (none now). With a store in
the app the shop drops "nothing charged", shows Restore Purchases and says
Membership renews until cancelled. The bags' chances are shown before buying
(Apple's rule for anything random bought with what money buys). Check
`till` uses a stand-in store.


## The save kept by the app (built 25 October)

iOS can clear a web view's storage when the phone runs short of room. In
the app every save is also written through `window.MMSave`, which the app
sets before the game boots:

- `get(key)` resolves to the stored text or `null`; `set(key, text)` and
  `remove(key)` resolve when done. Capacitor Preferences (UserDefaults,
  never cleared, carried by the phone's iCloud backup) is the store.
- At launch the game reads it before writing it. If its count of saves
  (`S.saveSeq`) is ahead of the browser's, it is taken up in place and his
  time away played out; if empty, it is filled. Erasing the save erases it.
  Check `appsave` uses a stand-in.

## Vibration (built 26 October)

The game buzzes on an ace or an albatross seen on the course (a success
buzz) and on a Mythic club (a medium tap), never in a catch-up, never two
within 0.4 seconds, and Settings has a Vibration switch (off is
`S.buzz = 0`). In the app it calls Capacitor's Haptics plugin through
`window.Capacitor.Plugins.Haptics` (`notification({ type: 'SUCCESS' })`
and `impact({ style: 'MEDIUM' })`), so the shell needs
`npm install @capacitor/haptics` and `npx cap sync ios`; nothing else to
wire. Without the plugin the switch is hidden and nothing buzzes. On the
web only a touch phone whose browser vibrates (not Safari) buzzes.

## Reminders (built 26 October)

Off until he turns on Reminders in the Settings, which is when the phone
asks to allow notifications (refused, it stays off). As the app goes to the
background (`visibilitychange`) the game sets, through
`window.Capacitor.Plugins.LocalNotifications`, ids 101 to 104: the free
sovereigns ready, the Membership's day waiting (not past its end), his
hours away used up (play stops there), the next day's Check-In. Anything
due between 10pm and 8am waits for 9am. Coming back cancels them all;
leaving again cancels before it sets. They name the sound `quiet.caf` (no
new sounds): put a short silent `quiet.caf` in the Xcode project's bundle,
or iOS plays its own. The shell needs `npm install
@capacitor/local-notifications`. If the app's leaving does not fire
`visibilitychange` in the web view, call `Remind.plan()` from Capacitor
App's `pause` and `Remind.clear()` from `resume` in the bridge. Check
`remind` uses a stand-in.

## The Mac checklist

**What he does himself** (Claude on the Mac walks him through each):

1. Install **Xcode** from the App Store, open it once, and sign in with his
   Apple ID (Xcode, Settings, Accounts) to get a free Personal Team.
2. Install **Node.js** (the LTS one from nodejs.org).
3. Plug the iPhone into the Mac once, then turn on **Developer Mode**
   (iPhone Settings, Privacy & Security, Developer Mode; it restarts).
4. Choose the **bundle ID** when asked (it never changes afterwards).
5. After the first install, on the phone: Settings, General, VPN & Device
   Management, trust his own developer name.

**What Claude on the Mac does:**

1. Check the tools: `xcode-select -p`, `node -v`, `xcodebuild -version`.
2. Make the shell in an `app/` folder of the repo, leaving the game's own
   layout alone: `npm install @capacitor/core @capacitor/cli
   @capacitor/ios @capacitor/preferences @capacitor/haptics
   @capacitor/local-notifications`, `npx cap
   init "Mythic Mulligan" <bundle id> --web-dir www`, `npx cap add ios`.
3. A copy step (`npm run build`) that puts `index.html` into `www/` with
   one line added at the top of `<head>`: `<script src="bridge.js">`, and
   copies `bridge.js` beside it. The bridge, for now:

   ```js
   // the app's side of the game's doorways (docs/ios-app.md)
   (function () {
     var P = window.Capacitor && window.Capacitor.Plugins;
     if (P && P.Preferences) window.MMSave = {
       get: function (k) { return P.Preferences.get({ key: k }).then(function (r) { return r.value; }); },
       set: function (k, v) { return P.Preferences.set({ key: k, value: v }); },
       remove: function (k) { return P.Preferences.remove({ key: k }); }
     };
     // window.MMStore comes here once real purchases are wired (above)
   })();
   ```

   Haptics and Local Notifications need nothing in the bridge: the game
   finds the plugins itself (add the silent `quiet.caf`, above).
4. Sound at once: the web view's `mediaTypesRequiringUserActionForPlayback`
   set to none (a small `CAPBridgeViewController` subclass).
5. The launch screen in `#20234F`; the app icon from
   `docs/app-icon-1024.png`; upright and on its side both allowed.
6. `npx cap sync ios`, then run in the simulator on a small and a large
   iPhone, upright and on its side: the notch, island and home bar clear
   (check `safeedges` says they are), sound on at open, the game pausing
   and catching up as the app leaves and comes back.
7. Run on his phone with his Personal Team; play a hole, close and reopen
   the app, and see the save is there; Settings shows Vibration and
   Reminders; turn Reminders on, leave the app, and see one arrive.
8. Commit `app/` (with `ios/` and the config; not `www/` or
   `node_modules/`) and write how to rebuild here.

**Later, with the $99 Developer Program:** the products in App Store
Connect (ids above), `window.MMStore` in the bridge over a StoreKit plugin,
TestFlight, then the store page (privacy: nothing collected; age rating;
screenshots; description) and review.

Afterwards a game change reaches the phone with: "pull main, rebuild the
iPhone app and run it on my phone". Keep `HANDOFF.md`'s line about the app
pointing at this file.
