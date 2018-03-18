function ViewSwitcher (superView) {
  var that = {
    addView,
    addViews,
    loadView,
  };;

  $$('[data-view]').forEach(el => {
    el.classList.add('hidden');
  })

  that.views = new Map();
  that.events = document.createElement('div');
  that.previousView = null;
  that.currentView = null;

  function addViews (...views) {
    for(var view of views) {
      addView(view);
    }
  }
  
  function addView (view) {
    if(!!that.views.get(view)) {
      // View is already added ignore it.
      return;
    }
    $$(`[data-view-transition="${view.name}"`).forEach(el => {
      el.addEventListener('click', function (e) {
        loadView(this.dataset.viewTransition);
      })
    });
    view.init();
    that.views.set(view.name, view);
  }

  function wrapWithName (event, viewName) {
    return Object.assign(event,{
      name: viewName,
    });
  }

  function loadView (viewName, ...args) {
    let view = that.views.get(viewName);
    if(!!view) {
      if(that.currentView) {
        $$(`[data-view="${that.currentView.name}"]`).forEach(el => {
          el.classList.add('hidden');
        })
        that.currentView.unrender();
      }
      $$(`[data-view="${view.name}"]`).forEach(el => {
        el.classList.remove('hidden');
      })
      that.events.dispatchEvent(wrapWithName(new Event('view-loading'), view.name));
      view.render(...args);
      that.previousView = that.currentView;
      that.currentView = view;
      that.events.dispatchEvent(wrapWithName(new Event('view-loaded'), view.name))
    } else {
      if(superView) {
        try {
          superView.loadView(viewName)
        } catch (e) {
          const errMsg = `No such view, '${viewName}', to load`;
          if(e.message !== errMsg) {
            throw new Error(errMsg);
          } 
        }
      } else {
        throw new Error(errMsg);
      }
    }
  }

  return that;
}