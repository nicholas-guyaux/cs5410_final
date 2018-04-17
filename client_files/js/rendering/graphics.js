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
  
  // var isFullMap = false;
  function setFullMapCanvas (fullMapIsScreenVal) {
    // const fullScreenVal = !!fullMapIsScreenVal;
    // if(isFullMap !== fullScreenVal) {
    //   isFullMap = fullScreenVal; 
    //   if(isFullMap) {
    //     canvas.width = Coords.world.width;
    //     canvas.height = Coords.world.height;
    //     onScreenCanvas.width = Coords.world.width;
    //     onScreenCanvas.height = Coords.world.height;

    //     // viewport.canvas.width = canvas.width;
    //     // viewport.canvas.height = canvas.height;
    //   } else {
    //     resizeCanvas();
    //   }
    // }
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
    // console.log('image: ', image);
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
      Math.floor(0.5 + (left * world.width * scalingFactor())),
      Math.floor(0.5 + (top * world.height * scalingFactor())),
      Math.floor(width * world.width),
      Math.floor(height * world.height)
    );
  }
  function drawFilledRectangle(style, left, top, width, height){
    context.fillStyle = style;
    context.fillRect(
      Math.floor(0.5 + (left * world.width * scalingFactor())),
      Math.floor(0.5 + (top * world.height * scalingFactor())),
      Math.floor(width * world.width),
      Math.floor(height * world.height)
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

  function drawStrokedCircle(strokeStyle, center, radius) {
    context.beginPath();
    context.arc(center.x * Coords.world.width,
        center.y * Coords.world.width, 2 * radius * Coords.world.width,
        2 * Math.PI, false);
    context.closePath();
    context.strokeStyle = strokeStyle;
    context.stroke();
  }

  function scalingFactor () {
    return 1;//canvas.width / (Coords.world.width * Coords.viewport.width);
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
    const CUSHION = FOVDistance * Coords.world.width * 5; // 5 is just a big number
    context.save();
    props.fogClippingEnabled = true;

    let swapOuterDirection = false;
    let xMinIndex = null;
    let xMin = Coords.world.width;

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
    else {
      swapOuterDirection = true; // This is necessary so that it doesn't cut itself off
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
    if (!swapOuterDirection) {
      context.lineTo(Coords.viewport.world.x + Coords.viewport.world.width + CUSHION,
          Coords.viewport.world.y - CUSHION);
      context.lineTo(Coords.viewport.world.x + Coords.viewport.world.width + CUSHION,
          Coords.viewport.world.y + Coords.viewport.world.height + CUSHION);
      context.lineTo(Coords.viewport.world.x - CUSHION,
          Coords.viewport.world.y + Coords.viewport.world.height + CUSHION);
    }
    else {
      context.lineTo(Coords.viewport.world.x - CUSHION,
          Coords.viewport.world.y + Coords.viewport.world.height + CUSHION);
      context.lineTo(Coords.viewport.world.x + Coords.viewport.world.width + CUSHION,
          Coords.viewport.world.y + Coords.viewport.world.height + CUSHION);
      context.lineTo(Coords.viewport.world.x + Coords.viewport.world.width + CUSHION,
          Coords.viewport.world.y - CUSHION);
    }

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
    drawStrokedCircle: drawStrokedCircle,
    drawCircle: drawCircle,
    drawFilledRectangle : drawFilledRectangle,
    drawTiledImage : drawTiledImage,
    drawPattern : drawPattern,
    resizeCanvas: resizeCanvas,
    finalizeRender: finalizeRender,
    enableClipping: enableClipping,
    disableClipping: disableClipping,
    disableFogClipping: disableFogClipping,
    createFogEffect: createFogEffect,
    drawFromTiledCanvas: drawFromTiledCanvas,
    setOpacity: setOpacity,
    setFullMapCanvas: setFullMapCanvas,
    get viewport () {
      return viewport;
    },
    get world () {
      return world;
    },
    translateToViewport: translateToViewport,
  };
}());
