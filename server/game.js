// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const Player = require('./player');
const NetworkIds = require('../shared/network-ids');
const Queue = require('../shared/queue.js');

let props = {
  quit: false
};
let inputQueue = Queue.create();
let activeClients = {};

function processInput(elapsedTime) {
  //
  // Double buffering on the queue so we don't asynchronously receive inputs
  // while processing.
  let processMe = inputQueue;
  inputQueue = Queue.create();

  while (!processMe.empty) {
    let input = processMe.dequeue();
    let client = activeClients[input.clientId];
    client.lastMessageId = input.message.id;

    // TODO: Handle all message types from client
    switch (input.message.type) {
      case NetworkIds.INPUT_MOVE:
        // client.player.move(input.message.elapsedTime);
        break;
      case NetworkIds.INPUT_ROTATE_LEFT:
        // client.player.rotateLeft(input.message.elapsedTime);
        break;
      case NetworkIds.INPUT_ROTATE_RIGHT:
        // client.player.rotateRight(input.message.elapsedTime);
        break;
      case NetworkIds.INPUT_FIRE:
        // createMissile(input.clientId, client.player);
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
function initializeSocketIO(httpServer) {
  const io = require('socket.io')(httpServer); // NOTE: Changed this from let to const

  //------------------------------------------------------------------
  //
  // Notifies the already connected clients about the arrival of this
  // new client. Plus, tell the newly connected client about the
  // other players already connected.
  //
  //------------------------------------------------------------------
  function notifyConnect(socket, newPlayer) {
    for (let clientId in activeClients) {
      let client = activeClients[clientId];
      if (newPlayer.clientId !== clientId) {
        //
        // Tell existing about the newly connected player
        client.socket.emit(NetworkIds.CONNECT_OTHER, {
          // TODO: Include all the data needed from a player on notify
          clientId: newPlayer.clientId,
          direction: newPlayer.direction,
          position: newPlayer.position,
          rotateRate: newPlayer.rotateRate,
          speed: newPlayer.speed,
          size: newPlayer.size
        });
        
        //
        // Tell the new player about the already connected player
        socket.emit(NetworkIds.CONNECT_OTHER, {
          // TODO: Include all the data needed from a player on notify
          clientId: client.player.clientId,
          direction: client.player.direction,
          position: client.player.position,
          rotateRate: client.player.rotateRate,
          speed: client.player.speed,
          size: client.player.size
        });
      }
    }
  }

  //------------------------------------------------------------------
  //
  // Notifies the already connected clients about the disconnect of
  // another client.
  //
  //------------------------------------------------------------------
  function notifyDisconnect(playerId) {
    for (let clientId in activeClients) {
      let client = activeClients[clientId];
      if (playerId !== clientId) {
        client.socket.emit(NetworkIds.DISCONNECT_OTHER, {
          clientId: playerId
        });
      }
    }
  }

  //
  // Handler for a new client connection
  io.on('connection', function(socket) {
    console.log('Connection established: ', socket.id);

    let newPlayer = Player.create()
    newPlayer.clientId = socket.id;
    activeClients[socket.id] = {
      socket: socket,
      player: newPlayer
    };

    //
    // Ack message emitted to new client with info about its new player
    socket.emit(NetworkIds.CONNECT_ACK, {
      direction: newPlayer.direction,
      position: newPlayer.position,
      size: newPlayer.size,
      rotateRate: newPlayer.rotateRate,
      speed: newPlayer.speed
    });

    //
    // Handler to enqueue the new client's input messages in the game's inputQueue
    socket.on(NetworkIds.INPUT, data => {
      inputQueue.enqueue({
        clientId: socket.id,
        message: data
      });
    });

    socket.on('disconnect', function() {
      delete activeClients[socket.id];
      notifyDisconnect(socket.id);
    });

    notifyConnect(socket, newPlayer);
  });
}

function initialize(httpServer) {
  initializeSocketIO(httpServer);
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
