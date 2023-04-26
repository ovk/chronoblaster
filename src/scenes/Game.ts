import Phaser from 'phaser';
import InputController from '../game/input';
import Player, { AltProjectile, MainProjectile } from '../game/player';
import AbstractProgressLoadScene from './AbstractPreload';
import World, { Killzone, PowerupType } from '../game/world';
import { GameSceneInitData } from './Types';
import Sound from '../sound';
import EffectsManager from '../game/effects';
import FieldsManager, { FieldType } from '../game/fields';
import { Platform } from '../game/platforms';
import Resources from '../resources';
import Settings from '../settings';
import Turret from '../game/turret';
import { EnemyProjectile } from '../game/enemies';

export default class GameScene extends AbstractProgressLoadScene {
  private initData!: GameSceneInitData;
  private world: World;
  private player: Player;
  private effects: EffectsManager;
  private fields: FieldsManager;
  private inputController!: InputController;

  private lineOfSight = new Phaser.Geom.Line();
  // private lineOfSightDebug?: Phaser.GameObjects.Line;

  private playerDamageTween!: Phaser.Tweens.Tween;

  constructor() {
    super('game');

    // Created once, and re-initialized with each level
    this.world = new World(this);
    this.player = new Player(this);
    this.effects = new EffectsManager(this);
    this.fields = new FieldsManager(this);
  }

  init(data: GameSceneInitData) {
    this.initData = data;
  }

  preload() {
    this.initializeLoadingProgress();

    const mapKey = `map.${this.initData.mapIndex}`;
    this.world.load(mapKey, Resources.Levels[mapKey]);

    Sound.loadAll(this.load);

    for (const key in Resources.Sheets) {
      this.load.atlas(key, Resources.Sheets[key] + '.png', Resources.Sheets[key] + '.json');
    }

  }

  create() {
    this.events.emit('respawn');

    Sound.initAll(this);

    if (Settings.musicVolume > 0)
      Sound.playMainMusic(this);

    // World
    this.world.init();
    // this.world.enableDebug();

    this.physics.world.setBounds(this.world.bounds.x, this.world.bounds.y, this.world.bounds.width, this.world.bounds.height);

    // Player
    this.player.init(this.world.spawn);
    this.player.addWeaponModules(this.world.startModules);

    // Camera
    this.cameras.main.startFollow(this.player.object, true, 0.2, 0.2);
    this.cameras.main.setDeadzone(30, 30);
    this.cameras.main.fadeIn(1000);
    this.cameras.main.setZoom(2, 2);
    this.cameras.main.setBackgroundColor(0x2b2b3c);
    this.cameras.main.setBounds(this.world.bounds.x, this.world.bounds.y, this.world.bounds.width, this.world.bounds.height);

    // Lights
    this.lights.enable();
    this.lights.setAmbientColor(0xfefefe);

    // Input
    this.inputController = new InputController(this);
    this.input.setDefaultCursor('url(assets/images/cursor.cur), pointer');

    this.effects.init();
    this.fields.init();

    this.initCollisions();

    //
    // this.lineOfSightDebug = this.add.line(0, 0, 0, 0, 0, 0, 0x0000ff);

    this.playerDamageTween = this.add.tween({
      targets: this.player.object,
      duration: 80,
      yoyo: true,
      angle: { from: -10, to: 10 },
      onComplete: () => this.player.object.setAngle(0)
    }).stop();

    this.events.on('pause', () => {
      Sound.pause(this);
    });

    this.events.on('resume', () => {
      Sound.resume(this);
    });

    this.events.on('pause-game', () => this.pauseGame());
  }

  update(time: number, dt: number) {
    this.player.update(this.inputController, time);
    this.fields.update(time, dt);
    this.world.update(time);
  }

  private playerProjectileObstacleCollision(a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const projectile = (a instanceof MainProjectile ? a : b) as MainProjectile;
    this.effects.explosion(projectile.x, projectile.y);
    projectile.deactivate();
    Sound.hitwall();
  }

