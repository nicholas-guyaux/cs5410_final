// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const NetworkIds = require('../client_files/shared/network-ids');
const Queue = require('../client_files/shared/queue.js');
const Token = require('../Token');
const game = require('./game');

var numPlayersRequired = 2;
var gameInProgress = false;


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
      game.intialize();
      GameState.gameClients = GameState.lobbyClients;
      GameState.lobbyClients = {};
      for (let clientId in GameState.gameClients) {
        if (!GameState.gameClients.hasOwnProperty(clientId)) {
          continue;
        }
        let existingClient = GameState.gameClients[clientId];
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
      numPlayers: numPlayersRequired
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

    socket.on(NetworkIds.PLAYER_JOIN, async data => {
      try {
        // asynchronous token checking
        const user = await Token.check_auth(data.token);
        newClient.state.player = user;
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
      } catch (e) {
        newClient.socket.emit(NetworkIds.LOBBY_KICK, {
          message: "Something went wrong authorizing you try refreshing or logging in again."
        });
        console.error(e);
      }
    });

    socket.on(NetworkIds.LOBBY_MSG, data => {
      for (let clientId in GameState.lobbyClients) {
        if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
          continue;
        }
        let client = GameState.lobbyClients[clientId];
        
        client.socket.emit(NetworkIds.LOBBY_MSG, {
          playerId: newClient.state.player.name,  
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


//------------------------------------------------------------------
//
// Public function that allows the game simulation and processing to
// be terminated.
//
//------------------------------------------------------------------


module.exports = {
  initializeSocketIO
};
