import Sound from '../sound';
import FieldsManager, { FieldType } from './fields';
import Turret, { TurretType } from './turret';

export default class EnemiesManager {
  static readonly TURRET_PROJ_LIFETIME = 1500;
  static readonly TURRET_PROJ_RADIUS = 3;

  private turrets: Turret[] = [];
  private projectilesGroup!: Phaser.Physics.Arcade.Group;

  constructor(private scene: Phaser.Scene) {
  }

  reset() {
    this.turrets = [];
  }

  init() {
    this.scene.anims.create({ key: 'projectile.2', frameRate: 2, frames: this.scene.anims.generateFrameNames('projectiles', { prefix: 'proj1_', start: 1, end: 5 }), repeat: 0 });

    this.projectilesGroup = this.scene.physics.add.group({
      classType: EnemyProjectile,
      frameQuantity: 30,
      active: false,
      visible: false,
      enable: false,
      allowGravity: false,
      key: 'projectiles'
    });

    this.projectilesGroup.children.each(p => {
      const proj = (p as EnemyProjectile);
      proj.group = this.projectilesGroup;
      proj.setCircle(EnemiesManager.TURRET_PROJ_RADIUS, proj.width / 2 - EnemiesManager.TURRET_PROJ_RADIUS, proj.height / 2 - EnemiesManager.TURRET_PROJ_RADIUS);
    });
  }

  get enemyTurrets() {
    return this.turrets;
  }

  get projectiles() {
    return this.projectilesGroup;
  }

  update(time: number) {
    for (const t of this.turrets)
      t.update(time);
  }

  addTurret(type: TurretType, x: number, y: number, width: number, height: number) {
    const turret = new Turret(this.scene, type, this, x, y, width, height);
    this.scene.add.existing(turret);
    turret.maskTurret(this.scene, x, y);
    turret.setDepth(-1);

    this.turrets.push(turret);
  }

  turretFireAt(turret: Turret, x: number, y: number) {
    turret.fire(x, y);
  }

  shootTurretProjectile(turret: Turret, target: Phaser.Math.Vector2) {
    const proj = this.projectilesGroup.getFirstDead() as EnemyProjectile;
    if (proj) {
      const start = new Phaser.Math.Vector2(target.x - turret.x, target.y - turret.y).normalize().scale(32);
      start.x += turret.x;
      start.y += turret.y;

      proj.fire(start.x, start.y);
      this.scene.physics.moveTo(proj, target.x, target.y, turret.projectileSpeed);
      proj.originalVelocity.copy(proj.body.velocity);
      proj.setRotation(Phaser.Math.Angle.BetweenPoints(start, target));

      Sound.shootTurret();
    }
  }

  damageTurret(turret: Turret, damage: number): boolean {
    turret.takeDamage(damage);

    if (turret.health.value <= 0) {
      turret.destroy(true);
      this.turrets = this.turrets.filter(t => t !== turret);
      Sound.explosion();
      return true;
    }

    return false;
  }
}

export class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  group!: Phaser.Physics.Arcade.Group;
  lifetime = 0;
  originalVelocity = new Phaser.Math.Vector2();
  fieldType = FieldType.NONE;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
    super(scene, x, y, key);
  }

  fire(x: number, y: number) {
    this.lifetime = EnemiesManager.TURRET_PROJ_LIFETIME;
    this.enableBody(true, x, y, true, true);
    this.play('projectile.2', true);
  }

  preUpdate(time: number, dt: number) {
    super.preUpdate(time, dt);

    if (this.active) {
      if (this.lifetime <= 0) {
        this.deactivate();
      } else {
        if (this.fieldType === FieldType.SLOW)
          this.lifetime -= dt * FieldsManager.FIELD_SLOW_FACTOR;
        else if (this.fieldType !== FieldType.STOP)
          this.lifetime -= dt;
      }
    }

    if (this.fieldType === FieldType.NONE)
      this.body.velocity.copy(this.originalVelocity);

    this.fieldType = FieldType.NONE;
  }

  deactivate() {
    this.group.killAndHide(this);
    this.disableBody(true, true);
  }


  inField(type: FieldType) {
    this.fieldType = type;

    if (type == FieldType.SLOW) {
      this.body.velocity.x = this.originalVelocity.x * FieldsManager.FIELD_SLOW_FACTOR;
      this.body.velocity.y = this.originalVelocity.y * FieldsManager.FIELD_SLOW_FACTOR;
    } else if (type === FieldType.STOP) {
      this.body.velocity.setTo(0, 0);
    }
  }
}
