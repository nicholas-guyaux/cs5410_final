//------------------------------------------------------------------
// Written by Dr. Dean Mathias
//
// Queue data structure used for holding network messages.
//
//------------------------------------------------------------------
(function(exports) {
  'use strict';

  exports.create = function() {
    let that = [];

    that.enqueue = function(value) {
      that.push(value);
    }
  
    that.dequeue = function() {
      return that.shift();
    }
  
    Object.defineProperty(that, 'front', {
      get: () => that[0]
    });
  
    Object.defineProperty(that, 'empty', {
      get: () => { return that.length === 0; }
    });

    return that;
  };

})(typeof exports === 'undefined' ? this['Queue'] = {} : exports);
