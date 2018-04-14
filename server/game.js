// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const GameNetIds = require('../client_files/shared/game-net-ids');
const Queue = require('../client_files/shared/queue.js');
const Token = require('../Token');
const rbush = require('rbush');

const SIMULATION_UPDATE_RATE_MS = 16;
//Game Constants
let playerCount = 0;
let maxHealth = 100;
let maxAmmo = 50;
let maxEnergy = 100;
let defaultBulletDamage = 5;


// The following is used to visually see the entity interpolation in action
const DEMONSTRATION_STATE_UPDATE_LAG = 100;

let props = {
  quit: false,
  lastUpdate: 0
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
    let client = GameState.gameClients[input.clientId];
    if(!client) continue;
    client.lastMessageId = input.message.id;

    // TODO: Handle all message types from client
    switch (input.message.type) {
      case GameNetIds.INPUT_MOVE_FORWARD:
        client.state.player.move(input.message.elapsedTime);
        break;
      case GameNetIds.INPUT_ROTATE_LEFT:
        client.state.player.rotateLeft(input.message.elapsedTime);
        break;
      case GameNetIds.INPUT_ROTATE_RIGHT:
        client.state.player.rotateRight(input.message.elapsedTime);
        break;
      case GameNetIds.INPUT_FIRE:
        // createMissile(input.clientId, client.state.player);
        break;
    }
  }
}

function update(elapsedTime, currentTime) {
  for (let clientId in GameState.gameClients) {
    GameState.gameClients[clientId].state.player.update(currentTime);
  }
}

function updateClients(elapsedTime) {

  props.lastUpdate += elapsedTime;


  // The following is used to visually see the entity interpolation in action
  if (props.lastUpdate < DEMONSTRATION_STATE_UPDATE_LAG) {
      return;
  }

  // For each game client create an update message with the client's data and elapsedTime
  // Then, if the player is to report the update, then emit an UPDATE_SELF and an UPDATE_OTHER 
  // to all other clients
  for (let clientId in GameState.gameClients) {
    let client = GameState.gameClients[clientId];
    let update = {
        clientId: clientId,
        lastMessageId: client.lastMessageId,
        player: {
          direction: client.state.player.direction,
          position: client.state.player.position,
          updateWindow: props.lastUpdate
        }
    };

    if (client.state.player.reportUpdate) {
        client.socket.emit(GameNetIds.UPDATE_SELF, update);

        for (let otherId in GameState.gameClients) {
            if (otherId !== clientId) {
              GameState.gameClients[otherId].socket.emit(GameNetIds.UPDATE_OTHER, update);
            }
        }
    }
  }

  for (let clientId in GameState.gameClients) {
    GameState.gameClients[clientId].state.player.reportUpdate = false;
  }

  props.lastUpdate = 0;
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
    setTimeout(() => {
      let now = present();
      gameLoop(now, now - currentTime);
    }, SIMULATION_UPDATE_RATE_MS);
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

function initializeSocketIO(io) {
  //------------------------------------------------------------------
  //
  // Bidirectional notification: notifies the newly connected client of 
  // all other clients and notifies all other clients of the newly connected 
  // client.
  //
  //------------------------------------------------------------------
  function notifyConnect(newClient) {
    for (let clientId in GameState.gameClients) {
      if (!GameState.gameClients.hasOwnProperty(clientId)) {
        continue;
      }

      let existingClient = GameState.gameClients[clientId];
      let newPlayer = newClient.state.player;
      let existingPlayer = existingClient.state.player;

      if (newClient.socket.id !== clientId) {
        existingClient.socket.emit(GameNetIds.CONNECT_OTHER, {
          clientId: newClient.socket.id,
          player: {
            direction: newPlayer.direction,
            position: newPlayer.position,
            size: newPlayer.size,
            speed: newPlayer.speed,
            rotateRate: newPlayer.rotateRate
          }
        });
        newClient.socket.emit(GameNetIds.CONNECT_OTHER, {
          clientId: existingClient.socket.id,
          player: {
            direction: existingPlayer.direction,
            position: existingPlayer.position,
            size: existingPlayer.size,
            speed: existingPlayer.speed,
            rotateRate: existingPlayer.rotateRate
          }
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
    for (let clientId in GameState.gameClients) {
      if (!GameState.gameClients.hasOwnProperty(clientId)) {
        continue;
      }
      let client = GameState.gameClients[clientId];
      client.socket.emit(GameNetIds.PLAYER_LEAVE, {
        clients: Object.values(GameState.gameClients).map(x => x.state.player).filter(x => !!x.name)
      });
      if (clientId !== playerId.id) {
        client.socket.emit(GameNetIds.GAME_MSG, {
          playerId: playerId.name,  
          message: "Has left the game"      
        });
      }
    }
  }

  //
  // Handler for a new client connection
  io.on('connection', function(socket) {
    console.log('Connection established: ', socket.id);

    let newPlayer = Player.create(maxHealth, maxEnergy, maxAmmo);
    let newClient = {
      lastMessageId: null,
      socket: socket,
      state: {
        player: newPlayer
      }
    };
    GameState.gameClients[socket.id] = newClient;

    //
    // Ack message emitted to new client with info about its new player
    // Note we can't send the player object itself because of its utilization of getters
    socket.emit(GameNetIds.CONNECT_ACK, {
      clientId: socket.id,
      player: {
        direction: newPlayer.direction,
        position: newPlayer.position,
        size: newPlayer.size,
        speed: newPlayer.speed,
        rotateRate: newPlayer.rotateRate
      }
    });

    //
    // Handler to enqueue the new client's input messages in the game's inputQueue
    socket.on(GameNetIds.INPUT, data => {
      inputQueue.enqueue({
        clientId: socket.id,
        message: data
      });
    });

    socket.on(GameNetIds.PLAYER_JOIN_GAME, async data => {
      try {
        // asynchronous token checking
        const user = await Token.check_auth(data.token);
        newClient.state.player = user;
        
        for (let clientId in GameState.gameClients) {
          if (!GameState.gameClients.hasOwnProperty(clientId)) {
            continue;
          }
          let client = GameState.gameClients[clientId];
          client.socket.emit(GameNetIds.PLAYER_JOIN_GAME_ACK, {
            clients: Object.values(GameState.gameClients).map(x => x.state.player).filter(x => !!x.name)
          });
          if (clientId !== socket.id) {
            client.socket.emit(GameNetIds.GAME_MSG, {
              playerId: newClient.state.player.name,  
              message: "Has entered the game"      
            });
          }
        }
      } catch (e) {
        newClient.socket.emit(GameNetIds.GAME_KICK, {
          message: "Something went wrong authorizing you try refreshing or logging in again."
        });
        console.error(e);
      }
    });

    socket.on(GameNetIds.GAME_MSG, data => {
      for (let clientId in GameState.gameClients) {
        if (!GameState.gameClients.hasOwnProperty(clientId)) {
          continue;
        }
        let client = GameState.gameClients[clientId];
        
        client.socket.emit(GameNetIds.GAME_MSG, {
          playerId: newClient.state.player.name,  
          message: data.message      
        });
      }
    });

    socket.on('disconnect', function() {
      var obj = {
        id: socket.id,
        name: GameState.gameClients[socket.id].state.player.name
      }
      delete GameState.gameClients[socket.id];
      notifyDisconnect(obj);
    });

    notifyConnect(newClient);
  });
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
  initialize,
  terminate,
  initializeSocketIO
};
