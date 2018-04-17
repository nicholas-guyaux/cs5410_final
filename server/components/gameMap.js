let GameMap = require('../../client_files/js/components/gameMap');
var path = require('path');
var fs = require('fs');

const islandsFilePath = path.join(__dirname, '../../client_files/assets/data/islands.json');
const islands = JSON.parse(fs.readFileSync(islandsFilePath, 'utf8'));

GameMap.parseMapJSON(islands);

module.exports = GameMap;
