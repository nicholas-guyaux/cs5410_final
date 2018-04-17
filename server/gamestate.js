// TODO: Add all gamestate data structures and methods here
const Vehicle = require('./components/vehicle');
const Dropper = require('./components/dropper');
const present = require('present');

const random = require ('./utils/random');
const GameMap = require ('./components/gamemap.js')

let lobbyClients = {};
let gameClients = {};
let playerCount = 0;
let alivePlayers = [];
let itemArray = [];
let islandMap = [];
//Game Constants
const maxHealth = 100;
const maxAmmo = 50;
const maxEnergy = 200;
const defaultBulletDamage = 5;
const fireRate = 300;
const upgradedFireRate = 150;
const healthPP = 5;
const ammoPP = 5;
const gunsPP = 5;
const speedPP = 5;
const dmgPP = 5;
const gunSpdPP = 5;
const vehicleStartTime = 12 * 1000;

// TODO: Wipes and preps the gamestate for a new game
// we are adding other things to GameState in newGame
var GameState = {
  newGame: newGame,
  lobbyClients: lobbyClients,
  gameClients: gameClients,
  maxHealth: maxHealth,
  maxEnergy: maxEnergy,
  maxAmmo: maxAmmo,
  alivePlayers: alivePlayers,
  playerCount: playerCount,
  update: update,
  vehicle: null,
  dropper: null,
  inProgress: false,
  defaultBulletDamage: defaultBulletDamage,
  fireRate: fireRate,
  upgradedFireRate: upgradedFireRate
};

// TODO: Wipes and preps the gamestate for a new game
function newGame() {
  //set number of players and reset item array and alivePlayer array
  islandMap = GameMap.getGridMap();
  GameState.playerCount = Object.keys(gameClients).length;
  GameState.itemArray = [];
  GameState.alivePlayers = Object.values(gameClients).map(client => client.state.player);
  GameState.inProgress = true;
  GameState.startTime = present();
  GameState.vehicle = Vehicle(vehicleStartTime);
  GameState.dropper = Dropper(GameState.vehicle);
  popItems();
  return itemArray;
}

function popItems() {
  //populate all items on map
  popAmmo();
  popHealth();
  popGuns();
  popSpeed();
  popDmg();
  popGunSpeed();
  
}

function popAmmo() {
  //populate ammo on map
  for(let i = 0; i < ammoPP; i++) {
    let x = Math.floor(random.nextGaussian(50,15));
    let y = Math.floor(random.nextGaussian(50,15));
    let added = false;
    
    while (!added) {
      let able = true;
      while (islandMap[y][x] !== 0) {
        x = Math.floor(random.nextGaussian(50,15));
        y = Math.floor(random.nextGaussian(50,15));
      }
      for (item in itemArray) {
        if (item.minX === x/100 && item.minY === y/100) {
          able = false;
        }
      }
      if (able) {
        added = true;
        var ammo = {
          minX: x/100,
          minY: y/100,
          maxX: x/100 + .01,
          maxY: y/100 + .01,
          type: 'ammo'
        }
        itemArray.push(ammo);
      }
    }
  }
}

function popHealth() {
  //populate health on map
  for(let i = 0; i < healthPP; i++) {
    let x = Math.floor(random.nextGaussian(50,15));
    let y = Math.floor(random.nextGaussian(50,15));
    let added = false;
    
    while (!added) {
      let able = true;
      while (islandMap[y][x] !== 0) {
        x = Math.floor(random.nextGaussian(50,15));
        y = Math.floor(random.nextGaussian(50,15));
      }
      for (item in itemArray) {
        if (item.minX === x/100 && item.minY === y/100) {
          able = false;
        }
      }
      if (able) {
        added = true;
        var health = {
          minX: x/100,
          minY: y/100,
          maxX: x/100 + .01,
          maxY: y/100 + .01,
          type: 'health'
        }
        itemArray.push(health);
      }
    }
  }
}

