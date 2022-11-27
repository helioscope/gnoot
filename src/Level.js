import characterConfig from "./characterConfig";
import saveManager from "./saveManager";

export const TILESET_ASSET_KEY = "tiles"; // key for the tileset image we loaded
export const TILED_TILESET_NAME = "main-tileset"; // name of the tileset in Tiled

export const TILED_LAYER_NAMES = {
  SKY : "Sky",
  BACK : "Behind",
  GROUND : "Ground"
}

export default class Level {
  /**
   * @param {Phaser.Scene}  scene - The scene to add the level to
   * @param {string} mapKey - the key/id for the map (from when you pre-loaded said map)
  */
  constructor(scene, mapKey, player) {
    const map = scene.make.tilemap({ key: mapKey });
    const tileset = map.addTilesetImage(TILED_TILESET_NAME, TILESET_ASSET_KEY);

    /** @type Phaser.Tilemaps.Tilemap */
    this.map = map;
    /** @type Phaser.Tilemaps.TilemapLayer */
    this.skyLayer = map.createLayer(TILED_LAYER_NAMES.SKY, tileset, 0, 0);
    /** @type Phaser.Tilemaps.TilemapLayer */
    this.backLayer = map.createLayer(TILED_LAYER_NAMES.BACK, tileset, 0, 0);
    /** @type Phaser.Tilemaps.TilemapLayer */
    this.groundLayer = map.createLayer(TILED_LAYER_NAMES.GROUND, tileset, 0, 0);
    this.pickups = [];
    this.overlapCheckers = [];
    this.groundCollider = null;
    this.onCollect = function(item, playerObj) {console.log('collected', item);};
    this.onCollide = function (tile, playerObj) {};


    this.groundLayer.setCollisionByProperty({ solid: true });
    this.groundCollider = scene.physics.add.collider(player.gameObject, this.groundLayer, (player, tile) => {
      this.onCollide(tile, player);
    });

    const spawnLayer = map.getObjectLayer("Spawns");
    if (spawnLayer) {
      const pickupConfig = characterConfig.rift;
      spawnLayer.objects.forEach((obj) => {
        if (obj.name === "Pickup") {
          if (!Array.isArray(obj.properties)) {
            console.warn("pickup appears to be missing custom properties -- this will break things", obj);
          }
          let pickupIdProp = obj.properties.find((prop)=>prop.name === 'id');
          let pickupId = pickupIdProp ? pickupIdProp.value : null;
          if (pickupId == null) {
            console.warn("bad pickup id for object -- this may break things", obj);
          }
          if (saveManager.didPickUp(pickupId)) {
            // don't spawn pickups we've already picked up
            return;
          }
          const spriteConfig = pickupConfig.spriteSheet;
          const pickup = scene.physics.add.sprite(obj.x, obj.y, spriteConfig.key)
            .setSize(spriteConfig.colliderSize[0],spriteConfig.colliderSize[1])
            .setOffset(spriteConfig.colliderOffset[0],spriteConfig.colliderOffset[1]);
          pickup.setData("pickupId", pickupId);
          console.log(obj, pickupId);
          pickup.anims.play(pickupConfig.animationSettings.animationPrefix + "idle", true);
          pickup.body.allowGravity = false;

          this.pickups.push(pickup);
          this.overlapCheckers.push(scene.physics.add.overlap(player.gameObject, pickup, this.onTouchPickup, null, this));
        }
      });
    }
  }

  destroy() {
    this.overlapCheckers.forEach((checker)=>{checker.destroy()});
    this.groundCollider.destroy();
    this.pickups.forEach((pickup)=>{pickup.destroy()});
    this.map.destroy();
    this.onCollect = null;
    this.onCollide = null;
  }

  onTouchPickup(player, pickup) {
    pickup.disableBody(true,true);
    saveManager.setPickup(pickup.getData('pickupId'), true);
    this.onCollect(pickup, player);
  }

  getAmbience() {
    let mapProperties = this.map.properties;
    let loopProp = Array.isArray(mapProperties) ? mapProperties.find((prop)=>{return prop.name === "audioloops";}) : null;
    let loopString = loopProp ? loopProp.value : null;
    
    let ambienceSettings = {};
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
          ambienceSettings[key] = volume / 100;
        }
      });
    }
    return ambienceSettings;
  }

  handleEnter() {

  }

  handleExit() {
    
  }
}