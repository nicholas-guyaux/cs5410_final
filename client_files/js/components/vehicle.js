/**
 * https://en.wikipedia.org/wiki/Linear_interpolation
 * Precise method, which guarantees y = rangeEnd when x = 1.
 * @param {Number} rangeStart 
 * output range start
 * @param {Number} rangeEnd 
 * output range end
 * @param {Float} x 
 * a number between 0 and 1 on the input range.
 */
function clampLerp(rangeStart, rangeEnd, x) {
  return Math.max(Math.min(rangeStart, rangeEnd), Math.min(Math.max(rangeStart, rangeEnd), ((1 - x) * rangeStart + x * rangeEnd)));
}

function Vehicle () {
  var vehicle ={
    x: null,
    y: null,
    // division by 4 because there are 4 adjacent images in tileset.
    width: MyGame.assets['plane'].width / 4 / Coords.world.width,
    height: MyGame.assets['plane'].height / Coords.world.height,
    radius: null,
    goal: null,
    update (elapsedTime) {
      if(vehicle.goal) {
        const goal = vehicle.goal;
        // Protect against divide by 0 before the first update from the server has been given
        if (goal.updateWindow <= 0) return;

        let updateFraction = elapsedTime / goal.updateWindow;
        if (updateFraction > 0) {
          vehicle.x = clampLerp(vehicle.x, goal.x, updateFraction);
          vehicle.y = clampLerp(vehicle.y, goal.y, updateFraction);
        }
        // goal.updateWindow -= elapsedTime;
      }
    },
    getRect () {
      return Geometry.Rectangle({
        width: vehicle.width,
        height: vehicle.height,
        x: vehicle.x - vehicle.width / 2,
        y: vehicle.y - vehicle.height / 2,
      })
    },
    getCircle() {
      return Geometry.Circle(vehicle);
    }
  };
  return vehicle;
}