function popGuns() {
  //populate guns on map
  for(let i = 0; i < gunsPP; i++) {
    let x = Math.floor(random.nextGaussian(50,15));
    let y = Math.floor(random.nextGaussian(50,15));
    let added = false;
    
    while (!added) {
      let able = true;
      while (islandMap[y][x] !== 0) {
        x = Math.floor(random.nextGaussian(50,15));
        y = Math.floor(random.nextGaussian(50,15));
      }
      for (item in itemArray) {
        if (item.minX === x/100 && item.minY === y/100) {
          able = false;
        }
      }
      if (able) {
        added = true;
        var gun = {
          minX: x/100,
          minY: y/100,
          maxX: x/100 + .01,
          maxY: y/100 + .01,
          type: 'gun'
        }
        itemArray.push(gun);
      }
    }
  }
}

function popSpeed() {
  //populate speed boost on map
  for(let i = 0; i < speedPP; i++) {
    let x = Math.floor(random.nextGaussian(50,15));
    let y = Math.floor(random.nextGaussian(50,15));
    let added = false;
    
    while (!added) {
      let able = true;
      while (islandMap[y][x] !== 0) {
        x = Math.floor(random.nextGaussian(50,15));
        y = Math.floor(random.nextGaussian(50,15));
      }
      for (item in itemArray) {
        if (item.minX === x/100 && item.minY === y/100) {
          able = false;
        }
      }
      if (able) {
        added = true;
        var speed = {
          minX: x/100,
          minY: y/100,
          maxX: x/100 + .01,
          maxY: y/100 + .01,
          type: 'speed'
        }
        itemArray.push(speed);
      }
    }
  }
}

function popDmg() {
  //popluate damage boost on map
  for(let i = 0; i < dmgPP; i++) {
    let x = Math.floor(random.nextGaussian(50,15));
    let y = Math.floor(random.nextGaussian(50,15));
    let added = false;
    
    while (!added) {
      let able = true;
      while (islandMap[y][x] !== 0) {
        x = Math.floor(random.nextGaussian(50,15));
        y = Math.floor(random.nextGaussian(50,15));
      }
      for (item in itemArray) {
        if (item.minX === x/100 && item.minY === y/100) {
          able = false;
        }
      }
      if (able) {
        added = true;
        var dmg = {
          minX: x/100,
          minY: y/100,
          maxX: x/100 + .01,
          maxY: y/100 + .01,
          type: 'dmg'
        }
        itemArray.push(dmg);
      }
    }
  }
}

function popGunSpeed() {
  //populate gun speed boost on map
  for(let i = 0; i < gunSpdPP; i++) {
    let x = Math.floor(random.nextGaussian(50,15));
    let y = Math.floor(random.nextGaussian(50,15));
    let added = false;
    
    while (!added) {
      let able = true;
      while (islandMap[y][x] !== 0) {
        x = Math.floor(random.nextGaussian(50,15));
        y = Math.floor(random.nextGaussian(50,15));
      }
      for (item in itemArray) {
        if (item.minX === x/100 && item.minY === y/100) {
          able = false;
        }
      }
      if (able) {
        added = true;
        var gunSpd = {
          minX: x/100,
          minY: y/100,
          maxX: x/100 + .01,
          maxY: y/100 + .01,
          type: 'gunSpd'
        }
        itemArray.push(gunSpd);
      }
    }
  }
}

function update (elapsed, currentTime, totalTime) {
  GameState.vehicle.update(elapsed, totalTime);
  const clientStates = Object.values(GameState.gameClients).map(client => client.state);
  GameState.dropper.update(currentTime, clientStates);
  for (let clientId in GameState.gameClients) {
    GameState.gameClients[clientId].state.player.update(elapsed);
  }
  GameState.alivePlayers = GameState.alivePlayers.filter(player => !player.dead);
}

module.exports = GameState;

