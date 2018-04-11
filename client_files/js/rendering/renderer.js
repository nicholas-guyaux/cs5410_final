const Renderer = (function(graphics) {

  function renderPlayer(model, texture) {
    graphics.saveContext();
    graphics.rotateCanvas(model.position, model.direction);
    graphics.drawImage(texture, model.position, model.size);
    graphics.restoreContext();
  }

  function renderRemotePlayer(model, texture) {
    graphics.saveContext();
    graphics.rotateCanvas(model.state.position, model.state.direction);
    graphics.drawImage(texture, model.state.position, model.size);
    graphics.restoreContext();
  }

  return {
    renderPlayer,
    renderRemotePlayer
  };
}(Graphics));
