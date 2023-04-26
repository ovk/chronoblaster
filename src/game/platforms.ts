import FieldsManager, { FieldType } from './fields';

export default class PlatformManager {
  public static readonly PLATFORM_SPEED_MULTIPLIER = 50;

  platforms: Platform[] = [];

  constructor(private scene: Phaser.Scene) {
  }

  reset() {
    this.platforms = [];
  }

  addPlatform(x: number, y: number, path: Phaser.Types.Math.Vector2Like[], speed: number, loop: boolean) {
    // Build path
    const tweenPath = new Phaser.Curves.Path(path[0].x! + x, path[0].y! + y);
    let pathLen = 0;

    for (let i = 1; i < path.length; ++i) {
      tweenPath.lineTo(path[i].x! + x, path[i].y! + y);
      pathLen += Phaser.Math.Distance.BetweenPoints(path[i - 1], path[i]);
    }

    if (loop) {
      pathLen += Phaser.Math.Distance.BetweenPoints(path[0], path[path.length - 1]);
      tweenPath.lineTo(path[path.length - 1].x! + x, path[0].y! + y);
    }

    // Create platform
    const platform = new Platform(this.scene, tweenPath, path[0].x! + x, path[0].y! + y, 'platform', undefined);
    platform.setOrigin(0.5, 0);
    this.scene.add.existing(platform);

    this.scene.physics.add.existing(platform);
    const body = platform.body as Phaser.Physics.Arcade.Body;
    body.immovable = true;
    body.setAllowGravity(false);

    // Setup following along platform path
    platform.startFollow({
      duration: pathLen * (1 - speed) * PlatformManager.PLATFORM_SPEED_MULTIPLIER,
      yoyo: !loop,
      repeat: -1,
      onUpdate: () => {
        body.velocity.copy(platform.pathDelta).scale(1000 / this.scene.game.loop.delta);
        platform.pathTween.timeScale = 1;
      },
      onRepeat: () => {
        const data = platform.pathTween.data[0];
        // Ugly hack to have platforms that can follow a loop
        if (loop && data.state === 5) {
          platform.pathTween.restart();
        }
      }
    });

    this.platforms.push(platform);
  }
}

export class Platform extends Phaser.GameObjects.PathFollower {
  constructor(scene: Phaser.Scene, path: Phaser.Curves.Path, x: number, y: number, texture: string, frame: string | number | undefined) {
    super(scene, path, x, y, texture, frame);
  }

  inField(type: FieldType) {
    if (type == FieldType.SLOW) {
      this.pathTween.timeScale = FieldsManager.FIELD_SLOW_FACTOR;
    } else if (type === FieldType.STOP) {
      this.pathTween.timeScale = 0;
    }
  }
}
