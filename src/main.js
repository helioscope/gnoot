import Phaser from 'phaser'

import HelloWorldScene from './HelloWorldScene';

const config = {
	type: Phaser.AUTO,
	parent: 'app',
	width: 600,
	height: 400,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: [HelloWorldScene],
}

export default new Phaser.Game(config);
