// This code was adapted from code originally written by Dr. Dean Mathias
const http = require('http');
const path = require('path');
const fs = require('fs');
let game = require('./server/game');
let Users = require('./models/Users');
let Token = require('./Token');
let { Router } = require('./Router');

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

function handleError(err, req, res, next) {
  if(err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal Server Error');
    return;
  }
  next();
}
function handleAPI (req, res) {
  let router = Router(req, res);

  router.get('/api/user/', handleError, async (err, req, res) => {
      try {
        client_user = await Token.check_auth(req.query.token);
        res.status(200);
        res.json({
          user: client_user,
          code: 200,
          token: Token.signUserToken(client_user),
        });
      } catch (e) {
        console.error(e);
        res.status(400);
        res.json({
          msg: e.message,
          code: 400,
        })
      }
  });

  router.post('/api/user/create', handleError, async (err, req, res) => {
    try {
      let user;
      try {
        user = JSON.parse(req.body.user);
      } catch (e) {
        handleError(e, req, res);
        return;
      }
      user = await Users.createUser(user);
      res.status(200);
      res.json({
        user: user.client,
        code: 200,
        token: Token.signUserToken(user.client),
      });
      Users.write();
    } catch (e) {
      console.error(e);
      res.status(400);
      res.json({
        msg: e.message,
        code: 400,
      })
    }
  });

  router.post('/api/user/login', handleError, async (err, req, res) => {
    try {
      let user;
      try {
        user = JSON.parse(req.body.user);
      } catch (e) {
        handleError(e, req, res);
        return;
      }
      user = await Users.loginUser(user.name, user.password);
      res.status(200);
      res.json({
        user: user.client,
        token: Token.signUserToken(user.client),
        code: 200,
      });
    } catch (e) {
      console.error(e);
      res.status(400);
      res.json({
        msg: e.message,
        code: 400,
      })
    }
  });
}

function handleRequest(req, res) {
  if(/\/api.*/.test(req.url)) {
    // route begins with /api
    handleAPI(req, res);
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
  game.initializeSocketIO(server);
  console.log('Server is listening on port 3000');
});
