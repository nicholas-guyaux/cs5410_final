const ControlsView = (function () {
  const buttonContainerEl = $('#controls-menu')[0];
  if(!(buttonContainerEl instanceof Element)) {
    throw new Error('buttonContainerEl must be a DOM element. You passed ', buttonContainerEl)
  }
  let buttonMenu = null;
  var keyboard = null;
  var enteringKey = false;
  var controlSetter = null;

  return {
    render () {
      keyboard.activate();
      buttonMenu.activate();
      controlSetter.render($('#controls-setter')[0], client.user);
      buttonMenu.reset();
    },
    unrender () {
      buttonMenu.deactivate();
      keyboard.deactivate();
      controlSetter.unlisten();
    },
    init () {
      var listenEl = $('#control-config-listening')[0];
      controlSetter = ControlsSetter({
        onChange (listening) {
          if(listening) {
            keyboard.deactivate();
            buttonMenu.deactivate();
            listenEl.innerHTML = "listening";
          } else {
            keyboard.activate();
            buttonMenu.activate(true);
            listenEl.innerHTML = "not listening";
          }
        }
      })
      buttonMenu = ButtonMenu(buttonContainerEl);
      keyboard = KeyboardHandler(true);
      keyboard.addOnceAction('Escape', function (e) {
        if(ControlsSetter.listening) {
          return;
        }
        MainView
        AudioPool.playSFX('menu_click');
      });
    },
    name: "ControlsView",
  };
})();
