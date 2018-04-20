const HighScoresView = (function HighScoresView (AudioPool) {
  var buttonMenu = null;

  function render(data) {
    console.log(Users.users[0]);
  }

  function unrender(data) {

  }

  function init() {
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Escape', function (e) {
      MainView.loadView(MenuView.name);
      AudioPool.playSFX('menu_click');
    });

    buttonMenu = ButtonMenu($('#highscore-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: 'HighScoresView',
  }
})(AudioPool);
