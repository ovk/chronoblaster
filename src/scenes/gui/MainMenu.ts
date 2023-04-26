import Phaser from 'phaser';
import Settings from '../../settings';
import { GameSceneInitData } from '../Types';
import WarpPostFx from '../WarpPostFx';

export default class MainMenuScene extends Phaser.Scene {
  img!: Phaser.GameObjects.Image;
  emitter!: Phaser.Geom.Rectangle;

  constructor() {
    super('m.main');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2b2b3c);

    this.cameras.main.setPostPipeline('timewarp');
    const fx = (this.cameras.main.getPostPipeline('timewarp') as WarpPostFx);
    fx.radius = 200;
    fx.center.setTo(0, 0);

    this.img = this.add.image(this.scale.width - 256, 256, 'gui.mainscreen').setScale(4, 4);

    this.emitter = new Phaser.Geom.Rectangle(0, -24, this.scale.width, 24);
    this.add.particles('timeslow').createEmitter({
      alpha: {
        start: 0.7,
        end: 0.1
      },
      emitZone: {
        source: this.emitter as Phaser.Types.GameObjects.Particles.RandomZoneSource,
      },
      frequency: 200,
      lifespan: 15000,
      scale: 3,
      gravityY: 20
    });

    // Menu
    const menu = this.add.dom(this.scale.gameSize.width / 2, this.scale.gameSize.height / 2).createFromCache('gui.menu.main');

    this.scale.on('resize', (size: any) => {
      const { width, height } = size;
      menu.setPosition(width / 2, height / 2);
      this.img.setPosition(this.scale.width - 256, 256);
      this.emitter.width = this.scale.width;
    });

    menu.addListener('click');
    menu.on('click', (e: any) => {
      if (e.target.id === 'mb-settings')
        this.scene.start('m.sett', { key: 'm.main' });
      else if (e.target.id === 'mb-select-level')
        this.scene.start('m.level');
      else if (e.target.id === 'mb-play') {
        this.scene.start('game', { mapIndex: Settings.nextLevel } as GameSceneInitData);
      }
    });
  }

  update(t: number) {
    const fx = (this.cameras.main.getPostPipeline('timewarp') as WarpPostFx);
    const f1 = 0.0001;
    const f2 = 0.0003;
    const x = (Math.sin(t * f1) + 1) * 0.5 * this.scale.width;
    const y = (Math.cos(t * f2) + 1) * 0.5 * this.scale.height;
    fx.center.setTo(x, y);
  }
}
