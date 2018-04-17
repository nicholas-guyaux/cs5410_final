// TODO: Add all gamestate data structures and methods here

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
const healthPP = 5;
const ammoPP = 5;
const gunsPP = 5;
const speedPP = 5;
const dmgPP = 5;
const gunSpdPP = 5;

// TODO: Wipes and preps the gamestate for a new game
function newGame() {
  //set number of players and reset item array and alivePlayer array
  islandMap = GameMap.getGridMap();
  playerCount = Object.keys(gameClients).length;
  itemArray = [];
  alivePlayers = [];
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


module.exports = {
  newGame: newGame,
  lobbyClients: lobbyClients,
  gameClients: gameClients,
  maxHealth: maxHealth,
  maxEnergy: maxEnergy,
  maxAmmo: maxAmmo,
  defaultBulletDamage: defaultBulletDamage
};