  private playerProjectileTurretCollision(a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const projectile = (a instanceof MainProjectile ? a : b) as MainProjectile;
    const turret = (a instanceof MainProjectile ? b : a) as Turret;
    const v = new Phaser.Math.Vector2(turret.x - projectile.x, turret.y - projectile.y).normalize().scale(10).add(projectile);
    this.effects.explosion(v.x, v.y);
    projectile.deactivate();
    Sound.hitwall();

    const dead = this.world.enemiesManager.damageTurret(turret, 15);
    if (dead) {
      this.cameras.main.shake(500, 0.0005, true);
      for (let i = 0; i < 10; i++) {
        const x = Phaser.Math.Between(-16, 16);
        const y = Phaser.Math.Between(0, 16);
        this.effects.explosion(turret.x + x, turret.y + y);
      }
    }
  }

  private playerAltProjectileObstacleCollision(a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const projectile = (a instanceof AltProjectile ? a : b) as AltProjectile;
    if (!projectile.expired) {
      projectile.expire();
      this.addPlayerField(projectile);
    }
  }

  private enemyProjectileObstacleCollision(a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const projectile = (a instanceof EnemyProjectile ? a : b) as EnemyProjectile;
    this.effects.explosion(projectile.x, projectile.y);
    projectile.deactivate();
    Sound.hitwall();
  }

  private enemyProjectilePlayerCollision(a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const projectile = (a instanceof EnemyProjectile ? a : b) as EnemyProjectile;
    const v = new Phaser.Math.Vector2(this.player.object.x - projectile.x, this.player.object.y - projectile.y).normalize().scale(10).add(projectile);
    this.effects.explosion(v.x, v.y);
    projectile.deactivate();
    Sound.hitwall();
    this.playerDamageTween.play(true);

    this.player.health.value -= 15;
    if (this.player.health.value <= 0) {
      this.gameOver();
    }
  }

  onPowerUp(powerup: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
    const type = powerup.getData('type');

    if (type === PowerupType.HP) {
      this.player.health.value += 80;
    } else if (type === PowerupType.SLOW_MODULE) {
      this.scene.pause().launch('m.message', {
        title: 'Slow time module', msg:
          `You found a module for your blaster that can create temporal anomalies. <br><br>
         Launch anomaly with right mouse button, and use right mouse button again to detonate it,
         creating temporal field that slows down the time for everyting inside it. <br><br>
         Everything, except your blaster projectiles! Use it to your advantage.`});
      this.player.addWeaponModules([FieldType.SLOW]);
    } else if (type === PowerupType.STOP_MODULE) {
      this.scene.pause().launch('m.message', {
        title: 'Stop time module', msg:
          `You found a module for your blaster that can create temporal anomalies that stop the flow of time inside them. <br><br>
          To switch between "slow time" and "stop time" modes, use 1/2 keys or mouse wheel.`
      });
      this.player.addWeaponModules([FieldType.STOP]);
    } else if (type === PowerupType.HINT) {
      this.scene.pause().launch('m.message', { title: 'Hint', msg: powerup.getData('hint') });
    }

    Sound.powerup();
    powerup.destroy();
  }

  public addPlayerField(projectile: AltProjectile) {
    this.fields.addField(projectile.x, projectile.y, projectile.fieldType, 4000);
  }

  private pauseGame() {
    this.scene.pause().launch('m.pause', { key: 'game' });
  }

  private onFinishLevel() {
    this.world.finishLevelSensor.destroy(true);
    this.cameras.main.fadeOut(700, 0, 0, 0, (_: Phaser.Cameras.Scene2D.Camera, t: number) => {
      if (t >= 1) {
        const nextIndex = this.initData.mapIndex + 1;
        const mapKey = `map.${nextIndex}`;

        if (Resources.Levels[mapKey]) {
          if (nextIndex > Settings.nextLevel) {
            Settings.nextLevel = nextIndex;
            Settings.save();
          }

          this.scene.restart({ mapIndex: nextIndex } as GameSceneInitData);
        } else {
          this.scene.start('m.main');
        }
      }
    });
  }

  private onKillzone(zone: Killzone) {
    zone.destroy();
    this.gameOver();
  }

  private onTurretDetector(turret: Turret) {
    // this.lineOfSightDebug!.setTo(this.player.object.x, this.player.object.y, turret.x, turret.y + 30);
    this.lineOfSight.setTo(this.player.object.x, this.player.object.y, turret.x, turret.y + 10);
    const tiles = this.world.tilemap.getTilesWithinShape(this.lineOfSight, { isNotEmpty: true }, undefined, this.world.ground);

    if (!tiles.length)
      this.world.enemiesManager.turretFireAt(turret, this.player.object.x, this.player.object.y);
  }

