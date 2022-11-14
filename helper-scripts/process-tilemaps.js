import fs from 'fs';
import {argv} from 'node:process'

// for "node myscript.js path/to/thing" arg[0] is the full node path and arg[1] is the full script path
const targetDir = argv[2]; 
let warnings = [];
let fileCount = 0;

let fileNames = fs.readdirSync(targetDir);
fileNames.forEach((fileName) => {
  if (!(fileName.endsWith('.tmj') || fileName.endsWith('.json'))) {
    // skip files that aren't maps
    return;
  }
  let content = fs.readFileSync(targetDir + fileName, {encoding: 'utf-8'});
  let fixedFile = false;
  let data = JSON.parse(content);
    let minTileId = 0;
    let maxTileId = 0;

    // filter out non-embedded tilesets whilst ascertaining the viable tile id range
    data.tilesets = data.tilesets.filter((tileset)=>{
      if (tileset.name && tileset.image && tileset.src === undefined) {
        // this looks like an embedded tileset.
        // check the id range
        if (minTileId > 0 || maxTileId > 0) {
          console.warn(`warning: multiple embedded tilesets found in ${fileName}. only one is supported. beware!`);
        } else {
          minTileId = tileset.firstgid;
          maxTileId = tileset.tilecount - minTileId;
        }
        return true;
      } else {
        warnings.push(`non-embedded tileset found in file "${fileName}"`);
        // this is NOT an embedded tileset.
        // let's remove it, to get rid of warnings from phaser (and to make the file a slightly smaller download)
        return false;
      }
    });

    if (data.tilesets.length === 0) {
      warnings.push(`no embedded tilesets found in file "${fileName}" -- UNABLE TO PROCESS`);
      fileCount++;
      return;
    }

    data.layers.forEach((layer) => {
      if (layer["type"] !== "tilelayer") {
        // skip non-tile layers
        return;
      }
      let warnedLayer = false;

      layer.data.forEach((tileId, index) => {
        if (tileId != 0) {
          let foundFix = false;
          if (tileId < minTileId) {
            tileId += minTileId;
            foundFix = true;
          } else if (tileId > maxTileId) {
            tileId -= (maxTileId + 1);
            foundFix = true;
          }
          if (foundFix) {
            if (!warnedLayer) {
              warnings.push(`out of range tile found in file "${fileName}", layer "${layer.name}"`);
              warnedLayer = true;
            }
            layer.data[index] = tileId;
          }
          fixedFile = fixedFile || foundFix;
        }
      });
    });

    // even if we haven't fixed anything, we should re-write the file
    // -- we'll be stripping whitespace this way, and making it a smaller download
    fs.writeFileSync(targetDir + fileName, JSON.stringify(data));
    fileCount++;
})

console.log(`found ${warnings.length} issues in ${fileCount} files`);
warnings.forEach((warning)=>{
  console.warn('• ' + warning);
})