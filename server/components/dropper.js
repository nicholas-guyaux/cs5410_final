var gameMap = require('./gameMap');
var Player = require('./player');
var Random = require('./random');

module.exports = function dropper (vehicle) {
  var that = {
    onDropSelection,
    update,
    canPlace,
    dropUpdate: false,
    get drops () {
      return drops;
    }
  }
  var drops = [];
  function canPlace (player) {
    var pCenterX = player.position.x + player.size.width / 2;
    var pCenterY = player.position.y + player.size.height / 2;
    if(vehicle.circle && vehicle.circle.containsPoint(player.position) && gameMap.collision(pCenterX, pCenterY, Math.max(player.size.width, player.size.height))) {
      return true;
    } else {
      return false;
    }
  }

  function onDropSelection (clientState, clickPosition, totalTime) {
    if(clientState.player.isDropped) {
      return;
    }
    clientState.player.position.x = clickPosition.x - clientState.player.size.width / 2;
    clientState.player.position.y = clickPosition.y - clientState.player.size.height / 2;
    if(canPlace(clientState.player)) {
      drops.push(clickPosition);
      that.dropUpdate = true;
      clientState.player.isDropped = true;
      clientState.player.reportUpdate = true;
      return clientState.player;
    } else {
      clientState.player.position.x = null;
      clientState.player.position.y = null;
      return false;
    }
  }

  function update (totalTime, clientStates) {
    if(!vehicle.isFlying) {
      for(var clientState of clientStates) {
        if(clientState.player.isDropped) {
          // player is already dropped
          continue;
        }
        // get random point in circle
        do {
          var randomPointInDropCircle = Random.randomPointInCircle(vehicle.circle);
        } while(!onDropSelection(clientState, randomPointInDropCircle, totalTime));
      }
    }
  }

  return that;
}
