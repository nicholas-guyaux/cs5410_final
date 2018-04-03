const GameLobbyView = (function GameLobbyView (AudioPool) {
  var buttonMenu = null;

  function render () {
    if(socket === null) {
      socket = io();

      socket.on(NetworkIds.CONNECT_ACK, function (data) {
        socket.emit(NetworkIds.PLAYER_JOIN, {
          player: player
        });
      });

      socket.on(NetworkIds.PLAYER_JOIN, function (data) {
        console.log(data);
      });
    }
    AudioPool.playMusic('menu');
    keyboard.activate();
    //buttonMenu.activate();
  }

  function unrender () {
    keyboard.deactivate();
    socket.emit(NetworkIds.LOBBY_JOIN, {
        direction: newPlayer.direction,
        position: newPlayer.position,
        size: newPlayer.size,
        rotateRate: newPlayer.rotateRate,
        speed: newPlayer.speed
    });
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
    });

    //buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: 'GameLobbyView',
  }
})(AudioPool);
