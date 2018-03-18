function ImageAsset (src) {
  const img = new Image();
  img.dataset.loaded = false;

  img.onload = function () {
    img.dataset.loaded = true;
  };
  img.src = src;

  return img;
}