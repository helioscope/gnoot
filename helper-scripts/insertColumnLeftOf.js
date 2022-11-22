import fs from 'fs';
import {argv, exit} from 'node:process'

const sourceDir = argv[2];
const insertPosition = parseInt(argv[3]);
const insertAmount = parseInt(argv[4]);

if (sourceDir == null || isNaN(insertPosition) || isNaN(insertAmount)) {
  console.log(`INCOMPLETE COMMAND`);
  console.log(`example usage: node insertColumnLeftOf.js raw-assets/tiled/ 51 1`);
  exit(1);
}

let fileNames = [];
let worldCols = [];

let minX = Infinity;
let maxX = -Infinity;
let minY = Infinity;
let maxY = -Infinity;


fileNames = fs.readdirSync(sourceDir);
fileNames.forEach((fileName) => {

  if (!(fileName.endsWith('.tmj') || fileName.endsWith('.json'))) {
    // skip files that aren't maps
    return;
  }

  // get x&y from file naming convention
  let nameMatch = fileName.match(/world_x(\d\d)_y(\d\d)/);

  if (nameMatch == null) {
    let msg = `WARNING: file name "${fileName}" does not match expected naming scheme and will be skipped!`;
    return false;
  }

  let worldX = parseInt(nameMatch[1]);
  let worldY = parseInt(nameMatch[2]);
  
  // establish min&max X&Y, and build grid of filenames
  // note: this will almost certainly be a "sparse" grid, i.e. with some array indices having nothing therein
  let col = [];

  if (worldX < minX) {
    minX = worldX;
  }
  if (worldX > maxX) {
    maxX = worldX;
  }
  if (worldY < minY) {
    minY = worldY;
  }
  if (worldY > maxY) {
    maxY = worldY;
  }

  if (worldCols[worldX]) {
    col = worldCols[worldX];
  } else {
    worldCols[worldX] = col;
  }
  if (col[worldY]) {
    console.warn(`WARNING -- it looks like there may be two files with the same position:\n (1) ${fileName}\n (2) ${col[worldY]}`)
  } else {
    col[worldY] = fileName;
  }
});

// process columns right-to-left to avoid clobbering existing filenames as we push things right
for (let x = maxX; x >= insertPosition; x--) {
  let col = worldCols[x];
  if (col == null) {
    // skip empty columns
    continue;
  }
  for (let y = minY; y <= maxY; y++) {
    let fileName = col[y];
    let sourcePath = sourceDir + "/" + fileName;
    if (fileName == null) {
      // skip empty cells
      continue;
    }
    let newFileName = `world_x${String(x+insertAmount).padStart(2,'0')}_y${String(y).padStart(2,'0')}`;
    if (fileName.endsWith('.tmj')) {
      newFileName = newFileName + ".tmj";
    } else if (fileName.endsWith('.json')) {
      newFileName = newFileName + ".json";
    } else {
      console.warn(`unhandled file extension for "${fileName}" -- this has not been updated (sorry, I was lazy)`);
    }

    fs.copyFileSync(sourcePath, sourceDir + "/" + newFileName);
    fs.rmSync(sourcePath);
    console.log(`copied ${sourcePath} to ${sourceDir + "/" + newFileName}`);
  }
}


