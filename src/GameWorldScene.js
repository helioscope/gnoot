import Phaser from 'phaser'


export default class GameWorldScene extends Phaser.Scene {
	constructor() {
		super('gameworld-scene');
    this.cursors = null;
    this.player = null;
    this.showDebug = false;
	}

  preload() {
    this.load.image("tiles", "assets/tileset_extruded.png");
    this.load.tilemapTiledJSON("test-map", "assets/test-map.json");
    this.load.spritesheet('player-sprite', "assets/player-placeholder-anims.png", {frameWidth: 16, frameHeight: 16});
  }

  create() {
    const map = this.make.tilemap({ key: "test-map" });
    const tileset = map.addTilesetImage("main-tileset", "tiles"); // ([Tiled's name], [the key we used when loading])

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const skyLayer = map.createLayer("Sky", tileset, 0, 0);
    const backLayer = map.createLayer("Behind", tileset, 0, 0);
    const groundLayer = map.createLayer("Ground", tileset, 0, 0);

    groundLayer.setCollisionByProperty({ solid: true });

    // define our animations
    this.defineAnimations();

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = map.findObject("Spawns", obj => obj.name === "Start");

    // Create a sprite with physics enabled via the physics system. The image used for the sprite has
    // a bit of whitespace, so I'm using setSize & setOffset to control the size of the player's body.
    this.player = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, "player-sprite", "idle_right")
      .setSize(10, 15)
      .setOffset(3, 1);

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(this.player, groundLayer);

    const camera = this.cameras.main;
    // camera.startFollow(this.player);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.zoomX = camera.zoomY = 2;

    this.cursors = this.input.keyboard.createCursorKeys();

    // Debug graphics
    this.input.keyboard.once("keydown-D", event => {
      // Turn on physics debugging to show player's hitbox
      this.physics.world.createDebugGraphic();

      // Create worldLayer collision graphic above the player, but below the help text
      const graphics = this.add
        .graphics()
        .setAlpha(0.75)
        .setDepth(20);
      groundLayer.renderDebug(graphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
      });
    });
  }
  defineAnimations() {
    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const anims = this.anims;
    anims.create({
      key: "player_idle_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [0]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_walk_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [1,2]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_jump-rise_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [3,4]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_jump-idle_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [5]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_jump-fall_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [6,7]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_jump-land_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [8]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_climb-idle_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [9]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_climb-up_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [10,11]}),
      frameRate: 10,
      repeat: -1
    });
    anims.create({
      key: "player_climb-down_right",
      frames: this.anims.generateFrameNumbers("player-sprite", {frames: [13,14]}),
      frameRate: 10,
      repeat: -1
    });
  }
  update(time, delta) {
    this.handlePlayerMovement();
  }
  handlePlayerMovement() {
    const groundSpeed = 150;
    const jumpSpeed = 150;
    const cursors = this.cursors;
    const player = this.player;
    const playerBody = player.body;
    const prevVelocity = playerBody.velocity.clone();
    
    let jumped = false;
    let moved = false;

    // Horizontal movement
    if (cursors.left.isDown) {
      playerBody.setVelocityX(-groundSpeed);
      player.flipX = true;
      moved = true;
    } else if (cursors.right.isDown) {
      playerBody.setVelocityX(groundSpeed);
      player.flipX = false;
      moved = true;
    } else {
      playerBody.setVelocity(0, prevVelocity.y);
    }
    if (playerBody.onFloor() && cursors.up.isDown) {
      playerBody.setVelocityY(-jumpSpeed);
      jumped = true;
    }

    if (playerBody.onFloor() && !jumped) {
      if (moved) {
        player.anims.play("player_walk_right", true);
      } else {
        player.anims.play("player_idle_right", true);
      }
    } else {
      if (playerBody.velocity.y < -40) {
        player.anims.play("player_jump-rise_right", true);
      } else if (playerBody.velocity.y > 40) {
        player.anims.play("player_jump-fall_right", true);
      } else {
        player.anims.play("player_jump-idle_right", true);
      }
    }
  }
}