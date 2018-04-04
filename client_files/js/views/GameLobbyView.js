const GameLobbyView = (function GameLobbyView (AudioPool) {
  var buttonMenu = null;

  var requiredNumPlayers = 10;

  
  function render () {
    if(socket === null) {
      socket = io();

    }
    var cht = document.getElementById('chat-messages-box');
    cht.innerHTML = '';
    
    socket.on(NetworkIds.CONNECT_ACK, function (data) {
      socket.emit(NetworkIds.PLAYER_JOIN, {
        player: client.user
      });
    });

  
    socket.on(NetworkIds.PLAYER_JOIN, function (data) {
      console.log(data.clients);
      var lob = document.getElementById('lobby-count');
      lob.innerHTML = data.clients.length + ' of ' + requiredNumPlayers;
      var lob = document.getElementById('lobby-players-box');
      lob.innerHTML = '';
      for (let playerId in data.clients) {
        lob.innerHTML += '<div class="user-in-lobby">' + data.clients[playerId].name + '</div>';
      }
    });

    socket.on(NetworkIds.PLAYER_LEAVE, function (data) {
      var lob = document.getElementById('lobby-count');
      lob.innerHTML = data.clients.length + ' of ' + requiredNumPlayers;
      var lob = document.getElementById('lobby-players-box');
      lob.innerHTML = '';
      for (let playerId in data.clients) {
        lob.innerHTML += '<div class="user-in-lobby">' + data.clients[playerId].name + '</div>';
      }
    });
  
    socket.on(NetworkIds.LOBBY_MSG, function (data) {
      var div = document.getElementById('chat-messages-box');
      div.innerHTML += '<div class="chat-message"><span class="chat-user">' + data.playerId + '</span>: <span class="chat-message">' + data.message + '</span>';
    });
    AudioPool.playMusic('menu');
    keyboard.activate();
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
  
    let buttonChat = $$('button', $('#chat-submit-button')[1]);
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
    if (chat != '') {
      document.getElementById('chat-text').value='';
      socket.emit(NetworkIds.LOBBY_MSG, {
        playerId: player.name,
        message: chat
      });
    }
  }

  return {
    render,
    unrender,
    init,
    name: 'GameLobbyView',
  }
})(AudioPool);
