import Phaser from 'phaser'

import GameWorldScene from './GameWorldScene';

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 960,
	height: 640,
  pixelArt: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 400 },
		},
	},
	scene: [GameWorldScene],
}

export default new Phaser.Game(config);
