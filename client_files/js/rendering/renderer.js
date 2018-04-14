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

  // textureSet: [
    //   {
    //     spriteSet: MyGame.assets['water_units'],
    //     mapping: MyGame.assets['water_units_mapping'],
    //   }
    // ]
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
  }

  // function renderRemotePlayer(model, textureSet, elapsed) {
  //   return renderPlayer(model, textureSet, elapsed);
  // }

  return {
    renderPlayer,
    // renderRemotePlayer
  };
}(Graphics));
