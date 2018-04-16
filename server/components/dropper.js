var gameMap = require('./gameMap');
var Player = require('./player');
var Random = require('./random');

module.exports = function dropper (vehicle, droppableAfter) {
  function canPlace (player) {
    var pCenterX = player.x + player.width / 2;
    var pCenterY = player.y + player.height / 2;
    if(vehicle.circle.containsPoint(player.position) && gameMap.collision(pCenterX, pCenterY, Math.max(player.width, player.height))) {
      return true;
    } else {
      return false;
    }
  }

  function onDropSelection (clientState, clickPosition, totalTime) {
    if(droppableAfter < totalTime) {
      return;
    }
    const player = Player();
    player.position.x = clickPosition.x - player.size.width / 2;
    player.position.y = clickPosition.y - player.size.height / 2;
    if(canPlace(player)) {
      Object.assign(clientState.player, player);
      clientState.player.isDropped = true;
      clientState.player.reportUpdate = true;
      return player;
    } else {
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
          var randomRadius = Random.nextRange(0, vehicle.circle.radius);
          var randomPointInDropCircle = Random.nextCircleVector(randomRadius);
        } while(onDropSelection(clientState, randomPointInDropCircle, totalTime));
      }
    }
  }

  return {
    onDropSelection,
    update,
    canPlace,
  };
}
