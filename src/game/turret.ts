import EnemiesManager from './enemies';
import FieldsManager, { FieldType } from './fields';
import Healthbar from './healthbar';

export enum TurretType {
  REGULAR = 0,
  HARD = 1
}

export default class Turret extends Phaser.GameObjects.Container {
  static readonly MAX_GUN_ANGLE = 70;

  turretType = TurretType.REGULAR;
  health: Healthbar;

  private gun: Phaser.GameObjects.Sprite;

  private manager: EnemiesManager;
  private detector: Phaser.GameObjects.Zone;
  private scanningTween: Phaser.Tweens.Tween;
  private isAimingAtPlayer = false;
  private weaponReadyTime = 0;
  private weaponDelayModifier = 1;
  private target = new Phaser.Math.Vector2();
  private damageTween: Phaser.Tweens.Tween;
  private fieldType = FieldType.NONE;

  constructor(scene: Phaser.Scene, type: TurretType, manager: EnemiesManager, x: number, y: number, width: number, height: number) {
    super(scene, x, y);

    this.turretType = type;
    this.manager = manager;

    const base = new Phaser.GameObjects.Sprite(scene, 0, 0, 'turret.base').setScale(0.4, 0.4).setTint(type === TurretType.HARD ? 0xffbd80 : 0xffffff);
    this.gun = new Phaser.GameObjects.Sprite(scene, 0, 0, 'turret.gun').setScale(0.4, 0.4).setTint(type === TurretType.HARD ? 0xffbd80 : 0xffffff);

    base.setOrigin(0.5, 0.0);
    this.gun.setOrigin(0.5, 0.125);
    this.gun.setAngle(Turret.MAX_GUN_ANGLE);

    this.health = new Healthbar(scene, -18, 18, 36, 3.5);

    this.add(this.health.gameObject);
    this.add(base);
    this.add(this.gun);
    this.setSize(36, 16);

    scene.physics.world.enable(this, Phaser.Physics.Arcade.STATIC_BODY);
    this.physicsBody.setOffset(0, 8);

    this.detector = this.scene.add.zone(x, y + height / 2, width, height);
    this.detector.setData('turret', this);
    this.scene.physics.add.existing(this.detector, true);
    this.add(this.detector);

    this.scanningTween = scene.add.tween({
      targets: this.gun,
      duration: 2000,
      hold: 100,
      repeatDelay: 100,
      ease: Phaser.Math.Easing.Cubic.InOut,
      yoyo: true,
      repeat: -1,
      angle: -Turret.MAX_GUN_ANGLE
    });

    this.damageTween = scene.add.tween({
      targets: this,
      duration: 50,
      yoyo: true,
      angle: { from: -8, to: 8 },
      onComplete: () => this.setAngle(0)
    }).stop();
  }

  maskTurret(scene: Phaser.Scene, x: number, y: number) {
    // Mask the turret so that upper part of the gun won't stick out
    const mask = scene.make.graphics({ add: false });
    mask.fillStyle(0xffffff);
    mask.beginPath();
    mask.fillRect(x - 50, y - 1, 100, 40);

    this.setMask(mask.createGeometryMask());
  }

  update(time: number) {
    const canShoot = this.fieldType !== FieldType.STOP;

    if (this.fieldType === FieldType.NONE) {
      this.scanningTween.timeScale = 1;
      this.weaponDelayModifier = 1;
    } else
      this.fieldType = FieldType.NONE;

    if (this.isAimingAtPlayer) {
      if (time > this.weaponReadyTime && canShoot) {
        this.weaponReadyTime = time + this.fireDelay * this.weaponDelayModifier;
        this.fireWeapon();
      }
    } else {
      this.scanningTween.resume();
    }

    this.isAimingAtPlayer = false;
  }

  get fireDelay() {
    return this.turretType === TurretType.HARD ? 200 : 500;
  }

  get projectileSpeed() {
    return this.turretType === TurretType.HARD ? 500 : 250;
  }

  takeDamage(damage: number) {
    this.health.value -= damage;
    this.damageTween.play(true);
  }

  fire(x: number, y: number) {
    this.target.setTo(x, y);
    this.isAimingAtPlayer = true;
    this.scanningTween.pause();

    if (this.fieldType !== FieldType.STOP)
      this.gun.setRotation(Phaser.Math.Angle.BetweenPoints(this, this.target) - Math.PI * 0.5);
  }

  inField(type: FieldType) {
    this.fieldType = type;

    if (type == FieldType.SLOW) {
      this.scanningTween.timeScale = FieldsManager.FIELD_SLOW_FACTOR;
      this.weaponDelayModifier = 1 / FieldsManager.FIELD_SLOW_FACTOR;
    } else if (type === FieldType.STOP) {
      this.scanningTween.timeScale = 0;
    }
  }

  get physicsBody() {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get playerDetector() {
    return this.detector;
  }

  private fireWeapon() {
    this.manager.shootTurretProjectile(this, this.target);
  }
}
