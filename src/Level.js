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
   * @param {string=} mapKey - the key/id for the map (from when you pre-loaded said map)
  */
  constructor(scene, mapKey) {
    const map = scene.make.tilemap({ key: mapKey });
    const tileset = map.addTilesetImage(TILED_TILESET_NAME, TILESET_ASSET_KEY);

    /** @type Phaser.Tilemaps.Tilemap */
    this.map = map;
    /** @type Phaser.Tilemaps.TilemapLayer */
    this.skyLayer = map.createLayer(TILED_LAYER_NAMES.SKY, tileset, 0, 0);
    /** @type Phaser.Tilemaps.TilemapLayer */
    this.backLayer = map.createLayer(TILED_LAYER_NAMES.BACK, tileset, 0, 0);
    /** @type Phaser.Tilemaps.TilemapLayer */
    this.groundLayer = map.createLayer(TILED_LAYER_NAMES.GROUND, tileset, 0, 0); console.log(this.groundLayer);

    this.groundLayer.setCollisionByProperty({ solid: true });
  }

  handleEnter() {

  }

  handleExit() {
    
  }
}