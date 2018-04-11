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
  '.woff2': 'font/woff2'
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

server.listen(3000, function() {
  Users.load();
  lobby.initializeSocketIO(server);
  console.log('Server is listening on port 3000');
});
