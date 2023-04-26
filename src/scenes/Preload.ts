import Resources from '../resources';
import Settings from '../settings';
import Sound from '../sound';
import AbstractProgressLoadScene from './AbstractPreload';

export default class PreloadScene extends AbstractProgressLoadScene {
  constructor() {
    super('preload');
  }

  preload() {
    this.initializeLoadingProgress();

    Settings.load();
    this.startLoading();
  }

  create() {
    Sound.initMain(this);

    this.scene.start('overlay').remove();
  }

  private startLoading() {
    Sound.loadMain(this.load);

    this.load.css('gui.css.main', 'assets/gui/main.css');
    this.load.html('gui.menu.main', 'assets/gui/menu-main.html');
    this.load.html('gui.menu.level', 'assets/gui/menu-level-select.html');
    this.load.html('gui.menu.settings', 'assets/gui/menu-sett.html');
    this.load.html('gui.menu.pause', 'assets/gui/menu-pause.html');
    this.load.html('gui.menu.message', 'assets/gui/menu-message.html');

    for (const key in Resources.Images) {
      this.load.image(key, Resources.Images[key]);
    }
  }
}

