const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const Errors = {
  UserExists: 'Username already exists',
  InvalidUser: 'Invalid user',
  UserDNE: 'User does not exist',
  WrongUserPass: 'Incorrect user password combo',
  UsersLoaded: 'Users are already loaded'
}

var users = [];

function pbkdf2 (password, salt, iterations) {
  return new Promise((res, rej)=> {
    crypto.pbkdf2(password, salt, iterations, 64, 'sha512', function (err, hash) {
      if(err) rej(err);
      else {
        res(hash.toString());
      }
    });
  })
}

function hashPassword (password, cb) {
  var salt = crypto.randomBytes(128).toString('base64');
  var iterations = 10000;
  return pbkdf2(password, salt, iterations).then(function (hash) {
      return {
        salt: salt,
        hash: hash,
        iterations: iterations
      };
  });
}

function isPasswordCorrect(savedHash, savedSalt, savedIterations, passwordAttempt) {
  return pbkdf2(passwordAttempt, savedSalt, savedIterations).then(hash => {
    return savedHash === hash;
  });
}

function saveKeyboard(commandKeys, user) {
  var user = users.find(u => user.name === u.name);

  // TODO: filter input - use a list of valid keys
  if (user) {
    user.commandKeys = commandKeys;
  }
  write();
}

async function createUser (user) {
  if(!user.name) throw new Error(Errors.InvalidUser)
  if(!user.password) throw new Error(Errors.InvalidUser)
  if(!user.email) throw new Error(Errors.InvalidUser)
  if(users.some(u => u.server.name === user.name)) {
    throw new Error(Errors.UserExists);
  }
  let hash = await hashPassword(user.password);
  delete user.password;
  user.hash = hash.hash;
  user.salt = hash.salt;
  user.iterations = hash.iterations;
  user = {
    server: user,
    client: {
      name: user.name,
      email: user.email,
      commandKeys: {
        ROTATE_RIGHT: 39,
        ROTATE_LEFT: 37,
        MOVE_FORWARD: 38,
        FIRE: 32
      }
    },
    stats: {
      totalGames: 0,
      totalKills: 0,
      totalWins: 0,
      totalDamageDealt: 0,
      shotAccuracy: 0
    }
  };
  users.push(user);
  return user;
}

function getUser () {

}

function write () {
  if(Array.isArray(users)) {
    fs.writeFile(path.join(__dirname, 'data', 'users.json'), JSON.stringify(users), function (err) {
      if(err) {
        console.error(err);
        return;
      }
      console.log('users written');
    })
  }
}

function load () {
  if(users.length > 0) {
    throw new Error(Errors.UsersLoaded);
  }
  fs.readFile(path.join(__dirname, 'data', 'users.json'), 'utf8', function (err, data) {
    if (err) {
      users = [];
      return;
    };
    users = JSON.parse(data);
  });
}

async function loginUser (username, password) {
  const user = users.find(user => user.server.name === username);
  if(user) {
    if(await isPasswordCorrect(user.server.hash, user.server.salt, user.server.iterations, password)) {
      return user;
    } else {
      throw new Error(Errors.WrongUserPass);
    }
  } else {
    throw new Error(Errors.UserDNE);
  }
}

module.exports = {
  load: load,
  get users () {
    return users;
  },
  loginUser: loginUser,
  createUser: createUser,
  Errors: Errors,
  write: write,
};
