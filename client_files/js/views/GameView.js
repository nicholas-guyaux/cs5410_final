// const AnimatedSprite = require('./components/animated-sprite');

let playerCount = 0;
let maxHealth = 100;
let maxAmmo = 50;
let maxEnergy = 100;
//
// Contains client-side game loop and client-side game state data
const GameView = (function() {
  var vehicle = null;
  var shield = null;
  let keyboard = KeyboardHandler(false, 'keyCode');
  let receivedMessages = Queue.create();
  var itemImages = {
    'ammo': MyGame.assets['ammo'],
    'health': MyGame.assets['health'],
    'dmg': MyGame.assets['dmg'],
    'speed': MyGame.assets['speed'],
    'gun': MyGame.assets['gun'],
    'gunSpd': MyGame.assets['gunSpd']
  }
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
  let bullets = {};
  let explosions = {};

  let props = {
    quit: false,
    lastTimeStamp: performance.now(),
    messageId: 1,
    commandKeys: null,
    nextExplosionId: 1,
    FOVDistance: 0.15,
    FOVWidth: 0.15
  };

  //
  // Render to initially setup and show the GameView
  function render() {
    props.quit = false;
    vehicle = Vehicle();
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

    socket.on(GameNetIds.UPDATE_VEHICLE, data => {
      receivedMessages.enqueue({
        type: GameNetIds.UPDATE_VEHICLE,
        data: data
      });
    });
    
    socket.on(GameNetIds.BULLET_NEW, data => {
      receivedMessages.enqueue({
        type: GameNetIds.BULLET_NEW,
        data: data
      });
    });

    socket.on(GameNetIds.MESSAGE_GAME_OVER, data => {
      receivedMessages.enqueue({
        type: GameNetIds.MESSAGE_GAME_OVER,
        data: data
      });
    });

    socket.on(GameNetIds.BULLET_HIT, data => {
      receivedMessages.enqueue({
        type: GameNetIds.BULLET_HIT,
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

    Events.on($('#game-canvas'), 'click', function (e) {
      var x = e.pageX - this.offsetLeft;
      var y = e.pageY - this.offsetTop; 
      let message = {
        id: props.messageId++,
        position: {
          x: x / this.offsetWidth,
          y: y / this.offsetHeight,
        },
        type: GameNetIds.INPUT_DROP
      };
      socket.emit(GameNetIds.INPUT, message);
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

    keyboard.addAction(props.commandKeys.TURBO, elapsedTime => {
      let message ={
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_TURBO
      };
      socket.emit(GameNetIds.INPUT, message);
    })
    requestAnimationFrame(gameLoop);
  }

  function unrender() {
    props.quit = true;
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
    playerSelf.model.energy = data.player.energy;
    playerSelf.model.useTurbo = data.player.useTurbo;
    playerSelf.model.isDropped = data.player.isDropped;

    shield = Shield(data.shield.x, data.shield.y, data.shield.radius);
    
    playerSelf.model.localItems = data.player.items;
    //console.log(playerSelf.model.localItems);
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

  function updateVehicle(data) {
    if(!vehicle.x || !vehicle.y) {
      vehicle.x = data.vehicle.x;
      vehicle.y = data.vehicle.y;
    }
    if(!vehicle.goal) vehicle.goal = {};
    vehicle.goal.updateWindow = data.updateWindow;

    vehicle.goal.x = data.vehicle.x;
    vehicle.goal.y = data.vehicle.y;
    // the direction doesn't need to be lerped
    vehicle.direction = data.vehicle.direction;
    vehicle.radius = data.vehicle.radius;
  }

  function bulletNew(data) {
    bullets[data.id] = Bullet({
      id: data.id,
      radius: data.radius,
      speed: data.speed,
      direction: data.direction,
      position: {
        x: data.position.x,
        y: data.position.y
      },
      timeRemaining: data.timeRemaining,
      color: data.color
    });
  }

  function bulletHit(data) {
    explosions[props.nextExplosionId] = AnimatedSprite({
      id: props.nextExplosionId++,
      spriteSheet: MyGame.assets['explosion'],
      spriteSize: { width: 0.01, height: 0.01 },
      spriteCenter: data.position,
      spriteCount: 16,
      spriteTime: [ 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
    });

    //
    // When we receive a hit notification, go ahead and remove the
    // associated missle from the client model.
    delete bullets[data.bulletId];
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
        case GameNetIds.UPDATE_VEHICLE:
          updateVehicle(message.data);
          break;
        case GameNetIds.BULLET_NEW:
          bulletNew(message.data);
          break;
        case GameNetIds.BULLET_HIT:
          bulletHit(message.data);
          break;
        case GameNetIds.MESSAGE_GAME_OVER:
          MainView.loadView(GameOverView.name, message.data);
      }
    }
  }

  function update(elapsedTime) {
    vehicle.update(elapsedTime);
    playerSelf.model.update(elapsedTime);
    for (let id in playerOthers) {
      playerOthers[id].model.update(elapsedTime);
    }

    let removeMissiles = [];
    for (let bullet in bullets) {
      if (!bullets[bullet].update(elapsedTime)) {
        removeMissiles.push(bullets[bullet]);
      }
    }

    for (let i = 0; i < removeMissiles.length; i++) {
      delete bullets[removeMissiles[i].id];
    }

    for (let id in explosions) {
      if (!explosions[id].update(elapsedTime)) {
        delete explosions[id];
      }
    }
  }

  // This function was written by Dr. Dean Mathias
  function rotatePointAboutPoint(center, pt, angle) {
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    let pTranslate = {
      x: pt.x - center.x,
      y: pt.y - center.y
    }

    let x = pTranslate.x * cos - pTranslate.y * sin;
    let y = pTranslate.x * sin + pTranslate.y * cos;

    return {
      x: x + center.x,
      y: y + center.y
    };
  }

  //
  // Render function for gameLoop
  function renderFrame() {
    totalTime = props.lastTimeStamp;
    if(!playerSelf.model.isDropped) {
      Graphics.setFullMapCanvas(true);
      Renderer.renderGameStart(totalTime, vehicle);
      return;
    }
    Graphics.setFullMapCanvas(false);
    Graphics.clear();
    Graphics.translateToViewport();
    
    // let playerPos = {x: playerSelf.model.position.x, y: playerSelf.model.position.y};
    // let FOVPoint1 = {x: (playerPos.x + props.FOVDistance), y: playerPos.y - (props.FOVWidth / 2)};
    // let FOVPoint2 = {x: (playerPos.x + props.FOVDistance), y: playerPos.y + (props.FOVWidth / 2)};

    // FOVPoint1 = rotatePointAboutPoint(playerPos, FOVPoint1, playerSelf.model.direction);
    // FOVPoint2 = rotatePointAboutPoint(playerPos, FOVPoint2, playerSelf.model.direction);
    // FOVPolygon = [playerPos, FOVPoint1, FOVPoint2];
    // Graphics.enableClipping(FOVPolygon); // clipping for objects forbidden outside FOV

    GameMap.draw();
    
    let playerPos = {x: playerSelf.model.position.x + playerSelf.model.size.width / 2, y: playerSelf.model.position.y + playerSelf.model.size.height / 2};
    let FOVPoint1 = {x: (playerPos.x + props.FOVDistance), y: playerPos.y - (props.FOVWidth / 2)};
    let FOVPoint2 = {x: (playerPos.x + props.FOVDistance), y: playerPos.y + (props.FOVWidth / 2)};

    FOVPoint1 = rotatePointAboutPoint(playerPos, FOVPoint1, playerSelf.model.direction);
    FOVPoint2 = rotatePointAboutPoint(playerPos, FOVPoint2, playerSelf.model.direction);
    FOVPolygon = [playerPos, FOVPoint1, FOVPoint2];
    FOVPolygon2 = FOVPolygon.map(obj => Object.assign({}, obj));
    Renderer.renderShield(shield);

    Graphics.enableClipping(FOVPolygon); // clipping for objects forbidden outside FOV
    // Render other players, items, etc. here (things only visible inside FOV)
    for (let bullet in bullets) {
      Renderer.renderBullet(bullets[bullet]);
    }
    for (let id in playerOthers) {
      let player = playerOthers[id];
      Renderer.renderPlayer(player.model, player.textureSet, totalTime);
    }
    Renderer.renderItems(playerSelf.model.localItems, itemImages);   
    for (let id in playerOthers) {
      let player = playerOthers[id];
      Renderer.renderPlayer(player.model, player.textureSet, totalTime);
    } 
    
    Graphics.disableClipping();
    Graphics.createFogEffect(FOVPolygon2, props.FOVDistance);
    Graphics.disableFogClipping();
    for (let id in explosions) {
      Renderer.renderExplosion(explosions[id]);
    }
    Renderer.minimap(shield);

    Renderer.renderPlayer(playerSelf.model, playerSelf.textureSet, totalTime);
    
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
