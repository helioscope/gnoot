import fs from 'fs';
import {argv, exit} from 'node:process';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

/*
 * When you add new tiles to a tilesheet, you can end up borking all previous tile IDs in Tiled.
 * This script tries to help you recover.
 * 
 * WARNING: There are a bunch of caveats/things I'm not handling here -- see below todo items.
 * 
*/

// todo: fix issue with writing boolean properties in XML (`solid="true"` collapses to `solid`)
// todo: fix issue with tile properties not being handled properly (are the tile ids not getting remapped?)

// todo: consider other OS filepath separators
// todo: handle multiple tilesets (or better warn about them when encountering them)
// - could use the image filename to target the appropriate tileset definitions?
// - would have to start with tileset files and identify the right ones, 
//   then handle "firstgid" getting bumped around by referenced tilesets (if applicable)
// todo: handle tile animation (I haven't even looked at the data spec)
// todo: make configuration/args more readable (maybe just take a config file path?)
// todo: handle tsj files (in addition to tsx files)
// todo: handle tmx files (in addition to tmj files)
// todo: version-check files (I was using Tiled version 1.9.2 while writing this script)


if (argv.length < 9) {
  console.error(`\nERROR: One or more argument is missing.`);
  console.log(`\nusage:\n {command} path/to/maps/ [OLD_COL_COUNT] [NEW_COL_COUNT] [OLD_TILE_COUNT] [NEW_TILE_COUNT] [OLD_IMG_WIDTH]x[OLD_IMG_HEIGHT] [NEW_IMG_WIDTH]x[NEW_IMG_HEIGHT]`);
  console.log(`\ne.g.\n{command} path/to/maps/ 12 18 168 306 216x256 306x306\n`);
  exit(1);
}

const sourceDir = argv[2];
const oldColumnCount = parseInt(argv[3]);
const newColumnCount = parseInt(argv[4]);
const oldCount = parseInt(argv[5]);
const newCount = parseInt(argv[6]);
const [oldImageWidth, oldImageHeight] = argv[7].split(/x/i).map(parseInt);
const [newImageWidth, newImageHeight] = argv[8].split(/x/i).map(parseInt);
const backupFolderName = 'backup' + (new Date()).valueOf();

let fileNames = [];
let tileIdMap = {};


fs.mkdirSync(sourceDir + backupFolderName);

fileNames = fs.readdirSync(sourceDir);
fileNames.forEach((fileName) => {
  
  if (fileName.endsWith('.tmj') || fileName.endsWith('.json')) {
    updateMapJSONFile(fileName);
  } else if (fileName.endsWith('.tmx')) {
    console.warn(`WARNING -- .tmx files aren't currently supported (${fileName}) -- export to .tmj (JSON format) instead`);
  } else if (fileName.endsWith('.tsx')) {
    updateTileSetXMLFile(fileName);
  } else if (fileName.endsWith('.tsj')) {
    console.warn(`WARNING -- .tsj files aren't currently supported (${fileName}) -- edit this by hand`);
  } else {
    return;
  }
});

console.log("backups of the original files have been saved under " + sourceDir + backupFolderName);


// Functions
function getRemappedTileId(oldId) {
  oldId = parseInt(oldId);
  if (oldId in tileIdMap) {
    return tileIdMap[oldId];
  } else {
    let newId = -1;
    if (oldId > oldCount) {
      // handle case where Tiled embedded the tileset but kept the original referenced tileset too, 
      // and somewhere down the line we end up with a mix of IDs from the two identical sets
      newId = (oldId - oldCount); 
      newId = newId + Math.floor(newId/oldColumnCount) * (newColumnCount - oldColumnCount) + newCount;
    } else {
      newId = oldId + Math.floor(oldId/oldColumnCount) * (newColumnCount - oldColumnCount);
    }
    tileIdMap[oldId] = newId;
    return newId;
  }
}

function getRemappedFirstGID(oldFirstGID) {
  if (oldFirstGID === oldCount + 1) {
    return newCount + 1;
  } else if (oldFirstGID > oldCount || oldFirstGID > 1) {
    console.warn(`WARNING: unexpected firstgid (${oldFirstGID}) in tileset -- there may be a problem...`);
  }
  return oldFirstGID;
}

