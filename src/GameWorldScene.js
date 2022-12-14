import Phaser from 'phaser';
import characterConfig from './characterConfig';
import Character, { AIRBORN_IDLE_ANIM_MAX_SPEED, CHARACTER_MODE, JUMP_DELAY, PREMATURE_JUMP_ALLOWANCE } from './Character';
import Level from './Level';
import { pickupLocations } from './worldMapConfig';
import saveManager from './saveManager';
import LoadSaveScene from './LoadSaveScene';
import particlesConfig from './particlesConfig';

const LEVEL_WIDTH = 480;
const LEVEL_HEIGHT = 320;

const WORLD_X_FOR_NEW_GAME = 50;
const WORLD_Y_FOR_NEW_GAME = 50;

const PLAYER_DEPTH = 10;
const GUIDELINE_DEPTH = 9;

const CAMERA_FADE_DEPTH = 100;
const FLASH_DEPTH = 99;

export default class GameWorldScene extends Phaser.Scene {
	constructor() {
		super('GameWorldScene');
    this.cursors = null;
    this.player = null;
    this.level = null;
    this.worldX = WORLD_X_FOR_NEW_GAME;
    this.worldY = WORLD_Y_FOR_NEW_GAME;
    this.showDebug = false;
    this.ambience = {};
    this.sfx = {};
    this.particlesMix = {};
    this.gameOver = false;
    this.running = false;
    this.inCutscene = false;
    /** @type Phaser.GameObjects.Rectangle */
    this.screenFlash = null;
    /** @type Phaser.GameObjects.Rectangle */
    this.cameraFade = null;

    this.guideLines = [];
    this.guideLinesActivated = false;

    this.loadSaveScene = null;

    saveManager.init();
	}

  preload() {
    // nothing to do here -- the preloader handled it all
  }

