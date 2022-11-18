import Phaser from 'phaser'
import characterConfig from './characterConfig';
import Character, { AIRBORN_IDLE_ANIM_MAX_SPEED, CHARACTER_MODE, JUMP_DELAY, PREMATURE_JUMP_ALLOWANCE } from './Character';
import Level from './Level';
import { worldMapImports } from './worldMapConfig';


export default class GameWorldScene extends Phaser.Scene {
	constructor() {
		super('gameworld-scene');
    this.cursors = null;
    this.player = null;
    this.level = null;
    this.worldX = 50;
    this.worldY = 50;
    this.levelCollider = null;
    this.showDebug = false;
    this.ambience = {};
    this.sfx = {};
	}

  preload() {
    this.loadAudioAssets();
    this.loadMapAssets();
    this.loadCharacterAssets();
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

  create() {
    this.createAnimations();
    
    this.player = new Character(this, 0, 0, characterConfig.player);
    this.player.gameObject.depth = 10;

    this.sfx = {
      'player_jump' : this.sound.add('player_jump', {volume: 0.9}),
      'player_run' : this.sound.add('player_run', {volume: 0.5, loop: true}),
      'player_land' : this.sound.add('player_land', {volume: 0.8}),
      'player_climb' : this.sound.add('player_climb', {volume: 0.4, loop: true}),
      'player_grip' : this.sound.add('player_grip', {volume: 0.4})
    };

    // temp -- to help with debugging at runtime in the console
    // window.level = this.level.groundLayer;
    // window.physics = this.physics;
    // window.player = this.player;

    this.cursors = this.input.keyboard.createCursorKeys();

    // Debug graphics
    // this.input.keyboard.once("keydown-D", event => {
    //   // Turn on physics debugging to show player's hitbox
    //   this.physics.world.createDebugGraphic();

    //   // Create worldLayer collision graphic above the player, but below the help text
    //   const graphics = this.add
    //     .graphics()
    //     .setAlpha(0.75)
    //     .setDepth(20);
    //   this.level.groundLayer.renderDebug(graphics, {
    //     tileColor: null, // Color of non-colliding tiles
    //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    //   });
    // });

    this.enterWorldPosition(this.worldX, this.worldY);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.level.map.widthInPixels, this.level.map.heightInPixels);
    camera.zoomX = camera.zoomY = 2;

    const spawnPoint = this.level.map.findObject("Spawns", obj => obj.name === "Start");
    if (spawnPoint) {
      this.player.gameObject.setPosition(spawnPoint.x, spawnPoint.y);
    } else {
      console.warn(`no spawn point provided for the starting map (${this.worldX}, ${this.worldY})`);
    }
  }

  createAnimations() {
    const anims = this.anims;
    for (let charKey in characterConfig) {
      const charConfig = characterConfig[charKey];
      const charAnims = charConfig.animations;
      const spritesheetKey = charConfig.spriteSheet.key;
      const {animationPrefix, defaultFramerate} = charConfig.animationSettings;

      for (let animationKey in charAnims) {
        const animationInfo = charAnims[animationKey];
        anims.create({
          key: animationPrefix + animationKey,
          frames: this.anims.generateFrameNumbers(spritesheetKey, {frames: animationInfo.frames}),
          frameRate: animationInfo.frameRate || defaultFramerate,
          repeat: -1
        });
      }
    }
  }

  getMapKeyForWorldPosition(x,y) {
    return `world-${x},${y}`;
  }

  enterWorldPosition(worldX, worldY, playerX, playerY) {
    this.worldX = worldX;
    this.worldY = worldY;
    console.log(`entering world position: ${worldX}, ${worldY})`);
    this.enterMap(this.getMapKeyForWorldPosition(worldX, worldY), playerX, playerY);
  }

  enterMap(mapKey, newPlayerX, newPlayerY) {
    console.log(`entering map: "${mapKey}" (new player position: ${newPlayerX}, ${newPlayerY})`);
    if (this.level) {
      this.level.handleExit();
      this.levelCollider.destroy();
      this.level.map.destroy();
    }
    this.level = new Level(this, mapKey);
    this.level.handleEnter();
    this.levelCollider = this.physics.add.collider(this.player.gameObject, this.level.groundLayer);
    if (newPlayerX != null) {
      this.player.gameObject.setPosition(newPlayerX, newPlayerY);
    }
    
    let mapProperties = this.level.map.properties;
    let loopProp = Array.isArray(mapProperties) ? mapProperties.find((prop)=>{return prop.name === "audioloops";}) : null;
    let loopString = loopProp ? loopProp.value : null;
    
    let newAmbience = {};
    if (loopString) {
      loopString.split(/[,;]/).forEach((trackString) => {
        let [key, volume] = trackString.split('@');
        if (!(key && volume)) {
          console.warn(`ambience track string is missing parts: ${trackString}`);
          return;
        }
        key = key.trim();
        volume = parseInt(volume.trim());
        if (key.length === 0 || isNaN(volume)) {
          console.warn(`ambience track string seems badly formatted: ${trackString}`);
          return;
        } else {
          newAmbience[key] = volume / 100;
        }
      });
    }
    this.setAmbience(newAmbience);
  }

