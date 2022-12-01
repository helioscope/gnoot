import Character from "./Character";
import characterConfig from "./characterConfig";
import { getNewBehaviorState } from "./npcDriver";
import saveManager from "./saveManager";
import { getObjectCustomProperty } from "./tiled-helpers";

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
    this.sprites = [];
    this.npcs = [];
    this.overlapCheckers = [];
    this.collisionCheckers = [];
    this.onCollect = function(item, playerObj) {console.log('collected', item);};
    this.onCollide = function (tile, playerObj) {};


    this.groundLayer.setCollisionByProperty({ solid: true });
    this.collisionCheckers.push(scene.physics.add.collider(player.gameObject, this.groundLayer, (player, tile) => {
      this.onCollide(tile, player);
    }));

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
          pickup.anims.play(pickupConfig.animationSettings.animationPrefix + "idle", true);
          pickup.body.allowGravity = false;

          this.pickups.push(pickup);
          this.overlapCheckers.push(scene.physics.add.overlap(player.gameObject, pickup, this.onTouchPickup, null, this));
        } else if (obj.name === "Sprite") {
          this.spawnSprite(obj, scene);
        } else if (obj.name === "NPC") {
          this.spawnNPC(obj, scene);
        }
      });
    }
  }

  /** 
   * @param {Phaser.Types.Tilemaps.TiledObject} data 
   * @param {Phaser.Scene} scene
   * */
  spawnSprite(data, scene) {
    const spriteConfigId = getObjectCustomProperty(data, 'id');
    const defaultAnim = getObjectCustomProperty(data, 'defaultAnimation');
    const tint = getObjectCustomProperty(data, 'tint');
    const flipX = getObjectCustomProperty(data, 'flipX');
    const config = characterConfig[spriteConfigId];

    if (config == null) {
      console.warn(`bad id "${spriteConfigId}" for sprite in level`);
      return;
    }

    const newSprite = scene.add.sprite(data.x, data.y, config.spriteSheet.key);
    if (flipX) {
      newSprite.flipX = true;
    }
    if (tint) {
      newSprite.tint = parseInt(tint.replace('#',''),16);
    }
    newSprite.anims.play(config.animationSettings.animationPrefix + defaultAnim, true);
    this.sprites.push(newSprite);
  }

  /** 
   * @param {Phaser.Types.Tilemaps.TiledObject} data 
   * @param {Phaser.Scene} scene
   * */
   spawnNPC(data, scene) {
    const configId = getObjectCustomProperty(data, 'characterId');
    const behaviorId = getObjectCustomProperty(data, 'behavior');
    const config = characterConfig[configId];

    if (config == null) {
      console.warn(`bad id "${configId}" for sprite in level`);
      return;
    }

    const newCharacter = new Character(scene, data.x, data.y, config);
    newCharacter.behaviorState = getNewBehaviorState(behaviorId, data, this.map);
    this.npcs.push(newCharacter);
    this.collisionCheckers.push(scene.physics.add.collider(newCharacter.gameObject, this.groundLayer));
  }

  

  destroy() {
    this.overlapCheckers.forEach((checker)=>{checker.destroy()});
    this.collisionCheckers.forEach((checker) => {checker.destroy()});
    this.pickups.forEach((pickup)=>{pickup.destroy()});
    this.sprites.forEach((sprite)=>{sprite.destroy()});
    this.npcs.forEach((character)=>{character.destroy()});
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
    return this.getScaledSettings('audioloops');
  }

  getParticleSettings() {
    return this.getScaledSettings('particles');
  }

  getScaledSettings(propertyName) {
    let mapProperties = this.map.properties;
    let prop = Array.isArray(mapProperties) ? mapProperties.find((prop)=>{return prop.name === propertyName;}) : null;
    let valString = prop ? prop.value : null;
    
    let settings = {};
    if (valString) {
      valString.split(/[,;]/).forEach((trackString) => {
        let [key, percent] = trackString.split('@');
        if (!(key && percent)) {
          console.warn(`config string "${propertyName}" is missing parts: ${trackString}`);
          return;
        }
        key = key.trim();
        percent = parseInt(percent.trim());
        if (key.length === 0 || isNaN(percent)) {
          console.warn(`config string "${propertyName}" seems badly formatted: ${trackString}`);
          return;
        } else {
          settings[key] = percent / 100;
        }
      });
    }
    return settings;
  }

  handleEnter() {

  }

  handleExit() {
    
  }
}