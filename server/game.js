const present = require('present');
const GameState = require('./gamestate');
const rbush = require('rbush');
const Coords = require('../client_files/shared/Coords');
const Geometry = require('../client_files/shared/Geometry');
const Player = require('./components/player');
const Bullet = require('./components/bullet');
const GameNetIds = require('../client_files/shared/game-net-ids');
const Queue = require('../client_files/shared/queue.js');
const GameMap = require ('./components/gameMap.js');
const Token = require('../Token');
const config = require('./config');
const Users = require('../models/Users');

var waitingForPlayers = false;

const SIMULATION_UPDATE_RATE_MS = 33;
// const STATE_UPDATE_LAG = 0;
const CLIENT_UPDATE_PERIOD = 200;

let inputQueue = Queue.create();
let islandMap = GameMap.getGridMap();
let newBullets = [];
var itemTree = rbush();
var playerTree = rbush();
let activeBullets = [];
let hits = [];
var bulletTree = rbush();

let props = {
  quit: false,
  lastUpdate: 0,
  nextBulletId: 1,
  accumulatingUpdatePeriod: 0
};


//------------------------------------------------------------------
//
// Used to create a bullet in response to user input.
//
//------------------------------------------------------------------
function createBullet(clientId, playerModel, username) {
  let bulletColor = playerModel.buffs.dmg ? 'red' : 'white';
  let bulletSpeedRatio = playerModel.buffs.gunRate ? 2 : 1;
  let bullet = Bullet.create({
    id: props.nextBulletId++,
    clientId: clientId,
    position: {
      x: playerModel.position.x + playerModel.size.width / 2,
      y: playerModel.position.y + playerModel.size.height / 2,
    },
    direction: playerModel.direction,
    speed: playerModel.speed * bulletSpeedRatio,
    damage: GameState.defaultBulletDamage + playerModel.buffs.dmg,
    color: bulletColor,
    username: username
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
    client.state.player.reportUpdate = true;
    switch (input.message.type) {
      case GameNetIds.INPUT_MOVE_FORWARD:
        client.state.player.move(input.message.elapsedTime);
        break;
      case GameNetIds.INPUT_MOVE_BACKWARD:
        client.state.player.reverse(input.message.elapsedTime);
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
          createBullet(input.clientId, client.state.player, client.state.username);
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

function checkCollisions(state, clientId, client){
  //Note: Player Vs Wall Collision done in player.move();
  checkPlayerVsPlayerCollisions(state, clientId);
  checkPlayerVsBulletCollisions(state,clientId);
  checkPlayerVsBuffCollision(state,client);
  checkPlayerVsDeathCircleCollision(state);
}

function checkPlayerVsPlayerCollisions(state, clientId){
  //if hit, take damage to other
  if (state.player.useTurbo) {
    let collisionSquare = {
      minX: state.player.center.x - state.player.size.width/2,
      minY: state.player.center.y - state.player.size.height/2,
      maxX: state.player.center.x + state.player.size.width/2,
      maxY: state.player.center.y + state.player.size.height/2
    }
    let otherPlayers = playerTree.search(collisionSquare);
    for (let i = 0; i < otherPlayers.length; i++) {
      if (clientId !== otherPlayers[i].client.socket.id) {
        if (otherPlayers[i].player.health.current > 0) {
          otherPlayers[i].player.health.current--;
          state.player.damageDealt++;
          otherPlayers[i].player.reportUpdate = true;
          if (otherPlayers[i].player.health.current <= 0 && !otherPlayers[i].player.dead) {
            otherPlayers[i].player.dead = true;
            state.player.killCount++;
            for (gamer in GameState.gameClients) {
              if (GameState.gameClients[gamer].socket.id !== clientId) {
                GameState.gameClients[gamer].socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
                  // they are not subtracted yet from the alive players so this is their position.
                  message: otherPlayers[i].client.username + ' was eliminated by ' + state.username
                });
              }
            }
            for (gamer in GameState.gameClients) {
              if (GameState.gameClients[gamer].socket.id !== otherPlayers[i].clientId) {
                GameState.gameClients[gamer].socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
                  // they are not subtracted yet from the alive players so this is their position.
                  message: otherPlayers[i].client.username + ' was eliminated by ' + state.username
                });
              }
            }
          }
        }
      }
    }
  }
}
function checkPlayerVsBulletCollisions(state, clientId){
  //if hit, take damage to self
  let searchArea = {
    minX: state.player.position.x + state.player.size.width/2 - Math.max(state.player.size.width, state.player.size.height)/2,
    minY: state.player.position.y + state.player.size.height/2 - Math.max(state.player.size.width, state.player.size.height)/2,
    maxX: state.player.position.x + Math.max(state.player.size.width, state.player.size.height),
    maxY: state.player.position.y + Math.max(state.player.size.width, state.player.size.height) };
  if (bulletTree.collides(searchArea)) {
    var results = bulletTree.search(searchArea);
    for (let i = 0; i < results.length; i++) {
      //
      // Don't allow a bullet to hit the player it was fired from.
      if (clientId !== results[i].clientId) {
        hits.push({
          bulletId: results[i].id,
          position: {
            x: state.player.center.x,
            y: state.player.center.y,
          },
          width: 0.01,
          height: 0.01
        });
        if (typeof GameState.gameClients[results[i].clientId] !== 'undefined') {
          GameState.gameClients[results[i].clientId].state.player.bulletShots.hit++;
          GameState.gameClients[results[i].clientId].state.player.damageDealt += results[i].damage;
        }        
        state.player.health.current -= results[i].damage;
        if (checkDeath(state.player) && !state.player.dead) {
          processDeath(state.player);
          if (typeof GameState.gameClients[results[i].clientId] !== 'undefined') {
            GameState.gameClients[results[i].clientId].state.player.killCount++;
          }
          
          for (gamer in GameState.gameClients) {
            if (GameState.gameClients[gamer].socket.id !== clientId) {
              GameState.gameClients[gamer].socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
                // they are not subtracted yet from the alive players so this is their position.
                message: state.username + ' was eliminated by ' + GameState.gameClients[results[i].clientId].state.username
              });
            }
          }
        }
        state.player.reportUpdate = true;
        bulletTree.remove(results[i]);
      }
    }
  }
}
function checkPlayerVsBuffCollision(state, client){
  let searchArea = {
    minX: state.player.position.x,
    minY: state.player.position.y,
    maxX: Math.max(state.player.size.height, state.player.size.width) + state.player.position.x,
    maxY: Math.max(state.player.size.height, state.player.size.width) + state.player.position.y
  };
  if(itemTree.collides(searchArea)) {
    var result = itemTree.search(searchArea);
    
    for (let i = 0; i < result.length; i++) {
      switch(result[i].type){
        case 'ammo':
          if (state.player.ammo.current < state.player.ammo.max) {
            state.player.ammo.current += 20;
            state.player.ammo.current = Math.min(state.player.ammo.current, state.player.ammo.max);
            itemTree.remove(result[i]);
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up ammo'
            });
          }
          break;
        case 'health':
          if (state.player.health.current < state.player.health.max) {
            state.player.health.current += 20;
            state.player.health.current = Math.min(state.player.health.current, state.player.health.max);
            itemTree.remove(result[i]);
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up health'
            });
          }
          break;
        case 'speed':
          if (!state.player.buffs.speed) {
            state.player.buffs.speed = true;
            state.player.energy.current = state.player.energy.max;
            itemTree.remove(result[i]);
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up speed boost buff'
            });
          } else if(state.player.energy.current < state.player.energy.max){
            state.player.energy.current = state.player.energy.max
            itemTree.remove(result[i]);
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up speed boost refill'
            });
          }
          break;
        case 'gun':
          if (!state.player.gun) {
            state.player.gun = true;
            state.player.ammo.current = state.player.ammo.max;
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up a gun'
            });
            itemTree.remove(result[i]);
          }
          break;
        case 'gunSpd':
          if (!state.player.buffs.fireRate) {
            state.player.buffs.fireRate = true;
            itemTree.remove(result[i]);
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up gun speed boost'
            });
          }
          break;
        case 'dmg':
          if (state.player.buffs.dmg === 0) {
            state.player.buffs.dmg = 5;
            itemTree.remove(result[i]);
            client.socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: 'Picked up damage boost'
            });
          }
          break;
      }
    }
  }
}
function checkPlayerVsDeathCircleCollision(state, clientId){
  //If outside circle, take damage
  let player = state.player;
  if(player.isDropped && !GameState.shield.containsPoint(Geometry.Point(player.center.x, player.center.y))) {
    if(player.health.current > 0) {
      player.health.current--;
      if(player.health.current <= 0) {
        processDeath(player);
        for (gamer in GameState.gameClients) {
          if (GameState.gameClients[gamer].socket.id !== clientId) {
            GameState.gameClients[gamer].socket.emit(GameNetIds.GAME_UPDATE_MESSAGE, {
              // they are not subtracted yet from the alive players so this is their position.
              message: state.username + ' was eliminated by the shield'
            });
          }
        }
      }
    }
  }
}

