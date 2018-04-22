const SignupView = (function SignupView (AudioPool) {
  var buttonMenu = null;
  var keyboard = null;

  const submitSignup = function submitSignup (e) {
    var username = $("#signup-username")[0].value;
    var email = $("#signup-email")[0].value;
    var pass = $("#signup-password")[0].value;
    var passConfirm = $('#signup-password-confirm')[0].value;
    if(pass !== passConfirm) {
      alert("Your passwords do not match");
    }
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

  function passwordCheck () {
    var pass = $("#signup-password")[0];
    var passConfirm = $('#signup-password-confirm')[0];
    if(pass.value !== passConfirm.value) {
      const colorWrong = 'red'
      pass.style.borderColor = colorWrong;
      passConfirm.style.borderColor = colorWrong;
    } else {
      const colorCorrect = 'green'
      pass.style.borderColor = colorCorrect
      passConfirm.style.borderColor = colorCorrect;
    }
  }

  function render () {
    $("#signup-username")[0].focus();
    keyboard.activate();
  }

  function unrender () {
    keyboard.deactivate();
  }

  function init () {
    keyboard = KeyboardHandler(true);
    keyboard.addOnceAction('Enter', submitSignup);
    Events.on($('#signup-button'), 'click', submitSignup);
    passwordCheck();
    Events.on($('#signup-password'), 'keyup',  passwordCheck);
    Events.on($('#signup-password-confirm'), 'keyup', passwordCheck);
  }

  return {
    render,
    unrender,
    init,
    name: "SignupView",
  }
})(AudioPool);
