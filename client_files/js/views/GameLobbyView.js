const GameLobbyView = (function GameView (AudioPool) {
  var buttonMenu = null;


  
  function render () {
    if(socket === null) {
      socket = io();

    }
    socket.on(NetworkIds.CONNECT_ACK, function (data) {
      socket.emit(NetworkIds.PLAYER_JOIN, {
        player: player
      });
    });
  
    socket.on(NetworkIds.PLAYER_JOIN, function (data) {
      console.log(data);
      var div = document.getElementById('lobby-chat-box');
      div.innerHTML = '';
      for (let playerId in data.clients) {
        div.innerHTML += playerId;
      }
      div.innerHTML += '<div class="chat-message"><span class="chat-user">' + data.clients[0].name + '</span>: <span class="chat-message">' + 'Has joined the lobby' + '</span>';
    });
  
    socket.on(NetworkIds.LOBBY_MSG, function (data) {
      console.log(data);
      var div = document.getElementById('lobby-chat-box');
      div.innerHTML += '<div class="chat-message"><span class="chat-user">' + data.playerId + '</span>: <span class="chat-message">' + data.message + '</span>';
    });
    AudioPool.playMusic('menu');
    keyboard.activate();
    //buttonMenu.activate();
  }

  function unrender () {
    socket.disconnect();
    socket = null;
    keyboard.deactivate();
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
  
    let buttonChat = $$('button', $('#game-lobby')[1]);
    Events.on(buttonChat, 'click', function (e) {
      sendMessage();
    });

    Events.on(buttons, 'mouseenter', function (e) {
      AudioPool.playSFX('menu_navigate');
    });

    //buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  function sendMessage() {
    var chat = document.getElementById('chat-text').value;
    document.getElementById('chat-text').value='';
    socket.emit(NetworkIds.LOBBY_MSG, {
      playerId: player.name,
      message: chat
    });
  }

  return {
    render,
    unrender,
    init,
    name: 'GameLobbyView',
  }
})(AudioPool);
