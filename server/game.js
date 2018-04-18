// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const rbush = require('rbush');
const Player = require('./components/player');
const Bullet = require('./components/bullet');
const GameNetIds = require('../client_files/shared/game-net-ids');
const Queue = require('../client_files/shared/queue.js');
const GameMap = require ('./components/gamemap.js');
const Token = require('../Token');
const config = require('./config');

var waitingForPlayers = false;

const SIMULATION_UPDATE_RATE_MS = 16;
const STATE_UPDATE_LAG = 100;

let inputQueue = Queue.create();
let islandMap = GameMap.getGridMap();
let newBullets = [];
var itemTree = rbush();
var playerTree = rbush();
let activeBullets = [];
let hits = [];
var bulletTree = rbush();
// The following is used to visually see the entity interpolation in action
const DEMONSTRATION_STATE_UPDATE_LAG = 100;

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
  let bullet = Bullet.create({
    id: props.nextBulletId++,
    clientId: clientId,
    position: {
      x: playerModel.position.x + playerModel.size.width / 2,
      y: playerModel.position.y + playerModel.size.height / 2,
    },
    direction: playerModel.direction,
    speed: playerModel.speed,
    damage: GameState.defaultBulletDamage + playerModel.buffs.dmg
  });
  newBullets.push(bullet);
}



function processInput(elapsedTime, totalTime) {
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
        var playerFireRate = client.state.player.buffs.fireRate ? GameState.upgradedFireRate : GameState.fireRate;
        if(client.state.player.currentFireRateWait >= playerFireRate && client.state.player.ammo.current > 0 && client.state.player.gun){
          createBullet(input.clientId, client.state.player);
          client.state.player.currentFireRateWait = 0;
          client.state.player.ammo.current--;
          client.state.player.bulletShots.total++;
        }
        break;
      case GameNetIds.INPUT_TURBO:
        client.state.player.turbo(input.message.elapsedTime);
        break;
      case GameNetIds.INPUT_DROP:
        GameState.dropper.onDropSelection(client.state, input.message.position, totalTime);
    }
  }
}

function collided(obj1, obj2) {
  let distance = Math.sqrt(Math.pow(obj1.position.x - obj2.position.x, 2) + Math.pow(obj1.position.y - obj2.position.y, 2));
  let radii = obj1.radius + obj2.radius;

  return distance <= radii;
}

function checkCollisions(player, clientId){
  //Note: Player Vs Wall Collision done in player.move();
  checkPlayerVsPlayerCollisions(player, clientId);
  checkPlayerVsBulletCollisions(player,clientId);
  checkPlayerVsBuffCollision(player);
  checkPlayerVsDeathCircleCollision(player);
}

