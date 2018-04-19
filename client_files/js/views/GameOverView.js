const GameOverView = (function GameOverView (AudioPool) {
  var buttonMenu = null;

  // example data
  // {
  //   // they are not subtracted yet from the alive players so this is their position.
  //   place: 3,
  //   totalPlayers: 4,
  // }
  function render (data) {
    $('#gameover-message')[0].innerHTML = HTML.escape(data.place === 1 ? "Battle Boat Boss!" : "Your ship has been sunk!");
    $('#gameover-placement')[0].innerHTML = HTML.escape(data.place);
    $('#gameover-totalplayers')[0].innerHTML = HTML.escape(data.totalPlayers);
    $('#gameover-kills')[0].innerHTML = HTML.escape(data.killCount);
    $('#gameover-damage')[0].innerHTML = HTML.escape(data.bulletStats.damage);
    var accuracy = isNaN(data.bulletStats.accuracy) ? 0 : data.bulletStats.accuracy*100;
    $('#gameover-accuracy')[0].innerHTML = HTML.escape(accuracy);


    AudioPool.playMusic('menu');
    keyboard.activate();
  }

  function showCountdown(seconds) {
    
  }

  function unrender () {
    keyboard.deactivate();
  }

  function init () {
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Escape', function (e) {
      MainView.loadView(MenuView.name);
      AudioPool.playSFX('menu_click');
    });

    buttonMenu = ButtonMenu($('#game-over-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: 'GameOverView',
  }
})(AudioPool);
