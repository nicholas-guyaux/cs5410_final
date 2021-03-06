(function (ViewSwitcher, MenuView) {
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

  window.main = (function (e) {
    window.player = {
      name: 'John'
    }

    miscSetup();
    window.socket = null;


    // Create Simple Views that use a viewstarter template
    const CreditsView = ViewStarters.ButtonView('CreditsView', $('#credits-menu')[0], () => {
      MainView.loadView(MenuView.name);
    });
    const OptionsView = ViewStarters.ButtonView('OptionsView', $('#options-menu')[0], () => {
      MainView.loadView(MenuView.name);
    });
    // setup the main view switcher
    window.MainView = ViewSwitcher();
    MainView.addViews(MenuView, CreditsView, HighScoresView, OptionsView, ControlsView, GameLobbyView, LoginView, SignupView, GameView, SplashView, GameOverView);
    MainView.loadView(SplashView.name);

    MainView.events.addEventListener('view-loaded', function () {
      if(e.name === MenuView.name && MainView.socket !== null) {
        socket.disconnect();
        socket = null;
      }
    });
  })
})(ViewSwitcher, MenuView);
