const Graphics = (function() {
  'use strict';

  let onScreenCanvas = document.getElementById('game-canvas');
  let onScreenContext = onScreenCanvas.getContext('2d');

  let maskingCanvas = document.createElement('canvas');
  let maskingContext = maskingCanvas.getContext('2d');
  let messageBox = document.getElementById('game-messages');
  maskingCanvas.width = Coords.world.width;
  maskingCanvas.height = Coords.world.height;

  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');

  let minimapCanvas = document.createElement('canvas');
  let minimapContext = minimapCanvas.getContext('2d');

  minimapCanvas.width = Coords.world.width;
  minimapCanvas.height = Coords.world.height;

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
      this.clearRect(0,0, this.canvas.width, this.canvas.height);
      this.restore();
  }

  function resetTransform () {
    if(context.resetTransform) {
      context.resetTransform();
    } else {
      context.setTransform(1,0,0,1,0,0);
    }
  }
  
  function clear() {
    maskingContext.clearRect(0, 0, maskingCanvas.width, maskingCanvas.height);
    context.clear();
  }

  function saveContext() { context.save(); }

  function restoreContext() { context.restore(); }

  function translateToViewport (myContext=context) {
    resetTransform();
    myContext.translate(-viewport.world.x, -viewport.world.y);
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

  const fontStyle = `'Press Start 2P', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`;
  function drawText(text,x,y,size, baseline) {
    context.font = `${size}px ${fontStyle}`;
    context.textBaseline = baseline;
    context.fillText(text, x, y);
  }

  function addGameMessage(message) {
    messageBox.innerHTML += '<p>' + message + '</p>';
    messageBox.scrollTop = messageBox.scrollHeight;
  }

  function clearGameMessageBox(){
    messageBox.innerHTML = '';
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
        center.y * Coords.world.width, radius * Coords.world.width,
        2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawStrokedCircle(strokeStyle, center, radius) {
    context.beginPath();
    context.arc(center.x * Coords.world.width,
        center.y * Coords.world.width, Math.max(0, radius * Coords.world.width),
        2 * Math.PI, false);
    context.closePath();
    context.strokeStyle = strokeStyle;
    context.stroke();
  }

  function scalingFactor () {
    return 1;
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

  function drawLine (color, a, b) {
    context.beginPath();
    context.strokeColor = color;
    context.moveTo(a.x*Coords.world.width, a.y*Coords.world.height);
    context.lineTo(b.x*Coords.world.width, b.y*Coords.world.height);
    context.stroke();
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

  function enableShieldClipping(shieldCircle, color='rgba(255,0,255,0.7)') {
    maskingContext.save();

    let circle = {
      x: shieldCircle.x * Coords.world.width,
      y: shieldCircle.y * Coords.world.height,
      radius: shieldCircle.radius * Coords.world.width,
    };

    const CUSHION = 2 * Coords.world.width;
    maskingContext.beginPath();
    maskingContext.moveTo(-CUSHION, -CUSHION);
    maskingContext.lineTo(circle.x, circle.y - circle.radius);
    maskingContext.arc(circle.x, circle.y, Math.max(0,circle.radius), 1.5 * Math.PI, 3.5 * Math.PI);
    maskingContext.lineTo(-CUSHION, -CUSHION);
    maskingContext.lineTo(-CUSHION, Coords.world.height + CUSHION);
    maskingContext.lineTo(Coords.world.width + CUSHION, Coords.world.height + CUSHION);
    maskingContext.lineTo(Coords.world.width + CUSHION, -CUSHION);
    maskingContext.closePath();
    maskingContext.clip();

    maskingContext.fillStyle = color;
    maskingContext.globalAlpha = 0.7;

    maskingContext.fillRect(
      Coords.viewport.world.x,
      Coords.viewport.world.y,
      Coords.viewport.world.width,
      Coords.viewport.world.height
    );

    context.drawImage(
      maskingCanvas,
      Coords.viewport.world.x,
      Coords.viewport.world.y,
      Coords.viewport.world.width,
      Coords.viewport.world.height,
      Coords.viewport.world.x,
      Coords.viewport.world.y,
      Coords.viewport.world.width,
      Coords.viewport.world.height
    );

    maskingContext.restore();
  }

  function disableClipping() {
    if (props.clippingEnabled) {
      context.restore();
      props.clippingEnabled = false;
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

  //------------------------------------------------------------------
  //
  // Draw an image out of a spritesheet into the local canvas coordinate system.
  //
  //------------------------------------------------------------------
  function drawImageSpriteSheet(spriteSheet, spriteSize, sprite, center, size) {
    let localCenter = {
        x: center.x * Coords.world.width,
        y: center.y * Coords.world.height
    };
    let localSize = {
        width: size.width * Coords.world.width,
        height: size.height * Coords.world.height
    };
    context.drawImage(spriteSheet,
        sprite * spriteSize.width, 0,           // which sprite to render
        spriteSize.width, spriteSize.height,    // size in the spritesheet
        localCenter.x - localSize.width / 2,
        localCenter.y - localSize.height / 2,
        localSize.width, localSize.height);
  }

  return {
    initialize : initialize,
    clear : clear,
    saveContext : saveContext,
    restoreContext : restoreContext,
    rotateCanvas : rotateCanvas,
    drawImage : drawImage,
    drawImageSpriteSheet: drawImageSpriteSheet,
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
    drawText: drawText,
    addGameMessage: addGameMessage,
    enableShieldClipping,
    drawLine: drawLine,
    clearGameMessageBox: clearGameMessageBox,
    get viewport () {
      return viewport;
    },
    get world () {
      return world;
    },
    translateToViewport: translateToViewport,
  };
}());
