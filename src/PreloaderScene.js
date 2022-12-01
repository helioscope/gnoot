import Phaser from 'phaser';
import characterConfig from './characterConfig';
import particlesConfig from './particlesConfig';
import { worldMapImports } from './worldMapConfig';

export default class PreloaderScene extends Phaser.Scene {
  constructor(config) {
    super(config);
    this.progressGraphics = null;
    this.loadFinished = false;
    this.allDone = false;
    this.onComplete = ()=>{return;console.warn("no oncomplete handler has been provided for the preloader!")}
  }

  preload() {
    this.addLoadProgressVisuals();
    this.load.on('progress', this.updateLoadProgressVisuals.bind(this));
    this.load.on('complete', this.endLoadProgressVisuals.bind(this));

    this.loadAudioAssets();
    this.loadMapAssets();
    this.loadCharacterAssets();
    this.loadParticleAssets();
  }

  addLoadProgressVisuals() {
    this.progressGraphics = this.add.graphics();
  }

  updateLoadProgressVisuals(progressValue) {
    this.progressGraphics.clear();
    this.progressGraphics.fillStyle(0xffffff, 1);
    this.progressGraphics.fillRect(0, 270,  this.game.canvas.width * progressValue, 60);
    // console.log(this.game.canvas.width * progressValue);
  }

  endLoadProgressVisuals() {
    // console.log('load finished');
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

  loadParticleAssets() {
    for (let key in particlesConfig) {
      let config = particlesConfig[key];
      this.load.image(
        config.spriteId,
        config.filepath
      );
    }
  }

  loadAudioAssets() {
    this.load.audio('desert','assets/Desert.wav');
    this.load.audio('mountain','assets/Ambience_Wind_Mountain_01_Loop.wav');
    this.load.audio('pillars','assets/Wind Loop 1.wav');
    this.load.audio('bridge', 'assets/Ambience_Place_Bridge_Wooden_Crackling_Loop.wav');
    this.load.audio('plateau-soft', 'assets/Ambience_Wind_Intensity_Soft_With_Leaves_Loop.wav');
    this.load.audio('plateau-windy', 'assets/Ambience_Place_Desert_Night_Loop.wav');
    this.load.audio('cave-large', 'assets/Cave 2.wav');
    this.load.audio('cave-dark', 'assets/Ambience_Place_Cave_Dark_Loop.wav');
    this.load.audio('stalks', 'assets/Knytt-like-game-sfx--fungus-ambience1-loop.wav');
    this.load.audio('disassembler', 'assets/Knytt-like-game-sfx--disassembler-hum-loop.wav');

    // lump this into character assets & character config? or separate all audio into its own module or class?
    this.load.audio('player_jump','assets/knyttlike-jump1.wav');
    this.load.audio('player_run','assets/knyttlike-running.wav');
    this.load.audio('player_land','assets/knyttlike-land1.wav');
    this.load.audio('player_climb','assets/knyttlike-climbing2.wav');
    this.load.audio('player_grip','assets/knyttlike-grip.wav');
    this.load.audio('rescue_player_start','assets/TomWinandySFX_UI_ScifiTech_Button-Select_23.wav');
    this.load.audio('rescue_player_end','assets/TomWinandySFX_UI_ScifiTech_Button-Select_12.wav');
    this.load.audio('guiding_line','assets/TomWinandySFX_UI_ScifiTech_Scroll-Loop_14.wav');

    this.load.audio('rift_close', 'assets/Magic Element 22_2.wav');

    this.load.audio('loader-button-press', 'assets/Click (13).wav');
  }

  create() {
    // nothing to do here -- we'll keep the preloaded assets for later
  }

  update() {
    if (this.loadFinished && !this.allDone) {
      this.progressGraphics.destroy();
      this.onComplete();
      this.scene.switch('GameWorldScene');
      this.allDone = true;
    }
  }
}