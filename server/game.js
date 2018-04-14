// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const Bullet = require('.components/bullet');
const GameNetIds = require('../client_files/shared/game-net-ids');
const Queue = require('../client_files/shared/queue.js');
const Token = require('../Token');

const SIMULATION_UPDATE_RATE_MS = 16;
const STATE_UPDATE_LAG = 100;

let inputQueue = Queue.create();
let newBullets = [];
let activeBullets = [];

let props = {
  quit: false,
  lastUpdate: 0,
  nextBulletId: 1
};


//------------------------------------------------------------------
//
// Used to create a bullet in response to user input.
//
//------------------------------------------------------------------
function createBullet(clientId, playerModel) {
  let bullet = bullet.create({
    id: nextBulletId++,
    clientId: clientId,
    position: {
      x: playerModel.position.x,
      y: playerModel.position.y
    },
    direction: playerModel.direction,
    speed: playerModel.speed
  });

  newBullets.push(bullet);
}

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
        createBullet(input.clientId, client.state.player);
        break;
    }
  }
}

function collided(obj1, obj2) {
  let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
  let radii = obj1.radius + obj2.radius;

  return distance <= radii;
}

function update(elapsedTime, currentTime) {
  for (let clientId in GameState.gameClients) {
    GameState.gameClients[clientId].state.player.update(currentTime);
  }

  for (let i = 0; i < newBullets.length; i++) {
    newBullets[i].update(elapsedTime);
  }

  let keepBullets = [];
  for (let i = 0; i < activeBullets.length; i++) {
    //
    // If update returns false, that means the bullet lifetime ended and
    // we don't keep it around any longer.
    if (activeBullets[i].update(elapsedTime)) {
      keepBullets.push(activeBullets[bullet]);
    }
  }
  activeBullets = keepBullets;

  //
  // Check to see if any bullets collide with any players (no friendly fire)
  keepBullets = [];
  // TODO: CHANGE so that for every player we only check that player's bullets
  // in that player's firing radius
  for (let i = 0; i < activeBullets.length; i++) {
    let hit = false;
    for (let clientId in activeClients) {
      //
      // Don't allow a bullet to hit the player it was fired from.
      if (clientId !== activeBullets[i].clientId) {
        if (collided(activeBullets[i], activeClients[clientId].player)) {
          hit = true;
          hits.push({
            clientId: clientId,
            bulletId: activeBullets[i].id,
            position: activeClients[clientId].player.position
          });
        }
      }
    }
    if (!hit) {
      keepbullets.push(activeBullets[i]);
    }
  }
  activeBullets = keepBullets;
}

function updateClients(elapsedTime) {

  props.lastUpdate += elapsedTime;


  if (props.lastUpdate < STATE_UPDATE_LAG) {
      return;
  }

  //
  // Build the bullet messages one time, then reuse inside the loop
  let bulletMessages = [];
  for (let i = 0; i < newBullets.length; i++) {
    let bullet = newBullets[i];
    bulletMessages.push({
      id: bullet.id,
      direction: bullet.direction,
      position: {
        x: bullet.position.x,
        y: bullet.position.y
      },
      radius: bullet.radius,
      speed: bullet.speed,
      timeRemaining: bullet.timeRemaining
    });
  }

  //
  // Move all the new bullets over to the active bullets array
  for (let i = 0; i < newBullets.length; i++) {
    activeBullets.push(newBullets[i]);
  }
  newBullets.length = 0;

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

    //
    // Report any new bullets to the active clients
    for (let i = 0; i < bulletMessages.length; i++) {
      client.socket.emit(GameNetIds.BULLET_NEW, bulletMessages[i]);
    }

    //
    // Report any bullet hits to this client
    for (let i = 0; i < hits.length; i++) {
        client.socket.emit(GameNetIds.BULLET_HIT, hits[i]);
    }
  }

  for (let clientId in GameState.gameClients) {
    GameState.gameClients[clientId].state.player.reportUpdate = false;
  }

  hits.length = 0; // Clean up

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

    let newPlayer = Player.create();
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
