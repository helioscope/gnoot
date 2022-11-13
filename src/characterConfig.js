export default {
  player : {
    stats : {
      walkSpeed : 120,
      jumpSpeed : 110,
      jumpLift : 560,
      jumpLiftTime : 1000,
      landingTime : 100
    },
    spriteSheet : {
      key : "player-sprite",
      path : "assets/player-placeholder-anims.png",
      frameSize : [16, 16],
      colliderSize : [10, 15],
      colliderOffset : [3, 1]
    },
    animationSettings : {
      animationPrefix : "player__",
      defaultFramerate : 10,
    },
    animations : {
      idle : {
        frames: [0]
      },
      walk : {
        frames: [1,2]
      },
      jumpRise : {
        frames: [3,4]
      },
      jumpPeak : {
        frames: [5]
      },
      jumpFall : {
        frames: [6,7]
      },
      jumpLand : {
        frames: [8]
      },
      edgeClimbStill : {
        frames: [9]
      },
      edgeClimbUp : {
        frames: [10,11]
      },
      edgeClimbDown : {
        frames: [12,13]
      }
    }
  }
};