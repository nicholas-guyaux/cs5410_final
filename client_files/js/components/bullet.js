//------------------------------------------------------------------
// This code was modified from code originally written by Dr. Dean Mathias
//
// Model for each bullet in the game.
//
//------------------------------------------------------------------
function Bullet(spec) {
  'use strict';
  let that = {};

  Object.defineProperty(that, 'position', {
      get: () => spec.position
  });

  Object.defineProperty(that, 'radius', {
      get: () => spec.radius
  });

  Object.defineProperty(that, 'id', {
      get: () => spec.id
  });

  Object.defineProperty(that, 'color', {
    get: () => spec.color
  });

  Object.defineProperty(that, 'username', {
    get: () => spec.username
  });

  //------------------------------------------------------------------
  //
  // Update the position of the bullet.  We don't receive updates from
  // the server, because the bullet moves in a straight line until it
  // explodes.
  //
  //------------------------------------------------------------------
  that.update = function(elapsedTime) {
      let vectorX = Math.cos(spec.direction);
      let vectorY = Math.sin(spec.direction);

      spec.position.x += (vectorX * elapsedTime * spec.speed);
      spec.position.y += (vectorY * elapsedTime * spec.speed);

      spec.timeRemaining -= elapsedTime;

      if (spec.timeRemaining <= 0) {
          return false;
      } else {
          return true;
      }
  };

  return that;
}
