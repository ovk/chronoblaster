import Game from '../scenes/Game';
import Sound from '../sound';
import { FieldType } from './fields';
import Healthbar from './healthbar';
import InputController from './input';

export default class Player {
  static readonly RUN_VELOCITY = 80;
  static readonly JUMP_VELOCITY = 125;
  static readonly MAX_VELOCITY = 200;
  static readonly MAIN_WEAPON_DELAY = 250;
  static readonly MAIN_WEAPON_PROJ_LIFETIME = 3500;
  static readonly MAIN_WEAPON_PROJ_SPEED = 550;
  static readonly MAIN_WEAPON_PROJ_RADIUS = 3;
  static readonly ALT_WEAPON_PROJ_SPEED = 100;
  static readonly ALT_WEAPON_PROJ_RADIUS = 10;
  static readonly ALT_WEAPON_PROJ_LIFETIME = 4000;

  health!: Healthbar;

  private sprite!: Phaser.GameObjects.Sprite;
  private light!: Phaser.GameObjects.Light;
  private lightTween!: Phaser.Tweens.Tween;
  private isFalling = false;
  public isOnPlatform = false;
  public fieldTimeModifier = 1.0;
  private jumpStartTime = 0;

  private mainProjectilesGroup!: Phaser.Physics.Arcade.Group;
  private mainWeaponReadyTime = 0;

  private altWeaponsAvailable!: FieldType[];
  private altWeaponActive = FieldType.NONE;
  private altWeaponIcons: { [key: number]: Phaser.GameObjects.Sprite } = {};
  private altWeaponIconTweens: { [key: number]: Phaser.Tweens.Tween } = {};
  private altWeaponProjectile!: AltProjectile;

  constructor(private scene: Game) {
  }

  init(position: Phaser.Math.Vector2) {
    this.health = new Healthbar(this.scene, position.x, position.y, 32, 4);

    this.scene.anims.create({ key: 'player.idle', frameRate: 10, frames: this.scene.anims.generateFrameNames('player', { prefix: 'idle_', start: 1, end: 10 }), repeat: -1 });
    this.scene.anims.create({ key: 'player.jump', frameRate: 10, frames: this.scene.anims.generateFrameNames('player', { prefix: 'jump_', start: 1, end: 10 }), repeat: 0 });
    this.scene.anims.create({ key: 'player.jump.shoot', frameRate: 20, frames: this.scene.anims.generateFrameNames('player', { prefix: 'jump_shoot_', start: 1, end: 5 }), repeat: -1 });
    this.scene.anims.create({ key: 'player.run', frameRate: 10, frames: this.scene.anims.generateFrameNames('player', { prefix: 'run_', start: 1, end: 8 }), repeat: -1 });
    this.scene.anims.create({ key: 'player.run.shoot', frameRate: 10, frames: this.scene.anims.generateFrameNames('player', { prefix: 'run_shoot_', start: 1, end: 9 }), repeat: -1 });
    this.scene.anims.create({ key: 'player.shoot', frameRate: 20, frames: this.scene.anims.generateFrameNames('player', { prefix: 'shoot_', start: 1, end: 4 }), repeat: -1 });
    this.scene.anims.create({ key: 'player.dead', frameRate: 10, frames: this.scene.anims.generateFrameNames('player', { prefix: 'dead_', start: 1, end: 10 }), repeat: 0 });

    this.sprite = this.scene.add.sprite(position.x, position.y, 'player').play('player.idle');

    this.scene.physics.add.existing(this.sprite);
    this.body.setSize(15, 28);
    this.body.setMaxSpeed(Player.MAX_VELOCITY);
    this.body.setCollideWorldBounds(true);

    // Player light source
    this.light = this.scene.lights.addLight(position.x, position.y, 70, 0xffffff, 0.8);
    this.lightTween = this.scene.add.tween({
      targets: this.light,
      duration: 50,
      yoyo: true,
      intensity: 1
    }).stop();

    // Weapons and projectiles
    this.scene.anims.create({ key: 'projectile.1', frameRate: 10, frames: this.scene.anims.generateFrameNames('projectiles', { prefix: 'proj1_', start: 1, end: 5 }), repeat: 0 });
    this.scene.anims.create({ key: 'anomaly', frameRate: 12, frames: this.scene.anims.generateFrameNames('anomaly', { prefix: 'anomaly_', start: 1, end: 11 }), repeat: -1 });
    this.scene.anims.create({ key: 'anomaly.explode', frameRate: 12, frames: this.scene.anims.generateFrameNames('anomaly', { prefix: 'explode_', start: 1, end: 5 }), repeat: 0 });

    this.altWeaponsAvailable = [];
    this.altWeaponActive = FieldType.NONE;

    this.altWeaponIcons[FieldType.SLOW] = this.scene.add.sprite(0, 0, 'timeslow').setVisible(false);
    this.altWeaponIcons[FieldType.STOP] = this.scene.add.sprite(0, 0, 'timestop').setVisible(false);

    for (const i of [FieldType.SLOW, FieldType.STOP]) {
      this.altWeaponIconTweens[i] = this.scene.add.tween({
        targets: this.altWeaponIcons[i],
        duration: 200,
        hold: 100,
        yoyo: 1,
        scale: 3,
        alpha: { from: 0, to: 0.7 },
        onComplete: (tween: Phaser.Tweens.Tween) => (tween.targets[0] as Phaser.GameObjects.Sprite).setVisible(false)
      }).stop();
    }

    this.initProjectiles();
  }

