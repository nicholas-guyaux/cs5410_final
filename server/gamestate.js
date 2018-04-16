// TODO: Add all gamestate data structures and methods here

let lobbyClients = {};
let gameClients = {};
let playerCount = 0;
let alivePlayers = [];
//Game Constants
const maxHealth = 100;
const maxAmmo = 50;
const maxEnergy = 200;
const defaultBulletDamage = 5;

// TODO: Wipes and preps the gamestate for a new game
function newGame() {
  
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
