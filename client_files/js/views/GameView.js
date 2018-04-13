const GameView = (function() {

  function render(){
    AudioPool.playMusic('game');
    
  }
  function unrender(){

  }
  function init(){
    Game.initialize(); 
  }

  return {
    render,
    unrender,
    init,
    name: "GameView",
  }
}());
