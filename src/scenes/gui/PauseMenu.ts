import Phaser from 'phaser';

export default class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super('m.pause');
  }

  create(parent: { key: string }) {
    const menu = this.add.dom(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2).createFromCache('gui.menu.pause');

    this.scale.on('resize', (size: any) => {
      const { width, height } = size;
      menu.setPosition(width / 2, height / 2);
    });

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.scene.resume(parent.key).stop();
    });

    menu.addListener('click');
    menu.on('click', (e: any) => {
      switch (e.target.id) {
        case 'mb-resume':
          this.scene.resume(parent.key).stop();
          break;
        case 'mb-settings':
          this.scene.start('m.sett', { key: 'm.pause' });
          break;
        case 'mb-exit':
          this.scene.stop(parent.key).start('m.main');
          break;
      }
    });
  }
}

