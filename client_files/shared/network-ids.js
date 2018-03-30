// ------------------------------------------------------------------
// This code was adapted from code originally written by Dr. Dean Mathias
//
// Additional reference for this idea: https://caolan.org/posts/writing_for_node_and_the_browser.html
//
// ------------------------------------------------------------------
(function(exports) {
  'use strict';

  // TODO: add/change this so that we have all our needed Network Ids
  Object.defineProperties(exports, {
    'INPUT': {
      value: 'input',
      writable: false
    },
    'INPUT_MOVE': {
      value: 'move',
      writable: false
    },
    'INPUT_ROTATE_LEFT': {
      value: 'rotate-left',
      writable: false
    },
    'INPUT_ROTATE_RIGHT': {
      value: 'rotate-right',
      writable: false
    },
    'INPUT_FIRE': {
      value: 'fire',
      writable: false
    },
    'PLAYER_JOIN': {
      value: 'player-join',
      writable: false
    },
    'LOBBY_MSG': {
      value: 'lobby-msg',
      writable: false
    },
    'GAME_COUNTDOWN': {
      value: 'game-starting',
      writeable: false
    },
    'GAME_SETUP': {
      value: 'game-init',
      writable: false
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
    'UPDATE_SELF': {
      value: 'update-self',
      writable: false
    },
    'UPDATE_OTHER': {
      value: 'update-other',
      writable: false
    }
  });

})(typeof exports === 'undefined' ? this['NetworkIds'] = {} : exports);
