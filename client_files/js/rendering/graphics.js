const Graphics = (function() {
  'use strict';

  let canvas = document.getElementById('game-canvas');
  let context = canvas.getContext('2d');

  let world = { size: 0, top: 0, left: 0 }
  let viewport = Viewport({ left: 0, top: 0, buffer: 0.15 });
  let resizeHandlers = [];

  function resizeCanvas(){
    var smallestSize = 0;
    var handler = null;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    //
    // Have to figure out where the upper left corner of the unit world is
    // based on whether the width or height is the largest dimension.
    if (canvas.width < canvas.height) {
      smallestSize = canvas.width;
      world.size = smallestSize * 0.9;
      world.left = Math.floor(canvas.width * 0.05);
      world.top = (canvas.height - world.size) / 2;
    } else {
      smallestSize = canvas.height;
      world.size = smallestSize * 0.9;
      world.top = Math.floor(canvas.height * 0.05);
      world.left = (canvas.width - world.size) / 2;
    }
    GameMap.viewRect.w = world.size;
    GameMap.viewRect.h = world.size;
    //
    // Notify interested parties of the canvas resize event.
    for (handler in resizeHandlers) {
      resizeHandlers[handler](true);
    }
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
  
  function clear() { context.clear(); }

  function saveContext() { context.save(); }

  function restoreContext() { context.restore(); }

  function rotateCanvas(center, rotation) {
      context.translate(center.x * canvas.width, center.y * canvas.width);
      context.rotate(rotation);
      context.translate(-center.x * canvas.width, -center.y * canvas.width);
  }
  
  function drawImage(image, center, size, clipping) {
    console.log(center, size, canvas.width, canvas.height);
      let localCenter = {
        x: center.x * canvas.width,
        y: center.y * canvas.height
      };
      let localSize ={
        width: size.width * canvas.width,
        height: size.height * canvas.height
      };
      if(clipping) {
        context.drawImage(image,
          clipping.x,
          clipping.y,
          clipping.width,
          clipping.height,
          localCenter.x - localSize.width / 2,
          localCenter.y - localSize.height / 2,
          localSize.width,
          localSize.height);
      } else {
        context.drawImage(image,
          localCenter.x - localSize.width / 2,
          localCenter.y - localSize.height / 2,
          localSize.width,
          localSize.height);
      }
  }
  
  function drawRectangle(style, left, top, width, height, useViewport){
    var adjustLeft = (useViewport === true) ? viewport.left : 0;
    var adjustTop = (useViewport === true) ? viewport.top : 0;

    context.strokeStyle = style;
    context.strokeRect(
      0.5 + world.left + ((left - adjustLeft) * world.size),
      0.5 + world.top + ((top - adjustTop) * world.size),
      width * world.size,
      height* world.size
    );
  }

  function drawTiledImage(image, leftEdge, topEdge, tileSizeX, tileSizeY, worldX, worldY){
    context.drawImage(image, leftEdge, topEdge, tileSizeX, tileSizeY, world.left + worldX, world.top + worldY, tileSizeX, tileSizeY);
  }

  function drawPattern(image, coords, size){
    console.log('hello');
    var pattern = context.createPattern(image, 'repeat');
    context.fillStyle = pattern;
    context.fillRect(coords.x, coords.y, size.width * canvas.width, size.height * canvas.height);
  }

  return {
    initialize : initialize,
    clear : clear,
    saveContext : saveContext,
    restoreContext : restoreContext,
    rotateCanvas : rotateCanvas,
    drawImage : drawImage,
    drawRectangle : drawRectangle,
    drawTiledImage : drawTiledImage,
    drawPattern : drawPattern
  }
}());
