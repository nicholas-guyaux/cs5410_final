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

function fillRect (rect) {
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function drawLine (lineSeg) {
  ctx.beginPath();
  ctx.moveTo(lineSeg.a.x, lineSeg.a.y);
  ctx.lineTo(lineSeg.b.x, lineSeg.b.y);
  ctx.stroke();
}

function strokeRect (rect) {
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}
