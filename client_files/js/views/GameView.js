const GameView = (function() {

  function render(){
    Graphics.drawImage(MyGame.assets['blue-brick'], {x: 0.5, y: 0.5}, {width: 0.05, height: 0.05});
  }
  function unrender(){

  }
  function init(){

  }

  return {
    render,
    unrender,
    init,
    name: "GameView",
  }
}());
