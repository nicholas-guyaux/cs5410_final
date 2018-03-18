const GameLobbyView = (function GameView (AudioPool) {
  var buttonMenu = null;

  function render () {
    AudioPool.playMusic('menu');
    keyboard.activate();
    //buttonMenu.activate();
  }

  function unrender () {
    keyboard.deactivate();
    //buttonMenu.deactivate();
  }

  function init () {
    AudioPool.addMusic('menu', 'assets/sound/09 Come and Find Me - B mix.mp3');
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Escape', function (e) {
      MainView.loadView(MenuView.name);
      AudioPool.playSFX('menu_click');
    });
    let buttons = $$('button', $('#game-lobby')[0]);
    Events.on(buttons, 'click', function (e) {
      AudioPool.playSFX('menu_click');
    });
  
    Events.on(buttons, 'mouseenter', function (e) {
      AudioPool.playSFX('menu_navigate');
    })
    //buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: "GameLobbyView",
  }
})(AudioPool);