import Phaser from 'phaser';
import characterConfig from './characterConfig';
import { worldMapImports } from './worldMapConfig';

export default class PreloaderScene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.progressGraphics = null;
    this.loadFinished = false;
    this.allDone = false;
    this.onComplete = ()=>{console.warn("no oncomplete handler has been provided for the preloader!")}
  }

  preload() {
    this.addLoadProgressVisuals();
    this.load.on('progress', this.updateLoadProgressVisuals.bind(this));
    this.load.on('complete', this.endLoadProgressVisuals.bind(this));

    this.loadAudioAssets();
    this.loadMapAssets();
    this.loadCharacterAssets();
  }

  addLoadProgressVisuals() {
    this.progressGraphics = this.add.graphics();
  }

  updateLoadProgressVisuals(progressValue) {
    this.progressGraphics.clear();
    this.progressGraphics.fillStyle(0xffffff, 1);
    this.progressGraphics.fillRect(0, 270, 800 * progressValue, 60);
  }

  endLoadProgressVisuals() {
    this.progressGraphics.destroy();
    this.loadFinished = true;
  }

  loadMapAssets() {
    this.load.image("tiles", "assets/tileset_extruded.png");
    for (let key in worldMapImports) {
      this.load.tilemapTiledJSON(key, "assets/" + worldMapImports[key]);
    }
  }

  loadCharacterAssets() {
    for (let key in characterConfig) {
      let charSpriteSheet = characterConfig[key].spriteSheet;
      this.load.spritesheet(
        charSpriteSheet.key,
        charSpriteSheet.path, 
        {
          frameWidth: charSpriteSheet.frameSize[0],
          frameHeight: charSpriteSheet.frameSize[1]
        }
      );
    }
  }

  loadAudioAssets() {
    this.load.audio('desert','assets/Desert.wav');
    this.load.audio('mountain','assets/Ambience_Wind_Mountain_01_Loop.wav');

    // lump this into character assets & character config? or separate all audio into its own module or class?
    this.load.audio('player_jump','assets/knyttlike-jump1.wav');
    this.load.audio('player_run','assets/knyttlike-running.wav');
    this.load.audio('player_land','assets/knyttlike-land1.wav');
    this.load.audio('player_climb','assets/knyttlike-climbing2.wav');
    this.load.audio('player_grip','assets/knyttlike-grip.wav');

    this.load.audio('rift_close', 'assets/Magic Element 22_2.wav');
  }

  create() {
    // nothing to do here -- we'll keep the preloaded assets for later
  }

  update() {
    if (this.loadFinished && !this.allDone) {
      this.onComplete();
      this.scene.switch('GameWorldScene');
      this.allDone = true;
    }
  }
}