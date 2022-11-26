import Phaser from 'phaser'

import GameWorldScene from './GameWorldScene';
import LoadSaveScene from './LoadSaveScene';
import PreloaderScene from './PreloaderScene';

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 960,
	height: 640,
  pixelArt: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 675 },
		},
	},
	scene: [PreloaderScene, GameWorldScene, LoadSaveScene],
}

export default new Phaser.Game(config);
