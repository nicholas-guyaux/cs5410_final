function GameState (spec) {
  var that = {};
  that.plane = ImageAsset('../../assets/images/plane.png');

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
  function lerp(rangeStart, rangeEnd, x) {
    return (1 - x) * rangeStart + x * rangeEnd;
  }

  function lerpBetweenPoints (a, b, time, maxTime=2000) {
    var tRatio = time / maxTime;
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
    return Geometry.Point(getRandomIntInclusive(rect.left, rect.right), getRandomIntInclusive(rect.top, rect.bottom));
  }


  that.worldRect = World();

  that.dropzoneRect = getCenteredBox({
    rect: that.worldRect,
    scale: 0.1,
  });
  
  function World () {
    var worldRect = Geometry.Rectangle({
      x: 0,
      y: 0,
      width: spec.worldWidth,
      height: spec.worldHeight,
    });

    // get rectangle in world coordinates from world ratio
    worldRect.scaleToCoord = function scaleRect (rectWorldRatio) {
      // rect should have coordinates and width in percentage of world
      return Geometry.Rectangle({
        x: rectWorldRatio.x * worldRect.width,
        y: rectWorldRatio.y * worldRect.height,
        width: rectWorldRatio.width * worldRect.width,
        height: rectWorldRatio.height * worldRect.height,
      });
    }

    return worldRect;
  }

  function ViewPort () {
    var viewport = Geometry.Rectangle({
      x: 0,
      y: 0,
      width: spec.worldWidth,
      height: spec.worldHeight,
    });
    
    // keep things in world coordinates by default only scale to viewport units when rendering.
    viewport.scaleToCoord = function (rectInWorld) {
      return Geometry.Rectangle({
        x: rectInWorld.x - that.viewport.x,
        y: rectInWorld.y - that.viewport.y,
        width: rectInWorld.width * that.viewport.width / that.worldRect.width,
        height: rectInWorld.height * that.viewport.height / that.worldRect.height,
      });
    };

    // Should already be in terms of viewport units
    viewport.scaleToRatio = function (viewportUnitsRect) {
      return Geometry.Rectangle({
        x: viewportUnitsRect.x / that.viewport.width,
        y: viewportUnitsRect.y / that.viewport.height,
        width: viewportUnitsRect.width / that.viewport.width,
        height: viewportUnitsRect.height / that.viewport.height,
      });
    };

    // Should already be in terms of viewport units
    viewport.fromWorldToRatio = function fromWorldToRatio (worldCoordRect) {
      return viewport.scaleToRatio(viewport.scaleToCoord(worldCoordRect));
    };

    viewport.move = function (vector) {
      viewport.x = Math.min(worldRect.width-viewport.width, Math.max(0, viewport.x + vector.deltaX));
      viewport.y = Math.min(worldRect.height-viewport.height, Math.max(0, viewport.y + vector.deltaY));
    }

    return viewport;
  }

  that.update = function update (elapsed, totalTime) {
    const maxTime = 30 * 1000;
    const widthHeigthRatio = 356/4/55;
    gameState.vehicle = getRectCenteredAtPoint(lerpBetweenPoints(that.vehiclePath.a, that.vehiclePath.b, totalTime, maxTime), 200*widthHeigthRatio, 200);
  }
  

  that.viewport = ViewPort();

  function Ship (spec) {
    var _speed = 0.01
    var that = {
      isCurrentPlayer: spec.isCurrentPlayer,
      get speed () {
        return _speed;
      },
      rect: spec.rect,
      dir: spec.dir,
    };

    return that;
  }

  that.dropShip = function () {
    
  };

  function getVehiclePath (gameState) {
    var p1 = getRandomPointInRect(gameState.dropzoneRect);
    var p2 = null;
    do {
      p2 = getRandomPointInRect(gameState.dropzoneRect);
    } while(p2.x === p1.x && p2.y === p1.y);
    var lineThroughRect = Geometry.Line(p1, p2);
    return lineThroughRect.lineWithinRect(gameState.worldRect);
  }

  that.vehiclePath = getVehiclePath(that);

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

  return that;
}
