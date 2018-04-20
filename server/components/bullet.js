// ------------------------------------------------------------------
// This code was modified from code originally written by Dr. Dean Mathias
//
// Nodejs module that represents the model for a bullet.
//
// ------------------------------------------------------------------
'use strict';
let Coords = require ('../../client_files/shared/Coords');

//------------------------------------------------------------------
//
// Public function used to initially create a newly fired bullet.
//
//------------------------------------------------------------------
function createBullet(spec) {
    let that = {};
    let radius = 0.005 * Coords.viewport.width;
    let speed = spec.speed + 0.00005;    // unit distance per millisecond
    let timeRemaining = 1500;   // milliseconds
    let currentFireRateWait = 0;
    let damage = spec.damage;
    let color = spec.color;
    that.maxX = 0;
    that.maxY = 0;
    that.minX = 0;
    that.minY = 0;


    Object.defineProperty(that, 'clientId', {
        get: () => spec.clientId
    });

    Object.defineProperty(that, 'id', {
        get: () => spec.id
    });

    Object.defineProperty(that, 'direction', {
        get: () => spec.direction
    });

    Object.defineProperty(that, 'position', {
        get: () => spec.position
    });

    Object.defineProperty(that, 'radius', {
        get: () => radius
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed
    });

    Object.defineProperty(that, 'timeRemaining', {
        get: () => timeRemaining
    });

    Object.defineProperty(that, 'damage', {
      get: () => damage
    });

    Object.defineProperty(that, 'color', {
      get: () => color
    });
    //------------------------------------------------------------------
    //
    // Function used to update the bullet during the game loop.
    //
    //------------------------------------------------------------------
    that.update = function(elapsedTime) {
      let vectorX = Math.cos(spec.direction);
      let vectorY = Math.sin(spec.direction);

      spec.position.x += (vectorX * elapsedTime * speed);
      spec.position.y += (vectorY * elapsedTime * speed);

      that.minX = spec.position.x - (that.radius * 2);
      that.minY = spec.position.y - (that.radius * 2);
      that.maxX = spec.position.x + (that.radius * 2);
      that.maxY = spec.position.y + (that.radius * 2);

      timeRemaining -= elapsedTime;

      if (timeRemaining <= 0) {
          return false;
      } else {
          return true;
      }
    };

    return that;
}

module.exports.create = (spec) => createBullet(spec);
