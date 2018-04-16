// TODO: Add all gamestate data structures and methods here
const Vehicle = require('./components/vehicle');
const Dropper = require('./components/dropper');
const present = require('present');
let lobbyClients = {};
let gameClients = {};
let playerCount = 0;
let alivePlayers = [];
//Game Constants
const maxHealth = 100;
const maxAmmo = 50;
const maxEnergy = 200;
const defaultBulletDamage = 5;
const vehicleStartTime = 12 * 1000;
const droppableAfterTime = 2 * 1000;
var game = {};
// TODO: Wipes and preps the gamestate for a new game
// we are adding other things to GameState in newGame
var GameState = {
  newGame: newGame,
  lobbyClients: lobbyClients,
  gameClients: gameClients,
  maxHealth: maxHealth,
  maxEnergy: maxEnergy,
  maxAmmo: maxAmmo,
  defaultBulletDamage: defaultBulletDamage,
  game: game,
  update: update,
  vehicle: null,
  dropper: null,
};

function newGame() {
  GameState.startTime = present();
  GameState.vehicle = Vehicle(vehicleStartTime);
  GameState.dropper = Dropper(GameState.vehicle, droppableAfterTime);
}

function update (elapsed, currentTime, totalTime) {
  GameState.vehicle.update(elapsed, totalTime);
  const clientStates = Object.values(GameState.gameClients).map(client => client.state);
  GameState.dropper.update(currentTime, clientStates);
  for (let clientId in GameState.gameClients) {
    GameState.gameClients[clientId].state.player.update(currentTime);
  }
}

module.exports = GameState;
