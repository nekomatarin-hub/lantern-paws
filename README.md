# lantern-paws

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/nekomatarin-hub/lantern-paws/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/nekomatarin-hub/lantern-paws/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Lantern Paws is an original arcade game about Mochi, a silver cat in a moonlit garden: gather fallen stars, carry them to stone lanterns to light them, and dash straight through the shadow Glooms that hunt you — every star you carry raises your combo, but one touch spills them all. Light every lantern across 5 waves, Great Lantern included, to win.

## How it's built

Plain ES modules on a canvas — no engine, no build step, no dependencies.

- `game/src/config.js` — every tuning constant: waves, speeds, scores, the palette
- `game/src/world.js` — the game state machine and all the rules (spawning, carrying, dashing, waves)
- `game/src/entities.js` — stars, glooms, pickups, particles and floating text
- `game/src/render.js` — all drawing: the garden, the cat, the HUD and the screens
- `game/src/input.js` / `game/src/audio.js` — keyboard, mouse and touch; WebAudio chimes and mews
- `game/src/shots.js` — seeded scenes behind `?shot=`, so the screenshots are the real game, framed

`main.ts` (Node 22, no dependencies) validates the screenshots and builds `dossier.json` with `vendor/makefun-board.ts`.

## Run it

```sh
node serve.ts --port 8123
# then open http://localhost:8123/ in a desktop browser
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=fs66msvv&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
