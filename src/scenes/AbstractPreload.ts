import Phaser from 'phaser';

const progressBarThickness = 20;
const progressBorderThickness = 5;
const progressBorderColor = 0x44445d;
const progressBarColor = 0x66ffe2;
const progressLabelColor = '#8484a3';

export default abstract class AbstractProgressLoadScene extends Phaser.Scene {
  constructor(name: string) {
    super(name);
  }

  protected initializeLoadingProgress() {
    this.createGui();
  }

  private createGui() {
    const { width, height } = this.scale;
    let progressBar: Phaser.GameObjects.Graphics;
    let progressBox: Phaser.GameObjects.Graphics;
    let loadingText: Phaser.GameObjects.Text;
    let assetText: Phaser.GameObjects.Text;

    this.load.on('start', () => {
      progressBar = this.add.graphics();
      progressBox = this.add.graphics();

      progressBox.setDepth(-1);
      progressBox.fillStyle(progressBorderColor, 0.8);
      progressBox.fillRect(width / 3 - progressBorderThickness,
        height / 2 - progressBarThickness / 2 - progressBorderThickness,
        width / 3 + 2 * progressBorderThickness,
        progressBarThickness + 2 * progressBorderThickness);

      loadingText = this.make.text({
        x: width / 2,
        y: height / 2 - progressBarThickness - 2 * progressBorderThickness,
        text: 'Loading...',
        style: {
          fontFamily: 'sans-serif',
          fontSize: '25px',
          color: progressLabelColor
        }
      });
      loadingText.setOrigin(0.5, 0.5);

      assetText = this.make.text({
        x: width / 2,
        y: height / 2 + progressBarThickness + 2 * progressBorderThickness,
        text: '',
        style: {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: progressLabelColor
        }
      });
      assetText.setOrigin(0.5, 0.5);
    });

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(progressBarColor, 1);
      progressBar.fillRect(width / 3, height / 2 - progressBarThickness / 2, (width / 3) * value, progressBarThickness);
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      assetText.text = file.url.toString();
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      assetText.destroy();
    });
  }
}

