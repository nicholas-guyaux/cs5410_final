const SplashView = (function SplashView (client) {

  function render () {
    // should use token stored in local storage and get the user
    window.userLoaded = client.getUser().then(function (d) {
      if(client.user) {
        MainView.loadView(MenuView.name);
      } else {
        MainView.loadView(LoginView.name);
      }
    }).catch(() => {
      MainView.loadView(LoginView.name);
    })
  }

  function unrender () {
    
  }

  function init () {
    
  }

  return {
    render,
    unrender,
    init,
    name: "SplashView",
  }
})(client);