  setAmbience(newAmbience) {
    console.log('new ambience', newAmbience);
    for (let key in this.ambience) {
      if (key in newAmbience) {
        this.ambience[key].volume = newAmbience[key];
      } else {
        this.ambience[key].pause();
      }
    }

    for (let key in newAmbience) {
      if (key in this.ambience) {
        this.ambience[key].resume();
      } else {
        this.ambience[key] = this.sound.add(key, {volume: newAmbience[key], loop: true});
        this.ambience[key].play();
      }
    }
  }

  update(time, delta) {
    this.handlePlayerMovement(time, delta);
  }

  handlePlayerMovement(time, deltaTime) {
    const cursors = this.cursors;
    const player = this.player;
    const playerGameObject = player.gameObject;
    const playerBody = player.gameObject.body;
    const prevVelocity = playerBody.velocity.clone();

    let nextWorldX = this.worldX;
    let nextWorldY = this.worldY;

    let mapWidth = this.level.map.widthInPixels;
    let mapHeight = this.level.map.heightInPixels;
    let playerCenter = playerBody.center;
    let newPlayerX = playerGameObject.x;
    let newPlayerY = playerGameObject.y;

    if (playerCenter.x < 0) {
      nextWorldX -= 1;
      newPlayerX = playerGameObject.x + mapWidth;
    } else if (playerCenter.x > mapWidth) {
      nextWorldX += 1;
      newPlayerX = playerGameObject.x - mapWidth;
    }
    if (playerCenter.y < 0) {
      nextWorldY -= 1;
      newPlayerY = playerGameObject.y + mapHeight;
    } else if (playerCenter.y > this.level.map.heightInPixels) {
      nextWorldY += 1;
      newPlayerY = playerGameObject.y - mapHeight;
    }

    if (nextWorldX !== this.worldX || nextWorldY !== this.worldY) {
      if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
        // slight hack to keep player "stuck" to edge after transition
        if (playerGameObject.flipX) {
          playerBody.velocity.x = -200;
        } else {
          playerBody.velocity.x = 200;
        }
        if (nextWorldY < this.worldY) {
          newPlayerY -= player.stats.edgeGripOffsetY;
        } else if (nextWorldY > this.worldY) {
          newPlayerY += 10;
        }
      }
      this.enterWorldPosition(nextWorldX, nextWorldY, newPlayerX, newPlayerY);
      return;
    }

    // handle mobility mode update

    player.modeLastFrame = player.mode;

