// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const NetworkIds = require('../client_files/shared/network-ids');
const Queue = require('../client_files/shared/queue.js');
const Token = require('../Token');



let props = {
  quit: false
};
let inputQueue = Queue.create();

function processInput(elapsedTime) {
  //
  // Double buffering on the queue so we don't asynchronously receive inputs
  // while processing.
  let processMe = inputQueue;
  inputQueue = Queue.create();

  while (!processMe.empty) {
    let input = processMe.dequeue();
    let client = GameState.lobbyClients[input.clientId];
    client.lastMessageId = input.message.id;

    // TODO: Handle all message types from client
    switch (input.message.type) {
      case NetworkIds.INPUT_MOVE:
        // client.state.player.move(input.message.elapsedTime);
        break;
      case NetworkIds.INPUT_ROTATE_LEFT:
        // client.state.player.rotateLeft(input.message.elapsedTime);
        break;
      case NetworkIds.INPUT_ROTATE_RIGHT:
        // client.state.player.rotateRight(input.message.elapsedTime);
        break;
      case NetworkIds.INPUT_FIRE:
        // createMissile(input.clientId, client.state.player);
        break;
    }
  }
}

function update(elapsedTime, currentTime) {

}

function updateClients(elapsedTime) {

}

//------------------------------------------------------------------
//
// Server side game loop
//
//------------------------------------------------------------------
function gameLoop(currentTime, elapsedTime) {
  processInput(elapsedTime);
  update(elapsedTime, currentTime);
  updateClients(elapsedTime);

  if (!props.quit) {
    let now = present();
    gameLoop(now, now - currentTime);
  }
}

//------------------------------------------------------------------
//
// Get the socket.io server up and running so it can begin
// collecting inputs from the connected clients.
//
//------------------------------------------------------------------


function initialize() {
  gameLoop(present(), 0);
}

//------------------------------------------------------------------
//
// Public function that allows the game simulation and processing to
// be terminated.
//
//------------------------------------------------------------------
function terminate() {
  props.quit = true;
}

module.exports = {
  initialize: initialize,
  terminate: terminate
};
