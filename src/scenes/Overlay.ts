import Phaser from 'phaser';
import settings from '../settings';
import { rpad } from '../util';

export default class OverlayScene extends Phaser.Scene {
  private debug = false;
  private debugOverlay!: Phaser.GameObjects.Text;
  private fps?: Phaser.GameObjects.Text;

  constructor() {
    super('overlay');
  }

  create() {
    this.scene.moveAbove('game');

    this.updateSettings();

    if (this.debug) {
      this.debugOverlay = this.add.text(5, 25, '', { color: '#66ffe2' });
    }

    settings.on('change', () => this.updateSettings());
    this.scene.launch('m.main');
  }

  update() {
    if (this.fps && this.fps.visible)
      this.fps.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);

    if (this.debug) {
      const scenes = this.game.scene.scenes.map(this.sceneDump, this).join('\n');
      this.debugOverlay.setText(scenes);
    }
  }

  private updateSettings() {
    this.updateFps();
  }

  private updateFps() {
    if (settings.fps) {
      if (!this.fps)
        this.fps = this.add.text(5, 5, 'FPS: ', { color: '#66ffe2' });
      this.fps.setVisible(true);
    } else {
      if (this.fps)
        this.fps.setVisible(false);
    }
  }

  private sceneDump(scene: Phaser.Scene): string {
    const status = rpad(this.mapSceneStatus(scene.sys.settings.status), ' ', 9);
    const active = scene.sys.settings.active ? 'a' : '-';
    const visible = scene.sys.settings.visible ? 'v' : '-';
    const transitioning = scene.sys.settings.isTransition ? 't' : '-';
    const dl = rpad(scene.sys.displayList.length.toString(), ' ', 3);
    const ul = rpad(scene.sys.updateList.length.toString(), ' ', 3);
    return `${active}${visible}${transitioning} ${rpad(scene.sys.settings.key, ' ', 9)} ${status} ${dl} ${ul}`;
  }

  private mapSceneStatus(n: number): string {
    switch (n) {
      case 0: return 'pending';
      case 1: return 'init';
      case 2: return 'start';
      case 3: return 'loading';
      case 4: return 'creating';
      case 5: return 'running';
      case 6: return 'paused';
      case 7: return 'sleeping';
      case 8: return 'shutdown';
      case 9: return 'destroyed';
      default: return 'invalid';
    }
  }
}

