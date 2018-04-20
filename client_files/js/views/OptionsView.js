const OptionsView = (function () {
  const buttonContainerEl = $('#options-menu')[0];
  if(!(buttonContainerEl instanceof Element)) {
    throw new Error('buttonContainerEl must be a DOM element. You passed ', buttonContainerEl)
  }
  let buttonMenu = null;
  var keyboard = null;
  var enteringKey = false;

  return {
    render () {
      keyboard.activate();
      buttonMenu.activate();
    },
    unrender () {
      buttonMenu.deactivate();
      keyboard.deactivate();
    },
    init () {
      buttonMenu = ButtonMenu(buttonContainerEl);
      keyboard = KeyboardHandler(true);
      keyboard.addOnceAction('Escape', function (e) {
        if(enteringKey) {
          return;
        }
        MainView
        AudioPool.playSFX('menu_click');
      });
    },
    name: "OptionsView",
  };
});
