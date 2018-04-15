// TODO: Add all gamestate data structures and methods here

let lobbyClients = {};
let gameClients = {};
let playerCount = 0;
let alivePlayers = [];
let itemArray = [];
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
  playerCount = Object.keys(gameClients).length;
  itemArray = [];
  alivePlayers = [];
  popItems(playerCount);
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

  }

}

function popHealth() {
  //populate health on map
  for(let i = 0; i < healthPP; i++) {
    
  }
}

function popGuns() {
  //populate guns on map
  for(let i = 0; i < gunsPP; i++) {
    
  }
}

function popSpeed() {
  //populate speed boost on map
  for(let i = 0; i < speedPP; i++) {
    
  }
}

function popDmg() {
  //popluate damage boost on map
  for(let i = 0; i < dmgPP; i++) {
    
  }
}

function popGunSpeed() {
  //populate gun speed boost on map
  for(let i = 0; i < gunSpdPP; i++) {
    
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
