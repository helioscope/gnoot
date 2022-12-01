import { CHARACTER_MODE } from './Character';
import { getObjectCustomProperty, getReferencedObject } from "./tiled-helpers";

export function getNewBehaviorState(character, behaviorId, tiledObjectData, tiledMap) {
  const triggerArea = getObjectCustomProperty(tiledObjectData, 'triggerArea');
  if (behaviorId === 'wander') {
    let boundsObj = getReferencedObject(getObjectCustomProperty(tiledObjectData, 'bounds'), tiledMap.getObjectLayer('Spawns'));
    let bounds = {
      minX : 0,
      minY : 0,
      maxX : 0,
      maxY : 0
    };
    if (boundsObj != null) {
      bounds = {
        minX : boundsObj.x, // need to multiply by screen scale?
        minY : boundsObj.y,
        maxX : boundsObj.x + boundsObj.width, // this seems odd -- need to investigate 
        maxY : boundsObj.y + boundsObj.height
      };
    } else {
      console.warn("no bounds obj found for wandering npc");
    }

    let initialActivity = Math.random() < 0.5 ? 'move' : 'idle';
    let moveTimeRange = character.config.behavior.moveTimeRange || [500, 5500];
    let idleTimeRange = character.config.behavior.idleTimeRange || [500, 5500];

    return {
      activity: initialActivity,
      timeInActivity: 0,
      timeForActivity: getRandomInRangeArr(initialActivity == 'move' ? moveTimeRange : idleTimeRange),
      directionX: Math.random() < 0.5 ? 1 : -1,
      behaviorConfig : {
        moveTimeRange,
        idleTimeRange,
        bounds
      }
    };
  } else {
    console.warn(`Can't find behavior for state id "${behaviorId}"`);
    return {behaviorConfig: {}};
  }
}

export function driveNPC(character, level, time, deltaTime) {
  randomWanderOnGround(character, level, time, deltaTime);
  updateNPC(character, level, time, deltaTime);
}

function randomWanderOnGround(character, level, time, deltaTime) {
  const behaviorState = character.behaviorState;
  const {activity, timeForActivity, behaviorConfig} = behaviorState;
  const {moveTimeRange, idleTimeRange, bounds} = behaviorConfig;
  
  behaviorState.timeInActivity += deltaTime;
  
  if (activity === 'move') {
    if (behaviorState.timeInActivity > timeForActivity) {
      // start next activity: idle
      character.input.x = 0;
      setNextActivity(behaviorState, 'idle', idleTimeRange)
    } else {
      // continue walking
      let futureX = character.gameObject.x + character.config.stats.moveSpeed * (deltaTime/1000);
      let wait = false;
      if (futureX < bounds.minX) {
        if (tryOdds(40)) {
          wait = true;
          setNextActivity(behaviorState, 'idle', idleTimeRange)
        } else {
          character.setFacing(1);
        }
      } else if (futureX > bounds.maxX) {
        if (tryOdds(40)) {
          wait = true;
          setNextActivity(behaviorState, 'idle', idleTimeRange)
        } else {
          character.setFacing(-1);
        }
      }
      if (wait) {
        character.input.x = 0;
      } else {
        character.input.x = character.getFacing();
      }
    }
  } else if (activity === 'idle') {
    if (behaviorState.timeInActivity > timeForActivity) {
      // start next activity: walk
      if (Math.random() < 0.5) {
        character.setFacing(-1);
      } else {
        character.setFacing(1);
      }
      setNextActivity(behaviorState, 'move', moveTimeRange)
    }
  }
}

function updateNPC(character, level, time, deltaTime) {
  const input = character.input;
  const characterSprite = character.gameObject;
  const characterBody = characterSprite.body;

  // react to input -- extremely basic version of player control
  if (input.x < 0) {
    if (character.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
      characterSprite.flipX = true;
      characterBody.setVelocityX(-character.stats.moveSpeed);
    }
  } else if (input.x > 0) {
    if (character.mode !== CHARACTER_MODE.EDGE_CLIMBING) {
      characterSprite.flipX = false;
      characterBody.setVelocityX(character.stats.moveSpeed);
    }
  } else {
    characterBody.setVelocityX(0);
  }

  if (input.jump) {
    if (character.canJump(time)) {
      character.jump(time);
    }
  }

  // update animation (simplified from player)
  if (input.x !== 0 || input.y !== 0) {
    character.setAnimation("move", true);
  } else {
    character.setAnimation("idle", true);
  }
}

function setNextActivity(behaviorState, activityId, timeRange) {
  behaviorState.activity = activityId;
  behaviorState.timeInActivity = 0;
  behaviorState.timeForActivity = getRandomInRangeArr(timeRange);
}

function tryOdds(odds) { // 0.1 - 100
  return Math.random() * 100 < odds;
}

function getRandomInRangeArr(rangeArr) {
  return Math.random() * (rangeArr[1] - rangeArr[0]) + rangeArr[0];
}