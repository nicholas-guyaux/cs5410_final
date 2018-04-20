const HighScoresView = (function HighScoresView (AudioPool) {
  var buttonMenu = null;
  var byKills = {};
  var byWins = {};
  var byDamage = {};
  var byAccuracy = {};

  function render(data) {
    getHighScores().then(([byKills, byWins, byDamage, byAccuracy]) => {

    }).catch(e => { console.error(e); });
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

  function getHighScores(){
    return Promise.all(
      [
        client.get('/api/highscore/byKills'),
        client.get('/api/highscore/byWins'),
        client.get('/api/highscore/byDamage'),
        client.get('/api/highscore/byAccuracy')
      ]
    )
  }

  return {
    render,
    unrender,
    init,
    name: 'HighScoresView',
  }
})(AudioPool);