function updateMapJSONFile(fileName) {
  let content = fs.readFileSync(sourceDir + fileName, {encoding: 'utf-8'});
  let data = JSON.parse(content);

  console.log(`checking ${fileName}...`);

  // for embedded tilesets, we'll need to update: 
  // - firstgid               // where to start the tile ID numbers assigned to this sheet (used in tilemap layer data)
  // - columns                // columns (number of tiles across) in sheet
  // - tilecount              // total number of tiles in sheet
  // - imageheight            // height (in pixels) of tilesheet image file
  // - imagewidth             // width (in pixels) of tilesheet image file
  //
  // for non-embedded tilesets, we'll need to update: 
  // - firstgid               // where to start the tile ID numbers assigned to this sheet (used in tilemap layer data
  //
  // in the case of multiple tilesets (which has been occurring when embedding tilesets), we'll need to make sure 
  // that the "firstgid" value is pushed up accordingly, so it doesn't overlap the tail end of a preceding tileset.

  data.tilesets.forEach((tileset, index)=>{
    if (tileset.name && tileset.image && tileset.src === undefined) {

      if (tileset.imageheight === oldImageHeight) {
        tileset.imageheight = newImageHeight;
      } else {
        console.warn(`found an embedded tileset whose image height (${tileset.imageheight}) doesn't match the old one (${oldImageHeight}). BEWARE THE CONSEQUENCES`);
      }

      if (tileset.imagewidth === oldImageWidth) {
        tileset.imagewidth = newImageWidth;
      } else {
        console.warn(`found an embedded tileset whose image width (${tileset.imagewidth}) doesn't match the old one (${oldImageWidth}). BEWARE THE CONSEQUENCES`);
      }

      if (tileset.columns == oldColumnCount) {
        tileset.columns = newColumnCount;
      } else {
        console.warn(`found an embedded tileset whose column count (${tileset.columns}) doesn't match the old one (${newColumnCount}). BEWARE THE CONSEQUENCES`);
      }

      if (tileset.tilecount === oldCount) {
        tileset.tilecount = newCount;
      } else {
        console.warn(`found an embedded tileset whose tile count  (${tileset.tilecount}) doesn't match the old one (${oldCount}). BEWARE THE CONSEQUENCES`);
      }

      tileset.firstgid = getRemappedFirstGID(tileset.firstgid);
    } else {
      // this is NOT an embedded tileset.

      tileset.firstgid = getRemappedFirstGID(tileset.firstgid);
    }
  });

  data.layers.forEach((layer) => {
    if (layer["type"] !== "tilelayer") {
      // skip non-tile layers
      return;
    }

    let warnedLayer = false;

    layer.data.forEach((tileId, index) => {
      // skip unchanged tiles
      if (tileId < oldColumnCount) {
        return;
      }
      
      layer.data[index] = getRemappedTileId(tileId);
    });
  });

  fs.copyFileSync(sourceDir + fileName, sourceDir + backupFolderName + "/" + fileName); // make backup of original content
  fs.writeFileSync(sourceDir + fileName, JSON.stringify(data, null, 2)); // overwrite original

  console.log(`...finished ${fileName}`);
}

function updateTileSetXMLFile(fileName) {
  console.log(`checking ${fileName}...`);
  const xmlParser = new XMLParser({ignoreAttributes: false, attributeNamePrefix : "attr_"});
  const xmlBuilder = new XMLBuilder({ignoreAttributes: false, attributeNamePrefix: "attr_", format: true});

  let content = fs.readFileSync(sourceDir + fileName, {encoding: 'utf-8'});
  let data = xmlParser.parse(content);

  // relevant data:
  // <tileset> (root obj): tilecount, columns // TODO (easier to just do tilecount by hand right now)
  // <image> (under tileset): width, height // TODO (easier to just do image properties by hand right now)
  // <tile> (under tileset): id

  data.tileset.attr_columns = newColumnCount;
  data.tileset.attr_tilecount = newCount;

  data.tileset.image.attr_width = newImageWidth;
  data.tileset.image.attr_height = newImageHeight;

  data.tileset.tile.forEach((tile) => {
    tile.attr_id = getRemappedTileId(tile.attr_id);
  });
  
  fs.copyFileSync(sourceDir + fileName, sourceDir + backupFolderName + "/" + fileName); // make backup of original content
  fs.writeFileSync(sourceDir + fileName, xmlBuilder.build(data)); // overwrite original
  console.log(`...finished ${fileName}`);
}
