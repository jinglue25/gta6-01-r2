# gta6-01-r2

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/jinglue25/gta6-01-r2/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/jinglue25/gta6-01-r2/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Port Solana is an original open-world crime game for the desktop browser: play courier Marina Vale in a sun-soaked coastal city, walk the waterfront, borrow a ride, run five connected missions for fixer Dario Venn, and shake the police through pastel streets — free roam after the story.

## Run it

```sh
node serve.ts
```

Use Node 22 with native TypeScript execution (22.18 or newer recommended). Open the loopback address printed by the server. There is no install or build step; the server serves `game/` directly. For another port, run `node serve.ts --port 8081`.

The game runs locally with bundled three.js and procedural scenery, characters, vehicles, and audio. It makes no network requests beyond loading its local files. Audio starts after your first keyboard or mouse gesture. Progress saves in your browser's localStorage at mission handoffs, periodically during play, and when pausing or leaving. Continue restores that browser's saved run; New Game starts over. After finishing, keep exploring or choose Replay Story from the menu.

## Controls

| Input | Action |
| --- | --- |
| W / S / A / D | Walk; accelerate, reverse, and steer in a car |
| Shift | Sprint on foot |
| E | Enter a nearby car or exit after slowing down |
| Mouse click / F | Shoot toward the cursor; hold F for repeated fire |
| Right mouse drag / Left and Right arrow keys | Turn the camera |
| Space | Brake in a car |
| M | Mute or unmute audio |
| Escape | Pause or resume |

## Marina's first day

Marina Vale arrives on the coast with a little cash and a courier's instincts. Fixer Dario Venn offers a simple pickup that turns into a string of hurried handoffs, a stolen coupe, and a police pursuit. Follow the golden marker and the mission text; the minimap shows roads, your position, vehicles, police, and the next destination. Witnesses and nearby patrols can raise the heat when you take a car or open fire. Break the police's line of sight and stay clear until the stars fade.

| Mission | Job | Payout |
| --- | --- | ---: |
| First Run | Bring a ride to the marina pier and collect the sealed package. | $200 |
| Across the Bay | Deliver the package to Luz's beachfront café within 100 seconds. | $350 |
| Borrowed Wheels | Take the marked coral coupe downtown and deliver it to Dario's western garage. | $500 |
| Heat | Escape the police and lose every wanted star. | $400 |
| Last Boat Out | Reach Dario's getaway boat at the pier within 120 seconds, with the city on your tail. | $1,000 |

Missing a timed handoff restarts its clock. A wrecked mission coupe gets a replacement. Arrest sends Marina to Civic Watch with a fine; going down sends her to Sunrise Medical with a treatment fee. Both put her back on the streets. Complete the final job to unlock free roam.

## Files

`game/index.html` supplies the page, local import map, menus, and HUD. `game/vendor/three/` contains the bundled renderer and its license notice. Each file in `game/src/` has a focused job:

- `main.js` — connects the scene, game states, input, camera, rendering, and recovery flow.
- `city.js` — builds roads, buildings, waterfront, palms, clouds, and animated water.
- `vehicles.js` — creates cars and handles traffic, driving physics, and collision checks.
- `player.js` — builds Marina and handles walking, sprinting, and car entry or exit.
- `pedestrians.js` — creates walkers and handles their movement, reactions, and witnesses.
- `police.js` — manages patrols, pursuit, wanted levels, and arrests.
- `combat.js` — handles aiming, gunfire, damage, and combat effects.
- `missions.js` — defines Dario's five jobs, objectives, timers, payouts, and story progression.
- `hud.js` — updates mission text, interaction prompts, health, cash, speed, and minimap.
- `audio.js` — synthesizes music and effects and manages gesture activation and mute.
- `save.js` — validates and stores localStorage saves and clears progress for a new run.
- `shots.js` — seeds screenshot scenes, composes their cameras and action, and signals readiness.
- `style.css` — styles the menus, HUD, typography, and recovery overlays.

## Screenshots and packaging

`shots.json` defines four seeded scenes: chase, drive, mission, and waterfront play. `capture.mjs` serves `game/` on an ephemeral loopback port, uses the shared Playwright installation at `/home/hatch/workspace/makefun/tools/pw`, and finds its bundled chrome-headless-shell. It blocks external page requests, uses SwiftShader for WebGL, and captures at 1280 × 720 after `window.__shotReady` becomes true.

```sh
node capture.mjs
```

The script writes `screenshots/1-chase.jpg`, `2-drive.jpg`, `3-mission.jpg`, and `4-city.jpg`. Each starts at JPEG quality 82 and retries at lower quality down to 70 to meet the 256 KiB cap. It prints each saved file's byte size and fails if a shot still exceeds the limit. Run this in the browser capture environment before preparing the final package.

```sh
MAKEFUN_OUTPUT_DIR=/tmp/port-solana-package node main.ts
```

`main.ts` checks the game's file and size limits, copies `game/` and the available screenshots into the output directory, and writes `dossier.json` using the supplied packaging library. Its summary reports the copied file counts and dossier size. Choose a clean output directory outside the source tree for a fresh package. For unchanged input files, repeated packaging produces byte-identical dossiers.

## License

The project uses the MIT license in [LICENSE](LICENSE). Vendored three.js keeps its own MIT notice. `vendor/makefun-game.ts` is the supplied competition packaging library, unchanged.

<sub>Entered on [make.fun](https://make.fun/?ref=22rep629&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
