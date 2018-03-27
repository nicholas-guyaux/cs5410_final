(function (ViewSwitcher, MenuView) {
  
  // function onScoreUpdate () {
  //   $$('.js-scoreboard-here').forEach(el => {
  //     scoreboard.render(el);
  //   });
  // }

  function miscSetup () {
    Events.on($('#volume-toggle'), 'click', function () {
      if(AudioPool.mute) {
        AudioPool.mute = false;
        this.classList.add('on');
      } else {
        AudioPool.mute = true;
        this.classList.remove('on');
      }
    });
  }

  function main (e) {

    miscSetup();

    // Create Simple Views that use a viewstarter template
    const CreditsView = ViewStarters.ButtonView('CreditsView', $('#credits-menu')[0], () => {
      MainView.loadView(MenuView.name);
    });
    const OptionsView = ViewStarters.ButtonView('OptionsView', $('#options-menu')[0], () => {
      MainView.loadView(MenuView.name);
    });
    const HighScoresView = ViewStarters.ButtonView('HighScoresView', $('#highscore-menu')[0], () => {
      MainView.loadView(MenuView.name);
    });
    // setup the main view switcher
    window.MainView = ViewSwitcher();
    MainView.addViews(MenuView, CreditsView, HighScoresView, OptionsView, GameLobbyView);
    MainView.loadView(MenuView.name);
  }

  // will call main when the DOM has been fully loaded
  window.addEventListener('load', main);

})(ViewSwitcher, MenuView);