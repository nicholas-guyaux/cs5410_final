// ------------------------------------------------------------------
// Written by Dr. Dean Mathias
//
// Nodejs module that represents the model for a player.
//
// ------------------------------------------------------------------
'use strict';

let random = require ('../utils/random');
let Coords = require ('../../client_files/shared/Coords');
let settings = require ('../../client_files/shared/settings');
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
function createPlayer(maxHealth, maxEnergy, maxAmmo) {
    let that = {};

    let position = {
        x: 0,
        y: 0
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
    
    let health = {current: maxHealth, max: maxHealth};
    let energy = {current: maxEnergy, max: maxEnergy};
    let ammo = {current: 0, max: maxAmmo};
    let bulletShots = { hit: 0, total: 0 };
    let killCount = 0;
    let buffs = { dmg: false, speed: false, range: false, fireRate: false};

    Object.defineProperty(that, 'direction', {
        get: () => direction
    });

    Object.defineProperty(that, 'position', {
        get: () => position
    });

    Object.defineProperty(that, 'size', {
        get: () => size
    });

    Object.defineProperty(that, 'speed', {
        get: () => speed
    })

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
      get: () => health
    });

    Object.defineProperty(that, 'energy', {
      get: () => energy
    });

    Object.defineProperty(that, 'ammo', {
      get: () => ammo
    });

    Object.defineProperty(that, 'bulletShots', {
      get: () => bulletShots
    });

    Object.defineProperty(that, 'killCount', {
      get: () => killCount
    });

    Object.defineProperty(that, 'buffs', {
      get: () => buffs
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

        position.x += (vectorX * elapsedTime * speed);
        position.y += (vectorY * elapsedTime * speed);
    };

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

    //------------------------------------------------------------------
    //
    // Function used to update the player during the game loop.
    //
    //------------------------------------------------------------------
    that.update = function(when) {
    };

    return that;
}

module.exports.create = () => createPlayer();
