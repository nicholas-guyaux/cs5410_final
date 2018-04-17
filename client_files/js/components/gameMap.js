// const GameMap = (function(){
//   var map = {};
// fetch('assets/data/map.json').then(stream => stream.json()).then(function(data){
//   Object.assign(map, data);
//   map.numXTiles = map.width;
//   map.numYTiles = map.height;
//   map.tileSize = {};
//   map.tileSize.x = map.tilewidth;
//   map.tileSize.y = map.tileheight;
//   map.pixelSize = {};
//   map.pixelSize.x = map.numXTiles * map.tileSize.x;
//   map.pixelSize.y = map.numYTiles * map.tileSize.y;
// });
//   return map;
// }());

(function(exports){
  var map = ({
    currMapData: null,
    tileSets: new Array(),
    // viewRect: {
    //   "x": 0,
    //   "y": 0,
    //   "w": 1000,
    //   "h": 1000
    // },
    numXTiles: 100,
    numYTiles: 100,
    tileSize: {
      "x": 64,
      "y": 64
    },
    pixelSize: {
      "x": 64,
      "y": 64
    },
    tileImg:null,
    imgLoadCount:0,
    preCacheCanvasArray:null,
    fullyLoaded:false,
    //---------------------------
    load: function (){
      return fetch('assets/data/islands.json').then(stream => stream.json()).then(function(data){
        GameMap.parseMapJSON(data);
      });
    //xhrGet(map, false,function(data)
    // {
    // 	GameMap.parseMapJSON(data.response);
    // });
    },
    //---------------------------
    _tempInput:null,
    loadImage:function(){
      var map = this.currMapData;      
      var GameMap = this;
      for (var i = 0; i < map.tilesets.length; i++){
        var img = new Image();
        img.onload = new function() {GameMap.imgLoadCount++;};
        img.src = "../assets/images/" + map.tilesets[i].image.replace(/^.*[\\\/]/, '');
        var ts = {
          "firstgid": map.tilesets[i].firstgid,
          "image": img,
          "imageheight": map.tilesets[i].imageheight,
          "imagewidth": map.tilesets[i].imagewidth,
          "name": map.tilesets[i].name,
          "numXTiles": Math.floor(map.tilesets[i].imagewidth / this.tileSize.x),
          "numYTiles": Math.floor(map.tilesets[i].imageheight / this.tileSize.y)
        };
        this.tileSets.push(ts);
        //clm precache the bg
        checkWait(function(){
          return GameMap.imgLoadCount == GameMap.tileSets.length;
        },function (){
          GameMap.fullyLoaded = true;
        });
      }
    },
    parseMapJSON:function(mapJSON){
    this.currMapData = mapJSON;
    
    var map = this.currMapData;
    this.numXTiles = map.width;
    this.numYTiles = map.height;
    this.tileSize.x = map.tilewidth;
    this.tileSize.y = map.tileheight;
    this.pixelSize.x = this.numXTiles * this.tileSize.x;
    this.pixelSize.y = this.numYTiles * this.tileSize.y;
    this.collisionMap = mapJSON.layers[1].data;
    this.gridMap = [];
    let x = 0;
    for (let i =0; i<100; i++) {
      this.gridMap.push([]);
      for (let j = 0; j < 100; j++) {
        this.gridMap[i].push(this.collisionMap[x]);
        x++;
      }
    }
    
      //load our tilesets if we are a client.
    
    },
    //---------------------------
    getTilePacket: function (tileIndex) {
      var pkt = {
        "img": null,
        "px": 0,
        "py": 0
      };
      var i = 0;
      for (i = this.tileSets.length - 1; i >= 0; i--) {
        if (this.tileSets[i].firstgid <= tileIndex) break;
      }
  
      pkt.img = this.tileSets[i].image;
      var localIdx = tileIndex - this.tileSets[i].firstgid;
      var lTileX = Math.floor(localIdx % this.tileSets[i].numXTiles);
      var lTileY = Math.floor(localIdx / this.tileSets[i].numXTiles);
      pkt.px = (lTileX * this.tileSize.x);
      pkt.py = (lTileY * this.tileSize.y);
  
      return pkt;
    },
    collision:function(playerX, playerY, playerSize) {
      if(playerX >= 1 || playerY >= 1 || playerX <= 0 || playerY <= 0) {
        return false;
      }
      for (let i1 = Math.ceil((playerX - playerSize/2) * 100), i2 = Math.floor((playerX + playerSize/2) * 100); i1 < i2; i1++) {
        for (let j1 = Math.ceil((playerY - playerSize/2) * 100), j2 = Math.floor((playerY + playerSize/2) * 100); j1 < j2; j1++) {
          if (this.gridMap[j1][i1] !== 0) {
            return false;
          }
        }
      }
      return true;
    },
    //---------------------------
    intersectRect:function (r1, r2) {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
    },
    //---------------------------
    draw: function () { //
      if(!this.fullyLoaded) return;
  
      for (var layerIdx = 0; layerIdx < this.currMapData.layers.length; layerIdx++){
        if (this.currMapData.layers[layerIdx].type != "tilelayer") continue;
  
        var dat = this.currMapData.layers[layerIdx].data;
        //find what the tileIndexOffset is for this layer
        for (var tileIDX = 0; tileIDX < dat.length; tileIDX++) {
          var tID = dat[tileIDX];
          if (tID == 0) continue;
  
          var tPKT = this.getTilePacket(tID);
  
          //test if this tile is within our world bounds
          var worldX = Math.floor(tileIDX % this.numXTiles) * this.tileSize.x;
          var worldY = Math.floor(tileIDX / this.numYTiles) * this.tileSize.y;
          if ((worldX + this.tileSize.x) < Graphics.viewport.world.x 
            || (worldY + this.tileSize.y) < Graphics.viewport.world.y 
            || worldX > Graphics.viewport.world.x + Graphics.viewport.canvas.width 
            || worldY > Graphics.viewport.world.y + Graphics.viewport.canvas.height) continue;
  
          //adjust all the visible tiles to draw at canvas origin.
          // worldX += Graphics.viewport.x;
          // worldY += Graphics.viewport.y;
  
          // Nine arguments: the element, source (x,y) coordinates, source width and 
          // height (for cropping), destination (x,y) coordinates, and destination width 
          // and height (resize).
          
          // Graphics.drawTiledImage(tPKT.img, tPKT.px, tPKT.py, this.tileSize.x, this.tileSize.y, worldX, worldY);
          Graphics.drawFromTiledCanvas("map-tiled-imageset", tPKT.img, tPKT.px, tPKT.py, this.tileSize.x, this.tileSize.y, worldX, worldY);
          
          //ctx.drawImage(tPKT.img, tPKT.px, tPKT.py, this.tileSize.x, this.tileSize.y, worldX, worldY, this.tileSize.x, this.tileSize.y);
  
        }
      }
    },
  });
  Object.assign(exports, map);
})(typeof exports === 'undefined' ? this['GameMap'] = {} : exports);
