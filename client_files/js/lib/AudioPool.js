const AudioPool = (function (AudioAsset, throttle) {
  
  const music = new Map();
  const sfx = new Map();
  var activeMusic = null;
  var musicVolume = 0.5;
  var sfxVolume = 0.7;

  function addMusic (nickname, src) {
    music.set(nickname, AudioAsset({
      loop: true,
      volume: musicVolume,
      src,
    }));
  }

  function addAllMusic (...music) {
    for(const [nickname, src] of music) {
      addMusic(nickname, src);
    }
  }

  function addLoopSFX (nickname, srcs) {
    music.set(nickname, AudioAsset({
      loop: true,
      volume: musicVolume,
      src,
    }));
  }

  function addSFX (nickname, src) {
    sfx.set(nickname, AudioAsset({
      src,
      volume: sfxVolume,
    }));
  }

  function addAllSFX (...sfx) {
    for(const [nickname, src] of sfx) {
      addSFX(nickname, src);
    }
  }

  function playMusic (nickname) {
    var newMusic = music.get(nickname);
    if(newMusic === activeMusic) {
      return;
    }
    if(newMusic) {
      if(activeMusic) {
        activeMusic.pause();
      }
      activeMusic = newMusic;
      var p = newMusic.play();
      if(p) {
        p.catch(e => {
          // do nothing
        })
      }
      newMusic.currentTime = 0;
    } else {
      console.warn(`No music by name '${nickname}'.`);
    }
  }

  function audioEnded (audio) {
    new Promise(res => {
      var interval = setInterval(() => {
        if(audio.ended) {
          clearInterval(interval);
          res(audio);
        }
      }, 1000/60);
    });
  }

  function copySFXPlayOnce (sfx) {
    var fx = sfx.cloneNode();
    fx.currentTime = 0;
    fx.volume = sfx.volume;
    fx.play();
    // I guess it cleans up itself??? Otherwise I have
    // no idea how to clean it up at the moment. I assume
    // it's garbage collected when it has no references and
    // has stopped playing.
  }

  const playOneSFX = throttle(copySFXPlayOnce, 1000/30);

  function playSFX (nickname) {
    var sound = sfx.get(nickname);
    if(sound) {
      playOneSFX(sound);
    } else {
      console.warn(`No sound effect by name '${nickname}'.`);
    }
  }

  var mute = false;
  var previousMusicVolume = musicVolume;
  var previousSFXVolume = sfxVolume;
  var that = {
    addMusic,
    addAllMusic,
    addSFX,
    addAllSFX,
    playMusic,
    playSFX,
    get musicVolume () {
      return musicVolume;
    },
    set musicVolume (val) {
      if(val < 0 || val > 1) {
        throw new Error('Invalid volume value. Valid volumes are between 0 and 1 inclusive.');
      }
      musicVolume = val
      for(const el of music.values()) {
        el.volume = val;
      }
    },
    get sfxVolume () {
      return sfxVolume;
    },
    set sfxVolume (val) {
      if(val < 0 || val > 1) {
        throw new Error('Invalid volume value. Valid volumes are between 0 and 1 inclusive.');
      }
      sfxVolume = val
      for(const el of sfx.values()) {
        el.volume = val;
      }
    },
    get mute () {
      return mute;
    },
    set mute (val) {
      val = !!val;
      mute = val;
      if(val) {
        previousMusicVolume = musicVolume;
        previousSFXVolume = sfxVolume;
        that.sfxVolume = 0;
        that.musicVolume = 0;
      } else {
        that.musicVolume = previousMusicVolume;
        that.sfxVolume = previousSFXVolume;
      }
    }
  }

  return that;
})(AudioAsset, throttle);
