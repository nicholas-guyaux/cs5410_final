const AudioPool = (function (AudioAsset, throttle) {
  
  const music = new Map();
  const sfx = new Map();
  const SfxSet = new Map();
  const loopSfx = new Map();
  var activeMusic = null;
  var musicVolume = 0.5;
  var sfxVolume = 0.7;

  function addMusic (nickname, src) {
    var _music = AudioAsset({
      loop: true,
      volume: musicVolume,
      src,
    });
    music.set(nickname, _music);
  }

  function addAllMusic (...music) {
    for(const [nickname, src] of music) {
      addMusic(nickname, src);
    }
  }

  function addSFXSet (nickname, srcs) {
    if(!Array.isArray(srcs)) {
      throw new Error("you must pass an array of sources to addLoopSFX");
    }
    var sfxs = srcs.map(src => AudioAsset({
      loop: false,
      volume: musicVolume,
      src,
    }));
    SfxSet.set(nickname, {
      idx: 0,
      audioAssets: sfxs,
    });
  }

  function addSFX (nickname, src) {
    var _sfx = AudioAsset({
      loop: false,
      src,
      volume: sfxVolume,
    });
    sfx.set(nickname, _sfx);
  }

  function addLoopSFX (nickname, src) {
    var _sfx = AudioAsset({
      loop: true,
      src,
      volume: sfxVolume,
    });
    loopSfx.set(nickname, _sfx);
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
  }

  const playOneSFX = throttle(copySFXPlayOnce, 1000/30);

  function playSFXSet (nickname) {
    const sound = SfxSet.get(nickname);
    const _sfx = sound.audioAssets[sound.idx];
    sound.idx = (sound.idx + 1) % sound.audioAssets.length;
    if(_sfx) {
      playOneSFX(_sfx);
    } else {
      console.warn(`No sound effect by name '${nickname}'.`);
    }
  }

  function playLoopSFX (nickname) {
    const sound = loopSfx.get(nickname);
    if(sound) {
      if(!sound.paused) {
        return;
      }
      sound.play();
    } else {
      console.warn(`No sound effect by name '${nickname}'.`);
    }
  }

  function pauseLoopSFX (nickname) {
    const sound = loopSfx.get(nickname);
    if(sound) {
      if(sound.paused) {
        return;
      }
      sound.pause();
    } else {
      console.warn(`No sound effect by name '${nickname}'.`);
    }
  }

  function playSFX (nickname) {
    var sound = sfx.get(nickname);
    if(sound) {
      playOneSFX(sound);
    } else {
      console.warn(`No sound effect by name '${nickname}'.`);
    }
  }

  function pauseAllLoopSFX () {
    for(const nickname of loopSfx.keys()) {
      pauseLoopSFX(nickname);
    }
  }

  var mute = false;
  var previousMusicVolume = musicVolume;
  var previousSFXVolume = sfxVolume;
  var that = {
    addLoopSFX,
    addSFXSet,
    addMusic,
    addAllMusic,
    addSFX,
    addAllSFX,
    playMusic,
    playSFXSet,
    playLoopSFX,
    playSFX,
    pauseLoopSFX,
    pauseAllLoopSFX,
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
