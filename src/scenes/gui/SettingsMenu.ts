import Phaser from 'phaser';
import settings from '../../settings';

export default class SettingsMenuScene extends Phaser.Scene {
  constructor() {
    super('m.sett');
  }

  create(parent: { key: string }) {
    const menu = this.add.dom(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2).createFromCache('gui.menu.settings');

    this.loadSettings(menu);

    this.scale.on('resize', (size: any) => {
      const { width, height } = size;
      menu.setPosition(width / 2, height / 2);
    });

    menu.addListener('click');
    menu.on('click', (e: any) => {
      if (e.target.id === 'mb-cancel')
        this.scene.start(parent.key);
      else if (e.target.id === 'mb-apply') {
        this.applySettings(menu);
        this.scene.start(parent.key);
      }
    });

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.scene.start(parent.key);
    });
  }

  private applySettings(el: Phaser.GameObjects.DOMElement) {
    settings.fps = !!(el.getChildByID('m-show-fps') as any).checked;
    settings.musicVolume = parseInt((el.getChildByID('m-music-vol') as any).value) / 100;
    settings.sfxVolume = parseInt((el.getChildByID('m-sfx-vol') as any).value) / 100;

    settings.save();
  }

  private loadSettings(el: Phaser.GameObjects.DOMElement) {
    (el.getChildByID('m-show-fps') as any).checked = settings.fps;
    (el.getChildByID('m-music-vol') as any).value = Math.round(settings.musicVolume * 100).toString();
    (el.getChildByID('m-sfx-vol') as any).value = Math.round(settings.sfxVolume * 100).toString();
  }
}

