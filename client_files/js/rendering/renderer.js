const Renderer = (function(graphics) {

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
  }

  function renderExplosion(sprite) {
    graphics.drawImageSpriteSheet(
        sprite.spriteSheet,
        { width: sprite.pixelWidth, height: sprite.pixelHeight },
        sprite.sprite,
        { x: sprite.center.x, y: sprite.center.y },
        { width: sprite.width, height: sprite.height }
    );
  }

  function renderItems(itemList, itemImages) {
    var size = {
      width: .01,
      height: .01,
    };
    for (let i = 0; i < itemList.length; i++) {
      let item = itemList[i];
      graphics.saveContext();
      let center = {
        x:item.minX + size.width / 2,
        y:item.minY + size.height / 2
      };
      
      graphics.drawImage(itemImages[item.type], center, size, false);
      graphics.restoreContext();
    }
  }

  function minimap (shield, playerPosition) {
    var minimap = {
      width: Coords.viewport.width*.2,
      height: Coords.viewport.height*.2,
    };
    minimap.x = Coords.viewport.x;
    minimap.y = Coords.viewport.y + Coords.viewport.height - minimap.height;
    minimap.center = {
      x: minimap.x + minimap.width / 2,
      y: minimap.y + minimap.height / 2,
    }
    graphics.saveContext();
    const viewport = {
      x: lerp(minimap.x, minimap.x + minimap.width, Coords.viewport.x),
      y: lerp(minimap.y, minimap.y + minimap.height, Coords.viewport.y),
      width: lerp(0, minimap.width, Coords.viewport.width),
      height: lerp(0, minimap.height, Coords.viewport.height),
    }
    graphics.setOpacity(0.7);
    graphics.drawImage(MyGame.assets['minimap'], minimap.center, minimap);
    graphics.restoreContext();
    shield = ({
      x: lerp(minimap.x, minimap.x + minimap.width, shield.x),
      y: lerp(minimap.y, minimap.y + minimap.height, shield.y),
      radius: lerp(0, minimap.width, shield.radius),
    });

    Graphics.drawStrokedCircle('purple', shield, shield.radius);
    graphics.drawRectangle('yellow', viewport.sx, viewport.y, viewport.width, viewport.height);
    Graphics.drawLine('white', shield, playerPosition);
  }

  function renderAmmo(gun,ammo) {
    if (gun) {
      Graphics.drawText('Ammo: ' + ammo.toString(), Math.floor(Coords.viewport.x * Coords.world.width), Math.floor(Coords.viewport.y * Coords.world.height) + 1, Math.floor((Coords.viewport.height * Coords.world.height * .03)).toString());
    } else {
      Graphics.drawText('Ammo: ' + 'No Gun', Math.floor(Coords.viewport.x * Coords.world.width), Math.floor(Coords.viewport.y * Coords.world.height) + 1, Math.floor((Coords.viewport.height * Coords.world.height * .03)).toString());
    }
  }

  var clipping = TiledImageClipping({
    width: MyGame.assets['plane'].width / 4,
    height: MyGame.assets['plane'].height
  });
  function renderVehicle (totalTime, vehicle) {
    if(!vehicle.x) {
      return;
    }
    const vCirc = vehicle.getCircleInViewport();
    graphics.saveContext();
    Graphics.rotateCanvas(vCirc, vehicle.direction + Math.PI / 2);
    Graphics.drawImage(MyGame.assets['plane'], vCirc, {
      width: vehicle.width,
      height: vehicle.height, 
    }, clipping(Math.floor(totalTime / 50) % 4));
    graphics.restoreContext();
  }

  function renderGameStart(totalTime, vehicle) {
    Graphics.drawImage(MyGame.assets['minimap'], Coords.viewport.center, Coords.viewport);
    renderVehicle(totalTime, vehicle);
    var vCirc = vehicle.getCircleInViewport();
    Graphics.drawStrokedCircle('white', vCirc, vCirc.radius)
    Graphics.finalizeRender();
  }

  function renderBullet(model) {
    Graphics.drawCircle(model.color, model.position, model.radius);
  }

  function renderMessages(message) {
    Graphics.addGameMessage(message);
  }

  function renderShield (shield) {
    Graphics.enableShieldClipping(shield);
  }

  return {
    renderPlayer,
    renderBullet,
    minimap,
    renderVehicle,
    renderGameStart,
    renderExplosion,
    renderItems,
    renderAmmo,
    renderMessages,
    renderShield,
  };
}(Graphics));
