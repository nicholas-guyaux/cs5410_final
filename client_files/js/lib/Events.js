var Events = (function ($$) {
  function on (els, event, cb) {
    els.forEach(function (el) {
      el.addEventListener(event, cb);
    })
    return {
      removeAll () {
        els.forEach(function (el) {
          el.removeEventListener(event, cb);
        });
      }
    }
  }

  function simulateClick (el) {
    var event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    var cancelled = !el.dispatchEvent(event);
  }

  function once (els, event, cb) {
    var elListener = el => function listener (e) {
      cb.call(this, e);
      el.removeEventListener(event, listener)
    };
    var listeners = [];
    els.forEach(function (el) {
      let listener = elListener(el);
      el.addEventListener(event, listener);
      listeners.push(listener);
    })
    return {
      removeAll () {
        return els.forEach(function (el) {
          let listener = listeners.shift();
          el.removeEventListener(event, listener);
        });
      }
    }
  }

  function onceKey (els, keyIdentifier, cb) {

    var current = once(els, 'keyup', function ListeningForKey (e) {
      if(e.key === keyIdentifier) {
        cb.call(this, e);
      } else {
        // recursive event!
        current = once(els, 'keyup', ListeningForKey);
      }
    })
    return {
      removeAll () {
        current.removeAll();
      }
    }
  }

  // Set the name of the hidden property and the change event for visibility
  var hidden, visibilityChange; 
  if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }
  function onPageVisibility (cb) {
    document.addEventListener(visibilityChange, function (e) {
      cb.call(this, Object.assign(e, {
        hidden: document[hidden],
      }));
    }, false);
  }

  return {
    on,
    once,
    onceKey,
    onPageVisibility,
    simulateClick,
  }
})($$);
