// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const NetworkIds = require('../client_files/shared/network-ids');
const Queue = require('../client_files/shared/queue.js');

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
    let client = GameState.activeClients[input.clientId];
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
function initializeSocketIO(httpServer) {
  const io = require('socket.io')(httpServer); // NOTE: Changed this from let to const

  //------------------------------------------------------------------
  //
  // Bidirectional notification: notifies the newly connected client of 
  // all other clients and notifies all other clients of the newly connected 
  // client.
  //
  //------------------------------------------------------------------
  function notifyConnect(newClient) {
    for (let clientId in GameState.activeClients) {
      if (!GameState.activeClients.hasOwnProperty(clientId)) {
        continue;
      }
      let existingClient = GameState.activeClients[clientId];

      if (newClient.socket.id !== clientId) {
        existingClient.socket.emit(NetworkIds.CONNECT_OTHER, {
          // TODO: Include all the data needed from a client on notify
          clientId: newClient.socket.id,
          player: newClient.state.player
        });
        newClient.socket.emit(NetworkIds.CONNECT_OTHER, {
          // TODO: Include all the data needed from a client on notify
          clientId: existingClient.socket.id,
          player: existingClient.state.player
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
    for (let clientId in GameState.activeClients) {
      if (!GameState.activeClients.hasOwnProperty(clientId)) {
        continue;
      }
      let client = GameState.activeClients[clientId];
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

    // let newPlayer = Player.create();
    let newClient = {
      socket: socket,
      state: {
        // player: newPlayer
      }
    };
    GameState.activeClients[socket.id] = newClient;

    //
    // Ack message emitted to new client with info about its new player
    socket.emit(NetworkIds.CONNECT_ACK, {
      clientId: socket.id,
      // player: newPlayer
    });

    //
    // Handler to enqueue the new client's input messages in the game's inputQueue
    socket.on(NetworkIds.INPUT, data => {
      inputQueue.enqueue({
        clientId: socket.id,
        message: data
      });
    });

    socket.on(NetworkIds.PLAYER_JOIN, data => {
      newClient.state.player = data.player
      console.log(data.player.name);
      socket.emit(NetworkIds.PLAYER_JOIN, {
        clients: Object.values(GameState.activeClients).map(x => x.state.player).filter(x => !!x.name)
      })
    });

    socket.on(NetworkIds.LOBBY_MSG, data => {
      for (let clientId in GameState.activeClients) {
        if (!GameState.activeClients.hasOwnProperty(clientId)) {
          continue;
        }
        let client = GameState.activeClients[clientId];
        
        client.socket.emit(NetworkIds.LOBBY_MSG, {
          playerId: data.playerId,  
          message: data.message      
        });
      }
    });

    socket.on('disconnect', function() {
      delete GameState.activeClients[socket.id];
      console.log('goodbye sucker');
      notifyDisconnect(socket.id);
    });

    notifyConnect(newClient);
  });
}

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
  initializeSocketIO,
  initialize: initialize,
  terminate: terminate
};
