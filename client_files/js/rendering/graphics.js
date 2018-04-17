const Graphics = (function() {
  'use strict';

  let onScreenCanvas = document.getElementById('game-canvas');
  let onScreenContext = onScreenCanvas.getContext('2d');

  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');

  var viewport = Coords.viewport;
  var world = Coords.world;

  var currentTranslation = {
    x: 0,
    y: 0,
  };

  let props = {
    clippingEnabled: false,
    fogClippingEnabled: false
  };

  const imageCanvasMap = new Map();

  function createImageCanvas(name, image) {
    if(imageCanvasMap.has(name)) {
      return;
    }
    const imageCanvas = document.createElement('canvas');
    const imageContext = imageCanvas.getContext('2d');
    imageCanvas.width = image.width;
    imageCanvas.height = image.height;
    imageContext.drawImage(image, 0, 0, image.width, image.height);
    imageCanvasMap.set(name, imageCanvas);
  }

  function resizeCanvas(){
    var smallestSize = 0;
    var handler = null;

    var wRatio = Coords.world.width * Coords.viewport.width;
    var hRatio = Coords.world.height * Coords.viewport.height;

    canvas.width = wRatio;
    canvas.height = hRatio;
    onScreenCanvas.width = wRatio;
    onScreenCanvas.height = hRatio;

    viewport.canvas.width = canvas.width;
    viewport.canvas.height = canvas.height;

    //
    // Have to figure out where the upper left corner of the unit world is
    // based on whether the width or height is the largest dimension.
    // if (canvas.width < canvas.height) {
    //   smallestSize = canvas.width;
    //   world.size = smallestSize * 0.9;
    //   world.x = Math.floor(canvas.width * 0.05);
    //   world.y = (canvas.height - world.size) / 2;
    // } else {
    //   smallestSize = canvas.height;
    //   world.size = smallestSize * 0.9;
    //   world.y = Math.floor(canvas.height * 0.05);
    //   world.x = (canvas.width - world.size) / 2;
    // }
    // GameMap.viewRect.w = world.size;
    // GameMap.viewRect.h = world.size;
    // //
    // // Notify interested parties of the canvas resize event.
    // for (handler in resizeHandlers) {
    //   resizeHandlers[handler](true);
    // }
  }

  function notifyResize(handler) { resizeHandlers.push(handler); }

  function initialize() {
		window.addEventListener('resize', function() {
			resizeCanvas();
		}, false);
		window.addEventListener('orientationchange', function() {
			resizeCanvas();
		}, false);
		window.addEventListener('deviceorientation', function() {
			resizeCanvas();
		}, false);

		//
		// Force the canvas to resize to the window first time in, otherwise
		// the canvas is a default we don't want.
		resizeCanvas();
	}

  CanvasRenderingContext2D.prototype.clear = function() {
      this.save();
      this.setTransform(1,0,0,1,0,0);
      this.clearRect(0,0, canvas.width, canvas.height);
      this.restore();
  }

  function resetTransform () {
    if(context.resetTransform) {
      context.resetTransform();
    } else {
      context.setTransform(1,0,0,1,0,0);
    }
  }
  
  function clear() { context.clear(); }

  function saveContext() { context.save(); }

  function restoreContext() { context.restore(); }

  function translateToViewport () {
    resetTransform();
    context.translate(-viewport.world.x, -viewport.world.y);
  }

  function rotateCanvas(center, rotation) {
    context.translate(center.x * world.width, center.y * world.height);
    context.rotate(rotation);
    context.translate(-center.x * world.width, -center.y * world.height);
  }
  
  function drawImage(image, center, size, clipping) {
    let localCenter = {
      x: center.x * world.width,
      y: center.y * world.height,
    };
    let localSize ={
      width: size.width * world.width,
      height: size.height * world.height
    };
    if(clipping) {
      context.drawImage(image,
          clipping.x,
          clipping.y,
          clipping.width,
          clipping.height,
          (localCenter.x - localSize.width / 2)*scalingFactor(),
          (localCenter.y - localSize.height / 2)*scalingFactor(),
          (localSize.width)*scalingFactor(),
          (localSize.height)*scalingFactor()); 
    } else {
      context.drawImage(image,
          (localCenter.x - localSize.width / 2)*scalingFactor(),
          (localCenter.y - localSize.height / 2)*scalingFactor(),
          localSize.width*scalingFactor(),
          localSize.height*scalingFactor());
    }
  }
  
  function drawRectangle(style, left, top, width, height, useViewport){
    var adjustLeft = useViewport ? viewport.x : 0;
    var adjustTop = useViewport ? viewport.y : 0;

    context.strokeStyle = style;
    context.strokeRect(
      0.5 + world.x + ((left - adjustLeft) * world.size),
      0.5 + world.y + ((top - adjustTop) * world.size),
      width * world.size,
      height* world.size
    );
  }

  function drawCircle(fillStyle, center, radius, alpha=1, ctx=context) {
    ctx.beginPath();
    ctx.arc(center.x * Coords.world.width,
        center.y * Coords.world.width, 2 * radius * Coords.world.width,
        2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function scalingFactor () {
    return canvas.width / (Coords.world.width * Coords.viewport.width);
  }

  function drawTiledImage(image, leftEdge, topEdge, tileSizeX, tileSizeY, worldX, worldY){
    context.drawImage(image, leftEdge, topEdge, tileSizeX, tileSizeY, (world.x + worldX)*scalingFactor(), (world.top + worldY)*scalingFactor(), tileSizeX*scalingFactor(), tileSizeY*scalingFactor());
  }

  function drawFromTiledCanvas (name, image, leftEdge, topEdge, tileSizeX, tileSizeY, worldX, worldY){
    createImageCanvas(name, image);
    context.drawImage(imageCanvasMap.get(name), leftEdge, topEdge, tileSizeX, tileSizeY, (world.x + worldX)*scalingFactor(), (world.top + worldY)*scalingFactor(), tileSizeX*scalingFactor(), tileSizeY*scalingFactor());
  }

  function drawPattern(image, coords, size){
    var pattern = context.createPattern(image, 'repeat');
    context.fillStyle = pattern;
    context.fillRect(coords.x, coords.y, size.width * canvas.width, size.height * canvas.height);
  }

  function enableClipping(polygon) {
    // Convert polygon to true coordinates       
    for (let point of polygon) {
      point.x *= Coords.world.width;
      point.y *= Coords.world.height;
    }

    if (!props.clippingEnabled && (polygon.length >= 2)) {
      context.save();
      props.clippingEnabled = true;

      context.beginPath();
      context.moveTo(polygon[0].x, polygon[0].y);
      for (let pointIdx = 1; pointIdx < polygon.length; pointIdx++) {
        context.lineTo(polygon[pointIdx].x, polygon[pointIdx].y);
      }
      context.closePath();
      context.clip();
    }
  }

  function disableClipping() {
    if (props.clippingEnabled) {
      context.restore();
      props.clippingEnabled = false;
      props.fogClippingEnabled = false;
    }
  }

  function disableFogClipping() {
    if (props.fogClippingEnabled) {
      context.restore();
      props.fogClippingEnabled = false;
    }
  }

  function createFogEffect(polygon, FOVDistance) {
    if (!props.fogClippingEnabled && (polygon.length < 2)) {
      return;
    }
    const CUSHION = FOVDistance * Coords.world.width * 10; // 10 is just a big number
    context.save();
    props.fogClippingEnabled = true;

    let xMinIndex = null;
    let xMin = Coords.world.width;
    // Convert polygon to true coordinates
    for (let i = 0; i < polygon.length; i++) {
      polygon[i].x *= Coords.world.width;
      polygon[i].y *= Coords.world.height;
      if (polygon[i].x < xMin) {
        xMin = polygon[i].x;
        xMinIndex = i;
      }
    }
    if (xMinIndex !== 0) {
      let temp = polygon[0];
      polygon[0] = polygon[xMinIndex];
      polygon[xMinIndex] = temp;
    }

    context.beginPath();
    context.moveTo(Coords.viewport.world.x - CUSHION,
        Coords.viewport.world.y - CUSHION);
    for (let pointIdx = 0; pointIdx < polygon.length; pointIdx++) {
      context.lineTo(polygon[pointIdx].x, polygon[pointIdx].y);
    }
    context.lineTo(polygon[0].x, polygon[0].y);
    context.lineTo(Coords.viewport.world.x - CUSHION,
        Coords.viewport.world.y - CUSHION);
    context.lineTo(Coords.viewport.world.x + Coords.viewport.world.width + CUSHION,
      Coords.viewport.world.y - CUSHION);
    context.lineTo(Coords.viewport.world.x + Coords.viewport.world.width + CUSHION,
        Coords.viewport.world.y + Coords.viewport.world.height + CUSHION);
    context.lineTo(Coords.viewport.world.x - CUSHION,
        Coords.viewport.world.y + Coords.viewport.world.height + CUSHION);
    context.closePath();
    context.clip();

    context.globalAlpha = 0.7;
    context.fillStyle = '#000000';
    context.fillRect(Coords.viewport.world.x, Coords.viewport.world.y, Coords.viewport.world.width, Coords.viewport.world.height);
    context.globalAlpha = 1;
  }

  function finalizeRender() {
    onScreenContext.clear();
    onScreenContext.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  }

  return {
    initialize : initialize,
    clear : clear,
    saveContext : saveContext,
    restoreContext : restoreContext,
    rotateCanvas : rotateCanvas,
    drawImage : drawImage,
    drawRectangle : drawRectangle,
    drawCircle: drawCircle,
    drawTiledImage : drawTiledImage,
    drawPattern : drawPattern,
    resizeCanvas: resizeCanvas,
    finalizeRender: finalizeRender,
    enableClipping: enableClipping,
    disableClipping: disableClipping,
    disableFogClipping: disableFogClipping,
    createFogEffect: createFogEffect,
    drawFromTiledCanvas: drawFromTiledCanvas,
    get viewport () {
      return viewport;
    },
    get world () {
      return world;
    },
    translateToViewport: translateToViewport,
  };
}());
