import Resources from '../resources';
import EnemiesManager from './enemies';
import { FieldType } from './fields';
import PlatformManager from './platforms';
import { TurretType } from './turret';

export enum PowerupType {
  HP,
  SLOW_MODULE,
  STOP_MODULE,
  HINT,
}

export default class World {
  private tmap!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private platforms: PlatformManager;
  private enemies: EnemiesManager;

  private spawnPoint = new Phaser.Math.Vector2();
  private finishSensor!: Phaser.GameObjects.Zone;
  private killZones: Killzone[] = [];
  private powerUps: Phaser.GameObjects.Sprite[] = [];

  constructor(private scene: Phaser.Scene) {
    this.platforms = new PlatformManager(this.scene);
    this.enemies = new EnemiesManager(this.scene);
  }

  load(key: string, path: string) {
    this.reset();
    this.platforms.reset();
    this.enemies.reset();

    this.killZones = [];
    this.powerUps = [];

    if (this.scene.cache.tilemap.has(key)) {
      this.onTilemapLoaded(key);
    } else {
      this.scene.load.on('filecomplete', (fileKey: string) => {
        if (fileKey === key) {
          this.onTilemapLoaded(key);
        }
      });

      this.scene.load.tilemapTiledJSON(key, path);
    }
  }

  init() {
    this.initTilemap();
    this.enemiesManager.init();
  }

  update(time: number) {
    this.enemies.update(time);
  }

  enableDebug() {
    this.tmap.renderDebug(this.scene.add.graphics(), {
      tileColor: null,
      collidingTileColor: new Phaser.Display.Color(100, 50, 255, 50),
      faceColor: new Phaser.Display.Color(100, 50, 255, 255)
    });
  }

  get spawn() {
    return this.spawnPoint;
  }

  get tilemap() {
    return this.tmap;
  }

  get ground() {
    return this.groundLayer;
  }

  get bounds() {
    return new Phaser.Geom.Rectangle(this.ground.x, this.ground.y, this.ground.width, this.ground.height);
  }

  get platformColliders() {
    return this.platforms.platforms;
  }

  get finishLevelSensor() {
    return this.finishSensor;
  }

  get killzones() {
    return this.killZones;
  }

  get enemiesManager() {
    return this.enemies;
  }

  get turrets() {
    return this.enemies.enemyTurrets;
  }

  get turretDetectors() {
    return this.enemies.enemyTurrets.map(t => t.playerDetector);
  }

  get powerups() {
    return this.powerUps;
  }

  get startModules(): FieldType[] {
    if (this.tmap.properties instanceof Array) {
      for (const prop of (this.tmap.properties as { name: string, value: number | string | boolean }[])) {
        if (prop.name === 'start_modules') {
          if (prop.value === 1)
            return [FieldType.SLOW];
          else if (prop.value === 2)
            return [FieldType.SLOW, FieldType.STOP];
        }
      }
    }

    return [];
  }

  private reset() {
    this.spawnPoint.set(0, 0);
    this.killZones = [];
  }

  private onTilemapLoaded(key: string) {
    // Create tilemap
    this.tmap = this.scene.make.tilemap({ key });

    // Load tile set images
    for (const ts in Resources.Tilesets) {
      this.scene.load.image('map.ts.' + ts, Resources.Tilesets[ts]);
    }
  }

  private initTilemap() {
    // Tile layers
    for (const l of this.tmap.layers) {
      const tileset = this.tmap.addTilesetImage('tileset', 'map.ts.main');
      const layer = this.tmap.createLayer(l.name, tileset).setPipeline('Light2D');

      if (l.name === 'ground')
        this.groundLayer = layer;
    }

    // Object layers
    for (const l of this.tmap.objects) {
      if (l.name === 'interactive') {
        this.parseInteractiveLayer(l);
      } else if (l.name === 'platforms') {
        this.parsePlatforms(l);
      } else if (l.name === 'enemies') {
        this.parseEnemies(l);
      }
    }

    // Initialize collisions
    this.tmap.setCollisionFromCollisionGroup(true, true, this.groundLayer);
  }

  private parseInteractiveLayer(layer: Phaser.Tilemaps.ObjectLayer) {
    for (const obj of layer.objects) {
      if (obj.name === 'spawn')
        this.spawnPoint.set(obj.x || 0, obj.y || 0);
      else if (obj.name === 'finish')
        this.createFinishDetector(obj.x!, obj.y!, obj.width!, obj.height!);
      else if (obj.name === 'killzone')
        this.createKillzone(obj.x!, obj.y!, obj.width!, obj.height!);
      else if (obj.name === 'hp')
        this.createPowerup(obj.x!, obj.y!, PowerupType.HP, 'powerup.hp', {});
      else if (obj.name === 'slow')
        this.createPowerup(obj.x!, obj.y!, PowerupType.SLOW_MODULE, 'timeslow', {});
      else if (obj.name === 'stop')
        this.createPowerup(obj.x!, obj.y!, PowerupType.STOP_MODULE, 'timestop', {});
      else if (obj.name === 'hint') {
        let hint = '';
        if (obj.properties) {
          for (const prop of obj.properties) {
            if (prop.name === 'hint')
              hint = prop.value;
          }
        }

        if (hint)
          this.createPowerup(obj.x!, obj.y!, PowerupType.HINT, 'hint', { hint });
      }
    }
  }

  private createFinishDetector(x: number, y: number, width: number, height: number) {
    const zone = this.scene.add.zone(x + width / 2, y + height / 2, width, height);
    this.scene.physics.add.existing(zone, true);
    this.finishSensor = zone;

    const sprite = this.scene.add.sprite(x + width / 2, y, 'end');
    this.scene.add.tween({
      targets: sprite,
      duration: 1000,
      repeat: -1,
      yoyo: true,
      alpha: 0.3
    });
  }

  private createKillzone(x: number, y: number, width: number, height: number) {
    const zone = new Killzone(this.scene, x + width / 2, y + height / 2, width, height);
    this.scene.physics.add.existing(zone, true);
    this.killZones.push(zone);
  }

  private createPowerup(x: number, y: number, type: PowerupType, texture: string, extraData: { [key: string]: string }) {
    const sprite = this.scene.add.sprite(x, y, texture);
    sprite.setData('type', type);

    for (const key in extraData)
      sprite.setData(key, extraData[key]);

    this.scene.physics.add.existing(sprite, true);
    this.powerUps.push(sprite);

    this.scene.add.tween({
      targets: sprite,
      duration: 1500,
      repeat: -1,
      yoyo: true,
      alpha: 0.5
    });
  }

  private parsePlatforms(layer: Phaser.Tilemaps.ObjectLayer) {
    for (const obj of layer.objects) {
      let speed = 0.5;
      const loop = obj.polygon ? true : false;

      if (obj.properties) {
        for (const prop of obj.properties) {
          if (prop.name === 'speed')
            speed = prop.value;
        }
      }

      this.platforms.addPlatform(obj.x!, obj.y!, obj.polygon ? obj.polygon! : obj.polyline!, speed, loop);
    }
  }

  private parseEnemies(layer: Phaser.Tilemaps.ObjectLayer) {
    for (const obj of layer.objects) {
      if (obj.name === 'turret') {
        let type = TurretType.REGULAR;
        if (obj.properties) {
          for (const prop of obj.properties) {
            if (prop.name === 'type')
              type = prop.value;
          }
        }

        this.enemies.addTurret(type, obj.x! + obj.width! / 2, obj.y!, obj.width!, obj.height!);
      }
    }
  }
}

export class Killzone extends Phaser.GameObjects.Zone {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y, width, height);
  }
}