function checkPlayerVsPlayerCollisions(player, clientId){
  //if hit, take damage to other
  if (player.useTurbo) {
    let collisionSquare = {
      minX: player.center.x - player.size.width/2,
      minY: player.center.y - player.size.height/2,
      maxX: player.center.x + player.size.width/2,
      maxY: player.center.y + player.size.height/2
    }
    let otherPlayers = playerTree.search(collisionSquare);
    for (let i = 0; i < otherPlayers.length; i++) {
      if (clientId !== otherPlayers[i].client.socket.id) {
        otherPlayers[i].player.health.current--;
        otherPlayers[i].player.reportUpdate = true;
        if (otherPlayers[i].player.health.current <= 0) {
          player.killCount++;
        }
      }
    }
  }
  
}
function checkPlayerVsBulletCollisions(player, clientId){
  //if hit, take damage to self

  let searchArea = {
    minX: player.position.x + player.size.width/2 - Math.max(player.size.width, player.size.height)/2,
    minY: player.position.y + player.size.height/2 - Math.max(player.size.width, player.size.height)/2,
    maxX: player.position.x + Math.max(player.size.width,player.size.height),
    maxY: player.position.y + Math.max(player.size.width, player.size.height) };
  if (bulletTree.collides(searchArea)) {
    var results = bulletTree.search(searchArea);
    for (let i = 0; i < results.length; i++) {
      //
      // Don't allow a bullet to hit the player it was fired from.
      if (clientId !== results[i].clientId) {
        hits.push({
          hitClientId: clientId,
          sourceClientId: results[i].clientId,
          bulletId: results[i].id,
          position: player.position
        });
        GameState.gameClients[results[i].clientId].state.player.bulletShots.hit++;
        player.health.current -= results[i].damage;
        if (player.health.current <= 0) {
          GameState.gameClients[results[i].clientId].state.player.killCount++;
        }
        player.reportUpdate = true;
        bulletTree.remove(results[i]);
      }
    }
  }
}
function checkPlayerVsBuffCollision(player){
  if(itemTree.collides({minX:player.position.x, minY: player.position.y, maxX:Math.max(player.size.height, player.size.width) + player.position.x, maxY:Math.max(player.size.height, player.size.width) + player.position.y})) {
    var result = itemTree.search({
      minX: player.position.x,
      minY: player.position.y,
      maxX: Math.max(player.size.height, player.size.width) + player.position.x,
      maxY: Math.max(player.size.height, player.size.width) + player.position.y
    });
    for (let i = 0; i < result.length; i++) {
      switch(result[i].type){
        case 'ammo':
          if (player.ammo.current < player.ammo.max) {
            player.ammo.current += 20;
            player.ammo.current = Math.min(player.ammo.current, player.ammo.max);
            itemTree.remove(result[i]);
          }
          break;
        case 'health':
          if (player.health.current < player.health.max) {
            player.health.current += 20;
            player.health.current = Math.min(player.health.current, player.health.max);
            itemTree.remove(result[i]);
          }
          break;
        case 'speed':
          if (!player.buffs.speed) {
            player.buffs.speed = true;
            itemTree.remove(result[i]);
          }
          break;
        case 'gun':
          if (!player.gun) {
            player.gun = true;
            player.ammo.current = player.ammo.max;
            itemTree.remove(result[i]);
          }
          break;
        case 'gunSpd':
          if (!player.buffs.fireRate) {
            player.buffs.fireRate = true;
            itemTree.remove(result[i]);
          }
          break;
        case 'dmg':
          if (player.buffs.dmg === 0) {
            player.buffs.dmg = 5;
            itemTree.remove(result[i]);
          }
          break;
      }
    }
  }
  //if hit, pick up buff if not already obtained
}
function checkPlayerVsDeathCircleCollision(player){
  //If outside circle, take damage
}

function checkDeath(player){
  if(player.health.current <= 0)
    return true;
  return false;
}

function processDeath(player){
  //PlayerCount--
  //Update to player = death
  //Update to others = otherDeath
  player.dead = true;
  return;
}

function update(elapsedTime, currentTime, totalTime) {
  GameState.update(elapsedTime, currentTime, totalTime);  
  //for bullet in bullets
  //update bullet (bullets die on hitting player or land)
  bulletTree.clear();
  bulletTree.load(activeBullets);

  for (let clientId in GameState.gameClients) {
    checkCollisions(GameState.gameClients[clientId].state.player, GameState.gameClients[clientId].socket.id);
    if(checkDeath(GameState.gameClients[clientId].state.player))
      processDeath(GameState.gameClients[clientId].state.player);
    }

  if(GameState.alivePlayers.length <= 1){
    // endGame
    // tell the player they won;
    GameState.inProgress = false;
  }
  activeBullets = bulletTree.all();
  for (let i = 0; i < newBullets.length; i++) {
    newBullets[i].update(elapsedTime);
  }
  //let keepBullets = [];
  bulletTree.clear();
  for (let i = 0; i < activeBullets.length; i++) {
    //
    // If update returns false, that means the bullet lifetime ended and
    // we don't keep it around any longer.
    if (activeBullets[i].update(elapsedTime)) {
      bulletTree.insert(activeBullets[i]);
    }
  }
  //bulletTree.load(keepBullets);
  
  //
  // Check to see if any bullets collide with any players (no friendly fire)

  // TODO: CHANGE so that for every player we only check that player's bullets
  // in that player's firing radius
  
   
  for (let j = 1; j < islandMap.length-1; j++) {
    for (let k = 1; k < islandMap[j].length-1; k++) {
      if (islandMap[j][k] !== 0) {
        if (bulletTree.collides({
          minX: k /100,
          minY: j/100,
          maxX: (k+1)/100,
          maxY: (j+1)/100
        })) {
          var badBullets = bulletTree.search({
            minX: k /100,
            minY: j/100,
            maxX: (k+1)/100,
            maxY: (j+1)/100
          });
          for (z = 0; z < badBullets.length; z++) {
            let location = {
              x: (2*k + 1)/200,
              y: (2*j + 1)/200
            } 
            hits.push({
              hitClientId: badBullets[z].clientId,
              sourceClientId: badBullets[z].clientId,
              bulletId: badBullets[z].id,
              position: location
            });
            bulletTree.remove(badBullets[z]);
          }
        }
      }
    }
  }
  activeBullets = bulletTree.all();
}

