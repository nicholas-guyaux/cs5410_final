function TiledImageClipping (spec) {
  // provide numCols only if there are multiple rows.
  spec.numCols = spec.numCols || Infinity;
  /**
   * getClipRegion gets the ith clip
   */
  return function getClipRegion (i) {
    return {
      x: (i % spec.numCols) * spec.width,
      y: (i / spec.numCols) * spec.height,
      width: spec.width,
      height: spec.height,
    };
  };
}
