var path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'family100'
    },
    port: 3000,
    db: 'mongodb://localhost/family100-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'family100'
    },
    port: 3000,
    db: 'mongodb://localhost/family100-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'family100'
    },
    port: 3000,
    db: 'mongodb://localhost/family100-production'
  }
};

module.exports = config[env];
