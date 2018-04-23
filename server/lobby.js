// This code was adapted from code originally written by Dr. Dean Mathias

const present = require('present');
const GameState = require('./gamestate');
const Player = require('./components/player');
const LobbyNetIds = require('../client_files/shared/lobby-net-ids');
const Queue = require('../client_files/shared/queue.js');
const Token = require('../Token');
const game = require('./game');
const config = require('./config');


let props = {
  countdownTime: 10,
};

//------------------------------------------------------------------
//
// Get the socket.io server up and running so it can begin
// collecting inputs from the connected clients.
//
//------------------------------------------------------------------
function initializeSocketIO(io) {

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
        existingClient.socket.emit(LobbyNetIds.CONNECT_OTHER, {
          clientId: newClient.socket.id,
          player: newClient.state.player
        });
        newClient.socket.emit(LobbyNetIds.CONNECT_OTHER, {
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
    for (let clientId in GameState.lobbyClients) {
      if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
        continue;
      }
      let client = GameState.lobbyClients[clientId];
      client.socket.emit(LobbyNetIds.PLAYER_LEAVE, {
        clients: Object.values(GameState.lobbyClients).map(x => x.state.player).filter(x => !!x.name)
      });
      if (clientId !== playerId.id) {
        client.socket.emit(LobbyNetIds.LOBBY_MSG, {
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

    let newClient = {
      socket: socket,
      state: {
        player: ''
      }
    };
    GameState.lobbyClients[socket.id] = newClient;

    //
    // Ack message emitted to new client with info about its new player
    socket.emit(LobbyNetIds.CONNECT_ACK, {
      clientId: socket.id,
      numPlayers: config.numPlayersRequired
    });

    socket.on(LobbyNetIds.PLAYER_JOIN_LOBBY, async data => {
      try {
        // asynchronous token checking
        const user = await Token.check_auth(data.token);
        newClient.state.player = user;
        
        for (let clientId in GameState.lobbyClients) {
          if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
            continue;
          }
          let client = GameState.lobbyClients[clientId];
          client.socket.emit(LobbyNetIds.PLAYER_JOIN_LOBBY_ACK, {
            clients: Object.values(GameState.lobbyClients).map(x => x.state.player).filter(x => !!x.name)
          });
          if (clientId !== socket.id) {
            client.socket.emit(LobbyNetIds.LOBBY_MSG, {
              playerId: newClient.state.player.name,  
              message: "Has entered the lobby"      
            });
          }
        }
      } catch (e) {
        newClient.socket.emit(LobbyNetIds.LOBBY_KICK, {
          message: "Something went wrong authorizing you try refreshing or logging in again."
        });
        console.error(e);
      }
    });

    socket.on(LobbyNetIds.LOBBY_MSG, data => {
      for (let clientId in GameState.lobbyClients) {
        if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
          continue;
        }
        let client = GameState.lobbyClients[clientId];
        
        client.socket.emit(LobbyNetIds.LOBBY_MSG, {
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
      notifyDisconnect(obj);
    });

    notifyConnect(newClient);

    checkGameStart();
  });
}

function checkGameStart () {
  if ((Object.keys(GameState.lobbyClients).length >= config.numPlayersRequired) && !GameState.inProgress) {
    GameState.alivePlayers = [];
    GameState.inProgress = true;
    for (let clientId in GameState.lobbyClients) {
      if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
        continue;
      }
      let existingClient = GameState.lobbyClients[clientId];
      existingClient.socket.emit(LobbyNetIds.START_COUNTDOWN, {
        clientId: existingClient.socket.id,
        countdown: props.countdownTime
      });
    }
    setTimeout(function(){
      game.initialize(Object.keys(GameState.lobbyClients).length);//sends # of players  
      for (let clientId in GameState.lobbyClients) {
        if (!GameState.lobbyClients.hasOwnProperty(clientId)) {
          continue;
        }
        let existingClient = GameState.lobbyClients[clientId];
        existingClient.socket.emit(LobbyNetIds.START_GAME, {
          clientId: existingClient.socket.id,
        });
      }
    }, props.countdownTime * 1000);
    
  }
}

var prev = config.numPlayersRequired
function updateNumClients () {
  if(config.numPlayersRequired === prev) {
    return;
  }
  prev = config.numPlayersRequired;
  for(var client of Object.values(GameState.lobbyClients)) {
    client.socket.emit(LobbyNetIds.CONNECT_ACK, {
      clientId: client.socket.id,
      numPlayers: config.numPlayersRequired
    });
  }
  checkGameStart();
}

module.exports = {
  initializeSocketIO,
  updateNumClients,
};
