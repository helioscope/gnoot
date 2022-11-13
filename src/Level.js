export const TILESET_ASSET_KEY = "tiles"; // key for the tileset image we loaded
export const TILED_TILESET_NAME = "main-tileset"; // name of the tileset in Tiled

export const TILED_LAYER_NAMES = {
  SKY : "Sky",
  BACK : "Behind",
  GROUND : "Ground"
}

export default class Level {
  constructor(scene, mapKey) {
    const map = scene.make.tilemap({ key: mapKey });
    const tileset = map.addTilesetImage(TILED_TILESET_NAME, TILESET_ASSET_KEY);

    this.map = map;
    this.skyLayer = map.createLayer(TILED_LAYER_NAMES.SKY, tileset, 0, 0);
    this.backLayer = map.createLayer(TILED_LAYER_NAMES.BACK, tileset, 0, 0);
    this.groundLayer = map.createLayer(TILED_LAYER_NAMES.GROUND, tileset, 0, 0);

    this.groundLayer.setCollisionByProperty({ solid: true });
  }
}