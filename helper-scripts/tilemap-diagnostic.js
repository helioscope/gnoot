import fs from 'fs';
import {argv, argv0, exit} from 'node:process';

/*
 * This is just something to help with troubleshooting Tiled tilemap files.
*/

const sourceDir = argv[2];
const ambienceKeyList = {
  'desert' :'assets/Desert.wav',
  'mountain' :'assets/Ambience_Wind_Mountain_01_Loop.wav',
  'pillars' :'assets/Wind Loop 1.wav',
  'bridge': 'assets/Ambience_Place_Bridge_Wooden_Crackling_Loop.wav',
  'plateau-soft': 'assets/Ambience_Wind_Intensity_Soft_With_Leaves_Loop.wav',
  'plateau-windy': 'assets/Ambience_Place_Desert_Night_Loop.wav',
  'cave-large': 'assets/Cave 2.wav',
  'cave-dark': 'assets/Ambience_Place_Cave_Dark_Loop.wav',
  'stalks': 'assets/Knytt-like-game-sfx--fungus-ambience1-loop.wav',
};

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


  // console.log("\ntilesets:");
  // data.tilesets.forEach((tileset, index)=>{
  //   if (tileset.name && tileset.image && tileset.src === undefined) { 
  //     console.log(`    (${index}) - EMBEDDED`);
  //     console.log(`    (${index}) - firstgid: ${tileset.firstgid}`);
  //   } else {
  //     console.log(`    (${index}) - REFERENCED`);
  //     console.log(`    (${index}) - firstgid: ${tileset.firstgid}`);
  //   }
  // });

  // console.log("\nlayers:");
  // data.layers.forEach((layer) => {
  //   if (layer["type"] !== "tilelayer") {
  //     // skip non-tile layers
  //     return;
  //   }

  //   let lowestID = Infinity;
  //   let highestID = -Infinity;

  //   layer.data.forEach((tileId, index) => {
  //     if (tileId < lowestID && tileId > 0) {
  //       lowestID = tileId;
  //     }
  //     if (tileId > highestID) {
  //       highestID = tileId;
  //     }
  //   });

  //   if (lowestID == Infinity && highestID == -Infinity) {
  //     console.log(`    ${layer.name} - UNUSED`);
  //   } else {
  //     console.log(`    ${layer.name} : ${lowestID == Infinity ? 0 : lowestID} - ${highestID}`);
  //   }
  // });

  if (data.properties) {
    let entriesDict = {};
    data.properties.forEach((entry) => {
      if (entry.name === 'audioloops') {
        if (entry.type !== 'string') {
          console.warn('bad audioloops type: ' + entry.type);
        }
        let loopString = entry.value;
        if (!loopString || !loopString.trim()) {
          console.warn('empty audioloop string');
        }

        loopString.split(/[,;]/).forEach((trackString) => {
          let [key, volume] = trackString.split('@');
          if (!(key.trim() && volume)) {
            console.warn(`ambience track string is missing parts: ${trackString}`);
            return;
          }
          key = key.trim();
          volume = parseInt(volume.trim());
          if (key.length === 0 || isNaN(volume)) {
            console.warn(`ambience track string seems badly formatted: ${trackString}`);
            return;
          } else {
            if (key in ambienceKeyList) {
              // console.log('ambience: "' + key + '" ' + volume);
            } else {
              console.log('unrecognized audioloop: ' + key);
            }
          }
        });
      } else {
        console.log('unrecognized map property: ' + entry.name);
      }
    });
  }

  console.log(`\n`);
}