    if (playerBody.onFloor()) {
      // if we're not climbing (and on the floor), we're grounded
      if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
        player.setMode(CHARACTER_MODE.GROUNDED, time);
        if (player.modeLastFrame === CHARACTER_MODE.AIRBORN) {
          player.lastLandingTime = time;
        }
      }
    } else { // not on floor
      if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
        // check if player has climbed off their ledge / has no more place to grip
        let hasGrip = false;
        let playerGripY = playerBody.center.y + player.stats.edgeGripOffsetY;
        if (player.gameObject.flipX) {
          let tileAtGripPoint = this.level.groundLayer.getTileAtWorldXY(playerBody.left - 1, playerGripY);
          if (tileAtGripPoint && tileAtGripPoint.collideRight) {
            hasGrip = true;
          }
        } else {
          let tileAtGripPoint = this.level.groundLayer.getTileAtWorldXY(playerBody.right + 1, playerGripY);
          if (tileAtGripPoint && tileAtGripPoint.collideLeft) {
            hasGrip = true;
          }
        }

        if (!hasGrip) {
          if (playerBody.velocity.y < 0) {
            player.jump(time);
          } else {
            player.setMode(CHARACTER_MODE.AIRBORN);
          }
        }
      } else {
        // if we're not climbing (and not on the floor), we're airborn
        player.setMode(CHARACTER_MODE.AIRBORN, time);
      }
    }

    // receive input

    let input = {
      x : 0,
      y : 0,
      jump : false,
      liftJump : false
    };
    
    if (cursors.left.isDown) {
      input.x -= 1;
    }
    if (cursors.right.isDown) {
      input.x += 1;
    }
    if (cursors.down.isDown) {
      input.y += 1;
    }
    if (cursors.up.isDown) {
      input.y -= 1;
    }
    if (cursors.space.isDown) {
      let pressTime = cursors.space.timeDown;

      // trigger jump
      if (pressTime > player.lastJumpTime + JUMP_DELAY) { // don't jump too often
        if (time - pressTime < PREMATURE_JUMP_ALLOWANCE) { // let jump stay active for a bit, (helps with early press)
          input.jump = true;
          input.liftJump = true;
        }
      }

      // keep holding button to jump higher
      if (player.mode === CHARACTER_MODE.AIRBORN) {
        let velocity = player.getVelocity();
        if (velocity.y < 0) {
          input.liftJump = true;
        }
      }
    }

    player.inputLastFrame = player.input;
    player.input = input;


    // process input

    if (input.x < 0) {
      if (playerBody.onWall()) {
        player.setMode(CHARACTER_MODE.EDGE_CLIMBING);
      } else if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
        playerGameObject.flipX = true;
        playerBody.setVelocityX(-player.stats.walkSpeed);
      }
    } else if (input.x > 0) {
      if (playerBody.onWall()) {
        player.setMode(CHARACTER_MODE.EDGE_CLIMBING);
      } else if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
        playerGameObject.flipX = false;
        playerBody.setVelocityX(player.stats.walkSpeed);
      }
    } else {
      playerBody.setVelocity(0, prevVelocity.y);
    }

    if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
      if (input.y > 0 && playerBody.onFloor()) {
        player.setMode(CHARACTER_MODE.GROUNDED);
        playerBody.setAccelerationY(0);
      } else {
        playerBody.setVelocityY(player.stats.climbSpeed * input.y);
        playerBody.setAccelerationY(-this.physics.config.gravity.y);
      }
    } else {
      playerBody.setAccelerationY(0);
    }

    if (input.jump) {
      if (player.canJump(time)) {
        player.jump(time);
      }
    }

    if (input.liftJump && player.mode === CHARACTER_MODE.AIRBORN) {
      let jumpDuration = time - player.lastJumpTime;
      let maxLiftTime = player.stats.jumpLiftTime;
      let jumpFactor = Math.max(0, maxLiftTime - jumpDuration) / maxLiftTime;
      let potentialLift = player.stats.jumpLift * (deltaTime/1000) * (jumpFactor * jumpFactor);
      
      if (player.getVelocity().y < 0) {
        playerBody.setVelocity(playerBody.velocity.x, playerBody.velocity.y - potentialLift);
      }
    }

    // process animation

    if (player.mode === CHARACTER_MODE.GROUNDED) {
      if (time - player.lastLandingTime < player.stats.landingTime) {
        player.setAnimation("jumpLand", true);
      } else if (input.x !== 0) {
        player.setAnimation("walk", true);
      } else {
        player.setAnimation("idle", true);
      }
    } else if (player.mode === CHARACTER_MODE.AIRBORN) {
      if (playerBody.velocity.y < -AIRBORN_IDLE_ANIM_MAX_SPEED) {
        player.setAnimation("jumpRise", true);
      } else if (playerBody.velocity.y > AIRBORN_IDLE_ANIM_MAX_SPEED) {
        player.setAnimation("jumpFall", true);
      } else {
        player.setAnimation("jumpPeak", true);
      }
    } else if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
      if (playerBody.velocity.y < 0) {
        player.setAnimation("edgeClimbUp", true);
      } else if (playerBody.velocity.y > 0) {
        player.setAnimation("edgeClimbDown", true);
      } else {
        player.setAnimation("edgeClimbStill", true);
      }
    } else {
      console.log(`unhandled player mode: ${player.mode}`);
    }

    // process audio

    if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
      this.setSFXLoop('player_run', false);

      if (playerBody.velocity.y !== 0) {
        this.setSFXLoop('player_climb', true);
      } else {
        this.setSFXLoop('player_climb', false);
      }
    } else if (player.mode === CHARACTER_MODE.GROUNDED) {
      this.setSFXLoop('player_climb', false);

      if (playerBody.velocity.x !== 0) {
        this.setSFXLoop('player_run', true);
      } else {
        this.setSFXLoop('player_run', false);
      }
    } else {
      this.setSFXLoop('player_climb', false);
      this.setSFXLoop('player_run', false);
    }

    if (player.lastJumpTime === time) {
      // console.log('play jump', time);
      this.sfx['player_jump'].play();
    }
    if (player.lastLandingTime === time) {
      // console.log('play land', time);
      this.sfx['player_land'].play();
    }

    if (player.mode === CHARACTER_MODE.EDGE_CLIMBING && player.modeLastFrame !== CHARACTER_MODE.EDGE_CLIMBING) {
      this.sfx['player_grip'].play();
    }
  }

  setSFXLoop(key, shouldPlay) {
    if (shouldPlay) {
      if (!this.sfx[key].isPlaying) {
        this.sfx[key].play();
      }
    } else {
      if (this.sfx[key].isPlaying) {
        this.sfx[key].stop();
      }
    }
  }
}