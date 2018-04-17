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
          Math.floor((localCenter.x - localSize.width / 2)*scalingFactor()),
          Math.floor((localCenter.y - localSize.height / 2)*scalingFactor()),
          Math.floor((localSize.width)*scalingFactor()),
          Math.floor((localSize.height)*scalingFactor())); 
    } else {
      context.drawImage(image,
          Math.floor((localCenter.x - localSize.width / 2)*scalingFactor()),
          Math.floor((localCenter.y - localSize.height / 2)*scalingFactor()),
          Math.floor(localSize.width*scalingFactor()),
          Math.floor(localSize.height*scalingFactor()));
    }
  }
  
  function drawRectangle(style, left, top, width, height){
    context.strokeStyle = style;
    context.strokeRect(
      0.5 + (left * world.width * scalingFactor()),
      0.5 + (top * world.height * scalingFactor()),
      width * world.width,
      height * world.height
    );
  }
  function drawFilledRectangle(style, left, top, width, height){
    context.fillStyle = style;
    context.fillRect(
      0.5 + (left * world.width * scalingFactor()),
      0.5 + (top * world.height * scalingFactor()),
      width * world.width,
      height * world.height
    );
  }

  function drawCircle(fillStyle, center, radius) {
    context.beginPath();
    context.arc(center.x * Coords.world.width,
        center.y * Coords.world.width, 2 * radius * Coords.world.width,
        2 * Math.PI, false);
    context.closePath();
    context.fillStyle = fillStyle;
    context.fill();
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

  function finalizeRender() {
    onScreenContext.clear();
    onScreenContext.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  }

  function setOpacity (alphaOpacity) {
    context.globalAlpha = alphaOpacity;
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
    drawFilledRectangle : drawFilledRectangle,
    drawTiledImage : drawTiledImage,
    drawPattern : drawPattern,
    resizeCanvas: resizeCanvas,
    finalizeRender: finalizeRender,
    drawFromTiledCanvas: drawFromTiledCanvas,
    setOpacity: setOpacity,
    get viewport () {
      return viewport;
    },
    get world () {
      return world;
    },
    translateToViewport: translateToViewport,
  }
}());
