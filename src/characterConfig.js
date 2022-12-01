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
  },
  mountainFlag : {
    spriteSheet : {
      key : "mtflag",
      path : "assets/mtflag.png",
      frameSize : [16, 16]
    },
    animationSettings : {
      animationPrefix : "mtflag__",
      defaultFramerate : 10,
    },
    animations : {
      windy : {
        frames: [0,1,2,3,4,5,6]
      }
    }
  },
  disassembler : {
    spriteSheet : {
      key : "disassembler",
      path : "assets/disassembler.png",
      frameSize : [24, 24]
    },
    animationSettings : {
      animationPrefix : "disassembler__",
      defaultFramerate : 15,
    },
    animations : {
      active : {
        frames: [0,1,2,3,4,5,6,7]
      }
    }
  },
  tinyturtle : {
    stats : {
      moveSpeed : 8,
    },
    spriteSheet : {
      key : "tinyturtle",
      path : "assets/tinyturtle.png",
      frameSize : [16, 14],
      colliderSize : [6, 5],
      colliderOffset : [5, 9]
    },
    animationSettings : {
      animationPrefix : "tinyturtle__",
      defaultFramerate : 7,
    },
    animations : {
      idle : {
        frames: [0]
      },
      move : {
        frames: [1,2,3,4,5]
      }
    }
  },
  lumpie : {
    stats : {
      moveSpeed : 25,
    },
    spriteSheet : {
      key : "lumpie",
      path : "assets/lumpie.png",
      frameSize : [16, 16],
      colliderSize : [8, 7],
      colliderOffset : [4, 9]
    },
    animationSettings : {
      animationPrefix : "lumpie__",
      defaultFramerate : 10,
    },
    animations : {
      idle : {
        frames: [0]
      },
      move : {
        frames: [2,3,4,5]
      }
    }
  },
  smallfly : {
    stats : {
      moveSpeed : 120,
    },
    spriteSheet : {
      key : "smallfly",
      path : "assets/small-fly.png",
      frameSize : [5, 5],
      colliderSize : [1, 1],
      colliderOffset : [2, 2]
    },
    animationSettings : {
      animationPrefix : "smallfly__",
      defaultFramerate : 10,
    },
    animations : {
      idle : {
        frames: [0]
      },
      move : {
        frames: [1,2]
      }
    }
  }
};