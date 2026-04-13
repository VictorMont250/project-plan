# Ladybug Adventures Baseline

This repository is a pnpm monorepo with three app targets and shared package folders. In the current baseline, the playable game exists in the web app, the desktop app wraps that same web app in Electron, and the mobile Expo app.

## Current architecture

- `apps/web` contains a thin Phaser bootstrap in `main.js` and a static `index.html` loader.
- `apps/desktop` is an Electron shell that opens `apps/web/index.html` directly, so desktop currently reuses the web game instead of duplicating gameplay code.
- `apps/mobile` is an Expo Router app that currently renders a placeholder screen and does not yet consume the shared game.
- `packages/assets` holds centralized gameplay images.
- `packages/game-core/src/ladybug-game.js` holds shared Phaser gameplay logic.
- `packages/config/src/game-config.js` holds shared game constants used by game-core.

## Baseline behavior to preserve

- Web remains the source of truth for the current playable game.
- Desktop remains a thin Electron wrapper around the current web game.
- Mobile remains separate for now and should not affect the existing web or desktop behavior.
- Gameplay behavior remains unchanged while logic is moved to shared packages.

## Install

From the workspace root:

```bash
pnpm install
```

## Run the current web game

Primary approach (your original approach):

- Open the repository root in VS Code.
- Start Live Server from the repository root folder.
- Open `http://127.0.0.1:<live-server-port>/apps/web`.

Why root matters:

- Shared game-core code uses relative paths to `packages/assets`.
- Serving from the repo root preserves those paths without moving files.

Optional CLI alternative (still local static serving):

```bash
pnpm dlx http-server . -p 8080 -c-1 -o /apps/web
```

This is only static local file serving for browser testing. It is not a gameplay backend server.

## Run the current desktop game

From the workspace root:

```bash
pnpm desktop:start
```

What this does:

- Launches Electron from `apps/desktop`
- Loads `apps/web/index.html` in a desktop window
- Preserves the current desktop behavior of reusing the web implementation

Desktop controls:

- Open the `Game` menu and use `Game Actions` for a dialog with `Reload game` and `Pause/Resume`.
- Quick shortcuts: `Ctrl+Shift+G` (actions dialog), `Ctrl+R` (reload), `Ctrl+P` (pause or resume).

You can also run it directly from the app folder:

```bash
pnpm --dir apps/desktop start
```

## Current mobile status

The mobile app can be started with:

```bash
pnpm mobile:start
```

It now embeds the web Phaser game inside an Expo `WebView` and overlays native touch controls.

Current implementation notes:

- `apps/mobile/app/index.tsx` loads `apps/web` using `?mobile=1` and injects touch state into the web page.
- `apps/web/main.js` reads that query param and calls `createLadybugGame(Phaser, { mobile: true })`.
- `packages/game-core/src/ladybug-game.js` enables a mobile bridge when `mobile` is true.
- The game receives touch input through browser `CustomEvent`s and merges it with keyboard input in the Phaser update loop.

## How mobile commands reach Phaser

The command path is:

1. User presses a native button in Expo (left, right, jump, shoot).
2. `apps/mobile/app/index.tsx` calls `injectJavaScript` on the `WebView`.
3. Injected JS updates `window.__ladybugTouch` and dispatches `ladybug-touch-input`.
4. `packages/game-core/src/ladybug-game.js` listens for `ladybug-touch-input` in `bindMobileBridge`.
5. The Phaser `update()` loop reads `touchState` and applies movement/shoot actions.

Game-to-mobile events use the reverse path:

- Phaser sends `game-started`, `game-win`, and `game-over` using `window.ReactNativeWebView.postMessage(...)`.
- `apps/mobile/app/index.tsx` receives those in `onMessage` and toggles native UI (for example, Restart button visibility).

Important for local testing:

- `GAME_URL` in `apps/mobile/app/index.tsx` must point to a reachable host/port for your machine (typically your LAN IP if testing on a physical phone).

## Practical migration summary

Current reusable implementation status:

- Gameplay logic lives in `packages/game-core/src/ladybug-game.js`
- Shared constants live in `packages/config/src/game-config.js`
- Web bootstrap is now thin in `apps/web/main.js`
- Desktop reuses that implementation by loading the same web files
- Gameplay assets are already shared physically via `packages/assets`
- Mobile target does not require a separate remote game server in this plan

That means the safest next migration steps are architectural, not behavioral: identify what should move out of `apps/web` into shared packages later, while keeping web as the working baseline until mobile integration begins.

## Baseline verification checklist

After installing dependencies, verify the current baseline with:

- Live Server at repo root + `http://127.0.0.1:<live-server-port>/apps/web`
- `pnpm desktop:start`

Optional web CLI check:

```bash
pnpm dlx http-server . -p 8080 -c-1 -o /apps/web
pnpm desktop:start
```

Expected result:

- The web game opens in a browser from `apps/web`
- The desktop app opens an Electron window showing that same game
- No gameplay differences are introduced by these script/documentation changes
