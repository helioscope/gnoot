import { getObjectCustomProperty } from "./tiled-helpers";

export function getNewBehaviorState(behaviorId, tiledObjectData, tiledMap) {
  const bounds = getObjectCustomProperty(tiledObjectData, 'bounds');
  const triggerArea = getObjectCustomProperty(tiledObjectData, 'triggerArea');
  if (behaviorId === 'wander-ground') {
    return {

    }
  }
}

export function driveNPC(character, behaviorState, level, deltaTime) {
  randomWanderOnGround(character, behaviorState, level, deltaTime);
  updateNPC(character);
}

function randomWanderOnGround(character, behaviorState, level, deltaTime) {
  let {activity, timeInActivity, timeForActivity, directionX, behaviorConfig} = behaviorState;
  let {moveTimeRange, idleTimeRange, bounds} = behaviorConfig;

  timeInActivity += deltaTime;

  if (activity === 'move') {
    character.input.x = directionX;
    if (timeInActivity > timeForActivity) {
      // start next activity: idle
      character.input.x = 0;
      setNextActivity(behaviorState, 'idle', idleTimeRange)
    } else {
      // continue walking
      let futureX = character.gameObject.x + character.config.walkSpeed * deltaTime;
      if (futureX < bounds.minX || futureX > bounds.maxX) {
        directionX *= -1;
        character.setFacing(directionX);
        behaviorConfig.directionX = directionX;
        character.input.x = 0;
      } else {
        character.input.x = directionX;
      }
    }
  } else if (activity === 'idle') {
    if (timeInActivity > timeForActivity) {
      // start next activity: walk
      if (Math.random() < 0.5) {
        behaviorState.directionX *= -1;
      }
      setNextActivity(behaviorState, 'move', moveTimeRange)
    }
  }
}

function updateNPC(character, level) {

}

function setNextActivity(behaviorState, activityId, timeRange) {
  behaviorState.activity = activityId;
  behaviorState.timeInActivity = 0;
  behaviorState.timeForActivity = Math.random() * (timeRange[1] - timeRange[0]) + timeRange[0];
}