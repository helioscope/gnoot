/// <reference types="@mapeditor/tiled-api" />



(function() {
// wow, it's been awhile since I've written an IIFE
// even if I use .mjs for the extensions I'm writing, 
// I still get warnings about collisions from global scope if I don't use the IIFE...

const customActionTitle = "New Map (Like Active Map)";
const customActionId = "NewMapLikeCurrent";

function handleSignalOnce(signal, handler) {
  tiled.log('will handle signal, presumably');
  let oneTimeFunction = (...args) => {
    tiled.log('one-time-function running...');
    if (handler(...args)) {
      signal.disconnect(oneTimeFunction);
    }
  }
  signal.connect(oneTimeFunction);
}

const action = tiled.registerAction(customActionId, function(action) {
  let currentAsset = tiled.activeAsset;

  if (!currentAsset.isTileMap) {
    tiled.alert("You must have a TileMap as the active tab in order to run this command.");
    return;
  }

  /** @type TileMap */
  // @ts-ignore
  let currentMap = currentAsset;
  let currentLayer = currentMap.currentLayer;
  let newLayerIndex = -1;

  let newMap = new TileMap();
  let hasWarnings = false;

  newMap.width = currentMap.width;
  newMap.height = currentMap.height;
  newMap.tileWidth = currentMap.tileWidth;
  newMap.tileHeight = currentMap.tileHeight;

  let newLayers = currentMap.layers.map((originalLayer, index) => {
    let newLayer;
    if (originalLayer.isTileLayer) {
      newLayer = new TileLayer();
      newLayer.name = originalLayer.name;
    } else if (originalLayer.isObjectLayer) {
      newLayer = new ObjectGroup();
      newLayer.name = originalLayer.name;
    } else if (originalLayer.isImageLayer) {
      newLayer = new ImageLayer();
      newLayer.name = originalLayer.name;
    } else if (originalLayer.isGroupLayer) {
      newLayer = new GroupLayer();
      newLayer.name = originalLayer.name;
    } else {
      newLayer = new TileLayer();
      newLayer.name = originalLayer.name + " [UNHANDLED TYPE]";
      tiled.warn(
        `WARNING: UNKNOWN LAYER TYPE for layer "${originalLayer.name}"`,
        ()=>{
          tiled.activeAsset = newMap;
          newMap.currentLayer = newLayer;
        }
      );
      hasWarnings = true;
    }
    if (currentLayer.id === originalLayer.id) {
      tiled.log(`found match for current layer at index ${index}`);
      tiled.log(originalLayer.name);
      newLayerIndex = index;
    }
    return newLayer;
  });

  newLayers.forEach((layer) => {
    newMap.addLayer(layer);
  });

  currentMap.tilesets.forEach((tileset) => {
    newMap.addTileset(tileset);
  });

  // I'd like to select the same layer that was previously active,
  // but every attempt I've made to set the current layer fails --
  // the error message says the layer doesn't belong the map
  // and indeed, it looks like any way of accessing the map's layers
  // returns layers whose "map" property is null.
  // not sure if this is a timing issue (maybe the map property
  // will be set later?) or if something else is wrong.
  // a link to the error message in the C++ source is here: 
  // https://github.com/mapeditor/tiled/blob/7ea7bd802abdc91eda66dcf36a620549db8f06bd/src/tiled/editablemap.cpp#L623
  // It seems like there might be a bug? If I try executing a script
  // via the console to check on the tile layer's map, it throws an error
  // String(tiled.activeAsset.layers[0].map)

  // can test with these commands:
  // (function(){ let newMap = new TileMap(); tiled.activeAsset = newMap; })(); // create new map and make it the active asset
  // (function(){ let newLayer = new TileLayer(); newLayer.name = "TEST"; tiled.activeAsset.addLayer(newLayer); })(); // create layer in current map
  // tiled.log(String(tiled.activeAsset.currentLayer.map)); // log the current layer's map

  // when you create a new map via the script, then add layers,
  // those layers end up with a null map property.
  // this doesn't happen when you create a new map via the menu.

  // handleSignalOnce(tiled.activeAssetChanged, (newAsset)=>{
  //   tiled.log('it is happening!');
  //   tiled.log(newAsset.fileName);
  //   if (newAsset.fileName === newMap.fileName) {
  //     tiled.log(`new layer index ${newLayerIndex}`);
  //     tiled.log(newAsset.layers[newLayerIndex] ? newAsset.layers[newLayerIndex].name : 'no layer found at that index...');
  //     tiled.log(String(newAsset.layerAt(0).map));
  //     newAsset.currentLayer = newAsset.layerAt(0);
  //     return true;
  //   }
  //   return false;
  // });

  tiled.activeAsset = newMap;
})

action.text = customActionTitle;

tiled.extendMenu("New", [
    { action: customActionId, before: "NewTileset" }
]);

})();