function ButtonMenu (el) {
  let active = false;

  let shiftIdx = (shiftAmount, length) => (2*length + (shiftAmount % length)) % length;
  
  let buttons = $$('button', el);
  if(!buttons[0]) {
    throw new Error('You need buttons inside this element for ButtonMenu to work!')
;  }
  let selectedIdx = buttons.findIndex(el => el.classList.contains('selected'));
  if(selectedIdx === -1) {
    selectedIdx = 0
    buttons[selectedIdx].classList.add('selected');
  }

  function select (idx) {
    if (idx instanceof Element) {
      const buttonToSelect = idx;
      idx = buttons.findIndex(el => el === buttonToSelect);
    }
    buttons[selectedIdx].classList.remove('selected');
    selectedIdx = idx;
    buttons[selectedIdx].classList.add('selected');
  }

  function shiftSelected (shiftAmount) {
    select(shiftIdx(selectedIdx+shiftAmount, buttons.length))
  }

  var keyboard = KeyboardHandler(true)

  Events.on(buttons, 'click', function (e) {
    AudioPool.playSFX('menu_click');
  });

  Events.on(buttons, 'mouseenter', function (e) {
    AudioPool.playSFX('menu_navigate');
  })

  keyboard.addOnceAction('ArrowUp', () => {
    shiftSelected(-1);
    AudioPool.playSFX('menu_navigate');
  });

  keyboard.addOnceAction('ArrowDown', () => {
    shiftSelected(1);
    AudioPool.playSFX('menu_navigate');
  });

  keyboard.addOnceAction('Enter', () => {
    setTimeout(()=>{
      buttons[selectedIdx].dispatchEvent(new Event('click'));
    }, 0);
  });

  // document.addEventListener('keyup', (e) => {
  //   if(!active) {
  //     return;
  //   }
  //   switch(e.key) {
  //     case 'ArrowUp':
  //     shiftSelected(-1);
  //     AudioPool.playSFX('menu_navigate');
  //     break;
  //     case 'ArrowDown':
  //     shiftSelected(1);
  //     AudioPool.playSFX('menu_navigate');
  //     break;
  //     case 'Enter':
  //     setTimeout(()=>{
  //       buttons[selectedIdx].dispatchEvent(new Event('click'));
  //     }, 0);
  //     AudioPool.playSFX('menu_click');
  //     break;
  //   }
  // });

  return {
    shiftSelected,
    select,
    activate () {
      select(buttons[0]);
      active = true;
      keyboard.activate();
    },
    deactivate () {
      active = false;
      keyboard.deactivate();
    },
  }
}