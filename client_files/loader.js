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
      scripts: ['js/lib/$.js'],
      message: 'Library essentials loaded',
      onComplete: null,
    }, {
      scripts: ['js/lib/AudioAsset'],
      message: 'AudioAsset',
      onComplete: null,
    }, {
      scripts: ['js/lib/ButtonMenu'],
      message: 'ButtonMenu',
      onComplete: null,
    }, {
      scripts: ['js/components/viewport.js']
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
      message: 'Graphics loaded',
      onComplete: null,
    },{
      scripts: ['js/rendering/graphics'],
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
      scripts: ['js/lib/KeyboardHandler'],
      message: 'KeyboardHandler',
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
        // 'js/lib/ImageAsset'                //We haven't included this yet
      ],
      message: 'Librarys loaded',
      onComplete: null,
    }, {
    //   scripts: ['input'],                  //INPUTS
    //   message: 'Input loaded',
    //   onComplete: null,
    // }, {
      scripts: [ //Components / Player Models
        'js/components/player',
        'js/components/player-other'
      ],
      message: 'Player models loaded',
      onComplete: null,
    }, {
      scripts: ['js/rendering/renderer'],
      message: 'Renderer loaded',
      onComplete: null,
    }, {
    //   scripts: [''],                       //Game
    //   message: 'Gameplay model loaded',
    //   onComplete: null,
    // }, {
      scripts: [
        'js/views/MenuView',
        'js/views/GameLobbyView',
        'js/views/GameView',
        'js/views/LoginView',
        'js/views/SignupView',
        'js/views/SplashView',
        'js/components/gameMap'
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
      AudioPool.addMusic('menu', 'assets/sound/09 Come and Find Me - B mix.mp3');
      AudioPool.addMusic('game', 'assets/sound/02 Underclocked (underunderclocked mix).mp3');
      AudioPool.addSFX('menu_click', 'assets/sound/270324__littlerobotsoundfactory__menu-navigate-00.wav');
      AudioPool.addSFX('menu_navigate', 'assets/sound/270322__littlerobotsoundfactory__menu-navigate-02.wav');
      GameMap.load().then(function(){
        GameMap.loadImage()
      });
      console.log('Loading Complete');
      //MainView.loadView(MenuView.name);
      window.main('MenuView');
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
