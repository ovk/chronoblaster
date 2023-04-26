import Phaser from 'phaser';
import Settings from '../../settings';
import { GameSceneInitData } from '../Types';

export default class SelectLevelScene extends Phaser.Scene {
  constructor() {
    super('m.level');
  }

  create() {
    const menu = this.add.dom(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2).createFromCache('gui.menu.level');

    this.scale.on('resize', (size: any) => {
      const { width, height } = size;
      menu.setPosition(width / 2, height / 2);
    });

    for (let i = 1; ; ++i) {
      const el = menu.getChildByID(`mb-level-${i}`);
      if (!el)
        break;

      if (i > Settings.nextLevel)
        el.setAttribute('disabled', 'disabled');
    }

    menu.addListener('click');
    menu.on('click', (e: any) => {
      if (e.target.id === 'mb-back')
        this.scene.start('m.main');
      else if (e.target.className === 'mb-level-select') {
        const levelIndex = parseInt((e.target.id as string).substring('mb-level-'.length));
        this.scene.start('game', { mapIndex: levelIndex } as GameSceneInitData);
      }
    });
  }
}

