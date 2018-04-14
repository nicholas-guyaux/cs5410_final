//------------------------------------------------------------------
//
// Model for each player in the game.
//
//------------------------------------------------------------------
function Player(maxHealth, maxEnergy, maxAmmo) {
  'use strict';
  let that = {};
  let position = {
      x: 0,
      y: 0
  };
  let size = {
      width: 0.05*Coords.viewport.width,
      height: 0.05*Coords.viewport.width,
  };
  let direction = 0;
  let rotateRate = 0;
  let speed = 0;
  let health = { current: maxHealth, max: maxHealth }

  Object.defineProperty(that, 'direction', {
      get: () => direction,
      set: (value) => { direction = value }
  });

  Object.defineProperty(that, 'speed', {
      get: () => speed,
      set: value => { speed = value; }
  });

  Object.defineProperty(that, 'rotateRate', {
      get: () => rotateRate,
      set: value => { rotateRate = value; }
  });

  Object.defineProperty(that, 'position', {
      get: () => position
  });

  Object.defineProperty(that, 'size', {
      get: () => size
  });

  Object.defineProperty(that, 'health', {
    get: () => health
  });

  //------------------------------------------------------------------
  //
  // Public function that moves the player in the current direction.
  //
  //------------------------------------------------------------------
  that.move = function(elapsedTime) {
      let vectorX = Math.cos(direction);
      let vectorY = Math.sin(direction);

      position.x += (vectorX * elapsedTime * speed);
      position.y += (vectorY * elapsedTime * speed);
      Graphics.viewport.playerUpdate({
        x:position.x+ size.width / 2, 
        y: position.y + size.height / 2,
      });
      
  };

  //------------------------------------------------------------------
  //
  // Public function that rotates the player right.
  //
  //------------------------------------------------------------------
  that.rotateRight = function(elapsedTime) {
      direction += (rotateRate * elapsedTime);
  };

  //------------------------------------------------------------------
  //
  // Public function that rotates the player left.
  //
  //------------------------------------------------------------------
  that.rotateLeft = function(elapsedTime) {
      direction -= (rotateRate * elapsedTime);
  };

  that.update = function(elapsedTime) {
  };

  return that;
};
