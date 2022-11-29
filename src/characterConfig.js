export default {
  player : {
    stats : {
      walkSpeed : 120,
      jumpSpeed : 115,
      jumpLift : 565,
      jumpLiftTime : 1000,
      landingTime : 100,
      climbSpeed : 71,
      edgeGripTop : 3,
      edgeGripBottom : 9,
      maxFallSpeed : 425,
    },
    spriteSheet : {
      key : "player-sprite",
      path : "assets/player-placeholder-anims2.png",
      frameSize : [16, 16],
      colliderSize : [10, 15],
      colliderOffset : [3, 1]
    },
    animationSettings : {
      animationPrefix : "player__",
      defaultFramerate : 11,
    },
    animations : {
      idle : {
        frames: [0]
      },
      walk : {
        frames: [1,2,3,4]
      },
      jumpRise : {
        frames: [5]
      },
      jumpPeak : {
        frames: [6]
      },
      jumpFall : {
        frames: [7]
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
  },
  rift : {
    spriteSheet : {
      key : "rift",
      path : "assets/rift-thing.png",
      frameSize : [16, 16],
      colliderSize : [8, 8],
      colliderOffset : [4, 4]
    },
    animationSettings : {
      animationPrefix : "rift__",
      defaultFramerate : 10,
    },
    animations : {
      idle : {
        frames: [0,1,2,3]
      }
    }
  }
};