const Renderer = (function(graphics) {

  function renderWaterUnit (center, image, mapping) {
    graphics.drawImage(image, center, {
      width: mapping.sourceSize.w / Coords.world.width * settings.waterUnitScale,
      height: mapping.sourceSize.h / Coords.world.height * settings.waterUnitScale,
    }, {
      x: mapping.frame.x,
      y: mapping.frame.y,
      width: mapping.frame.w,
      height: mapping.frame.h,
    });
  }

  function renderPlayer(model, textureSet, totalTime) {
    var center;
    var direction;
    if(model.position && typeof model.direction !== "undefined") {
      direction = model.direction;
      center = {x: (model.position.x + model.size.width / 2) , y: (model.position.y + model.size.height / 2)};
    } else if(model.state) {
      direction = model.state.direction
      center = {x: model.state.position.x + model.size.width / 2, y: model.state.position.y + model.size.height / 2 };
    } else {
      throw new Error('invalid model');
    }
    graphics.saveContext();
    // boat images are straight up and down so they needed 
    // an added 90 degrees to their rotation
    graphics.rotateCanvas(center, direction + Math.PI / 2);
    var water_animated_mapping = textureSet.water.animation[Math.floor(totalTime / 50) % textureSet.water.animation.length];
    var waterCenter = {
      x: center.x,
      // the water needs to be off-centered to look right
      y: center.y + model.size.height / 8,
    };
    renderWaterUnit(waterCenter, textureSet.water.spriteSet, water_animated_mapping);
    renderWaterUnit(center, textureSet.ship.spriteSet, textureSet.ship.normal);
    graphics.restoreContext();
    
    if(model.health){
      //Render Energy Bar
      graphics.drawFilledRectangle(
        'rgba(245,140,0,255)',
        model.position.x, center.y - (model.size.height *.4),
        model.size.width * (model.energy.current / model.energy.max), (model.size.height * .1)
      );
      //Render Health Bar
      graphics.drawFilledRectangle(
        'rgba(255,0,0,255)',
        model.position.x, center.y - (model.size.height *.4),
        model.size.width, (model.size.height * .05)
      );
      graphics.drawFilledRectangle(
        'rgba(0,255,0,255)',
        model.position.x, center.y - (model.size.height *.4),
        model.size.width * (Math.max(0,model.health.current) / model.health.max), (model.size.height * .05)
      );
    }
    //graphics.drawFilledRectangle('red',model.position.x, model.position.y, .1, .10);
  }

  // function renderRemotePlayer(model, textureSet, elapsed) {
  //   return renderPlayer(model, textureSet, elapsed);
  // }

  return {
    renderPlayer,
    // renderRemotePlayer
  };
}(Graphics));
