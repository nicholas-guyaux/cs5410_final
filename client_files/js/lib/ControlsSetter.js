function ControlsSetter (spec={}) {
  const onChange = spec.onChange || (()=>{});
  var keyActionTitles = {
    ROTATE_RIGHT: 'Rotate Right',
    ROTATE_LEFT: 'Rotate Left',
    MOVE_FORWARD: 'Move Forward',
    MOVE_BACKWARD: 'Move Backward',
    FIRE: 'Fire',
    TURBO: 'Turbo',
  };
  let listeningForKeyInput = false;

  var activeListeners = [];

  function unlisten () {
    for(const listener of activeListeners) {
      listener.removeAll();
    }
    activeListeners = [];
  }

  function render (el, user) {
    el.innerHTML = "";
    for(var key of Object.keys(user.commandKeys)) {
      var keyAction = HTML.escape(key);
      el.innerHTML += stringSingle(user, key);
    }
    Events.on($$('.js-set-key', el), 'click', function (e) {
      if(listeningForKeyInput) {
        return;
      }
      listenForKeyInfo(this, e, user);
    });
  }

  function listenForKeyInfo (el, e, user) {
    el.classList.add('listening')
    listeningForKeyInput = true;
    onChange(listeningForKeyInput);
    activeListeners.push(Events.once([document.body], 'keyup', function (e) {
      e.stopImmediatePropagation();
      setKey(el, e, user);
      listeningForKeyInput = false;
      onChange(listeningForKeyInput);
      el.classList.remove('listening')
      unlisten();
    }));
    activeListeners.push(Events.on([document.body], 'click', function (e) {
      listeningForKeyInput = false;
      onChange(listeningForKeyInput);
      e.stopImmediatePropagation();
      unlisten();
    }));
  }

  function setKey (el, e, user) {
    if(Object.values(e.keyCode).some(code => code === e.keyCode)) {
      alert('Key already assigned');
      return;
    }
    const key = el.dataset.keyAction;
    if(!user.keyNames) {
      user.keyNames = {};
    }
    user.keyNames[key] = e.key;
    user.commandKeys[key] = e.keyCode;
    updateEl(el.closest('.keyCommand-group'), user, key);
    client.saveKeys(user.commandKeys, user.keyNames);
  }

  function updateEl (el, user, key) {
    var name = el.querySelector('.js-insertKeyName');
    var key = user.keyNames && user.keyNames[key] ? user.keyNames[key] : user.commandKeys[key];
    key += "";
    if(key === " ") {
      key = "[space]"
    }
    name.innerHTML = '';
    name.appendChild(document.createTextNode(key));
  }

  function stringSingle(user, key) {
    var keyAction = HTML.escape(key);
    var keyName = user.keyNames && user.keyNames[key] ? user.keyNames[key] : user.commandKeys[key];
    if(keyName === " ") {
      keyName = "[space]"
    }
    return `<div class="keyCommand-group">
      <button class="js-set-key" data-key-action="${keyAction}">Set ${HTML.escape(keyActionTitles[key])}</button>
      Currently: <label class="js-insertKeyName" data-key-action="${keyAction}">${keyName}</label>
    </div>`;
  }

  return {
    render,
    get listening () {
      return listeningForKeyInput;
    },
    unlisten,
  }

}
