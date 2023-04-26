export default class Healthbar {
  private graphics: Phaser.GameObjects.Graphics;
  private val = 100;
  private border = 1;
  private tween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, private width: number, private height: number) {
    this.graphics = new Phaser.GameObjects.Graphics(scene);
    this.graphics.setPosition(x, y);
    this.graphics.alpha = 0;
    this.draw();

    scene.add.existing(this.graphics);

    this.tween = scene.add.tween({
      targets: this.graphics,
      duration: 200,
      hold: 2000,
      alpha: 1,
      yoyo: true
    }).stop();
  }

  set value(value: number) {
    this.val = Phaser.Math.Clamp(value, 0, 100);
    this.draw();

    if (!this.tween.isPlaying())
      this.tween.play();
    else {
      const d = this.tween.data[0];
      if (d.state === 7)
        d.elapsed = d.hold;
    }
  }

  get value() {
    return this.val;
  }

  get gameObject() {
    return this.graphics;
  }

  setPosition(x: number, y: number) {
    this.graphics.setPosition(x, y);
  }

  draw() {
    this.graphics.clear();

    this.graphics.fillStyle(0x44445d);
    this.graphics.fillRect(0, 0, this.width, this.height);

    this.graphics.fillStyle(0x44445d);
    this.graphics.fillRect(this.border, this.border, this.width - 2 * this.border, this.height - 2 * this.border);

    this.graphics.fillStyle(0x66ffe2);

    const t = Math.floor((this.width - 2 * this.border) * this.val / 100);
    this.graphics.fillRect(this.border, this.border, t, this.height - 2 * this.border);
  }
}
