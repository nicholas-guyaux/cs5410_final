function KeyboardHandler (immediateHandle=false, type="key") {

  var active = false;
  var actions = new Map();
  var onceActions = new Map();
  var upActions = new Map();
  var queuedActions = new Set();
  var addedOnceActions = new Set();
  var keyMappings = [
    ['ArrowDown', 'Down'],
    ['ArrowLeft', 'Left'],
    ['ArrowRight', 'Right'],
    ['ArrowUp', 'Up'],
    ['Escape', 'Esc'],
  ];
  keyMappings = keyMappings.concat(keyMappings.map(x => x.reverse()));
  var dupeKeys = new Map(keyMappings);

  document.addEventListener('keydown', e => {
    if(!active){
      return;
    }
    var action = getKeys(actions, e[type]);
    if(action) {
      queuedActions.add(action);
    }
    var action = getKeys(onceActions, e[type]);
    if(action && !addedOnceActions.has(action)) {
      addedOnceActions.add(action);
      queuedActions.add(action);
    }
    if(immediateHandle) {
      handle(e);
    }
  });

  function getKeys (map, key) {
    return map.get(key) || map.get(dupeKeys.get(key));
  }

  document.addEventListener('keyup', e => {
    if(!active){
      return;
    }
    var action = getKeys(actions, e[type]);
    if(action) {
      queuedActions.delete(action);
    }
    var action = getKeys(onceActions, e[type]);
    if(addedOnceActions.has(action)) {
      addedOnceActions.delete(action)
    }
    var upAction = getKeys(upActions, e[type]);
    if(upAction) {
      queuedActions.add(upAction);
    }
    if(immediateHandle) {
      handle(e);
    }
  });

  function handle (event) {
    if(!active) return;
    for(var action of queuedActions) {
      action(event);
      if(addedOnceActions.has(action)) {
        queuedActions.delete(action);
      }
    }
  };

  function addAction (key, action) {
    actions.set(key, action);
  }

  function addOnceAction (key, action) {
    onceActions.set(key, action);
  }

  function addUpAction (key, action) {
    upActions.set(key,action);
  }

  function removeAction (key) {
    actions.remove(key);
  }
  
  return {
    handle,
    addAction,
    addOnceAction,
    addUpAction,
    removeAction,
    activate () {
      queuedActions.clear();
      active = true;
    },
    deactivate () {
      queuedActions.clear();
      active = false;
    }
  };
}
