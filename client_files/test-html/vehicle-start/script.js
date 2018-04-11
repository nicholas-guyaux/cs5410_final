var canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

lastTime = 0;
let clipping;

const gameState = GameState({
  worldWidth: canvas.width,
  worldHeight: canvas.height,
});

const keyboard = KeyboardHandler();

keyboard.addOnceAction(() => {
  gameState.dropShip();
});

function handleInput () {
  keyboard.handle();
}

function update (elapsed, totalTime) {
  gameState.update(elapsed, totalTime);
}

function renderVehicle (totalTime, plane, vehicle, vehiclePath) {
  if (plane.loaded) {
    if(!clipping) {
      clipping = TiledImageClipping({
        width: plane.width / 4,
        height: plane.height
      });
    }
    //  convert to viewport ratio from world coordinates
    var vCenter = gameState.viewport.fromWorldToRatio({
      x: gameState.vehicle.center.x,
      y: gameState.vehicle.center.y,
    });
    ctx.save();
    Graphics.rotateCanvas(vCenter, vehiclePath.angle + Math.PI / 2);
    Graphics.drawImage(plane, vCenter, gameState.viewport.fromWorldToRatio({
      width: gameState.vehicle.width,
      height: gameState.vehicle.height, 
    }), clipping(Math.floor(totalTime / 50) % 4));
    ctx.restore();
  }
}

function renderLoop (elapsed, totalTime) {
  ctx.clear();
  
  console.log(elapsed, totalTime);
  ctx.strokeStyle = 'red';
  strokeRect(gameState.dropzoneRect);
  
  ctx.strokeStyle = '#7c0';
  drawLine(gameState.vehiclePath);

  renderVehicle(totalTime, gameState.plane, gameState.vehicle, gameState.vehiclePath);
}

function gameLoop (totalTime) {
  var elapsed = totalTime - lastTime;
  handleInput();
  update(elapsed, totalTime);
  renderLoop(elapsed, totalTime);
  window.requestAnimationFrame(gameLoop);
}

window.requestAnimationFrame(gameLoop);

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function getRandomPointInRect (rect) {
  return Geometry.Point(getRandomIntInclusive(rect.left, rect.right), getRandomIntInclusive(rect.top, rect.bottom));
}

function fillRect (rect) {
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

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

function drawLine (lineSeg) {
  ctx.beginPath();
  ctx.moveTo(lineSeg.a.x, lineSeg.a.y);
  ctx.lineTo(lineSeg.b.x, lineSeg.b.y);
  ctx.stroke();
}

function getRectCenteredAtPoint (point, width, height) {
  return Geometry.Rectangle({
    x: point.x - width / 2,
    y: point.y - height / 2,
    width: width,
    height: height,
  })
}

function strokeRect (rect) {
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}
