export default class EffectsManager {
  private explosions!: Phaser.GameObjects.Group;
  private flashes: Flash[] = [];

  constructor(private scene: Phaser.Scene) {
  }

  init() {
    this.scene.anims.create({ key: 'explosion.1', frameRate: 24, frames: this.scene.anims.generateFrameNames('projectiles', { prefix: 'expl_', start: 1, end: 5 }), repeat: 0 });

    this.initExplosions();
    this.initFlashes();
  }

  explosion(x: number, y: number) {
    const explosion = this.explosions.get(x, y) as Phaser.GameObjects.Sprite;

    if (explosion) {
      explosion.setActive(true);
      explosion.setVisible(true);
      explosion.play('explosion.1');

      const flash = this.flashes.shift();
      if (flash)
        flash.flash(x, y);
    }
  }

  private initExplosions() {
    this.explosions = this.scene.add.group({
      defaultKey: 'explosions',
      maxSize: 20,
      createCallback: explosion => {
        explosion.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.explosions.killAndHide(explosion));
      }
    });
  }

  private initFlashes() {
    for (let i = 0; i < 5; i++) {
      const light = this.scene.lights.addLight(0, 0, 80, 0xfff1f0, 0.8);
      light.setVisible(false);

      const flash = new Flash(light);

      flash.tween = this.scene.add.tween({
        targets: light,
        duration: 30,
        yoyo: true,
        intensity: 1.1,
        onComplete: () => {
          light.setVisible(false);
          this.flashes.push(flash);
        }
      }).stop();

      this.flashes.push(flash);
    }
  }
}

class Flash {
  tween!: Phaser.Tweens.Tween;

  constructor(private light: Phaser.GameObjects.Light) {
  }

  flash(x: number, y: number) {
    this.light.setPosition(x, y);
    this.light.setVisible(true);
    this.tween.restart();
  }
}
