const Renderer = (function(graphics) {

  function renderPlayer(model, texture) {
    var center = {x: model.position.x + model.size.width / 2, y: model.position.y + model.size.height / 2 };
    graphics.saveContext();
    graphics.rotateCanvas(center, model.direction);
    graphics.drawImage(texture, center, model.size);
    graphics.restoreContext();
  }

  function renderRemotePlayer(model, texture) {
    var center = {x: model.state.position.x + model.size.width / 2, y: model.state.position.y + model.size.height / 2 };
    graphics.saveContext();
    graphics.rotateCanvas(center, model.state.direction);
    graphics.drawImage(texture, center, model.size);
    graphics.restoreContext();
  }

  return {
    renderPlayer,
    renderRemotePlayer
  };
}(Graphics));
