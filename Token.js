const jwt = require('jsonwebtoken');

// normally you would not save your secrets to git
const secret = 'super-secret';
const issuer = 'br';

function verifyUserToken (token, cb) {
  var data = jwt.decode(token);
  return jwt.verify(token, secret, cb);
}

function check_auth (auth_obj) {
  return new Promise ((res, rej) => {
    verifyUserToken(auth_obj, function(err, decoded) {
      // if audience mismatch, err == invalid audience
      if(err) {
        rej(err);
        return;
      }
      res(decoded.user);
    });
  });
}

function signUserToken (userObject) {
  return jwt.sign({
    user: userObject,
  }, secret, {
    expiresIn: '7d'
  });
}

module.exports = {
  signUserToken,
  check_auth,
}
