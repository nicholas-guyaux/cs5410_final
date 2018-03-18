const ViewStarters = (function (ButtonMenu) {

  function ButtonView (name, buttonContainerEl, onEscape=()=>{}) {
    if(!(buttonContainerEl instanceof Element)) {
      throw new Error('buttonContainerEl must be a DOM element. You passed ', buttonContainerEl)
    }
    let buttonMenu = null;
    var keyboard = null;

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
          onEscape.call(this, e);
          AudioPool.playSFX('menu_click');
        })
      },
      get buttonMenu () {
        return buttonMenu;
      },
      name: name,
    }
  }

  function EmptyView (name) {
    return {
      render () {
      },
      unrender () {
      },
      init () {
      },
      name: name,
    }
  }

  function ComposeViews (name, ...views) {
    return {
      render() {
        views.forEach(render);
      },
      unrender() {
        views.forEach(unrender);
      },
      unrender() {
        views.forEach(init);
      },
      name,
    }
  }

  return {
    EmptyView,
    ButtonView,
    ComposeViews,
  };
})(ButtonMenu);