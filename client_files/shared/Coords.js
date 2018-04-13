(function (myExports) {
  var Geometry
  if(typeof exports !== 'undefined') {
    Geometry = require('./Geometry');
  } else {
    Geometry = window.Geometry
  }

  const viewport = ViewPort({
    width: 0.15,
    height: 0.15,
    x: 0,
    y: 0,
  });

  const world = World({
    width: 3200,
    height: 3200,
  });

  function World (spec) {
    var worldRect = Geometry.Rectangle({
      x: 0,
      y: 0,
      width: spec.width,
      height: spec.height,
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

  function ViewPort (spec) {
    var viewport = Geometry.Rectangle({
      x: spec.x,
      y: spec.y,
      width: spec.width,
      height: spec.height,
    });
    
    // keep things in world coordinates by default only scale to viewport units when rendering.
    // viewport.scaleToCoord = function (rectInWorld) {
    //   return Geometry.Rectangle({
    //     x: rectInWorld.x - viewport.x,
    //     y: rectInWorld.y - viewport.y,
    //     width: rectInWorld.width * viewport.world.width / world.width,
    //     height: rectInWorld.height * viewport.world.height / world.height,
    //   });
    // };

    // Should already be in terms of viewport units
    viewport.scaleToRatio = function (viewportUnitsRect) {
      return Geometry.Rectangle({
        x: viewportUnitsRect.x / viewport.world.width,
        y: viewportUnitsRect.y / viewport.world.height,
        width: viewportUnitsRect.width / viewport.world.width,
        height: viewportUnitsRect.height / viewport.world.height,
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

    viewport.set = function (center) {
      viewport.x = center.x - viewport.width / 2;
      viewport.y = center.y - viewport.height / 2;
      if(typeof Graphics !== "undefined") {
        Graphics.translate(viewport.world)
      }
    }

    var worldTwo = {};
    Object.defineProperty(worldTwo, 'x', {
      get () {
        return Math.floor(viewport.x * world.width);
      }
    });

    Object.defineProperty(worldTwo, 'y', {
      get () {
        return Math.floor(viewport.y * world.height);
      }
    });

    Object.defineProperty(worldTwo, 'width', {
      get () {
        return Math.floor(viewport.width * world.width);
      }
    });

    Object.defineProperty(worldTwo, 'height', {
      get () {
        return Math.floor(viewport.height * world.height);
      }
    });

    viewport.world = worldTwo;

    viewport.canvas = {
      height: 0,
      width: 0,
    };

    return viewport;
  }

  myExports.world = world;

  myExports.viewport = viewport;
  
})(typeof exports === 'undefined' ? this['Coords'] = {} : exports);
