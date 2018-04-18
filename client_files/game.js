const Game = (function(){
  'use strict';
  var lastTimeStamp = performance.now();
  
  //process input
  function processInput(elapsedTime){

  }

  //update
  function update(elapsedTime){

  }

  //render
  function render(elapsedTime){
    Graphics.drawRectangle('rgba(255,255,255,1)', 0, 0, 1, 1);
    GameMap.draw(Graphics.context);
  }

  //gameloop
  function gameloop(time){
    var elapsedTime = (time - lastTimeStamp);
    lastTimeStamp = time;

    processInput(elapsedTime);
    update(elapsedTime);
    render(elapsedTime);

    requestAnimationFrame(gameloop);
  }

  function initialize(){
    Graphics.initialize();

    requestAnimationFrame(gameloop);
  }

  return {
    initialize : initialize
  };
}());