  create() {
    this.createAnimations();
    
    this.player = new Character(this, 0, 0, characterConfig.player);
    this.player.gameObject.depth = PLAYER_DEPTH;
    this.player.gameObject.setVisible(false);

    this.createGuideLines();

    this.screenFlash = this.add.rectangle(0,0, LEVEL_WIDTH,LEVEL_HEIGHT, 0xFFFFFF);
    this.screenFlash.setDepth(FLASH_DEPTH).setOrigin(0,0).setVisible(false);

    this.cameraFade = this.add.rectangle(0,0, LEVEL_WIDTH,LEVEL_HEIGHT, 0x000000);
    this.cameraFade.setDepth(CAMERA_FADE_DEPTH).setOrigin(0,0).setVisible(false);

    this.sfx = {
      'player_jump' : this.sound.add('player_jump', {volume: 0.9}),
      'player_run' : this.sound.add('player_run', {volume: 0.5, loop: true}),
      'player_land' : this.sound.add('player_land', {volume: 0.8}),
      'player_climb' : this.sound.add('player_climb', {volume: 0.4, loop: true}),
      'player_grip' : this.sound.add('player_grip', {volume: 0.4}),
      'rift_close' : this.sound.add('rift_close', {volume: 1}),
      'rescue_player_start' : this.sound.add('rescue_player_start', {volume: 0.45}),
      'rescue_player_end' : this.sound.add('rescue_player_end', {volume: 0.3}),
      'guiding_line' : this.sound.add('guiding_line', {volume: 0.05, loop: true}),
    };

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

    this.camera = this.cameras.main;
    this.camera.setZoom(2);

    // start on load screen (todo: clean this up & move it outside the game scene)
    // this.loadSaveScene = new LoadSaveScene();
    // this.loadSaveScene.onTriggerLoad = this.onLoadSaveSlot;
    // this.loadSaveScene.create();
    // this.scene.launch(this.loadSaveScene);

    /** @type LoadSaveScene */
    this.loadSaveScene = null;
    /** @ts-ignore */
    this.loadSaveScene = this.scene.get('LoadSaveScene');
    this.loadSaveScene.onTriggerLoad = this.onLoadSaveSlot.bind(this);
    this.scene.switch('LoadSaveScene');
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

  onLoadSaveSlot(slotIndex) {
    let slotData = saveManager.loadSlot(slotIndex);
    if (slotData.started) {
      this.startGameAt(slotData.worldX, slotData.worldY, slotData.safeX, slotData.safeY);
    } else {
      this.startGameAt(WORLD_X_FOR_NEW_GAME, WORLD_Y_FOR_NEW_GAME);
    }
    this.loadSaveScene.exit();
    this.loadSaveScene.scene.switch('GameWorldScene');
    saveManager.markActiveSlotAsStarted();
    saveManager.saveState();
    this.player.setFacing(slotData.facing);
  }

  startGameAt(worldX, worldY, levelX, levelY) {
    this.enterWorldPosition(worldX, worldY);
    this.camera.setBounds(0, 0, this.level.map.widthInPixels, this.level.map.heightInPixels);

    if (levelX == null || levelY == null)  {
      const spawnPoint = this.level.map.findObject("Spawns", obj => obj.name === "Start");
      if (spawnPoint) {
        levelX = spawnPoint.x;
        levelY = spawnPoint.y;
      } else {
        console.warn(`no spawn point provided for the starting map (${this.worldX}, ${this.worldY})`);
        levelX = 0;
        levelY = 0;
      }
    }
    this.player.gameObject.setPosition(levelX, levelY);
    this.player.gameObject.setVisible(true);
    this.running = true;
    this.paused = false;
    this.fadeIn();
  }

  flashScreen(colorNumber = 0xFFFFFF) {
    this.screenFlash.fillColor = colorNumber;
    this.screenFlash.fillAlpha = 0;
    this.screenFlash.setVisible(true);
    this.tweens.timeline({
      tweens: [
        {
          targets: this.screenFlash,
          fillAlpha: {
            value: 0.55,
            duration: 35,
            ease: 'Power1'
          }
        },
        {
          targets: this.screenFlash,
          fillAlpha: {
            value: 0.20,
            duration: 200,
            ease: 'Power1'
          }
        },
        {
          targets: this.screenFlash,
          fillAlpha: {
            value: 0,
            duration: 300,
            ease: 'Ease-Out',
            onComplete: () => {
              this.screenFlash.setVisible(false);
            }
          }
        },
      ]
    });
  }

  fadeIn(colorNumber = 0x000000, duration = 2000, onComplete=()=>{}) {
    this.cameraFade.setVisible(true);
    this.cameraFade.fillColor = colorNumber;
    this.cameraFade.fillAlpha = 1;
    this.tweens.add({
      targets: this.cameraFade,
      delay : 20,
      fillAlpha : { value: 0, duration: duration, ease: 'Ease-Out' },
      onComplete : () => {
        this.cameraFade.setVisible(false);
        onComplete();
      }
    });
  }

  fadeOut(colorNumber = 0x000000, duration = 4000, onComplete=()=>{}) {
    this.cameraFade.setVisible(true);
    this.cameraFade.fillColor = colorNumber;
    this.cameraFade.fillAlpha = 0;
    this.tweens.add({
      delay: 50,
      targets: this.cameraFade,
      fillAlpha : { value: 1, duration: duration, ease: 'Ease-Out' },
      onComplete
    });
  }

  getMapKeyForWorldPosition(x,y) {
    return `world-${x},${y}`;
  }

  worldTileExists(worldX, worldY) {
    return this.load.cacheManager.tilemap.exists(this.getMapKeyForWorldPosition(worldX, worldY));
  }

  enterWorldPosition(worldX, worldY, playerX, playerY) {
    this.worldX = worldX;
    this.worldY = worldY;
    // console.log(`entering world position: ${worldX}, ${worldY})`);
    this.enterMap(this.getMapKeyForWorldPosition(worldX, worldY), playerX, playerY);
  }

  enterMap(mapKey, newPlayerX, newPlayerY) {
    // console.log(`entering map: "${mapKey}" (new player position: ${newPlayerX}, ${newPlayerY})`);
    if (this.level) {
      this.level.handleExit();
      this.level.destroy();
    }
    
    this.level = new Level(this, mapKey, this.player);
    this.level.onCollect = this.onCollectPickup.bind(this);
    this.level.onCollide = this.onTouchTile.bind(this);
    this.level.handleEnter();

    if (newPlayerX != null) {
      this.player.gameObject.setPosition(newPlayerX, newPlayerY);
    }
    
    this.setAmbience(this.level.getAmbience());
    this.setParticleSystems(this.level.getParticleSettings());
  }

  setAmbience(newAmbience) {
    // console.log('new ambience', newAmbience);
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

  setParticleSystems(newParticlesMix) {
    for (let key in this.particlesMix) {
      let emitter = this.particlesMix[key];
      emitter.killAll();
      if (key in newParticlesMix) {
        // do nothing -- we will prewarm in next pass
      } else {
        emitter.stop();
      }
    }

    for (let key in newParticlesMix) {
      let emitter = this.particlesMix[key];
      let volume = newParticlesMix[key];
      if (emitter == null) {
        emitter = this.createParticleSystem(key);
        this.particlesMix[key] = emitter;
      }
      this.prewarmParticles(emitter, key, volume);
      emitter.start();
    }
  }

  createParticleSystem(key) {
    const config = particlesConfig[key];
    if (config == null) {
      console.warn('key not found in particles config', key);
      return;
    }
    const manager = this.add.particles(config.spriteId);
    let emitter = manager.createEmitter(config.emitterConfig);
    manager.depth = config.depth;
    return emitter;
  }

  prewarmParticles(emitter, key, volume) {
    const config = particlesConfig[key];
    if (config == null) {
      console.warn('key not found in particles config', key);
      return;
    }
    const prewarmSpawnZone = config.prewarm.emitZone;
    const updateSpawnZone = config.emitterConfig.emitZone;

    emitter.setEmitZone(prewarmSpawnZone).emitParticle(Math.floor(config.prewarm.count * volume));
    emitter.setEmitZone(updateSpawnZone).setQuantity(config.emitterConfig.quantity * volume);
  }

  update(time, delta) {
    if (this.running && !this.inCutscene) {
      let playerObj = this.player.gameObject;
      this.handlePlayerMovement(time, delta);
      this.level.update(time, delta);

      if (this.player.mode === CHARACTER_MODE.GROUNDED) {
        saveManager.setSavedPosition(this.worldX, this.worldY, playerObj.x, playerObj.y, this.player.getFacing());
        saveManager.saveState();
      }
    }
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
      if (this.worldTileExists(nextWorldX, nextWorldY)) {
        this.enterWorldPosition(nextWorldX, nextWorldY, newPlayerX, newPlayerY);
        return;
      } else {
        // stop player from going to nonexistent world locations.
        // this shouldn't be possible, but just in case someone manages this, it's better to not crash.
        // -- the effect here looks kinda buggy, which might help people to report it (if it every happens).
        if (nextWorldX < this.worldX) {
          playerGameObject.x = 0;
          playerBody.velocity.x = 0;
          playerBody.acceleration.x = 0;
        } else if (nextWorldX > this.worldX) {
          playerGameObject.x = mapWidth;
          playerBody.velocity.x = 0;
          playerBody.acceleration.x = 0;
        }

        if (nextWorldY < this.worldY) {
          playerGameObject.y = 0;
          playerBody.velocity.y = 0;
          playerBody.acceleration.y = 0;
        } else if (nextWorldY > this.worldY) {
          playerGameObject.y = mapHeight;
          playerBody.velocity.y = 0;
          playerBody.acceleration.y = 0;
        }
      }
    }

    // handle mobility-mode update (from physics since last update)

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
        if (!player.canGrip(this.level.groundLayer)) {
          if (playerBody.velocity.y < 0) {
            playerBody.position.y -= 1; // a tiny bit of help clambering up
            player.jump(time);
          } else {
            player.setMode(CHARACTER_MODE.AIRBORN, time);
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

    if (this.gameOver !== true) {
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
    }

    if (this.guideLinesActivated) {
      if (cursors.shift.isDown) {
        this.updateGuideLines();
      } else {
        this.guideLinesActivated = false;
        this.hideGuideLines();
      }
    } else {
      if (cursors.shift.isDown) {
        this.showGuideLines();
      }
    }
    


    // process input
    
    if (input.x < 0) {
      if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
        // when walking up to a wall, you can latch on without wanting to.
        // disengage if you try to walk in the opposite direction
        if (player.isFacingRight()) {
          if (player.canStand(this.level.groundLayer)) {
            player.setMode(CHARACTER_MODE.GROUNDED, time);
          } else {
            if (input.y < 0) {
              player.jump(time);
            } else {
              player.setMode(CHARACTER_MODE.AIRBORN, time);
            }
          }
        }
      }
      if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
        playerGameObject.flipX = true;
        playerBody.setVelocityX(-player.stats.walkSpeed);
        if (player.canGrip(this.level.groundLayer)) {
          player.setMode(CHARACTER_MODE.EDGE_CLIMBING, time);
        }
      }
    } else if (input.x > 0) {
      if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
        // when walking up to a wall, you can latch on without wanting to.
        // disengage if you try to walk in the opposite direction
        if (player.isFacingLeft()) {
          if (player.canStand(this.level.groundLayer)) {
            player.setMode(CHARACTER_MODE.GROUNDED, time);
          } else {
            if (input.y < 0) {
              player.jump(time);
            } else {
              player.setMode(CHARACTER_MODE.AIRBORN, time);
            }
          }
        }
      }
      if (player.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
        playerGameObject.flipX = false;
        playerBody.setVelocityX(player.stats.walkSpeed);
        if (player.canGrip(this.level.groundLayer)) {
          player.setMode(CHARACTER_MODE.EDGE_CLIMBING, time);
        }
      }
    } else {
      playerBody.setVelocity(0, prevVelocity.y);
    }

    if (player.mode === CHARACTER_MODE.EDGE_CLIMBING) {
      if (input.y > 0 && playerBody.onFloor()) {
        player.setMode(CHARACTER_MODE.GROUNDED, time);
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
      this.sfx['player_jump'].play();
    }
    if (player.lastLandingTime === time) {
      this.sfx['player_land'].play();
    }

    if (player.mode === CHARACTER_MODE.EDGE_CLIMBING && player.modeLastFrame !== CHARACTER_MODE.EDGE_CLIMBING) {
      this.sfx['player_grip'].play();
    }
  }

  createGuideLines() {
    for (let i = 0; i < 30; i++) {
      let line = this.add.line(0,0,0,0,5,5,0xffffff);
      line.depth = GUIDELINE_DEPTH;
      line.setOrigin(0);
      line.setVisible(false);
      this.guideLines.push(line);
    }
  }

  showGuideLines() {
    this.updateGuideLines();
    pickupLocations.forEach((locationInfo, index) => {
      if (saveManager.didPickUp(locationInfo.id) !== true) {
        this.guideLines[index].setVisible(true);
      }
    });
    this.guideLinesActivated = true;
    this.setSFXLoop('guiding_line', true);
  }

  hideGuideLines() {
    this.guideLines.forEach((line) => line.setVisible(false));
    this.guideLinesActivated = false;
    this.setSFXLoop('guiding_line', false);
  }
  
  getJitter(scale = 1) {
    return scale * (Math.random() - 0.5);
  }

  updateGuideLines() {
    let startX = this.player.gameObject.body.center.x;
    let startY = this.player.gameObject.body.center.y;
    let globalOffsetX = this.worldX * LEVEL_WIDTH;
    let globalOffsetY = this.worldY * LEVEL_HEIGHT;

    pickupLocations.forEach((locationInfo, index) => {
      let locationX = (locationInfo.worldX * LEVEL_WIDTH) - globalOffsetX + locationInfo.levelX;
      let locationY = (locationInfo.worldY * LEVEL_HEIGHT) - globalOffsetY + locationInfo.levelY;
      let length = Math.sqrt((locationX - startX) * (locationX - startX) + (locationY - startY) * (locationY - startY));
      let line = this.guideLines[index];
      let flickerAmount = this.getJitter(0.125);
      line.setTo(startX + this.getJitter(1), startY + this.getJitter(1), locationX + this.getJitter(1), locationY + this.getJitter(1));
      line.setAlpha(Math.min(Math.max(1000/length + flickerAmount, 0.05), 0.9));

      if (saveManager.didPickUp(locationInfo.id) === true) {
        this.guideLines[index].setVisible(false);
      }
    })
  }

  onCollectPickup(pickup, player) {
    this.sfx['rift_close'].play();
    this.flashScreen();
    
    let remainingPickups = pickupLocations.filter((pickupInfo) => !saveManager.didPickUp(pickupInfo.id));
    // console.log(remainingPickups);
    if (remainingPickups.length === 0) {
      // later, we will win more elegantly, I hope
      this.winGame();
    }
  }

  onTouchTile(tile, player) {
    if (this.inCutscene) {
      return;
    }
    if (tile && tile.properties && tile.properties.deadly === true) {
      this.rescuePlayerFromDeath();
    }
  }

  rescuePlayerFromDeath() {
    let savedState = saveManager.getState();
    let safeWorldX = savedState.worldX;
    let safeWorldY = savedState.worldY;
    let safeLevelX = savedState.safeX;
    let safeLevelY = savedState.safeY;

    
    this.sfx['rescue_player_start'].play();
    this.player.gameObject.body.setEnable(false).setVelocity(0,0).setAcceleration(0,0);
    this.player.gameObject.setTintFill(0xFFFFFF);
    this.player.gameObject.anims.pause();
    
    this.setSFXLoop('player_run', false);
    this.setSFXLoop('player_climb', false);
    this.hideGuideLines();

    this.inCutscene = true;
    // this.scene.pause('GameWorldScene');

    setTimeout(()=>{
      if (safeWorldX !== this.worldX || safeWorldY !== this.worldY) {
        this.enterWorldPosition(safeWorldX, safeWorldY, safeLevelX, safeLevelY - 1);
      } else {
        this.player.gameObject.setPosition(safeLevelX, safeLevelY - 1);
      }
      this.player.setMode(CHARACTER_MODE.AIRBORN, this.game.getTime());
      this.sfx['rescue_player_end'].play();
      this.player.gameObject.clearTint();
      setTimeout(()=>{
        this.player.gameObject.body.setEnable(true)
        this.player.gameObject.active = true;
        this.player.gameObject.anims.resume();
        this.inCutscene = false;
        // this.scene.resume('GameWorldScene');
      }, 50);
    }, 700);
  }

  winGame() {
    this.gameOver = true;
    // todo: make winning look less bad
    const text1 = this.add.text(0, this.renderer.height / 4, 'You won :)', { font: '32px Arial', color: "white", resolution: 8, align: "center", fixedWidth: (this.renderer.width / 2)});
    text1.depth = CAMERA_FADE_DEPTH + 1;
    saveManager.markActiveSlotAsFinished();
    console.log("you won");
    this.fadeOut();
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