// TODO: Add all gamestate data structures and methods here

// Example client object in activeClients:
// {
//   socket: socket,
//   state: {
//     player: player
//   }
// };
let lobbyClients = {};
let gameClients = {};

// TODO: Wipes and preps the gamestate for a new game
function newGame() {

}

module.exports = {
  newGame: newGame,
  lobbyClients: lobbyClients,
  gameClients: gameClients
};
