//
// Contains client-side game loop and client-side game state data
const GameView = (function() {
  let keyboard = KeyboardHandler(false, 'keyCode');
  let receivedMessages = Queue.create();
  let playerSelf = {
    model: Player(),
    texture: MyGame.assets['test-ship']
  };
  let playerOthers = {};

  let props = {
    quit: false,
    lastTimeStamp: performance.now(),
    messageId: 1,
    commandKeys: null
  };

  //
  // Render to initially setup and show the GameView
  function render() {
    props.commandKeys = client.user.commandKeys;
    keyboard.activate();
    if (socket === null) {
      socket = io('/game');
    }

    socket.on(GameNetIds.CONNECT_ACK, data => {
      receivedMessages.enqueue({
        type: GameNetIds.CONNECT_ACK,
        data: data
      });
    });

    socket.on(GameNetIds.CONNECT_OTHER, data => {
      receivedMessages.enqueue({
        type: GameNetIds.CONNECT_OTHER,
        data: data
      });
    });

    socket.on(GameNetIds.DISCONNECT_OTHER, data => {
      receivedMessages.enqueue({
        type: GameNetIds.DISCONNECT_OTHER,
        data: data
      });
    });

    socket.on(GameNetIds.UPDATE_SELF, data => {
      receivedMessages.enqueue({
        type: GameNetIds.UPDATE_SELF,
        data: data
      });
    });

    socket.on(GameNetIds.UPDATE_OTHER, data => {
      receivedMessages.enqueue({
        type: GameNetIds.UPDATE_OTHER,
        data: data
      });
    });

    keyboard.addAction(props.commandKeys.MOVE_FORWARD, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_MOVE_FORWARD
      };
      socket.emit(GameNetIds.INPUT, message);
      playerSelf.model.move(elapsedTime);
    });

    keyboard.addAction(props.commandKeys.ROTATE_RIGHT, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_ROTATE_RIGHT
      };
      socket.emit(GameNetIds.INPUT, message);
      playerSelf.model.rotateRight(elapsedTime);
    });

    keyboard.addAction(props.commandKeys.ROTATE_LEFT, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_ROTATE_LEFT
      };
      socket.emit(GameNetIds.INPUT, message);
      playerSelf.model.rotateLeft(elapsedTime);
    });

    keyboard.addAction(props.commandKeys.FIRE, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_FIRE
      };
      socket.emit(GameNetIds.INPUT, message);
    });
    // Graphics.drawImage(MyGame.assets['blue-brick'], {x: 0.5, y: 0.5}, {width: 0.05, height: 0.05});
    requestAnimationFrame(gameLoop);
  }

  function unrender() {
    socket.disconnect();
    socket = null;
    keyboard.deactivate();
    props.quit = true;
  }

  function connectPlayerSelf(data) {
    let player = data.player;

    playerSelf.model.position.x = player.position.x;
    playerSelf.model.position.y = player.position.y;

    playerSelf.model.size.x = player.size.x;
    playerSelf.model.size.y = player.size.y;

    playerSelf.model.direction = player.direction;
    playerSelf.model.speed = player.speed;
    playerSelf.model.rotateRate = player.rotateRate;
  }

  function connectPlayerOther(data) {
    let player = data.player;
    let model = PlayerRemote();
    model.state.position.x = player.position.x;
    model.state.position.y = player.position.y;
    model.state.direction = player.direction;
    model.state.lastUpdate = performance.now();

    model.goal.position.x = player.position.x;
    model.goal.position.y = player.position.y;
    model.goal.direction = player.direction;
    model.goal.updateWindow = 0;

    model.size.x = player.size.x;
    model.size.y = player.size.y;

    playerOthers[data.clientId] = {
      model: model,
      texture: MyGame.assets['test-ship']
    };
  }

  function disconnectPlayerOther(data) {
    delete playerOthers[data.clientId];
  }

  //
  // Small update called in process input
  function updatePlayerSelf(data) {
    playerSelf.model.position.x = data.player.position.x;
    playerSelf.model.position.y = data.player.position.y;
  }

  //
  // Small update called in process input (prep for update in gameLoop)
  function updatePlayerOther(data) {
    if (playerOthers.hasOwnProperty(data.clientId)) {
      let model = playerOthers[data.clientId].model;
      model.goal.updateWindow = data.updateWindow;

      model.goal.position.x = data.player.position.x;
      model.goal.position.y = data.player.position.y;
      model.goal.direction = data.player.direction;
    }
  }

  function processInput(elapsedTime) {
    keyboard.handle(elapsedTime); // Pass gameState? Or not necessary?

    //
    // Double buffering on the queue so we don't asynchronously receive inputs
    // while processing.
    let processMe = receivedMessages;
    receivedMessages = Queue.create();

    while (!processMe.empty) {
      let message = processMe.dequeue();
      switch (message.type) {
        case GameNetIds.CONNECT_ACK:
          connectPlayerSelf(message.data);
          break;
        case GameNetIds.CONNECT_OTHER:
          connectPlayerOther(message.data);
          break;
        case GameNetIds.DISCONNECT_OTHER:
          disconnectPlayerOther(message.data);
          break;
        case GameNetIds.UPDATE_SELF:
          updatePlayerSelf(message.data);
          break;
        case GameNetIds.UPDATE_OTHER:
          updatePlayerOther(message.data);
          break;
      }
    }
  }

  function update(elapsedTime) {
    playerSelf.model.update(elapsedTime);
    for (let id in playerOthers) {
      playerOthers[id].model.update(elapsedTime);
    }
  }

  //
  // Render function for gameLoop
  function renderFrame() {
    Graphics.clear();
    Renderer.renderPlayer(playerSelf.model, playerSelf.texture);
    for (let id in playerOthers) {
        let player = playerOthers[id];
        Renderer.renderRemotePlayer(player.model, player.texture);
    }
  }

  function gameLoop(time) {
    let elapsedTime = time - props.lastTimeStamp;

    processInput(elapsedTime);
    update(elapsedTime);
    renderFrame();

    if (!props.quit) {
      requestAnimationFrame(gameLoop);
    }
  }

  function init() {
  }

  return {
    render,
    unrender,
    init,
    name: "GameView",
  };
}());