function updatePlayerTree() {
  playerTree.clear();
  for (let clientId in GameState.gameClients) {
    let client = GameState.gameClients[clientId].state.player;
    if (!client.dead) {
      let playerLocale = {
        minX:client.center.x - client.size.width/2,
        minY:client.center.y - client.size.height/2,
        maxX:client.center.x - client.size.width/2,
        maxY:client.center.y + client.size.height/2,
        player: client,
        client: GameState.gameClients[clientId]
      }
      playerTree.insert(playerLocale);
    }
  }
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
  // updateBulletTree(activeBullets);

  // For each game client create an update message with the client's data and elapsedTime
  // Then, if the player is to report the update, then emit an UPDATE_SELF and an UPDATE_OTHER 
  // to all other clients
  
  for (let clientId in GameState.gameClients) {
    let client = GameState.gameClients[clientId];
    let buffs = itemTree.search({
      minX: client.state.player.position.x - .15,
      minY: client.state.player.position.y - .15,
      maxX: client.state.player.position.x + .15,
      maxY: client.state.player.position.y + .15
    });
    //let buffs = itemTree.all();
    
    let update = {
        clientId: clientId,
        lastMessageId: client.lastMessageId,
        player: {
          direction: client.state.player.direction,
          position: client.state.player.position,
          health: client.state.player.health,
          energy: client.state.player.energy,
          useTurbo: client.state.player.useTurbo,
          updateWindow: props.lastUpdate,
          isDropped: client.state.player.isDropped,
          items: buffs
        }        
    };

    if(!client.state.player.isDropped) {
      client.socket.emit(GameNetIds.UPDATE_VEHICLE, {
        vehicle: {
          x: Math.abs(GameState.vehicle.circle.x),
          y: Math.abs(GameState.vehicle.circle.y),
          radius: GameState.vehicle.circle.radius,
          direction: GameState.vehicle.direction,
        },
        updateWindow: elapsedTime,
      });
    }

    if (client.state.player.reportUpdate) {
      client.socket.emit(GameNetIds.UPDATE_SELF, update);
      let otherPlayers = playerTree.search({
        minX: client.state.player.center.x - .15,
        minY: client.state.player.center.y - .15,
        maxX: client.state.player.center.x + .15,
        maxY: client.state.player.center.y + .15
      });
      for (let i = 0; i < otherPlayers.length; i++) {
        if (otherPlayers[i].cliend !== client) {
          otherPlayers[i].client.socket.emit(GameNetIds.UPDATE_OTHER, update);
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
    let client = GameState.gameClients[clientId];
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
  processInput(elapsedTime, currentTime - GameState.startTime);
  updatePlayerTree();
  update(elapsedTime, currentTime, currentTime - GameState.startTime);
  updateClients(elapsedTime);

  if (GameState.inProgress) {
    setTimeout(() => {
      let now = present();
      gameLoop(now, now - currentTime);
    }, SIMULATION_UPDATE_RATE_MS);
  }
}


var timeout = (ms) => new Promise(res => setTimeout(res, ms));
//------------------------------------------------------------------
//
// Get the socket.io server up and running so it can begin
// collecting inputs from the connected clients.
//
//------------------------------------------------------------------
async function initialize() {
  try {
    itemTree = rbush();
    itemTree.load(GameState.newGame());
    // wait for atleast two players to come in
    for(var i = 0; i < 100; ++i) {
      await timeout(100);
      if(GameState.alivePlayers.length >= 2) {
        break;
      }
    }
    GameState.startTime = present();
    gameLoop(present(), 0);
  } catch (e) {
    console.error(e);
  }
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
          // player: null,
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

    let newPlayer = Player.create(GameState.maxHealth, GameState.maxEnergy, GameState.maxAmmo);
    let newClient = {
      lastMessageId: null,
      socket: socket,
      state: {
        player: newPlayer,
      }
    };
    GameState.gameClients[socket.id] = newClient;
    GameState.alivePlayers.push(newPlayer);

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
        newClient.state.player.isDropped = false;
        
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
  GameState.inProgress = false;
}

module.exports = {
  initialize,
  terminate,
  initializeSocketIO
};
