let playerCount = 0;
let maxHealth = 100;
let maxAmmo = 50;
let maxEnergy = 100;
//
// Contains client-side game loop and client-side game state data
const GameView = (function() {

  const PARTICLE_PERIOD = 400;

  // declare variables here and initialize in reset() which is called at the
  // beggining of render.
  let vehicle,
      shield,
      keyboard,
      receivedMessages,
      itemImages,
      boatTextureSet,
      opposingBoatTextureSet,
      messageHistory,
      playerSelf,
      playerOthers,
      particleManager,
      bullets,
      explosions,
      props;

  function reset () {
    playerCount = 0;
    maxHealth = 100;
    maxAmmo = 50;
    maxEnergy = 100;
    vehicle = null;
    shield = null;
    Graphics.clearGameMessageBox();
    keyboard = KeyboardHandler(false, 'keyCode');
    receivedMessages = Queue.create();
    itemImages = {
      'ammo': MyGame.assets['ammo'],
      'health': MyGame.assets['health'],
      'dmg': MyGame.assets['dmg'],
      'speed': MyGame.assets['speed'],
      'gun': MyGame.assets['gun'],
      'gunSpd': MyGame.assets['gunSpd']
    }
    boatTextureSet = {
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
    opposingBoatTextureSet = Object.assign({},boatTextureSet, {
      ship: {
        spriteSet: MyGame.assets['water_units'],
        normal: MyGame.assets['water_units_mapping'].frames["ship_small_b_body.png"],
        damaged: MyGame.assets['water_units_mapping'].frames["ship_small_body_b_destroyed.png"]
      }
    });
    messageHistory = Queue.create();
    playerSelf = {
      model: Player(maxHealth, maxAmmo, maxEnergy),
      textureSet: boatTextureSet,
    };
    playerOthers = {};
    bullets = {};
    explosions = {};

    props = {
      quit: false,
      lastTimeStamp: performance.now(),
      messageId: 1,
      commandKeys: null,
      nextExplosionId: 1,
      FOVDistance: 0.15,
      FOVWidth: 0.25,
      accumulatingParticlePeriod: 0
    };

    particleManager = ParticleManager(Graphics);
  }

  let waitingGameMessage = false;
  let gameMessage = '';
  

  let shieldProps = {
    get distanceToShieldCenter() {
      let viewCenter = {
        x: Coords.viewport.x + (Coords.viewport.width / 2),
        y: Coords.viewport.y + (Coords.viewport.height / 2)
      };

      // yDiff will be squared, so adding a negative wouldn't matter
      let yDiff = viewCenter.y - shield.y;
      let xDiff = viewCenter.x - shield.x;
      return Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
    }, 
    get isClose() {
      return ((shield.radius - this.distanceToShieldCenter) < Coords.viewport.width);
    },
    get viewAngle() {
      let viewCenter = {
        x: Coords.viewport.x + (Coords.viewport.width / 2),
        y: Coords.viewport.y + (Coords.viewport.height / 2)
      };

      // Negate yDiff to account for canvas's coordinate system
      let yDiff = (-(viewCenter.y - shield.y));
      let xDiff = viewCenter.x - shield.x;

      return (-(Math.atan2(xDiff, yDiff) - (Math.PI / 2)));
    },
    get epsilon() {
      let currentRadius = shield.radius;
      let R_1 = 0.5; // Half the world
      let E_1 = 0.2; // Minimum epsilon

      if (currentRadius >= R_1) {
        return E_1;
      }

      let R_2 = Coords.viewport.width / 2;
      let E_2 = Math.PI;
      let slope = (R_2 - R_1) / (E_2 - E_1);

      return ((currentRadius - R_1) / slope) + E_1;
    }
  };

  //
  // Render to initially setup and show the GameView
  function render() {
    reset();
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

    socket.on(GameNetIds.GAME_UPDATE_MESSAGE, data => {
      receivedMessages.enqueue({
        type: GameNetIds.GAME_UPDATE_MESSAGE,
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

    keyboard.addAction(props.commandKeys.MOVE_BACKWARD, elapsedTime => {
      let message = {
        id: props.messageId++,
        elapsedTime: elapsedTime,
        type: GameNetIds.INPUT_MOVE_BACKWARD
      };
      socket.emit(GameNetIds.INPUT, message);
      messageHistory.enqueue(message);
      playerSelf.model.reverse(elapsedTime);
    })

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
    AudioPool.pauseAllLoopSFX();
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
    updateViewportPosition();
    socket.emit(GameNetIds.SET_NAME, {
      username: client.user.name
    })
  }

  function updateViewportPosition() {
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
    playerSelf.model.health = data.player.health;
    playerSelf.model.direction = data.player.direction;
    playerSelf.model.energy = data.player.energy;
    playerSelf.model.useTurbo = data.player.useTurbo;
    playerSelf.model.isDropped = data.player.isDropped;
    playerSelf.model.remainingPlayers = data.player.remainingPlayers;

    shield = Shield(data.shield.x, data.shield.y, data.shield.radius);
    if(shield.radius <= Geometry.LineSegment(shield, playerSelf.model.center).distance + Math.sqrt(2*Math.pow(Coords.viewport.width,2))) {
      AudioPool.playLoopSFX('shield');
    } else {
      AudioPool.pauseLoopSFX('shield');
    }
    
    playerSelf.model.localItems = data.player.items;
    playerSelf.model.ammo = data.player.ammo;
    playerSelf.model.gun = data.player.gun;
    playerSelf.model.dead = data.player.isDead;

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
    let memory = Queue.create();
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
        case GameNetIds.MOVE_BACKWARD:
          playerSelf.model.reverse(message.elapsedTime);
          break;
      }
      memory.enqueue(message);
    }
    messageHistory = memory;

    updateViewportPosition();
  }

  //
  // Small update called in process input (prep for update in gameLoop)
  function updatePlayerOther(data) {
    if (playerOthers.hasOwnProperty(data.clientId)) {
      playerOthers[data.clientId].model.goal.updateWindow = data.player.updateWindow;

      playerOthers[data.clientId].model.goal.position.x = data.player.position.x;
      playerOthers[data.clientId].model.goal.position.y = data.player.position.y;
      playerOthers[data.clientId].model.goal.direction = data.player.direction;
      playerOthers[data.clientId].model.recentlyUpdated = true;
      playerOthers[data.clientId].model.renderLimit = 1000;
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
    AudioPool.playSFX('shoot');
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
    AudioPool.playSFXSet('explosion');
    explosions[props.nextExplosionId] = AnimatedSprite({
      id: props.nextExplosionId++,
      spriteSheet: MyGame.assets['explosion'],
      spriteSize: { width: data.width, height: data.width },
      spriteCenter: data.position,
      spriteCount: 16,
      spriteTime: [ 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
    });

    //
    // When we receive a hit notification, go ahead and remove the
    // associated missle from the client model.
    delete bullets[data.bulletId];
  }

  function newGameMessage(data) {
    waitingGameMessage = true;
    gameMessage += data.message + '\n';
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
        case GameNetIds.GAME_UPDATE_MESSAGE:
          newGameMessage(message.data);
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

    particleManager.update(elapsedTime);

    props.accumulatingParticlePeriod += elapsedTime;
    if ((shield !== null) && shieldProps.isClose
        && (props.accumulatingParticlePeriod >= PARTICLE_PERIOD)) {
      particleManager.createEffect({
        image:  MyGame.assets['violetlight'],
        size: { mean: .003, stdDev: .0005 },
        lifetime: { mean: 600, stdDev: 300 },
        speed: { mean: .00001, stdDev: .000005 },
        circleSegment: {
          center: {x: shield.x, y: shield.y },
          radius: shield.radius,
          viewAngle: shieldProps.viewAngle,
          epsilon: shieldProps.epsilon
        }
      });

      props.accumulatingParticlePeriod = 0;
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
      Renderer.renderGameStart(totalTime, vehicle);
      return;
    }
    Graphics.clear();
    Graphics.translateToViewport();
    GameMap.draw();
       
    particleManager.render();

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
      if(player.model.renderLimit >= 0){
        Renderer.renderPlayer(player.model, player.textureSet, totalTime);
      }
    }
    Renderer.renderItems(playerSelf.model.localItems, itemImages);
    
    Graphics.disableClipping();
    Graphics.createFogEffect(FOVPolygon2, props.FOVDistance);
    Graphics.disableFogClipping();
    for (let id in explosions) {
      Renderer.renderExplosion(explosions[id]);
    }
    Renderer.minimap(shield, playerSelf.model.center);

    Renderer.renderAmmo(playerSelf.model.gun, playerSelf.model.ammo);

    Renderer.renderRemPlayers(playerSelf.model.remainingPlayers);

    if (waitingGameMessage) {
      waitingGameMessage = false;
      Renderer.renderMessages(gameMessage);
      gameMessage = '';
    }

    Renderer.renderPlayer(playerSelf.model, playerSelf.textureSet, totalTime);
    if(waitingGameMessage) {
      waitingGameMessage = false;
      Renderer.renderMessages(gameMessage);
    }
    
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
    } else {
      AudioPool.pauseAllLoopSFX();
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
    playerOthers,
  };
}());
