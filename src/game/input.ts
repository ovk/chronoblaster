export default class InputController {
  private keys: { [key: string]: any };

  private rightButtonPressed = false;
  private weaponSwitchIndex = 0;

  constructor(private scene: Phaser.Scene) {
    this.keys = this.scene.input.keyboard.addKeys({
      'esc': Phaser.Input.Keyboard.KeyCodes.ESC,
      'left': Phaser.Input.Keyboard.KeyCodes.LEFT,
      'left_alt': Phaser.Input.Keyboard.KeyCodes.A,
      'right': Phaser.Input.Keyboard.KeyCodes.RIGHT,
      'right_alt': Phaser.Input.Keyboard.KeyCodes.D,
      'jump': Phaser.Input.Keyboard.KeyCodes.SPACE,
      'jump_alt1': Phaser.Input.Keyboard.KeyCodes.UP,
      'jump_alt2': Phaser.Input.Keyboard.KeyCodes.W,
      'wpn_slow': Phaser.Input.Keyboard.KeyCodes.ONE,
      'wpn_stop': Phaser.Input.Keyboard.KeyCodes.TWO,
    });

    this.keys.esc.on('down', () => this.scene.events.emit('pause-game'));

    this.scene.input.mouse.disableContextMenu();

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 2)
        this.rightButtonPressed = true;
    });

    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _go: any, _deltaX: number, deltaY: number) => {
      this.weaponSwitchIndex = deltaY > 0 ? 1 : -1;
    });
  }

  get left(): boolean {
    return this.keys.left.isDown || this.keys.left_alt.isDown;
  }

  get right(): boolean {
    return this.keys.right.isDown || this.keys.right_alt.isDown;
  }

  get jump(): boolean {
    return this.keys.jump.isDown || this.keys.jump_alt1.isDown || this.keys.jump_alt2.isDown;
  }

  get weaponSelectSlowActivated(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.wpn_slow);
  }

  get weaponSelectStopActivated(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys.wpn_stop);
  }

  get weaponSwitchDirection(): number {
    const idx = this.weaponSwitchIndex;
    this.weaponSwitchIndex = 0;
    return idx;
  }

  get mainAttackActive(): boolean {
    return this.scene.input.activePointer.leftButtonDown();
  }

  get altAttackActive(): boolean {
    const pressed = this.rightButtonPressed;
    this.rightButtonPressed = false;
    return pressed;
  }
}
