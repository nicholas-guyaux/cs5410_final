const Renderer = (function(graphics) {

  function renderPlayer(model, texture) {
    var center = {x: model.position.x + model.size.width / 2, y: model.position.y + model.size.height / 2 };
    graphics.saveContext();
    graphics.rotateCanvas(center, model.direction);
    graphics.drawImage(texture, center, model.size);
    graphics.restoreContext();

    //Render Health Bar
    graphics.drawFilledRectangle(
      'rgba(255,0,0,255)',
      model.position.x, model.position.y - (model.size.height *.3),
      model.size.width, (model.size.height * .1)//.001
    );
    graphics.drawFilledRectangle(
      'rgba(0,255,0,255)',
      model.position.x, model.position.y - (model.size.height *.3),
      model.size.width * (model.health.current / model.health.max), (model.size.height * .1)//.001
    );
  }

  function renderRemotePlayer(model, texture) {
    var center = {x: model.state.position.x + model.size.width / 2, y: model.state.position.y + model.size.height / 2 };
    graphics.saveContext();
    graphics.rotateCanvas(center, model.state.direction);
    graphics.drawImage(texture, center, model.size);
    graphics.restoreContext();
  }

  function render () {
    renderPlayer();
    renderRemotePlayer();
  }

  return {
    renderPlayer,
    renderRemotePlayer
  };
}(Graphics));
