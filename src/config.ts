import Phaser from 'phaser';
import GameScene from  './scenes/Game';
import MainMenuScene from './scenes/gui/MainMenu';
import MessageScene from './scenes/gui/Message';
import PauseMenuScene from './scenes/gui/PauseMenu';
import SelectLevelScene from './scenes/gui/SelectLevelMenu';
import SettingsMenuScene from './scenes/gui/SettingsMenu';
import OverlayScene from './scenes/Overlay';
import PreloadScene from './scenes/Preload';
import WarpPostFx from './scenes/WarpPostFx';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game',
  dom: {
    createContainer: true
  },
  backgroundColor: '#2b2b3c',
  scale: {
    width: '100%',
    height: '100%',
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: { y: 200 }, // in pixels per second
      debug: false
    }
  },
  pixelArt: true,
  roundPixels: true,
  scene: [PreloadScene, OverlayScene, MainMenuScene, SelectLevelScene, SettingsMenuScene, PauseMenuScene, MessageScene, GameScene],
  pipeline: { timewarp: WarpPostFx }
};

export default config;
