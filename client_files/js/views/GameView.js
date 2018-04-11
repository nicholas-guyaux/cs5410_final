//
// Contains client-side game loop and client-side game state data
const GameView = (function() {

  let keyboard = KeyboardHandler(true);
  let receivedMessages = Queue.create();
  let playerSelf = {
    model: Player(),
    texture: MyGame.assets['player-self']
  };
  let playerOthers = {};

  let props = {
    quit: False,
    lastTimeStamp: performance.now()
  };

  //
  // Render to initially setup and show the GameView
  function render() {
    keyboard.activate();
    if (socket === null) {
      socket = io();
    }

    socket.on(NetworkIds.CONNECT_ACK, data => {
      networkQueue.enqueue({
        type: NetworkIds.CONNECT_ACK,
        data: data
      });
    });

    socket.on(NetworkIds.CONNECT_OTHER, data => {
      networkQueue.enqueue({
        type: NetworkIds.CONNECT_OTHER,
        data: data
      });
    });

    socket.on(NetworkIds.DISCONNECT_OTHER, data => {
      networkQueue.enqueue({
        type: NetworkIds.DISCONNECT_OTHER,
        data: data
      });
    });

    socket.on(NetworkIds.UPDATE_SELF, data => {
      networkQueue.enqueue({
        type: NetworkIds.UPDATE_SELF,
        data: data
      });
    });

    socket.on(NetworkIds.UPDATE_OTHER, data => {
      networkQueue.enqueue({
        type: NetworkIds.UPDATE_OTHER,
        data: data
      });
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

  function init() {
  }

  function connectPlayerSelf(data) {
    playerSelf.model.position.x = data.position.x;
    playerSelf.model.position.y = data.position.y;

    playerSelf.model.size.x = data.size.x;
    playerSelf.model.size.y = data.size.y;

    playerSelf.model.direction = data.direction;
    playerSelf.model.speed = data.speed;
    playerSelf.model.rotateRate = data.rotateRate;
  }

  function connectPlayerOther(data) {
    let model = PlayerRemote();
    model.state.position.x = data.position.x;
    model.state.position.y = data.position.y;
    model.state.direction = data.direction;
    model.state.lastUpdate = performance.now();

    model.goal.position.x = data.position.x;
    model.goal.position.y = data.position.y;
    model.goal.direction = data.direction;
    model.goal.updateWindow = 0;

    model.size.x = data.size.x;
    model.size.y = data.size.y;

    playerOthers[data.clientId] = {
        model: model,
        texture: MyGame.assets['player-other']
    };
  }

  function disconnectPlayerOther(data) {
    delete playerOthers[data.clientId];
  }

  //
  // Small update called in process input
  function updatePlayerSelf(data) {
    playerSelf.model.position.x = data.position.x;
    playerSelf.model.position.y = data.position.y;
  }

  //
  // Small update called in process input (prep for update in gameLoop)
  function updatePlayerOther(data) {
    if (playerOthers.hasOwnProperty(data.clientId)) {
      let model = playerOthers[data.clientId].model;
      model.goal.updateWindow = data.updateWindow;

      model.goal.position.x = data.position.x;
      model.goal.position.y = data.position.y
      model.goal.direction = data.direction;
    }
  }

  function processInput(elapsedTime) {
    keyboard.handle(elapsedTime); // Pass gameState? Or not necessary?

    // Double buffering
    let processMe = receivedMessages;
    receivedMessages = Queue.create();

    while (!processMe.empty) {
      let message = processMe.dequeue();
      switch (message.type) {
        case NetworkIds.CONNECT_ACK:
          connectPlayerSelf(message.data);
          break;
        case NetworkIds.CONNECT_OTHER:
          connectPlayerOther(message.data);
          break;
        case NetworkIds.DISCONNECT_OTHER:
          disconnectPlayerOther(message.data);
          break;
        case NetworkIds.UPDATE_SELF:
          updatePlayerSelf(message.data);
          break;
        case NetworkIds.UPDATE_OTHER:
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

  return {
    render,
    unrender,
    init,
    name: "GameView",
  };
}());
