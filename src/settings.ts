interface SettingsJson {
  fps: boolean;
  musicVolume: number;
  sfxVolume: number;
  nextLevel: number;
}

const SettingsStorageKey = 'settings';

class SettingsManager extends Phaser.Events.EventEmitter {
  public fps: boolean;
  public musicVolume: number;
  public sfxVolume: number;
  public nextLevel: number;

  constructor() {
    super();

    this.fps = false;
    this.musicVolume = 0.5;
    this.sfxVolume = 0.5;
    this.nextLevel = 1;
  }

  load() {
    const str = localStorage.getItem(SettingsStorageKey);

    if (str) {
      try {
        const obj = JSON.parse(str) as SettingsJson;

        this.fps = !!obj.fps;
        this.musicVolume = obj.musicVolume === undefined ? this.musicVolume : obj.musicVolume;
        this.sfxVolume = obj.sfxVolume === undefined ? this.sfxVolume : obj.sfxVolume;
        this.nextLevel = obj.nextLevel || this.nextLevel;
      } catch (e) {
        console.log('error while parsing settings', e);
      }
    }
  }

  save() {
    const settings: SettingsJson = {
      fps: this.fps,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      nextLevel: this.nextLevel,
    };

    localStorage.setItem(SettingsStorageKey, JSON.stringify(settings));
    this.emit('change');
  }
}

const Settings = new SettingsManager();
export default Settings;
