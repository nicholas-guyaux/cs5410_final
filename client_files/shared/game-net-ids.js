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
      value: 'a',
      writable: false
    },
    'INPUT_DROP': {
      value: 'b',
      writable: false
    },
    'INPUT_MOVE_FORWARD': {
      value: 'c',
      writable: false
    },
    'INPUT_MOVE_BACKWARD': {
      value: 'd',
      writable: false
    },
    'INPUT_ROTATE_LEFT': {
      value: 'e',
      writable: false
    },
    'INPUT_ROTATE_RIGHT': {
      value: 'f',
      writable: false
    },
    'INPUT_FIRE': {
      value: 'g',
      writable: false
    },
    'BULLET_HIT': {
      value: 'h',
      writable: false
    },
    'BULLET_NEW': {
      value: 'i',
      writable: false
    },
    "INPUT_TURBO": {
      value: 'j',
      writable: false
    },
    'PLAYER_JOIN_GAME': {
      value: 'k',
      writable: false
    },
    'PLAYER_JOIN_GAME_ACK': {
      value: 'l',
      writable: false
    },
    'PLAYER_LEAVE': {
      value:'m', 
      writeable: false
    },
    'GAME_MSG': {
      value: 'n',
      writable: false
    },
    'GAME_SETUP': {
      value: 'o',
      writable: false
    },
    'CONNECT_ACK': {
      value: 'p',
      writable: false
    },
    'CONNECT_OTHER': {
      value: 'q',
      writable: false
    },
    'DISCONNECT_OTHER': {
      value: 'r',
      writable: false
    },
    'UPDATE_SELF': {
      value: 's',
      writable: false
    },
    'UPDATE_OTHER': {
      value: 't',
      writable: false
    },
    'UPDATE_VEHICLE_DROP': {
      value: 'u',
      writable: false
    },
    'UPDATE_VEHICLE': {
      value: 'v',
      writable: false,
    },
    "GAME_KICK": {
      value: 'w',
      writable: false,
    },
    'MESSAGE_GAME_OVER': {
      value: 'x',
      writable: false
    },
    'SET_NAME': {
      value: 'y',
      writable: false
    },
    'GAME_UPDATE_MESSAGE': {
      value: 'z',
      writable: false
    },
  });

})(typeof exports === 'undefined' ? this['GameNetIds'] = {} : exports);
