// ------------------------------------------------------------------
// This code was adapted from code originally written by Dr. Dean Mathias
//
// Additional reference for this idea: https://caolan.org/posts/writing_for_node_and_the_browser.html
//
// ------------------------------------------------------------------
(function(exports) {
  'use strict';

  // TODO: add/change this so that we have all our needed Lobby Network Ids
  Object.defineProperties(exports, {
    'PLAYER_JOIN_LOBBY': {
      value: 'player-join-lobby',
      writable: false
    },
    'PLAYER_JOIN_LOBBY_ACK': {
      value: 'player-join-lobby-ack',
      writable: false
    },
    'PLAYER_LEAVE': {
      value:'player-leave', 
      writeable: false
    },
    'LOBBY_MSG': {
      value: 'lobby-msg',
      writable: false
    },
    'GAME_COUNTDOWN': {
      value: 'game-starting',
      writeable: false
    },
    'START_GAME': {
      value: 'start_game',
      writeable: false
    },
    'CONNECT_ACK': {
      value: 'connect-ack',
      writable: false
    },
    'CONNECT_OTHER': {
      value: 'connect-other',
      writable: false
    },
    'DISCONNECT_OTHER': {
      value: 'disconnect-other',
      writable: false
    },
    "LOBBY_KICK": {
      value: 'lobby-kick',
      writable: false,
    },
  });

})(typeof exports === 'undefined' ? this['LobbyNetIds'] = {} : exports);