  addWeaponModules(modules: FieldType[]) {
    this.altWeaponsAvailable.push(...modules);

    if (this.altWeaponActive === FieldType.NONE && modules.length)
      this.altWeaponActive = this.altWeaponsAvailable[0];
  }

  selectAltWeapon(n: number) {
    let selected = this.altWeaponActive;
    const len = this.altWeaponsAvailable.length;

    if (n >= 0 && n < len)
      selected = this.altWeaponsAvailable[n];
    else if (n < 0 && len > 1)
      selected = this.altWeaponsAvailable[(((this.altWeaponsAvailable.indexOf(this.altWeaponActive) - 1) % len) + len) % len];
    else if (n >= 10 && this.altWeaponsAvailable.length > 1)
      selected = this.altWeaponsAvailable[(((this.altWeaponsAvailable.indexOf(this.altWeaponActive) + 1) % len) + len) % len];

    if (selected !== this.altWeaponActive) {
      this.altWeaponActive = selected;

      for (const i in this.altWeaponIconTweens) {
        if (i === '' + selected) {
          this.altWeaponIcons[i].setVisible(true);
          this.altWeaponIcons[i].setPosition(this.sprite.x, this.sprite.y - 40);
          this.altWeaponIconTweens[i].restart();
        } else
          this.altWeaponIconTweens[i].stop(1);
      }
    }
  }

  get object() {
    return this.sprite;
  }

  get projectiles() {
    return this.mainProjectilesGroup;
  }

  get altProjectile() {
    return this.altWeaponProjectile;
  }

  update(input: InputController, time: number) {
    if (!this.body.enable)
      return;

    this.light.setPosition(this.sprite.x, this.sprite.y);

    // Detect fall/landing
    if (this.body.onFloor()) {
      if (this.isFalling) {
        Sound.land();
        this.isFalling = false;
      }
    } else if (this.body.velocity.y > 0) {
      this.isFalling = true;
    }

    this.handleMovement(input, time);
    this.handleWeapon(input, time);

    // Simulate time slowdown
    this.sprite.anims.timeScale = this.fieldTimeModifier;
    this.body.setVelocity(this.body.velocity.x * this.fieldTimeModifier, this.body.velocity.y * this.fieldTimeModifier);

    // Had to add this, otherwise player still falls when time is stopped, no idea why
    if (this.fieldTimeModifier === 0)
      this.body.setVelocityY(-3);

    // Reset this at the end of update
    this.isOnPlatform = false;
    this.fieldTimeModifier = 1.0;

    // Update health bar position
    this.health.setPosition(this.sprite.x - 17, this.sprite.y - 22);
  }

