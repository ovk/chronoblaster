import WarpPostFx from '../scenes/WarpPostFx';
import Sound from '../sound';

export enum FieldType {
  NONE,
  SLOW,
  STOP
}

export default class FieldsManager {
  public static readonly FIELD_RADIUS = 100;
  public static readonly FIELD_SLOW_FACTOR = 0.30;

  private field!: Phaser.GameObjects.GameObject;
  private shockwave!: Phaser.GameObjects.Sprite;
  private fieldType = FieldType.NONE;
  private fieldLifetime = 0;

  constructor(private scene: Phaser.Scene) {
  }

  init() {
    this.fieldType = FieldType.NONE;

    this.field = this.scene.add.zone(0, 0, 10, 10);
    this.field.active = false;
    this.scene.physics.add.existing(this.field, true);

    this.body.enable = false;
    this.body.setCircle(FieldsManager.FIELD_RADIUS);

    this.scene.anims.create({ key: 'shockwave', frameRate: 48, frames: this.scene.anims.generateFrameNames('shockwave', { prefix: 'wave_', start: 1, end: 12 }), repeat: 0 });

    this.shockwave = this.scene.add.sprite(0, 0, 'shockwave').setAlpha(0.2).setScale(2, 2).setTint(0xfafae9).setVisible(false);
    this.shockwave.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.shockwave.setVisible(false));
  }

  addField(x: number, y: number, type: FieldType, lifetime: number) {
    this.body.reset(x - FieldsManager.FIELD_RADIUS, y - FieldsManager.FIELD_RADIUS);
    this.body.enable = true;
    this.field.active = true;
    this.fieldType = type;
    this.fieldLifetime = lifetime;


    this.scene.cameras.main.resetPostPipeline(true);
    this.scene.cameras.main.setPostPipeline('timewarp');
    const fx = this.scene.cameras.main.getPostPipeline('timewarp') as WarpPostFx;
    fx.radius = FieldsManager.FIELD_RADIUS * this.scene.cameras.main.zoom;

    this.shockwave.setVisible(true).setPosition(x-5, y - 12).play('shockwave'); // Sprite sheet seems to be off-center

    Sound.fieldCreate();

    if (type === FieldType.SLOW)
      Sound.fieldSlow();
    else
      Sound.fieldStop();
  }

  update(_: number, dt: number) {
    if (this.fieldType != FieldType.NONE) {
      this.fieldLifetime -= dt;
      if (this.fieldLifetime <= 0) {
        this.expireField();
      } else {
        const sx = this.scene.cameras.main.worldView.x;
        const sy = this.scene.cameras.main.worldView.y;
        const fx = this.scene.cameras.main.getPostPipeline('timewarp') as WarpPostFx;

        fx.center.setTo(
          (this.body.x + FieldsManager.FIELD_RADIUS - sx) * this.scene.cameras.main.zoom,
          (this.body.y + FieldsManager.FIELD_RADIUS - sy) * this.scene.cameras.main.zoom);
      }
    }
  }

  get body() {
    return this.field.body as Phaser.Physics.Arcade.Body;
  }

  get fields() {
    return [this.field];
  }

  get activeFieldType() {
    return this.fieldType;
  }

  get activeFieldTimeModifier() {
    switch (this.fieldType) {
      case FieldType.SLOW:
        return FieldsManager.FIELD_SLOW_FACTOR;
      case FieldType.STOP:
        return 0;
      default:
        return 1.0;
    }
  }

  private expireField() {
    this.field.setActive(false);
    this.body.enable = false;
    this.fieldType = FieldType.NONE;
    this.scene.cameras.main.resetPostPipeline(true);
    this.shockwave.setVisible(true).playReverse('shockwave');

    Sound.hitAlt();
  }
}

