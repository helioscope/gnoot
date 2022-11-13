import Phaser from 'phaser'
import characterConfig from './characterConfig';
import Character, { AIRBORN_IDLE_ANIM_MAX_SPEED, CHARACTER_MODE, JUMP_DELAY, PREMATURE_JUMP_ALLOWANCE } from './Character';
import Level from './Level';


export default class GameWorldScene extends Phaser.Scene {
	constructor() {
		super('gameworld-scene');
    this.cursors = null;
    this.player = null;
    this.showDebug = false;
	}

  preload() {
    this.loadMapAssets();
    this.loadCharacterAssets();
  }

  loadMapAssets() {
    this.load.image("tiles", "assets/tileset_extruded.png");
    this.load.tilemapTiledJSON("test-map", "assets/test-map.json");
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
    this.enterMap("test-map");

    const spawnPoint = this.level.map.findObject("Spawns", obj => obj.name === "Start");

    this.player = new Character(this, spawnPoint.x, spawnPoint.y, characterConfig.player)

    this.physics.add.collider(this.player.gameObject, this.level.groundLayer);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.level.map.widthInPixels, this.level.map.heightInPixels);
    camera.zoomX = camera.zoomY = 2;

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
    //   groundLayer.renderDebug(graphics, {
    //     tileColor: null, // Color of non-colliding tiles
    //     collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //     faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    //   });
    // });
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

  enterMap(mapKey) {
    this.level = new Level(this, mapKey);
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

    // handle mobility mode update

    player.modeLastFrame = player.mode;

    if (playerBody.onFloor()) {
      // if we're not climbing, we're grounded
      if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
        player.setMode(CHARACTER_MODE.GROUNDED, time);
      }
    } else {
      // if we're not climbing, we're airborn
      if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
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
    if (cursors.up.isDown) {
      let pressTime = cursors.up.timeDown;

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
      playerBody.setVelocityX(-player.stats.walkSpeed);
      playerGameObject.flipX = true;
    } else if (input.x > 0) {
      playerBody.setVelocityX(player.stats.walkSpeed);
      playerGameObject.flipX = false;
    } else {
      playerBody.setVelocity(0, prevVelocity.y);
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
      if (input.x !== 0) {
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
  }
}