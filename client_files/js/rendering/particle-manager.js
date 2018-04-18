function ParticleManager(graphics) {
  'use strict';

  let pManager = {};
  pManager.effects = [];

  function ParticleEffect(spec) {
    let pEffect = {};
    pEffect.particles = [];

    if (typeof spec.image === 'undefined') {
      pEffect.render = function() {
        for (let i = 0; i < pEffect.particles.length; i++) {
          if (pEffect.particles[i].alive >= 100) {
            graphics.drawRectangle(
              pEffect.particles[i].shape.fillStyle,
              pEffect.particles[i].position.x,
              pEffect.particles[i].position.y,
              pEffect.particles[i].size,
              pEffect.particles[i].size
            );
          }
        }
      };
    }
    else {
      let image = spec.image;
      pEffect.render = function() {
        for (let i = 0; i < pEffect.particles.length; i++) {
          if (pEffect.particles[i].alive >= 100) {
            graphics.drawImage(
              image,
              pEffect.particles[i].position,
              pEffect.particles[i].size
              // pEffect.particles[i].rotation,
            );
          }
        }
      };
    }

    pEffect.update = function(elapsedTime) {
      let keepMe = [];
  
      for (let i = 0; i < pEffect.particles.length; i++) {
        pEffect.particles[i].alive += elapsedTime;
        pEffect.particles[i].position.x += (elapsedTime * pEffect.particles[i].speed * pEffect.particles[i].direction.x);
        pEffect.particles[i].position.y += (elapsedTime * pEffect.particles[i].speed * pEffect.particles[i].direction.y);
        pEffect.particles[i].rotation += pEffect.particles[i].speed / 0.5;
  
        if (pEffect.particles[i].alive <= pEffect.particles[i].lifetime) {
          keepMe.push(pEffect.particles[i]);
        }
      }
      pEffect.particles = keepMe;
    };

    //
    // Initiate particles
    if (typeof spec.circleSegment !== 'undefined') {
      let radius = spec.circleSegment.radius;
      let center = spec.circleSegment.center;
      let particleCount = 0;
      while (particleCount < 30) {
        // TODO: CHANGE THIS LOGIC?
        //
        // Do something with angles:
        // let angle = Math.random() * Math.PI * 2;
        // let x = Math.cos(angle) * radius;
        // let y = Math.sin(angle) * radius;
        let positionX = (Math.random() * (spec.circleSegment.xMax - spec.circleSegment.xMin)) + spec.circleSegment.xMin;
        let positionY = null;
        let partialComp1 = (radius * radius) - ((positionX - center.x) * (positionX - center.x));
        let partialComp2 = null;

        if (partialComp1 >= 0) {
          partialComp2 = Math.sqrt(partialComp1);
        }
        else {
          continue;
        }

        let selector = Math.floor(Math.random() * 2); // will be a 1 or a 0
        if (selector === 0) {
          positionY = center.y + partialComp2;
        }
        else {
          positionY = center.y - partialComp2;
        }
        
        if ((positionY < spec.circleSegment.yMin) || (positionY > spec.circleSegment.yMax)) {
          if (selector === 0) {
            positionY = center.y - partialComp2;
          }
          else {
            positionY = center.y + partialComp2;
          }
        }

        if ((positionY < spec.circleSegment.yMin) || (positionY > spec.circleSegment.yMax)) {
          particleCount++;
          continue;
        }

        let p = {
          position: { x: positionX, y: positionY },
          direction: Random.nextCircleVector(),
          speed: Random.nextGaussian( spec.speed.mean, spec.speed.stdDev ),	// pixels per millisecond
          rotation: 0,
          lifetime: Math.abs(Random.nextGaussian(spec.lifetime.mean, spec.lifetime.stdDev)),	// milliseconds
          alive: 0,
          size: Random.nextGaussian(spec.size.mean, spec.size.stdDev),
        };
        pEffect.particles.push(p);
        particleCount++;
      }
    }
    
    return pEffect;
  }

  // specPseudoExample = {
  //   shape: {
  //     type: 'square', // Or circle
  //     strokeStyle: 'blue',
  //     fillStyle: 'red'
  //   },
  //   // If shape, don't include image
  //   image: MyGame.assets['violetlight'],
  //   size: { mean: 5, stdDev: 2 },  // = diameter/sidelength
  //   lifetime: { mean: 200, stdDev: 200 },
  //   position: { x: 22, y: 33 },
  //   // If position, don't include rectangularArea
  //   rectangularArea: {
  //     xMin: 4,
  //     xMax: 4,
  //     yMin: 4,
  //     yMax: 4
  //   },
  //   // If position or rectangularArea, don't include circleSegment
  //   circleSegment: {
  //     center: {x: 5, y: 5},
  //     radius: 5,
  //     xMin: 4,
  //     xMax: 4,
  //     yMin: 4,
  //     yMax: 4
  //   }
  // };
  pManager.createEffect = function(spec) {
    pManager.effects.push(ParticleEffect(spec));
  };

  pManager.render = function() {
    for (let i = 0; i < pManager.effects.length; i++) {
      pManager.effects[i].render();
    }
  };

  pManager.update = function(elapsedTime) {
    let effectsToKeep = [];
    for (let i = 0; i < pManager.effects.length; i++) {
      if (pManager.effects[i].particles.length !== 0) {
        pManager.effects[i].update(elapsedTime);
        effectsToKeep.push(pManager.effects[i]);
      }
    }
    pManager.effects = effectsToKeep;
  };

  return pManager;
}
