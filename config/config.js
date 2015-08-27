var path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  secretKey = "sdflkjlk12_!kjlksd",
  env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    apiVersion: 1.0,
    root: rootPath,
    jwtSecretKey: secretKey,
    app: {
      name: 'family100'
    },
    port: 3000,
    db: 'mongodb://localhost/family100-development'
  },

  test: {
    apiVersion: 1.0,
    root: rootPath,
    jwtSecretKey: secretKey,
    app: {
      name: 'family100'
    },
    port: 3000,
    db: 'mongodb://localhost/family100-test'
  },

  production: {
    apiVersion: 1.0,
    root: rootPath,
    jwtSecretKey: secretKey,
    app: {
      name: 'family100'
    },
    port: 3000,
    db: 'mongodb://localhost/family100-production'
  }
};

module.exports = config[env];
