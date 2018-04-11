const GameLobbyView = (function GameLobbyView (AudioPool) {
  var buttonMenu = null;

  var requiredNumPlayers = 10;

  
  function render () {
    if(socket === null) {
      socket = io('/lobby');
    }

    $('#chat-text')[0].focus();

    var cht = document.getElementById('chat-messages-box');
    cht.innerHTML = '';
    
    socket.on(NetworkIds.CONNECT_ACK, function (data) {
      socket.emit(NetworkIds.PLAYER_JOIN_LOBBY, {
        // We'll just use the token and not the user object
        // because
        // player: client.user,
        // this is for authorization so we know the user is who
        // they say they are
        token: client.user_token
      });
    });

  
    socket.on(NetworkIds.PLAYER_JOIN_LOBBY_ACK, function (data) {
      console.log(data.clients);
      var lob = document.getElementById('lobby-count');
      lob.innerHTML = HTML.escape(data.clients.length) + ' of ' + HTML.escape(requiredNumPlayers);
      var lob = document.getElementById('lobby-players-box');
      lob.innerHTML = '';
      for (let playerId in data.clients) {
        lob.innerHTML += '<div class="user-in-lobby">' + HTML.escape(data.clients[playerId].name) + '</div>';
      }
    });

    socket.on(NetworkIds.PLAYER_LEAVE, function (data) {
      var lob = document.getElementById('lobby-count');
      lob.innerHTML = HTML.escape(data.clients.length) + ' of ' + HTML.escape(requiredNumPlayers);
      var lob = document.getElementById('lobby-players-box');
      lob.innerHTML = '';
      for (let playerId in data.clients) {
        lob.innerHTML += '<div class="user-in-lobby">' + HTML.escape(data.clients[playerId].name) + '</div>';
      }
    });
  
    socket.on(NetworkIds.LOBBY_MSG, function (data) {
      var div = document.getElementById('chat-messages-box');
      var scrollToBottom = false;
      if(div.scrollHeight - div.scrollTop - 5 < div.clientHeight) {
        scrollToBottom = true;
      }
      div.innerHTML += '<div class="chat-message"><span class="chat-user">' + data.playerId + '</span>: <span class="chat-message">' + HTML.escape(data.message) + '</span>';
      if(scrollToBottom) {
        div.scrollTop = div.scrollHeight;
      }
    });

    socket.on(NetworkIds.START_GAME, function (data) {
      // In the loadView this view's unrender will be called and its socket
      // will be disconnected and set to null
      GameView.loadView(GameView.name);
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
    // grab all buttons in #game-lobby and set up event listeners for button noises
    let buttons = $$('button', $('#game-lobby')[0]);
    Events.on(buttons, 'click', function (e) {
      AudioPool.playSFX('menu_click');
    });
  
    // select the chat submit button and sendMessage on click
    let buttonChat = $('#chat-submit-button');
    Events.on(buttonChat, 'click', function (e) {
      sendMessage();
    });

    Events.on(buttons, 'mouseenter', function (e) {
      AudioPool.playSFX('menu_navigate');
    });

    Events.on($('#chat-text'), 'keyup', function (e) {
      if(e.key === "Enter") {
        Events.simulateClick($('#chat-submit-button')[0]);
      }
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
