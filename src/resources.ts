export type ResourceEntry = {
  [key: string]: string;
};

export default class Resources {
  public static readonly Tilesets: ResourceEntry = {
    'main': 'assets/images/tileset.png'
  };

  public static readonly MusicTracks: ResourceEntry = {
    'main': 'assets/sound/namaste.mp3'
  };

  public static readonly Sounds: ResourceEntry = {
    'jump': 'assets/sound/jump.ogg',
    'land': 'assets/sound/land.ogg',
    'dead': 'assets/sound/dead.ogg',
    'hitwall': 'assets/sound/hitwall.ogg',
    'shootmain': 'assets/sound/shootmain.ogg',
    'fieldcreate': 'assets/sound/fieldcreate.ogg',
    'hitalt': 'assets/sound/hitalt.ogg',
    'flyalt': 'assets/sound/flyalt.ogg',
    'shootalt': 'assets/sound/shootalt.ogg',
    'powerup': 'assets/sound/powerup.ogg',
    'fieldslow': 'assets/sound/fieldslow.ogg',
    'fieldstop': 'assets/sound/fieldstop.ogg',
    'explosion': 'assets/sound/explosion.ogg',
    'shootturret': 'assets/sound/shootturret.ogg'
  };

  public static readonly Levels: ResourceEntry = {
    'map.1': 'assets/levels/level-1.json',
    'map.2': 'assets/levels/level-2.json',
    'map.3': 'assets/levels/level-3.json'
  };

  public static readonly Images: ResourceEntry = {
    'gui.mainscreen': 'assets/images/mainscreen.png',
    'powerup.hp': 'assets/images/powerup_hp.png',
    'timeslow': 'assets/images/timeslow.png',
    'timestop': 'assets/images/timestop.png',
    'platform': 'assets/images/platform.png',
    'turret.base': 'assets/images/turret_base.png',
    'turret.gun': 'assets/images/turret_gun.png',
    'end': 'assets/images/end.png',
    'hint': 'assets/images/hint.png',
  };

  // .png and .json appended when loading
  public static readonly Sheets: ResourceEntry = {
    'player': 'assets/sheets/player',
    'projectiles': 'assets/sheets/projectiles',
    'anomaly': 'assets/sheets/anomaly',
    'shockwave': 'assets/sheets/shockwave',
  };
}
