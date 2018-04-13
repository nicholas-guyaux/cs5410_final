function ImageAsset (src) {
  const img = new Image();
  img.loaded = false;

  img.onload = function () {
    img.loaded = true;
  };
  img.src = src;

  return img;
}
