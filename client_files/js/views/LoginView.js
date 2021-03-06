const LoginView = (function LoginView (AudioPool) {
  var buttonMenu = null;
  var keyboard = null;

  const submitLogin = function submitLogin (e) {
    var username = $("#login-username")[0].value;
    var pass = $("#login-password")[0].value;
    client.loginUser({
      name: username,
      password: pass,
    }).then(function (d) {
      if(d.code === 200) {
        window.user = d.user;
        MainView.loadView(MenuView.name);
      } else {
        alert(d.msg)
        throw Error(d.msg);
      }
    })
  }

  function render () {
    $("#login-username")[0].focus();
    AudioPool.playMusic('menu');
    keyboard.activate();
  }

  function unrender () {
    keyboard.deactivate();
  }

  function init () {
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Enter', submitLogin);
    Events.on($('#login-button'), 'click', submitLogin);

    Events.on($$('.js-logout'), 'click', function () {
      client.logout();
      MainView.loadView(LoginView.name);
    });
  }

  return {
    render,
    unrender,
    init,
    name: "LoginView",
  }
})(AudioPool);
