const GameView = (function() {

  function render(){
    Graphics.drawRectangle('rgba(255,255,255,1)', 0, 0, 1, 1);
    Graphics.drawPattern(MyGame.assets['water'], {x: 0, y: 0}, {width: 0.40, height: 0.40});
    //Graphics.drawImage(MyGame.assets['blue-brick'], {x: 0.5, y: 0.5}, {width: 0.05, height: 0.05});
  }
  function unrender(){

  }
  function init(){
    Graphics.initialize();
  }

  return {
    render,
    unrender,
    init,
    name: "GameView",
  }
}());