  die() {
    this.sprite.play('player.dead');
    this.body.enable = false;
    Sound.dead();
  }

  deactivate() {
    this.sprite.active = false;
    this.body.enable = false;
  }

  private get body() {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  private moveRight(shooting: boolean) {
    this.body.setVelocityX(Player.RUN_VELOCITY);
    this.sprite.flipX = false;

    if (!this.isFalling) {
      if (shooting)
        this.sprite.play('player.run.shoot', true);
      else
        this.sprite.play('player.run', true);
    }
  }

  private moveLeft(shooting: boolean) {
    this.sprite.flipX = true;
    this.body.setVelocityX(-Player.RUN_VELOCITY);

    if (!this.isFalling) {
      if (shooting)
        this.sprite.play('player.run.shoot', true);
      else
        this.sprite.play('player.run', true);
    }
  }

  private stop(shooting: boolean) {
    this.body.setVelocityX(0);
    if (!this.isFalling) {
      if (shooting)
        this.sprite.play('player.shoot', true);
      else
        this.sprite.play('player.idle', true);
    } else {
      const anim = this.sprite.anims.getName();
      if (shooting && anim === 'player.jump')
        this.sprite.play('player.jump.shoot');
      else if (!shooting && anim === 'player.jump.shoot')
        this.sprite.play('player.idle', true);
    }
  }

  private jump(time: number, shooting: boolean) {
    if (this.body.onFloor()) {
      this.body.setVelocityY(-Player.JUMP_VELOCITY);
      Sound.jump();

      this.sprite.play(shooting ? 'player.jump.shoot' : 'player.jump');
      this.isFalling = true;
      this.jumpStartTime = time;
    }
  }

  private handleMovement(input: InputController, time: number) {
    if (input.right) {
      this.moveRight(input.mainAttackActive);
    } else if (input.left) {
      this.moveLeft(input.mainAttackActive);
    } else {
      if (!this.isOnPlatform)
        this.stop(input.mainAttackActive);
    }

    if (input.jump)
      this.jump(time, input.mainAttackActive);

    // Hack to fix jumps in slow time
    if (this.fieldTimeModifier < 1 && !this.body.onFloor() && time - this.jumpStartTime < 800) {
      this.body.setVelocityY(-Player.JUMP_VELOCITY);
    }
  }

  private handleWeapon(input: InputController, time: number) {
    if (input.mainAttackActive) {
      if (time > this.mainWeaponReadyTime) {
        this.mainWeaponReadyTime = time + Player.MAIN_WEAPON_DELAY;
        this.fireMain();
      }
    }

    const dir = input.weaponSwitchDirection;
    if (dir !== 0)
      this.selectAltWeapon(dir * 10);
    else if (input.weaponSelectSlowActivated)
      this.selectAltWeapon(0);
    else if (input.weaponSelectStopActivated)
      this.selectAltWeapon(1);

    if (input.altAttackActive) {
      if (this.altWeaponProjectile.visible) {
        this.detonateAlt();
      } else if (this.altWeaponActive !== FieldType.NONE) {
        this.fireAlt();
      }
    }
  }

  private fireMain() {
    const proj = this.mainProjectilesGroup.getFirstDead() as MainProjectile;
    if (proj) {
      const target = this.getMouseTarget();
      proj.fire(this.sprite.x, this.sprite.y);
      this.scene.physics.moveTo(proj, target.x, target.y, Player.MAIN_WEAPON_PROJ_SPEED);
      proj.setRotation(Phaser.Math.Angle.BetweenPoints(this.sprite, target));

      Sound.shootMain();
      this.lightTween.restart();
    }
  }

  private fireAlt() {
    const target = this.getMouseTarget();
    this.altWeaponProjectile.fire(this.sprite.x, this.sprite.y, this.altWeaponActive);
    this.scene.physics.moveTo(this.altWeaponProjectile, target.x, target.y, Player.ALT_WEAPON_PROJ_SPEED);

    Sound.shootAlt();
    Sound.flyAlt();
  }

  private detonateAlt() {
    this.altWeaponProjectile.expire();
    this.scene.addPlayerField(this.altWeaponProjectile);
  }

  private getMouseTarget() {
    // 16 pixels to account for cursor size and make aim in the center
    return this.scene.cameras.main.getWorldPoint(this.scene.game.input.mousePointer.x + 16, this.scene.game.input.mousePointer.y + 16);
  }

  private initProjectiles() {
    // Pool for main fire mode projectiles
    this.mainProjectilesGroup = this.scene.physics.add.group({
      classType: MainProjectile,
      frameQuantity: 15,
      active: false,
      visible: false,
      enable: false,
      allowGravity: false,
      key: 'projectiles'
    });

    this.mainProjectilesGroup.children.each(p => {
      const proj = (p as MainProjectile);
      proj.group = this.mainProjectilesGroup; // It feels like there must be a better way
      proj.setCircle(Player.MAIN_WEAPON_PROJ_RADIUS, proj.width / 2 - Player.MAIN_WEAPON_PROJ_RADIUS, proj.height / 2 - Player.MAIN_WEAPON_PROJ_RADIUS);
    });

    // Single alt projectile
    const alt = new AltProjectile(this.scene, 0, 0, 'anomaly');
    alt.setVisible(false);
    alt.setActive(false);
    alt.setScale(0.3, 0.3);
    this.scene.add.existing(alt);
    this.scene.physics.add.existing(alt);
    alt.init();

    const altBody = alt.body as Phaser.Physics.Arcade.Body;
    altBody.immovable = true;
    altBody.allowGravity = false;
    altBody.enable = false;
    altBody.setCircle(Player.ALT_WEAPON_PROJ_RADIUS, alt.width / 2 - Player.ALT_WEAPON_PROJ_RADIUS, alt.height / 2 - Player.ALT_WEAPON_PROJ_RADIUS);

    this.altWeaponProjectile = alt;
  }
}

export class MainProjectile extends Phaser.Physics.Arcade.Sprite {
  group!: Phaser.Physics.Arcade.Group;
  lifetime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key);
  }

  fire(x: number, y: number) {
    this.lifetime = Player.MAIN_WEAPON_PROJ_LIFETIME;
    this.enableBody(true, x, y, true, true);
    this.play('projectile.1');
  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt);

    if (this.active) {
      if (this.lifetime <= 0) {
        this.deactivate();
      } else {
        this.lifetime -= dt;
      }
    }
  }

  deactivate() {
    this.group.killAndHide(this);
    this.disableBody(true, true);
  }
}

export class AltProjectile extends Phaser.Physics.Arcade.Sprite {
  lifetime = 0;
  expired = false;
  fieldType = FieldType.NONE;
  light!: Phaser.GameObjects.Light;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key);

    this.light = scene.lights.addLight(x, y, 80, 0xf0f1ff, 1).setVisible(false);
  }

  init() {
    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (this.expired) {
        this.light.setVisible(false);
        this.deactivate();
      }
    });
  }

  fire(x: number, y: number, type: FieldType) {
    this.fieldType = type;
    this.lifetime = Player.ALT_WEAPON_PROJ_LIFETIME;
    this.expired = false;
    this.enableBody(true, x, y, true, true);
    this.play('anomaly');
    this.light.setPosition(x, y).setVisible(true);
  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt);

    if (this.active) {
      if (this.lifetime <= 0 && !this.expired) {
        this.expired = true;
        this.setVelocity(0, 0);
        this.play('anomaly.explode');
        Sound.hitAlt();
      } else {
        this.lifetime -= dt;
        this.light.setPosition(this.body.position.x, this.body.position.y);
      }
    }
  }

  expire() {
    this.lifetime = 0;
  }

  deactivate() {
    this.disableBody(true, true);
  }

}
