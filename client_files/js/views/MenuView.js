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
    AudioPool.addMusic('menu', 'assets/sound/09 Come and Find Me - B mix.mp3');
    AudioPool.addSFX('menu_click', 'assets/sound/270324__littlerobotsoundfactory__menu-navigate-00.wav');
    AudioPool.addSFX('menu_navigate', 'assets/sound/270322__littlerobotsoundfactory__menu-navigate-02.wav');
    buttonMenu = ButtonMenu($('#game-menu')[0]);
  }

  return {
    render,
    unrender,
    init,
    name: "MenuView",
  }
})(AudioPool);
