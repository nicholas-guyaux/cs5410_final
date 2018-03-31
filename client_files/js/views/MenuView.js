const MenuView = (function GameView (AudioPool) {
  var buttonMenu = null;

  function render () {
    AudioPool.playMusic('menu');
    buttonMenu.activate();
  }

  function unrender () {
    buttonMenu.deactivate();
  }

  function init () {
    buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: "MenuView",
  }
})(AudioPool);
