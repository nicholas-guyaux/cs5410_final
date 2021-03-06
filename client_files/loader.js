MyGame = {
  input: {},
  components: {},
  renderer: {},
  utilities: {},
  assets: {}
};
//Loader modeled after Dean Mathias's example code.
//For better comments, see his github version:
//https://github.com/ProfPorkins/GameTech/blob/master/JavaScript/TileRendering/scripts/loader.js

MyGame.loader = (function() {
  'use strict';
  let scriptOrder = [
    {
      scripts: [
        'shared/game-net-ids',
        'shared/lobby-net-ids'
      ],
      message: 'Network Ids loaded',
      onComplete: null,
    }, {
      scripts: ['shared/queue'],
      message: 'Utilities loaded',
      onComplete: null,
    }, {
      scripts: ['js/lib/client.js'],
      message: 'Library essentials loaded',
      onComplete: null,
    }, {
      scripts: ['js/lib/$.js', 'js/lib/Async.js'],
      message: 'Library essentials loaded',
      onComplete: null,
    }, {
      scripts: ['js/lib/AudioAsset', 'js/lib/ControlsSetter'],
      message: 'AudioAsset',
      onComplete: null,
    }, {
      scripts: ['js/lib/ButtonMenu'],
      message: 'ButtonMenu',
      onComplete: null,
    }, {
      scripts: ['shared/Geometry'],
      message: 'Geometry loaded',
      onComplete: null,
    }, {
      scripts: ['shared/settings'],
      message: 'settings loaded',
      onComplete: null,
    },{
      scripts: ['shared/Coords'],
      message: 'Coords loaded',
      onComplete: null,
    },{
      scripts: [
        'js/rendering/graphics',
        'js/rendering/particle-manager'
      ],
      message: 'Graphics loaded',
      onComplete: null,
    }, {
      scripts: ['js/lib/Events'],
      message: 'Events',
      onComplete: null,
    }, {
      scripts: ['js/lib/ViewStarters'],
      message: 'ViewStarters',
      onComplete: null,
    }, {
      scripts: ['js/lib/ViewSwitcher'],
      message: 'ViewSwitcher',
      onComplete: null,
    }, {
      scripts: ['js/lib/KeyboardHandler', 'js/lib/TiledImageClipping'],
      message: 'KeyboardHandler and TiledImageClipping',
      onComplete: null,
    }, {
      scripts: [
        'js/lib/throttle',
        'js/lib/core'
      ],
      message: 'throttle',
      onComplete: null,
    }, {
      scripts: ['js/lib/HTML'],
      message: 'throttle',
      onComplete: null,
    }, {
      scripts: [
        'js/lib/AudioPool',
        'js/lib/random'
      ],
      message: 'Librarys loaded',
      onComplete: null,
    }, {
      scripts: [ //Components / Player Models
        'js/components/player',
        'js/components/player-other',
        'js/components/bullet',
        'js/components/animated-sprite'
      ],
      message: 'Player models loaded',
      onComplete: null,
    }, {
      scripts: ['js/rendering/renderer'],
      message: 'Renderer loaded',
      onComplete: null,
    }, {
      scripts: [
        'js/views/MenuView',
        'js/views/GameLobbyView',
        'js/views/GameView',
        'js/views/GameOverView',
        'js/views/LoginView',
        'js/views/SignupView',
        'js/views/SplashView',
        'js/views/HighScoresView',
        'js/views/ControlsView',
        'js/components/gameMap',
        'js/components/vehicle',
        'js/components/shield',
      ],
      message: 'Views loaded', 
      onComplete: null,
    }, {
      scripts: ['app.js'],
      message: 'app.js loaded',
      onComplete: null
    }],
    assetOrder =[{
      key: 'test-ship',
      source: 'assets/images/testShip.png'
    }, {
      key: 'water_units',
      source: 'assets/images/water_units.png'
    }, {
      key: 'minimap',
      source: 'assets/images/minimap.png'
    }, {
      key: 'plane',
      source: 'assets/images/plane.png'
    }, {
      key: 'violetlight',
      source: 'assets/images/violetlight.png'
    }, {
      key: 'ammo',
      source: 'assets/images/ammo.png'
    }, {
      key: 'health',
      source: 'assets/images/health.png'
    }, {
      key: 'gun',
      source: 'assets/images/gun.png'
    }, {
      key: 'dmg',
      source: 'assets/images/dmg.png'
    }, {
      key: 'gunSpd',
      source: 'assets/images/gunSpd.png'
    }, {
      key: 'speed',
      source: 'assets/images/speed.png'
    },{
      key: 'explosion',
      source: 'assets/images/explosion.png'
    }];

    function loadScripts(scripts, onComplete){
      //Once all scripts are loaded, call onComplete
      if(scripts.length > 0){
        let entry = scripts[0];
        require(entry.scripts, function() {
          console.log(entry.message);
          if(entry.onComplete)
            entry.onComplete();
          scripts.splice(0,1);
          loadScripts(scripts, onComplete);
        });
      } else {
        onComplete();
      }
    }

    function loadAssets(assets, onSuccess, onError, onComplete){
      //Once all assests are loaded, call onConplete
      if(assets.length > 0){
        let entry = assets[0];
        loadAsset(entry.source,
          function(asset){
            onSuccess(entry, asset);
            assets.splice(0,1);
            loadAssets(assets, onSuccess, onError, onComplete);
          },
          function(error) {
            onError(error);
            assets.splice(0,1);
            loadAssets(assets, onSuccess, onError, onComplete);
          });
      } else {
        onComplete();
      }
    }

    function loadAsset(source, onSuccess, onError){
      let xhr = new XMLHttpRequest(),
        asset = null,
        fileExtension = source.substr(source.lastIndexOf('.') + 1);
      
      if(fileExtension){
        xhr.open('GET', source, true);
        xhr.responseType = 'blob';

        xhr.onload = function() {
          if(xhr.status === 200) {
            //Check fileExtension type
            if(fileExtension === 'png' || fileExtension === 'jpg')
              asset = new Image();
            else if(fileExtension === 'mp3')
              asset = new Audio();
            else if(onError) 
              onError('Unknown file extension: ' + fileExtension);

            asset.onload = function() { window.URL.revokeObjectURL(asset.src); }
            asset.src = window.URL.createObjectURL(xhr.response);
            if(onSuccess) 
              onSuccess(asset);

          } else {
            if (onError)
              onError('Failed to retrieve: ' + source);
          }
        };
      } else {
        if(onError) 
          onError('Unknown file extension: ' + fileExtension);
      }

      xhr.send();
    }

    function mainComplete(){
      AudioPool.addSFXSet('explosion', [
        'assets/sound/explosion_00.wav',
        'assets/sound/explosion_01.wav',
        'assets/sound/explosion_02.wav',
        'assets/sound/explosion_03.wav',
        'assets/sound/explosion_04.wav',
      ])
      AudioPool.addMusic('menu', 'assets/sound/09 Come and Find Me - B mix.mp3');
      AudioPool.addMusic('game', 'assets/sound/02 Underclocked (underunderclocked mix).mp3');
      AudioPool.addSFX('win', 'assets/sound/win.wav');
      AudioPool.addSFX('death', 'assets/sound/death.wav');
      AudioPool.addSFX('shoot', 'assets/sound/shoot.wav');
      AudioPool.addLoopSFX('shield', 'assets/sound/white_noise.wav');
      AudioPool.addSFX('menu_click', 'assets/sound/270324__littlerobotsoundfactory__menu-navigate-00.wav');
      AudioPool.addSFX('menu_navigate', 'assets/sound/270322__littlerobotsoundfactory__menu-navigate-02.wav');
      GameMap.load().then(function(){
        GameMap.loadImage()
      }).then(function () {
        console.log('Loading Complete');
        window.main('MenuView');
      })
    }

    console.log('Starting to dynamically load project assets');
    loadAssets(assetOrder,
      function(source, asset) { MyGame.assets[source.key] = asset; },
      function(error){ console.log(error); },
      function() {
        fetch('assets/data/water_units.json').then(x => x.json()).then(function (water_units_mapping) {
          MyGame.assets['water_units_mapping'] = water_units_mapping;
        }).catch(e => {
          console.error(e);
          throw e;
        }).then(function () {
          console.log('All assets loaded');
          console.log('Starting to dynamically load project scripts');
          loadScripts(scriptOrder, mainComplete);
        });
      }
  );
}());
