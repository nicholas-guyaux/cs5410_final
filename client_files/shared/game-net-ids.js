// ------------------------------------------------------------------
// This code was adapted from code originally written by Dr. Dean Mathias
//
// Additional reference for this idea: https://caolan.org/posts/writing_for_node_and_the_browser.html
//
// ------------------------------------------------------------------
(function(exports) {
  'use strict';

  // TODO: add/change this so that we have all our needed Game Network Ids
  Object.defineProperties(exports, {
    'INPUT': {
      value: 'input',
      writable: false
    },
    'INPUT_DROP': {
      value: 'drop-self',
      writable: false
    },
    'INPUT_MOVE_FORWARD': {
      value: 'move-forward',
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
    'BULLET_HIT': {
      value: 'bullet-hit',
      writable: false
    },
    'BULLET_NEW': {
      value: 'bullet-new',
      writable: false
    },
    "INPUT_TURBO": {
      value: 'turbo',
      writable: false
    },
    'PLAYER_JOIN_GAME': {
      value: 'player-join-game',
      writable: false
    },
    'PLAYER_JOIN_GAME_ACK': {
      value: 'player-join-game-ack',
      writable: false
    },
    'PLAYER_LEAVE': {
      value:'player-leave', 
      writeable: false
    },
    'GAME_MSG': {
      value: 'game-msg',
      writable: false
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
    },
    'UPDATE_VEHICLE_DROP': {
      value: 'update-vehicle-drop',
      writable: false
    },
    'UPDATE_VEHICLE': {
      value: 'update-vehicle',
      writable: false,
    },
    "GAME_KICK": {
      value: 'game-kick',
      writable: false,
    },
    'MESSAGE_GAME_OVER': {
      value: 'update-vehicle-drop',
      writable: false
    },
  });

})(typeof exports === 'undefined' ? this['GameNetIds'] = {} : exports);
