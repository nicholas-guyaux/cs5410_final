/**
 * https://en.wikipedia.org/wiki/Linear_interpolation
 * Precise method, which guarantees y = rangeEnd when x = 1.
 * @param {Number} rangeStart 
 * output range start
 * @param {Number} rangeEnd 
 * output range end
 * @param {Float} x 
 * a number between 0 and 1 on the input range.
 */
function clampLerp(rangeStart, rangeEnd, x) {
  return Math.max(Math.min(rangeStart, rangeEnd), Math.min(Math.max(rangeStart, rangeEnd), ((1 - x) * rangeStart + x * rangeEnd)));
}

//------------------------------------------------------------------
//
// Model for each remote player in the game.
//
//------------------------------------------------------------------
function PlayerRemote() {
  'use strict';
  let that = {};
  let size = {
    width: boatImg.sourceSize.w / Coords.world.width * settings.waterUnitScale,
    height: boatImg.sourceSize.h / Coords.world.height * settings.waterUnitScale,
  };
  let state = {
    direction: 0,
    position: {
      x: 0,
      y: 0
    }
  };
  let goal = {
    direction: 0,
    position: {
      x: 0,
      y: 0
    },
    updateWindow: 0      // Server reported time elapsed since last update
  };

  Object.defineProperty(that, 'state', {
    get: () => state
  });

  Object.defineProperty(that, 'goal', {
    get: () => goal
  });

  Object.defineProperty(that, 'size', {
    get: () => size
  });

  //------------------------------------------------------------------
  //
  // Update of the remote player is a simple linear progression/interpolation
  // from the previous state to the goal (new) state.
  //
  //------------------------------------------------------------------
  that.update = function(elapsedTime) {
    // Protect against divide by 0 before the first update from the server has been given
    if (goal.updateWindow <= 0) return;

    let updateFraction = elapsedTime / goal.updateWindow;
    if (updateFraction > 0) {
      //
      // Turn first, then move.
      state.direction = clampLerp(state.direction, goal.direction, updateFraction);

      state.position.x = clampLerp(state.position.x, goal.position.x, updateFraction);
      state.position.y = clampLerp(state.position.y, goal.position.y, updateFraction);

      // Original way:
      // state.direction -= (state.direction - goal.direction) * updateFraction;

      // state.position.x -= (state.position.x - goal.position.x) * updateFraction;
      // state.position.y -= (state.position.y - goal.position.y) * updateFraction;
    }
  };

  return that;
};
