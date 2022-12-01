export default {
  snow : {
    spriteId : 'particleSnow',
    filepath : 'assets/particleSnow.png',
    depth: 1,
    prewarm : {
      count : 100,
      emitZone : {
        type: 'random',
        source: new Phaser.Geom.Rectangle(
          -30, -20,
          480 + 30, 320 + 20
        ),
      }
    },
    emitterConfig : {
      lifespan: {min:3000, max: 5000},
      speedX: { min: 300, max: 550 },
      speedY: { min: 0, max: 90 },
      quantity: 10,
      frequency: 100,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(
          -40, -50,
          35, 320 + 50
        )
      }
    }
  }
}