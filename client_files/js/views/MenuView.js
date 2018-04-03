const MenuView = (function MenuView (AudioPool) {
  var buttonMenu = null;
  let user = null;

  function render () {
    AudioPool.playMusic('menu');
    buttonMenu.activate();
    if(client.user !== user) {
      user = client.user;
      $$('.insert-username-here').forEach(function (element) {
        element.innerHTML = '';
        element.appendChild(document.createTextNode(user.name));
      })
    }
  }

  function unrender () {
    buttonMenu.deactivate();
  }

  function init () {
    buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: "MenuView",
  }
})(AudioPool);
