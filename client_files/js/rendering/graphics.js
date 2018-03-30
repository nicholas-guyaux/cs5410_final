const Graphics = (function() {
  'use strict';

  let canvas = document.getElementById('game-canvas');
  let context = canvas.getContext('2d');

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

  function drawImage(image, center, size) {
    console.log(center, size, canvas.width, canvas.height);
    let localCenter = {
          x: center.x * canvas.width,
          y: center.y * canvas.height
      };
      let localSize ={
          width: size.width * canvas.width,
          height: size.height * canvas.height
      };
      image.onload
      context.drawImage(image,
          localCenter.x - localSize.width / 2,
          localCenter.y - localSize.height / 2,
          localSize.width,
          localSize.height);
  }
  
  return {
    clear : clear,
    saveContext : saveContext,
    restoreContext : restoreContext,
    rotateCanvas : rotateCanvas,
    drawImage : drawImage
  }
}());
