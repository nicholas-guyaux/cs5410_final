// This code was adapted from code originally written by Dr. Dean Mathias
const http = require('http');
const path = require('path');
const fs = require('fs');
let game = require('./server/game');
let lobby = require('./server/lobby');
let Users = require('./models/Users');
const { API } = require('./API');

let mimeTypes = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg3',
  '.map': 'application/json',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
};

function handleRequest(req, res) {
  if(/\/api.*/.test(req.url)) {
    // route begins with /api
    API(req, res);
    return;
  }
  let lookup = (req.url === '/') ? '/index.html' : decodeURI(req.url);
  
  let file = lookup.substring(1, lookup.length);

  file = path.join(__dirname, 'client_files', file);
  
  fs.exists(file, function(exists) {
    // TODO: Prevent client from accessing server code
    if (exists) {
      fs.readFile(file, function(err, data) {
        if (err) {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
        else {
          let headers = {'Content-type': mimeTypes[path.extname(lookup)]};
          res.writeHead(200, headers);
          res.end(data);
        }
      });
    }
    else {
      res.writeHead(404);
      res.end();
    }
  });
}

let server = http.createServer(handleRequest);

const port = process.env.PORT || 3000;
server.listen(port, function() {
  Users.load();

  // Initialize root socket.io
  const io = require('socket.io')(server);

  // Create socket.io namespaces for the lobby and the game
  const lobbyIO = io.of('/lobby');
  const gameIO = io.of('/game');

  // Initialize socket.io in both namespaces
  lobby.initializeSocketIO(lobbyIO);
  game.initializeSocketIO(gameIO);

  console.log(`Server is listening on port ${port}`);
});
