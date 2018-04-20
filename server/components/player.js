// ------------------------------------------------------------------
// Written by Dr. Dean Mathias
//
// Nodejs module that represents the model for a player.
//
// ------------------------------------------------------------------
'use strict';

let random = require ('../utils/random');
let Coords = require ('../../client_files/shared/Coords');
let Geometry = require ('../../client_files/shared/Geometry');
let settings = require ('../../client_files/shared/settings');
let GameMap = require('./gameMap')
var fs = require('fs');
var path = require('path');
const waterUnitsFilePath = path.join(__dirname, '../../client_files/assets/data/water_units.json');
const water_units = JSON.parse(fs.readFileSync(waterUnitsFilePath, 'utf8'));


const boatImg = water_units.frames["ship_small_body.png"];
//------------------------------------------------------------------
//
// Public function used to initially create a newly connected player
// at some random location.
//
//------------------------------------------------------------------
function createPlayer(maxHealth, maxEnergy, maxAmmo, depletionRate) {
    let that = {};
    let isDropped = false;
    that.dead = false;

    // this is top left position
    let position = {
        x: null,
        y: null,
    };

    let size = {
        width: boatImg.sourceSize.w / Coords.world.width * settings.waterUnitScale,
        height: boatImg.sourceSize.h / Coords.world.height * settings.waterUnitScale,
        // the height is bigger than the width that is why the 
        // height is used to compute the radius.
        radius: boatImg.sourceSize.h / Coords.world.height / 2 * settings.waterUnitScale,
    };
    let direction = random.nextDouble() * 2 * Math.PI;    // Angle in radians
    let rotateRate = Math.PI / 1000;    // radians per millisecond
    let speed = 0.0002*Coords.viewport.width;                 // unit distance per millisecond
    let reportUpdate = false;    // Indicates if this model was updated during the last update
    
    let health = {current: maxHealth, max: maxHealth, rate: 0};
    let energy = {current: maxEnergy, max: maxEnergy, rate: 0};
    let useTurbo = false;
    let ammo = {current: 0, max: maxAmmo};
    let bulletShots = { hit: 0, total: 0 };
    let damageDealt = 0;
    let killCount = 0;
    let gun = false;
    let buffs = { dmg: 0, speed: false, fireRate: false};
    let currentFireRateWait = 0;

    that.getCircle = function () {
      return Geometry.Circle({
        x: position.x + size.width / 2,
        y: position.y + size.height / 2,
        radius: size.radius,
      });
    }

    Object.defineProperty(that, 'direction', {
        get: () => direction
    });

    Object.defineProperty(that, 'isDropped', {
      get: () => isDropped,
      set: (val) => { isDropped = !!val; }
    });

    Object.defineProperty(that, 'position', {
        get: () => position
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed
    });

    Object.defineProperty(that, 'gun', {
      get: () => gun,
      set: value => gun = value
    });

    Object.defineProperty(that, 'rotateRate', {
        get: () => rotateRate
    });

    Object.defineProperty(that, 'reportUpdate', {
        get: () => reportUpdate,
        set: value => reportUpdate = value
    });

    Object.defineProperty(that, 'radius', {
        get: () => size.radius
    });

    Object.defineProperty(that, 'health', {
      get: () => health,
      set: value => health = value
    });

    Object.defineProperty(that, 'energy', {
      get: () => energy
    });

    Object.defineProperty(that, 'ammo', {
      get: () => ammo,
      set: value => ammo = value
    });

    Object.defineProperty(that, 'bulletShots', {
      get: () => bulletShots,
      set: value => bulletShots = value
    });

    Object.defineProperty(that, 'killCount', {
      get: () => killCount,
      set: value => killCount = value
    });

    Object.defineProperty(that, 'damageDealt', {
      get: () => damageDealt,
      set: value => damageDealt = value
    })

    Object.defineProperty(that, 'buffs', {
      get: () => buffs,
      set: value => buffs = value
    });

    Object.defineProperty(that, 'currentFireRateWait', {
      get: () => currentFireRateWait,
      set: value => currentFireRateWait = value
    });

    var center = {};
    Object.defineProperty(center,'x', {
      get: () => position.x + size.width / 2
    })

    Object.defineProperty(center,'y', {
      get: () => position.y + size.height / 2
    })
    Object.defineProperty(that, 'center', {
      get: () => center
    });

    Object.defineProperty(that, 'useTurbo', {
      get: () => useTurbo
    });

    //------------------------------------------------------------------
    //
    // Moves the player forward based on how long it has been since the
    // last move took place.
    //
    //------------------------------------------------------------------
    that.move = function(elapsedTime) {
      reportUpdate = true;
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

      health.rate += elapsedTime;
      if((!moveY || !moveX) && useTurbo && health.rate >= depletionRate){
        health.current -= 1;
        health.rate -= depletionRate;
      }
    };

    that.reverse = function(elapsedTime) {
      reportUpdate = true;
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
    }

    //------------------------------------------------------------------
    //
    // Rotates the player right based on how long it has been since the
    // last rotate took place.
    //
    //------------------------------------------------------------------
    that.rotateRight = function(elapsedTime) {
        reportUpdate = true;
        direction += (rotateRate * elapsedTime);
    };

    //------------------------------------------------------------------
    //
    // Rotates the player left based on how long it has been since the
    // last rotate took place.
    //
    //------------------------------------------------------------------
    that.rotateLeft = function(elapsedTime) {
        reportUpdate = true;
        direction -= (rotateRate * elapsedTime);
    };

    that.turbo = function() {
      if(energy.current === energy.max){
        useTurbo = true;
      }
    }

    //------------------------------------------------------------------
    //
    // Function used to update the player during the game loop.
    //
    //------------------------------------------------------------------
    that.update = function(elapsedTime) {
      energy.rate += elapsedTime;
      if(energy.rate > depletionRate){
        if(useTurbo){
          var rate = buffs.speed ? 1 : 2;
          energy.current -= rate;
          reportUpdate = true;
          if(energy.current <= 0){
            useTurbo = false
          }
        }
        else if(energy.current < energy.max){
          energy.current += .25;
          reportUpdate = true;
        }
      }
      currentFireRateWait += elapsedTime;
      if(energy.rate >= depletionRate){
        energy.rate -= depletionRate;
      }
    };

    return that;
}

module.exports.create = (...args) => createPlayer(...args);
