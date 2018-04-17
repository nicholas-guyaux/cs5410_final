// ------------------------------------------------------------------
//
// Rendering function for an AnimatedSprite object.
//
// ------------------------------------------------------------------
const AnimatedSpriteDraw = (function(graphics) {
  'use strict';
  let that = {};

  that.render = function(sprite) {
    console.log('drawing explosion');
      graphics.drawImageSpriteSheet(
          sprite.spriteSheet,
          { width: sprite.pixelWidth, height: sprite.pixelHeight },
          sprite.sprite,
          { x: sprite.center.x, y: sprite.center.y },
          { width: sprite.width, height: sprite.height }
      );
  };

  return that;
}(Graphics));
