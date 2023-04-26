import Phaser from 'phaser';

export default class MessageScene extends Phaser.Scene {
  constructor() {
    super('m.message');
  }

  create(message: { title: string, msg: string }) {
    const menu = this.add.dom(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2).createFromCache('gui.menu.message');

    menu.getChildByID('m-msg-title').innerHTML = message.title;
    menu.getChildByID('m-msg-message').innerHTML = message.msg;

    this.scale.on('resize', (size: any) => {
      const { width, height } = size;
      menu.setPosition(width / 2, height / 2);
    });

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.scene.resume('game').stop();
    });

    menu.addListener('click');
    menu.on('click', (e: any) => {
      switch (e.target.id) {
        case 'mb-ok':
          this.scene.resume('game').stop();
          break;
      }
    });
  }
}


