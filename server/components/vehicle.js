const Coords = require('../../client_files/shared/Coords');
const Geometry = require('../../client_files/shared/Geometry');
const lerp = require('../utils/lerp');
const Random = require('./random');
const dropzoneRect = getCenteredBox({
  rect: Coords.world.ratio,
  scale: 0.1,
});

/**
 * Game Start vehicle to cross the map
 * @param {Number in ms} totalTime 
 * The total time for the vehicle to cross the map.
 */
function Vehicle (totalTime) {
  var that = {};

  const path = getVehiclePath();

  var rect = undefined;
  var circle = undefined;
  var isFlying = true;
  var direction = path.angle;

  function update (elapsed, time) {
    const tRatio = time / totalTime;
    const widthHeigthRatio = Coords.world.width/Coords.world.height;
    if (tRatio < 1) {
      var center = lerpBetweenPoints(path.a, path.b, tRatio);
      rect = getRectCenteredAtPoint(center, 200*widthHeigthRatio, 200);
      circle = Geometry.Circle({
        x: center.x,
        y: center.y,
        radius: 0.15 * Math.min(Coords.world.ratio.width, Coords.world.ratio.height),
      });
    } else {
      isFlying = false;
    }
  }

  return {
    update,
    get rect () {
      return rect;
    },
    get circle () {
      return circle;
    },
    get isFlying () {
      return isFlying;
    },
    path: path,
    get direction () {
      return direction;
    }
  };
}

function lerpBetweenPoints (a, b, tRatio) {
  return Geometry.Point(lerp(a.x, b.x, tRatio), lerp(a.y, b.y, tRatio));
}

function getRectCenteredAtPoint (point, width, height) {
  return Geometry.Rectangle({
    x: point.x - width / 2,
    y: point.y - height / 2,
    width: width,
    height: height,
  })
}

function getRandomPointInRect (rect) {
  return Geometry.Point(Random.nextDoubleRange(rect.left, rect.right), Random.nextDoubleRange(rect.top, rect.bottom));
}

function getVehiclePath () {
  var p1 = getRandomPointInRect(dropzoneRect);
  var p2 = null;
  do {
    p2 = getRandomPointInRect(dropzoneRect);
  } while(p2.x === p1.x && p2.y === p1.y);
  var lineThroughRect = Geometry.Line(p1, p2);
  return lineThroughRect.lineWithinRect(Coords.world.ratio);
}

function getCenteredBox (spec) {
  var { rect, scale } = spec;
  var width = rect.width * scale;
  var height = rect.height * scale;
  return Geometry.Rectangle({
    x: rect.center.x - width / 2,
    y: rect.center.y - height / 2,
    width: width,
    height: height,
  });
}

module.exports = Vehicle;
