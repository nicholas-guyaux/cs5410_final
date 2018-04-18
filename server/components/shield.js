const Geometry = require('../../client_files/shared/Geometry');
const random = require('../utils/random');
const lerp = require('../utils/lerp');

module.exports = function Shield (totalTime=1000*60*5) {
  // world vertices as points
  const worldVertices = [
    [0,0],
    [1,0],
    [1,1],
    [0,1],
  ].map(p => {
    return Geometry.Point(p[0], p[1])
  });
  
  var center = Geometry.Point(random.nextDouble(),random.nextDouble());

  const startingRadius = Math.max(...worldVertices.map(v => Geometry.LineSegment(center, v).distance));

  var that = Geometry.Circle({
    x: 0.5, // center.x,
    y: 0.5, // center.y,
    radius: 0.15// startingRadius,
  });

  that.update = t => {
    // that.radius = lerp(startingRadius, 0, t/totalTime);
  };

  return that;
}
