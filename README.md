[Play on Itch.io](https://ovk.itch.io/chronoblaster)

**Chrono Bender** is a 2D paltformer game made in just under two weeks for [Gamedev.js 2023 Jam](https://itch.io/jam/gamedevjs-2023).
The theme of the jam was "time" and the main game mechanics revolves around creating time anomalies that slow or stop the time.
The game was built using [Phaser 3](https://phaser.io) engine.

## Disclaimer
Since this code was written under severe time constraints, it clearly doesn't represent how you should write and structure your game code.
Game mechanics were also changed quite a bit during development, which only added to code inconsistencies and some duplication.
It was also my first time using Phaser 3, so I'm sure many things could be done cleaner and more efficiently.

Nevertheless, I hope the code still could be useful to some.
I had lot of fun working on the game and was pleasantly surprised by the Phaser 3 capabilities and the ease of use.

## Building and Running
First, download and install latest stable version of [Node.js](https://nodejs.org/en), if you don't have it already.

- Install dependencies with `npm install` command.
- To lint code, use `npm run lint` command.
- To build and serve in development mode (with hot reloading) run `npm run dev` command.
- To build distribution package, run `npm run build`.

## Debug Modes
There are few ways to help debugging the game:

- To enable physics debug drawing, set `debug: true` in `config.ts` file.
- To enable debug overlay with scene states, set `debug = true` in `Overlay.ts` file.
- To enable debug drawing for tilemap, uncomment `this.world.enableDebug();` line in `Game.ts` file.
- To enable debug drawing of turret line of sight, uncomment all commented lines with `lineOfSightDebug` variable in `Game.ts` file.

## Editing Levels
Levels for the game are created/edited with amazing open-source tool [Tiled](https://www.mapeditor.org/).
You can open Tiled project in `assets/levels` and browse existing levels, to get general idea of how they structured.
Layer and property names should be pretty self-explanatory, and you can always look at `initTilemap()` method in `World.ts` file.

Moving platforms are created via either path (for a platform going back and forth) or polygon (for a platform following a loop).

New levels should be exported to `public/assets/levels` and named sequentially.

## Assets
I'm not an artist, so while few images/sounds I made myself, most of the art for the game was based on existing assets.

- Tileset - [Metroidvania Sci-fi Tileset by s4m-ur4i](https://s4m-ur4i.itch.io/metroid-scifi-pixelart-tileset).
- Player sprite sheet - [The Robot - Free Sprite](https://www.gameart2d.com/the-robot---free-sprites.html).
- Projectiles sprite sheet - [Pure Projectile - Magic Effect by Cethiel](https://opengameart.org/content/pure-projectile-magic-effect).
- Shock wave effect sprite sheet - [Pixel FX Pack by CodeManu](https://opengameart.org/content/pixel-fx-pack ).
- Turret sprite - [Assets Free: Space Modular Buildings Kit by Wenrexa](https://opengameart.org/content/assets-free-space-modular-buildings-kit).
- Music track - [Namaste by Jason](https://audionautix.com/).
- Jump, hit wall, anomaly fly, power up pickup sounds - [50 CC0 Sci-Fi SFX by rubberduck](https://opengameart.org/content/50-cc0-sci-fi-sfx).
- Player death sound: - [Machine shutting down by Cough-E](https://opengameart.org/content/machine-shutting-down).
- Anomaly launch, anomaly detonate, turret explosion, turret fire sounds - [Sci-fi Sounds by Kenney](https://www.kenney.nl/assets/sci-fi-sounds).
- Player main fire sound - [Space Shoot Sounds by Robin Lamb](https://opengameart.org/content/space-shoot-sounds).
- Time field sounds - [Reversing Time / Stuck in Time by isaiah658](https://opengameart.org/content/reversing-time-stuck-in-time).

Please note, that most of these assets were edited/altered to better fit into the game style.

