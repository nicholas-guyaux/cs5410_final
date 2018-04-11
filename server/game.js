// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const NetworkIds = require('../client_files/shared/network-ids');
const Queue = require('../client_files/shared/queue.js');

var numPlayersRequired = 10;
var gameInProgress = false;

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
    for (let clientId in GameState.lobbyClients) {
      if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
        continue;
      }
      let existingClient = GameState.lobbyClients[clientId];

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
    if (GameState.lobbyClients.length >= numPlayersRequired && !gameInProgress) {
      gameInProgress = true;
      for (let clientId in GameState.lobbyClients) {
        if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
          continue;
        }
        let existingClient = GameState.lobbyClients[clientId];
        existingClient.socket.emit(NetworkIds.START_GAME, {
          // TODO: Include all the data needed from a client on notify
          clientId: newClient.socket.id,
          player: newClient.state.player
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
    for (let clientId in GameState.lobbyClients) {
      if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
        continue;
      }
      let client = GameState.lobbyClients[clientId];
      client.socket.emit(NetworkIds.PLAYER_LEAVE, {
        clients: Object.values(GameState.lobbyClients).map(x => x.state.player).filter(x => !!x.name)
      });
      if (clientId !== playerId.id) {
        client.socket.emit(NetworkIds.LOBBY_MSG, {
          playerId: playerId.name,  
          message: "Has left the lobby"      
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
        player: ''
      }
    };
    GameState.lobbyClients[socket.id] = newClient;

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
      newClient.state.player = data.player;
      //console.log(data.player);
      
      for (let clientId in GameState.lobbyClients) {
        if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
          continue;
        }
        let client = GameState.lobbyClients[clientId];
        client.socket.emit(NetworkIds.PLAYER_JOIN, {
          clients: Object.values(GameState.lobbyClients).map(x => x.state.player).filter(x => !!x.name)
        });
        if (clientId !== socket.id) {
          client.socket.emit(NetworkIds.LOBBY_MSG, {
            playerId: newClient.state.player.name,  
            message: "Has entered the lobby"      
          });
          //console.log(newClient.state.player);
        }
      }
    });

    socket.on(NetworkIds.LOBBY_MSG, data => {
      for (let clientId in GameState.lobbyClients) {
        if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
          continue;
        }
        let client = GameState.lobbyClients[clientId];
        
        client.socket.emit(NetworkIds.LOBBY_MSG, {
          playerId: newClient.state.player,  
          message: data.message      
        });
      }
    });

    socket.on('disconnect', function() {
      var obj = {
        id: socket.id,
        name: GameState.lobbyClients[socket.id].state.player.name
      }
      delete GameState.lobbyClients[socket.id];
      //console.log('goodbye sucker');
      notifyDisconnect(obj);
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
  initializeSocketIO: initializeSocketIO,
  initialize: initialize,
  terminate: terminate
};