function checkDeath(player){
  if(player.health.current <= 0)
    return true;
  return false;
}

function processDeath(player){
  hits.push({
    width: player.size.width * 10,
    height: player.size.height * 10,
    position: {
      x: player.center.x,
      y: player.center.y
    }
  });
  player.dead = true;
}

function update(elapsedTime, currentTime, totalTime) {
  GameState.update(elapsedTime, currentTime, totalTime);
  bulletTree.clear();
  bulletTree.load(activeBullets);
  for (let clientId in GameState.gameClients) {
    checkCollisions(GameState.gameClients[clientId].state, GameState.gameClients[clientId].socket.id, GameState.gameClients[clientId]);
    if(checkDeath(GameState.gameClients[clientId].state.player)) {
      processDeath(GameState.gameClients[clientId].state.player);
      GameState.gameClients[clientId].socket.emit(GameNetIds.MESSAGE_GAME_OVER, {
        // they are not subtracted yet from the alive players so this is their position.
        place: GameState.alivePlayers.length,
        totalPlayers: GameState.playerCount,
        killCount: GameState.gameClients[clientId].state.player.killCount,
        bulletStats: {
          accuracy: (GameState.gameClients[clientId].state.player.bulletShots.hit / GameState.gameClients[clientId].state.player.bulletShots.total).toFixed(2),
          damage: GameState.gameClients[clientId].state.player.damageDealt
        }
      });
    }
  }

  GameState.alivePlayers = GameState.alivePlayers.filter(player => !player.dead);

  if(GameState.alivePlayers.length <= 1){
    for (let clientId in GameState.gameClients) {
      if(!GameState.gameClients[clientId].state.player.dead) {
        GameState.gameClients[clientId].socket.emit(GameNetIds.MESSAGE_GAME_OVER, {
          // they are not subtracted yet from the alive players so this is their position.
          place: GameState.alivePlayers.length,
          totalPlayers: GameState.playerCount,
          killCount: GameState.gameClients[clientId].state.player.killCount,
          bulletStats: {
            accuracy: (GameState.gameClients[clientId].state.player.bulletShots.hit / GameState.gameClients[clientId].state.player.bulletShots.total).toFixed(2),
            damage: GameState.gameClients[clientId].state.player.damageDealt
          }
        });
      }
    }
    terminate();
  }
  activeBullets = bulletTree.all();
  for (let i = 0; i < newBullets.length; i++) {
    newBullets[i].update(elapsedTime);
  }
  bulletTree.clear();
  for (let i = 0; i < activeBullets.length; i++) {
    //
    // If update returns false, that means the bullet lifetime ended and
    // we don't keep it around any longer.
    if (activeBullets[i].update(elapsedTime)) {
      bulletTree.insert(activeBullets[i]);
    }
  }
  
  //
  // Check to see if any bullets collide with any players (no friendly fire)
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
              bulletId: badBullets[z].id,
              width: 0.01,
              height: 0.01,
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
      timeRemaining: bullet.timeRemaining,
      color: bullet.color
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
    client.state.player.reportUpdate = true;
    let buffs = itemTree.search({
      minX: client.state.player.position.x - Coords.viewport.width,
      minY: client.state.player.position.y - Coords.viewport.height,
      maxX: client.state.player.position.x + Coords.viewport.width,
      maxY: client.state.player.position.y + Coords.viewport.height
    });
    
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
          ammo: client.state.player.ammo.current,
          gun: client.state.player.gun,
          items: buffs,
          isDead: client.state.player.dead,
          remainingPlayers: GameState.alivePlayers.length
        },
        shield: {
          x: GameState.shield.x,
          y: GameState.shield.y,
          radius: GameState.shield.radius,
        }        
    };
    
    let updateOther = {
      clientId : update.clientId,
      player: {
        direction: update.player.direction,
        position: update.player.position,
        updateWindow: update.player.updateWindow
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
        minX: client.state.player.center.x - Coords.viewport.width,
        minY: client.state.player.center.y - Coords.viewport.height,
        maxX: client.state.player.center.x + Coords.viewport.width,
        maxY: client.state.player.center.y + Coords.viewport.height
      });
      for (let i = 0; i < otherPlayers.length; i++) {
        if (otherPlayers[i].client !== client) {
          otherPlayers[i].client.socket.emit(GameNetIds.UPDATE_OTHER, updateOther);
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
  if (props.accumulatingUpdatePeriod > CLIENT_UPDATE_PERIOD) {
    updateClients(props.accumulatingUpdatePeriod);
    props.accumulatingUpdatePeriod = 0;
  }
  props.accumulatingUpdatePeriod += elapsedTime;
  if (GameState.inProgress) {
    setTimeout(() => {
      let now = present();
      gameLoop(now, now - currentTime);
    }, SIMULATION_UPDATE_RATE_MS);
  } else {
    updateStats();
  }
}

function updateStats(){
  for(let clientId in GameState.gameClients){
    for(let user in Users.users){
      if(Users.users[user].server.name === GameState.gameClients[clientId].state.username){
        Users.users[user].stats.totalGames++;
        Users.users[user].stats.totalKills += GameState.gameClients[clientId].state.player.killCount;
        Users.users[user].stats.totalWins += GameState.gameClients[clientId].state.player.dead ? 0 : 1;
        Users.users[user].stats.totalDamageDealt += GameState.gameClients[clientId].state.player.damageDealt;
        Users.users[user].stats.bullets.hit += GameState.gameClients[clientId].state.player.bulletShots.hit;
        Users.users[user].stats.bullets.total += GameState.gameClients[clientId].state.player.bulletShots.total;
        break;
      }
    }
  }
  Users.setHighScores();
  Users.write();
}


var timeout = (ms) => new Promise(res => setTimeout(res, ms));
function terminate () {
  GameState.inProgress = false;
}
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
    for(var i = 0; i < 50; ++i) {
      await timeout(100);
      if(GameState.alivePlayers.length >= 2) {
        break;
      }
    }
    if(GameState.alivePlayers.length === 0) {
      terminate();
      return;
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

    let newPlayer = Player.create(GameState.maxHealth, GameState.maxEnergy, GameState.maxAmmo, GameState.depletionRate);
    let newClient = {
      lastMessageId: null,
      socket: socket,
      state: {
        player: newPlayer,
      }
    };
    GameState.gameClients[socket.id] = newClient;
    GameState.alivePlayers.push(newPlayer);
    GameState.playerCount++;

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

    socket.on(GameNetIds.SET_NAME, data => {
      GameState.gameClients[socket.id].state.username = data.username;
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
      GameState.gameClients[socket.id].state.player.dead = true;;
      delete GameState.gameClients[socket.id];
      notifyDisconnect(obj);
    });

    notifyConnect(newClient);
  });
}

module.exports = {
  initialize,
  initializeSocketIO
};
