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
    AudioPool.addMusic('menu', 'assets/sound/09 Come and Find Me - B mix.mp3');
    AudioPool.addSFX('menu_click', 'assets/sound/270324__littlerobotsoundfactory__menu-navigate-00.wav');
    AudioPool.addSFX('menu_navigate', 'assets/sound/270322__littlerobotsoundfactory__menu-navigate-02.wav');
    buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: "MenuView",
  }
})(AudioPool);