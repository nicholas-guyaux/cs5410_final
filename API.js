let { Router } = require('./Router');
let Token = require('./Token');
let Users = require('./models/Users');
const config = require('./server/config');
const lobby = require('./server/lobby');

function handleError(err, req, res, next) {
  if(err) {
    console.error(err);
    res.writeHead(500);
    res.end('Internal Server Error');
    return;
  }
  next();
}

function API (req, res) {
  let router = Router(req, res);

  router.get('/api/user/', handleError, async (err, req, res) => {
      try {
        client_user = await Token.check_auth(req.query.token);
        var user = Users.findUser(client_user.name);
        if(!user) {
          throw new Error('User in token does not exist');
        }
        res.status(200);
        res.json({
          user: user.client,
          code: 200,
          token: Token.signUserToken(user.client),
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

  router.post('/api/user/keyConfig', handleError, async (err, req, res) => {
    try {
      try {
        commandKeys = JSON.parse(req.body.commandKeys);
        keyNames = JSON.parse(req.body.keyNames);
      } catch (e) {
        handleError(e, req, res);
        return;
      }
      client_user = await Token.check_auth(req.body.token);
      let user = Users.saveKeyboard(commandKeys, keyNames, client_user);
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

  router.get('/api/highscore/sortedUsers', handleError, async(err, req, res) =>{
    try{
      let users;
      users = Users.sorted;
      res.status(200);
      res.json({
        users: users,
        code: 200
      });
    } catch(e) {
      handleError(e, req, res);
      return;
    }
  });

  router.post('/api/game/numPlayersRequired', handleError, function () {
    try {
      const numRequired = parseInt(req.body.n, 10);
      config.numPlayersRequired = numRequired;
      lobby.updateNumClients();
      res.status(200);
      res.json({
        message: "users updated",
        code: 200
      });
    } catch (e) {
      handleError(e, req, res);
      return;
    }
  });
}

module.exports = {
  API,
}
