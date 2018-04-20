let { Router } = require('./Router');
let Token = require('./Token');
let Users = require('./models/Users');

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

  router.get('/api/highscore/byKills', handleError, async(err, req, res) =>{
    try{
      let users;
      users = Users.sorted.byKills;
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

  router.get('/api/highscore/byWins', handleError, async(err, req, res) =>{
    try{
      let users;
      users = Users.sorted.byWins;
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

  router.get('/api/highscore/byDamage', handleError, async(err, req, res) =>{
    try{
      let users;
      users = Users.sorted.byDamage;
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

  router.get('/api/highscore/byAccuracy', handleError, async(err, req, res) =>{
    try{
      let users;
      users = Users.sorted.byAccuracy;
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
}

module.exports = {
  API,
}
