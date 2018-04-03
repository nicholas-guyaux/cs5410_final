var canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');

var worldRect = Geometry.Rectangle({
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
});

var dropzoneRect = getCenteredBox({
  rect: worldRect,
  scale: 0.1,
});

var vehiclePath = getVehiclePath();
lastTime = 0;

function renderLoop (totalTime) {
  ctx.clearRect(worldRect.x, worldRect.y, worldRect.width, worldRect.height)
  var elapsed = totalTime - lastTime;
  console.log(elapsed, totalTime);
  ctx.strokeStyle = 'red';
  strokeRect(dropzoneRect);
  
  ctx.strokeStyle = '#7c0';
  drawLine(vehiclePath);

  const maxTime = 30 * 1000
  var vehicle = getRectCenteredAtPoint(lerpBetweenPoints(vehiclePath.a, vehiclePath.b, totalTime, maxTime), 20, 20);
  ctx.fillStyle = "steelblue";
  fillRect(vehicle);
  window.requestAnimationFrame(renderLoop);
}

window.requestAnimationFrame(renderLoop);

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function getRandomPointInRect (rect) {
  return Geometry.Point(getRandomIntInclusive(rect.left, rect.right), getRandomIntInclusive(rect.top, rect.bottom));
}

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

function getVehiclePath () {
  var p1 = getRandomPointInRect(dropzoneRect);
  var p2 = null;
  do {
    p2 = getRandomPointInRect(dropzoneRect);
  } while(p2.x === p1.x && p2.y === p1.y);
  var lineThroughRect = Geometry.Line(p1, p2);
  return lineThroughRect.lineWithinRect(worldRect);
}
