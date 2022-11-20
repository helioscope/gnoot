export const CHARACTER_MODE = {
  INIT : 'INIT',
  GROUNDED : 'GROUNDED',
  AIRBORN : 'AIRBORN',
  EDGE_CLIMBING : 'EDGE_CLIMBING'
};

export const AIRBORN_IDLE_ANIM_MAX_SPEED = 40;

export const COYOTE_TIME = 90; // (milliseconds) how late you can jump after walking off a ledge
export const JUMP_DELAY = 150; // (milliseconds) how long you have to wait before jumping again
export const PREMATURE_JUMP_ALLOWANCE = 100; // (milliseconds) how early you can press the jump button before landing and still have it work

export const DEFAULT_MAX_VELOCITY = 400;

export default class Character {
  /**
   * @param {Phaser.Scene}  scene - The scene to add the level to
   * @param {Number} x - x position to start at
   * @param {Number} y - y position to start at
   * @param {any} config - character config (todo: define a type)
  */
  constructor(scene, x, y, config) {
    let spriteConfig = config.spriteSheet;
    
    this.config = config;
    this.stats = {...config.stats};
    /** @type Phaser.Types.Physics.Arcade.SpriteWithDynamicBody */
    this.gameObject = scene.physics.add.sprite(x,y, spriteConfig.key)
      .setSize(spriteConfig.colliderSize[0],spriteConfig.colliderSize[1])
      .setOffset(spriteConfig.colliderOffset[0],spriteConfig.colliderOffset[1]);

    this.gameObject.body.maxVelocity.set(this.stats.runSpeed || DEFAULT_MAX_VELOCITY, this.stats.maxFallSpeed || DEFAULT_MAX_VELOCITY);

    this.mode = CHARACTER_MODE.INIT;
    this.modeLastFrame = CHARACTER_MODE.INIT;
    this.input = {
      x : 0,
      y : 0,
      jump : false
    };
    this.inputLastFrame = {
      x : 0,
      y : 0,
      jump : false
    };
    this.lastExitedMode = CHARACTER_MODE.INIT;
    this.lastModeChangeTime = 0;
    this.lastJumpTime = 0;
    this.lastLandingTime = 0;
  }

  setAnimation(animationKey, shouldContinue) {
    this.gameObject.anims.play(this.config.animationSettings.animationPrefix + animationKey, shouldContinue);
  }

  canGrip(tilemapLayer) {
    let body = this.gameObject.body;
    let playerGripTop = body.y + this.stats.edgeGripTop;
    let playerGripBottom = body.y + this.stats.edgeGripBottom;
    let upperTile = null;
    let lowerTile = null;

    if (this.gameObject.flipX) {
      upperTile = tilemapLayer.getTileAtWorldXY(body.left - 1, playerGripTop);
      lowerTile = tilemapLayer.getTileAtWorldXY(body.left - 1, playerGripBottom);
      if ((upperTile && upperTile.collideRight) || (lowerTile && lowerTile.collideRight) ) {
        return true;
      }
    } else {
      upperTile = tilemapLayer.getTileAtWorldXY(body.right + 1, playerGripTop);
      lowerTile = tilemapLayer.getTileAtWorldXY(body.right + 1, playerGripBottom);
      if ((upperTile && upperTile.collideLeft) || (lowerTile && lowerTile.collideLeft) ) {
        return true;
      }
    }
    return false;
  }

  canJump(time) {
    if (this.mode === CHARACTER_MODE.GROUNDED) {
      return true;
    }

    if (this.mode === CHARACTER_MODE.EDGE_CLIMBING) {
      return true;
    }

    if (this.mode === CHARACTER_MODE.AIRBORN) {
      if (this.lastExitedMode === CHARACTER_MODE.GROUNDED) {
        if (time - this.lastModeChangeTime < COYOTE_TIME) {
          return true;
        }
      }
    }
  }

  jump(time) {
    this.gameObject.body.setVelocityY(-this.stats.jumpSpeed);
    this.lastJumpTime = time;
    this.setMode(CHARACTER_MODE.AIRBORN, time);
  }

  getVelocity() {
    return this.gameObject.body.velocity;
  }

  accelerate(deltaX, deltaY) {
    let body = this.gameObject.body;
    let currentAcceleration = body.acceleration;
    console.log(`acceleration before adjustment:${currentAcceleration}`);
    body.setAcceleration(currentAcceleration.x + deltaX, currentAcceleration.y + deltaY);
  }

  setMode(newMode, time) {
    if (this.mode === newMode) {
      return;
    }
    this.lastExitedMode = this.mode;
    this.mode = newMode;
    this.lastModeChangeTime = time;
  }
}