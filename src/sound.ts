import Resources from './resources';
import Settings from './settings';

class SoundManager {
  private static readonly FAST_START = false;

  // There's probably a better way to do this...
  private music: { [key: string]: Phaser.Sound.WebAudioSound } = {};
  private sounds: { [key: string]: Phaser.Sound.WebAudioSound } = {};
  private initialized = false;

  loadMain(load: Phaser.Loader.LoaderPlugin) {
    if (!SoundManager.FAST_START) {
      // Load absolute minimum to avoid long initial loading
      load.audio('main', Resources.MusicTracks.main);
    }
  }

  loadAll(load: Phaser.Loader.LoaderPlugin) {
    // Load everything else
    for (const key in Resources.MusicTracks) {
      if (key !== 'main')
        load.audio(key, Resources.MusicTracks[key]);
    }

    for (const key in Resources.Sounds) {
      load.audio(key, Resources.Sounds[key]);
    }
  }

  initMain(scene: Phaser.Scene) {
    if (!SoundManager.FAST_START) {
      this.music.main = scene.sound.add('main', {
        volume: this.mapVolume('main', Settings.musicVolume),
        loop: true
      }) as Phaser.Sound.WebAudioSound;
    }

    Settings.on('change', () => {
      for (const key in this.music)
        this.music[key].setVolume(this.mapVolume(key, Settings.musicVolume));

      for (const key in this.sounds)
        this.sounds[key].setVolume(this.mapVolume(key, Settings.sfxVolume));
    });
  }

  initAll(scene: Phaser.Scene) {
    if (this.initialized)
      return;

    for (const key in Resources.MusicTracks) {
      if (key !== 'main')
        this.music[key] = scene.sound.add(key, {
          volume: this.mapVolume(key, Settings.musicVolume),
        }) as Phaser.Sound.WebAudioSound;
    }

    for (const key in Resources.Sounds) {
      this.sounds[key] = scene.sound.add(key, {
        volume: this.mapVolume(key, Settings.sfxVolume),
      }) as Phaser.Sound.WebAudioSound;
    }

    this.initialized = true;
  }

  playMainMusic(scene: Phaser.Scene) {
    if (!SoundManager.FAST_START) {
      if (this.music.main.isPlaying)
        return;

      if (!scene.sound.locked) {
        this.music.main.play();
      }
      else {
        scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
          this.music.main.play();
        });
      }
    }
  }

  pause(scene: Phaser.Scene) {
    scene.sound.pauseAll();
  }

  resume(scene: Phaser.Scene) {
    scene.sound.resumeAll();
  }

  jump() {
    this.sounds.jump.play();
  }

  land() {
    this.sounds.land.play();
  }

  dead() {
    this.sounds.dead.play();
  }

  shootMain() {
    this.sounds.shootmain.play();
  }

  shootAlt() {
    this.sounds.shootalt.play();
  }

  flyAlt() {
    this.sounds.flyalt.play();
  }

  fieldCreate() {
    this.sounds.fieldcreate.play();
  }

  fieldSlow() {
    this.sounds.fieldslow.play();
  }

  fieldStop() {
    this.sounds.fieldstop.play();
  }

  hitAlt() {
    this.sounds.hitalt.play();
    this.sounds.flyalt.stop();
  }

  hitwall() {
    this.sounds.hitwall.play();
  }

  shootTurret() {
    this.sounds.shootturret.play();
  }

  explosion() {
    this.sounds.explosion.play();
  }

  powerup() {
    this.sounds.powerup.play();
  }

  private mapVolume(key: string, volume: number): number {
    switch (key) {
      case 'land':
        return volume * 0.5;
      case 'jump':
        return volume * 0.5;
      case 'main':
        return volume * 0.4;
      default:
        return volume;
    }
  }
}

const Sound = new SoundManager();
export default Sound;