  private gameOver() {
    this.player.die();

    this.cameras.main.fadeOut(2000, 0, 0, 0, (_: Phaser.Cameras.Scene2D.Camera, t: number) => {
      if (t >= 1)
        this.scene.restart();
    });
  }

  private initCollisions() {
    // Player - Finish level sensor
    this.physics.add.overlap(this.player.object, this.world.finishLevelSensor, () => {
      this.onFinishLevel();
    });

    // Player - Kill zones
    this.physics.add.overlap(this.player.object, this.world.killzones, (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
      const zone = a instanceof Killzone ? a : b;
      this.onKillzone(zone as Killzone);
    });

    // Player - World
    this.physics.add.collider(this.player.object, this.world.ground);

    // Player - Platforms
    this.physics.add.collider(this.player.object, this.world.platformColliders, (a, b) => {
      const aIsPlatform = (a as any).texture.key === 'platforms';
      const platform = aIsPlatform ? a : b;
      const player = aIsPlatform ? b : a;

      if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
        // An ugly hack to make arcade physics detect collisions between player & tilemap while on moving platform.
        // It looks like the player must be moving, at lest a little bit in the direction of platform, or otherwise collisions won't be checked.
        this.player.isOnPlatform = true;
        (player.body as Phaser.Physics.Arcade.Body).setVelocity(platform.body.velocity.x * 0.001, platform.body.velocity.y * 0.001);
      }
    });

    // Player - power ups
    this.physics.add.overlap(this.player.object, this.world.powerups, (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
      const powerup = ((a as any).texture.key === 'player' ? b : a);
      this.onPowerUp(powerup);
    });

    // Player Projectiles - Platforms
    this.physics.add.collider(this.player.projectiles, this.world.platformColliders,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.playerProjectileObstacleCollision(a, b));

    // Player Projectiles - World
    this.physics.add.collider(this.player.projectiles, this.world.ground,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.playerProjectileObstacleCollision(a, b));

    // Player Projectiles - Turrets
    this.physics.add.overlap(this.player.projectiles, this.world.turrets,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.playerProjectileTurretCollision(a, b));

    // Alt projectile - Platforms
    this.physics.add.collider(this.player.altProjectile, this.world.platformColliders,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.playerAltProjectileObstacleCollision(a, b));

    // Alt projectile - World
    this.physics.add.collider(this.player.altProjectile, this.world.ground,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.playerAltProjectileObstacleCollision(a, b));

    // Field - Player
    this.physics.add.overlap(this.player.object, this.fields.fields, () => {
      this.player.fieldTimeModifier = this.fields.activeFieldTimeModifier;
    });

    // Field - Platforms
    this.physics.add.overlap(this.world.platformColliders, this.fields.fields, (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
      const platform = ((a as any).texture.key === 'platform' ? a : b) as Platform;
      platform.inField(this.fields.activeFieldType);
    });

    // Field - Turrets
    this.physics.add.overlap(this.world.turrets, this.fields.fields, (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
      const turret = (a instanceof Turret ? a : b) as Turret;
      turret.inField(this.fields.activeFieldType);
    });

    // Field - Enemy Projectiles
    this.physics.add.overlap(this.world.enemiesManager.projectiles, this.fields.fields, (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
      const projectile = (a instanceof EnemyProjectile ? a : b) as EnemyProjectile;
      projectile.inField(this.fields.activeFieldType);
    });

    // Turrets - Player
    this.physics.add.overlap(this.player.object, this.world.turretDetectors, (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
      const detector = (a instanceof Phaser.GameObjects.Zone ? a : b) as Turret;
      const turret = detector.getData('turret') as Turret;
      this.onTurretDetector(turret);
    });

    // Turrets Projectiles - World
    this.physics.add.collider(this.world.enemiesManager.projectiles, this.world.ground,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.enemyProjectileObstacleCollision(a, b));

    // Turrets Projectiles - Platforms
    this.physics.add.collider(this.world.enemiesManager.projectiles, this.world.platformColliders,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.enemyProjectileObstacleCollision(a, b));

    // Turrets Projectiles - Player
    this.physics.add.collider(this.world.enemiesManager.projectiles, this.player.object,
      (a: Phaser.Types.Physics.Arcade.GameObjectWithBody, b: Phaser.Types.Physics.Arcade.GameObjectWithBody) => this.enemyProjectilePlayerCollision(a, b));
  }
}
