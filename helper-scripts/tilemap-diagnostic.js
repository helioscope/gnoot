import fs from 'fs';
import {argv, argv0, exit} from 'node:process';

/*
 * This is just something to help with troubleshooting Tiled tilemap files.
*/

const sourceDir = argv[2];

if (sourceDir == null) {
  console.log(`BAD COMMAND\nusage: ${argv0} path/to/maps/`);
  exit(1);
}

fs.readdirSync(sourceDir).forEach((fileName) => {
  
  if (fileName.endsWith('.tmj') || fileName.endsWith('.json')) {
    checkMapJSONFile(fileName);
  } else if (fileName.endsWith('.tmx')) {
    console.warn(`WARNING -- .tmx files aren't currently supported (${fileName}) -- export to .tmj (JSON format) instead`);
  } else {
    // skip file
    return;
  }
});



// Functions
function checkMapJSONFile(fileName) {
  let content = fs.readFileSync(sourceDir + fileName, {encoding: 'utf-8'});
  let data = JSON.parse(content);

  console.log(`[[[ ${fileName} ]]]`);


  console.log("\ntilesets:");
  data.tilesets.forEach((tileset, index)=>{
    if (tileset.name && tileset.image && tileset.src === undefined) { 
      console.log(`    (${index}) - EMBEDDED`);
      console.log(`    (${index}) - firstgid: ${tileset.firstgid}`);
    } else {
      console.log(`    (${index}) - REFERENCED`);
      console.log(`    (${index}) - firstgid: ${tileset.firstgid}`);
    }
  });

  console.log("\nlayers:");

  data.layers.forEach((layer) => {
    if (layer["type"] !== "tilelayer") {
      // skip non-tile layers
      return;
    }

    let lowestID = Infinity;
    let highestID = -Infinity;

    layer.data.forEach((tileId, index) => {
      if (tileId < lowestID && tileId > 0) {
        lowestID = tileId;
      }
      if (tileId > highestID) {
        highestID = tileId;
      }
    });

    if (lowestID == Infinity && highestID == -Infinity) {
      console.log(`    ${layer.name} - UNUSED`);
    } else {
      console.log(`    ${layer.name} : ${lowestID == Infinity ? 0 : lowestID} - ${highestID}`);
    }
  });

  console.log(`\n`);
}