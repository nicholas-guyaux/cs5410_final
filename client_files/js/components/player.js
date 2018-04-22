//------------------------------------------------------------------
//
// Model for each player in the game.
//
//------------------------------------------------------------------
const boatImg = MyGame.assets['water_units_mapping'].frames["ship_small_body.png"];
function Player(maxHealth, maxEnergy, maxAmmo) {
  let isDropped = false;
  'use strict';
  let that = {};
  let position = {
      x: 0,
      y: 0
  };
  let size = {
      width: boatImg.sourceSize.w / Coords.world.width * settings.waterUnitScale,
      height: boatImg.sourceSize.h / Coords.world.height * settings.waterUnitScale,
  };
  let direction = 0;
  let rotateRate = 0;
  let speed = 0;
  let health = { current: maxHealth, max: maxHealth }
  let energy = {current: maxEnergy, max: maxEnergy};
  let useTurbo = false;
  let gun = false;
  let ammo = {current: 0, max: maxAmmo};
  let bulletShots = { hit: 0, total: 0 };
  let killCount = 0;
  let buffs = { dmg: 0, speed: false, fireRate: false};
  let localItems = [];
  let remainingPlayers = 0;

  Object.defineProperty(that, 'direction', {
      get: () => direction,
      set: (value) => { direction = value }
  });

  Object.defineProperty(that, 'isDropped', {
    get: () => isDropped,
    set: (value) => { isDropped = !!value }
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
    get: () => health,
    set: (value) => { health = value }
  });

  Object.defineProperty(that, 'energy', {
    get: () => energy,
    set: (value) => { energy = value }
  });

  Object.defineProperty(that, 'useTurbo', {
    get: () => useTurbo,
    set: (value) => { useTurbo = value }
  });

  Object.defineProperty(that, 'ammo', {
    get: () => ammo,
    set: (value) => { ammo = value }
  });

  Object.defineProperty(that, 'bulletShots', {
    get: () => bulletShots,
    set: (value) => { health = value }
  });

  Object.defineProperty(that, 'killCount', {
    get: () => killCount,
    set: (value) => { killCount = value }
  });

  Object.defineProperty(that, 'buffs', {
    get: () => buffs
  });

  Object.defineProperty(that, 'localItems', {
    get: () => localItems,
    set: (value) => { localItems = value }
  });

  Object.defineProperty(that, 'gun', {
    get: () => gun,
    set: (value) => { gun = value }
  });
  var center = {};
  Object.defineProperty(center,'x', {
    get: () => position.x + size.width / 2
  })

  Object.defineProperty(center,'y', {
    get: () => position.y + size.height / 2
  });

  Object.defineProperty(that, 'center', {
    get: () => center
  });

  Object.defineProperty(that, 'remainingPlayers', {
    get: () => remainingPlayers,
    set: (value) => { remainingPlayers = value }
  });

  //------------------------------------------------------------------
  //
  // Public function that moves the player in the current direction.
  //
  //------------------------------------------------------------------
  that.move = function(elapsedTime) {
    let vectorX = Math.cos(direction);
    let vectorY = Math.sin(direction);
    let moveX = false;
    let moveY = false;

    let centerX = position.x + size.width/2;
    let centerY = position.y + size.height/2;
    
    moveY = GameMap.collision(centerX, centerY + (vectorY * elapsedTime * speed), Math.max(size.width, size.height));
    moveX = GameMap.collision(centerX + (vectorX * elapsedTime * speed), centerY, Math.max(size.width, size.height));
    
    let turboAdjust = 1;
    if(useTurbo)
      turboAdjust = 2;

    if (moveX) {
      position.x += (vectorX * elapsedTime * speed * turboAdjust);
    }
    if (moveY) {
      position.y += (vectorY * elapsedTime * speed * turboAdjust);
    }

    Graphics.viewport.playerUpdate({
      x:position.x + size.width / 2,
      y: position.y + size.height / 2,
    });
  };

  that.reverse = function(elapsedTime) {
    let vectorX = Math.cos(direction);
    let vectorY = Math.sin(direction);
    let moveX = false;
    let moveY = false;

    let centerX = position.x + size.width/2;
    let centerY = position.y + size.height/2;

    moveY = GameMap.collision(centerX, centerY + (vectorY * elapsedTime * speed), Math.max(size.width, size.height));
    moveX = GameMap.collision(centerX + (vectorX * elapsedTime * speed), centerY, Math.max(size.width, size.height));

    if (moveX) {
      position.x -= (vectorX * elapsedTime * speed * .5);
    }
    if (moveY) {
      position.y -= (vectorY * elapsedTime * speed * .5);
    }

    Graphics.viewport.playerUpdate({
      x:position.x + size.width / 2,
      y: position.y + size.height / 2,
    });
  }

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

  that.update = function(playerUpdate) {
  };

  return that;
};
