let playerCount = 0;
let maxHealth = 100;
let maxAmmo = 50;
let maxEnergy = 100;
//
// Contains client-side game loop and client-side game state data
const GameView = (function() {
  let keyboard = KeyboardHandler(false, 'keyCode');
  let receivedMessages = Queue.create();
  var boatTextureSet = {
    water: {
      spriteSet: MyGame.assets['water_units'],
      animation: [
        MyGame.assets['water_units_mapping'].frames["water_ripple_small_000.png"],
        MyGame.assets['water_units_mapping'].frames["water_ripple_small_001.png"],
        MyGame.assets['water_units_mapping'].frames["water_ripple_small_002.png"],
        MyGame.assets['water_units_mapping'].frames["water_ripple_small_003.png"],
        MyGame.assets['water_units_mapping'].frames["water_ripple_small_004.png"],
      ],
    },
    ship: {
      spriteSet: MyGame.assets['water_units'],
      normal: MyGame.assets['water_units_mapping'].frames["ship_small_body.png"],
      damaged: MyGame.assets['water_units_mapping'].frames["ship_small_body_destroyed.png"]
    },
    gun: {
      spriteSet: MyGame.assets['water_units'],
      normal: undefined
    }
  };
  var opposingBoatTextureSet = Object.assign({},boatTextureSet, {
    ship: {
      spriteSet: MyGame.assets['water_units'],
      normal: MyGame.assets['water_units_mapping'].frames["ship_small_b_body.png"],
      damaged: MyGame.assets['water_units_mapping'].frames["ship_small_body_b_destroyed.png"]
    }
  });
  let messageHistory = Queue.create();
  let playerSelf = {
    model: Player(maxHealth, maxAmmo, maxEnergy),
    textureSet: boatTextureSet,
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
    Graphics.resizeCanvas();
    AudioPool.playMusic('game');
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
      messageHistory.enqueue(message);
      playerSelf.model.move(elapsedTime);
    });

    keyboard.addAction(props.commandKeys.ROTATE_RIGHT, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_ROTATE_RIGHT
      };
      socket.emit(GameNetIds.INPUT, message);
      messageHistory.enqueue(message);
      playerSelf.model.rotateRight(elapsedTime);
    });

    keyboard.addAction(props.commandKeys.ROTATE_LEFT, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_ROTATE_LEFT
      };
      socket.emit(GameNetIds.INPUT, message);
      messageHistory.enqueue(message);
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
    updateSelfPosition();
  }

  function updateSelfPosition () {
    Graphics.viewport.playerUpdate({
      x: playerSelf.model.position.x + playerSelf.model.size.width / 2,
      y: playerSelf.model.position.y + playerSelf.model.size.height / 2,
    });
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
      textureSet: opposingBoatTextureSet,
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
    //if(data.player.health.current < playerSelf.model.health.current)
    //add damage particle effect
    //else if(data.player.health.current > playerSelf.model.health.current)
    //add healing particle effect
    playerSelf.model.health = data.player.health;
    playerSelf.model.direction = data.player.direction;

    
    // Remove messages from the queue up through the last one identified
    // by the server as having been processed.
    let done = false;
    while (!done && !messageHistory.empty) {
      if (messageHistory.front.id === data.lastMessageId) {
        done = true;
      }
      messageHistory.dequeue();
    }

        
    // Update the client simulation since this last server update, by
    // replaying the remaining inputs.
    // let memory = Queue.create();
    // while (!messageHistory.empty) {
    //   let message = messageHistory.dequeue();
    //   memory.enqueue(message);
    // }
    // messageHistory = memory;

    while (!messageHistory.empty) {
      let message = messageHistory.dequeue();
      switch (message.type) {
        case GameNetIds.INPUT_MOVE_FORWARD:
          playerSelf.model.move(message.elapsedTime);
          break;
        case GameNetIds.INPUT_ROTATE_LEFT:
          playerSelf.model.rotateLeft(message.elapsedTime);
          break;
        case GameNetIds.INPUT_ROTATE_RIGHT:
          playerSelf.model.rotateRight(message.elapsedTime);
          break;
      }
    }

    updateSelfPosition();
  }

  //
  // Small update called in process input (prep for update in gameLoop)
  function updatePlayerOther(data) {
    if (playerOthers.hasOwnProperty(data.clientId)) {
      playerOthers[data.clientId].model.goal.updateWindow = data.player.updateWindow;

      playerOthers[data.clientId].model.goal.position.x = data.player.position.x;
      playerOthers[data.clientId].model.goal.position.y = data.player.position.y;
      playerOthers[data.clientId].model.goal.direction = data.player.direction;
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
    totalTime = props.lastTimeStamp;
    Graphics.clear();
    Graphics.translateToViewport();
    GameMap.draw();
    Renderer.renderPlayer(playerSelf.model, playerSelf.textureSet, totalTime);
    for (let id in playerOthers) {
        let player = playerOthers[id];
        Renderer.renderPlayer(player.model, player.textureSet, totalTime);
    }
    Renderer.minimap();
    Graphics.finalizeRender();
  }

  function gameLoop(time) {
    let elapsedTime = time - props.lastTimeStamp;
    props.lastTimeStamp = time;

    processInput(elapsedTime);
    update(elapsedTime);
    renderFrame();

    if (!props.quit) {
      requestAnimationFrame(gameLoop);
    }
  }

  function init() {
    Graphics.initialize();
  }

  return {
    render,
    unrender,
    init,
    name: "GameView",
    playerOthers
  };
}());
