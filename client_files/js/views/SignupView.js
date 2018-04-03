const SignupView = (function SignupView (AudioPool) {
  var buttonMenu = null;
  var keyboard = null;

  const submitSignup = function submitSignup (e) {
    var username = $("#signup-username")[0].value;
    var email = $("#signup-email")[0].value;
    var pass = $("#signup-password")[0].value;
    client.createUser({
      name: username,
      email: email,
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
    $("#signup-username")[0].focus();
    keyboard.activate();
  }

  function unrender () {
    keyboard.deactivate();
  }

  function init () {
    // nothing to do
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Enter', submitSignup);
    Events.on($('#signup-button'), 'click', submitSignup);
  }

  return {
    render,
    unrender,
    init,
    name: "SignupView",
  }
})(AudioPool);
