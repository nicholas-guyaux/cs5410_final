function AudioAsset (spec) {
  var audio = new Audio(spec.src);
  audio.dataset.loaded = false;
  audio.onload = function () {
    audio.dataset.loaded = true;
  }
  audio.load();

  audio.restart = function () {
    audio.currentTime = 0;
  }

  if(spec.volume) {
    audio.volume = spec.volume
  }

  audio.loop = !!spec.loop;

  return audio;
}
