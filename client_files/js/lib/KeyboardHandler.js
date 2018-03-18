function KeyboardHandler (immediateHandle=false) {

  var active = false;
  var actions = new Map();
  var onceActions = new Map();
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
    var action = getKeys(actions, e.key);
    if(action) {
      queuedActions.add(action);
    }
    var action = getKeys(onceActions, e.key);
    if(action && !addedOnceActions.has(action)) {
      addedOnceActions.add(action);
      queuedActions.add(action);
    }
    if(immediateHandle) {
      handle();
    }
  });

  function getKeys (map, key) {
    return map.get(key) || map.get(dupeKeys.get(key));
  }

  document.addEventListener('keyup', e => {
    if(!active){
      return;
    }
    var action = getKeys(actions, e.key);
    if(action) {
      queuedActions.delete(action);
    }
    var action = getKeys(onceActions, e.key);
    if(addedOnceActions.has(action)) {
      addedOnceActions.delete(action)
    }
    if(immediateHandle) {
      handle();
    }
  });

  function handle (elapsed, gameState) {
    if(!active) return;
    for(var action of queuedActions) {
      action(elapsed, gameState);
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

  function removeAction (key) {
    actions.remove(key);
  }
  
  return {
    handle,
    addAction,
    addOnceAction,
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