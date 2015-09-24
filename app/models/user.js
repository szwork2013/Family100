/**
 * Author: VincentBel
 * Date: 15/9/22.
 */

var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;
var oAuthTypes = [
  'github',
  'twitter',
  'facebook',
  'google',
  'linkedin'
];

/**
 * User Schema
 */

var UserSchema = new Schema({
  name: {type: String, default: ''},
  email: {type: String, default: ''},
  username: {type: String, default: ''},
  phoneNumber: {type: Number, unique: true},
  provider: {type: String, default: ''},
  hashed_password: {type: String, default: ''},
  salt: {type: String, default: ''},
  authToken: {type: String, default: ''},
  facebook: {},
  twitter: {},
  github: {},
  google: {},
  linkedin: {}
});

/**
 * Virtuals
 */

UserSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password
  });

/**
 * Validations
 */

var validatePresenceOf = function (value) {
  return value && value.length;
};

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path('name').validate(function (name) {
  if (this.skipValidation()) return true;
  return name.length;
}, '称呼不能为空');

UserSchema.path('phoneNumber').validate(function (phoneNumber) {
  if (this.skipValidation()) return true;
  return phoneNumber.length;
}, '电话号码不能为空');

UserSchema.path('phoneNumber').validate(function (phoneNumber) {
  if (this.skipValidation()) return true;
  return phoneNumber.length === 11;
}, '电话号码格式错误');

UserSchema.path('email').validate(function (phoneNumber, fn) {
  var User = mongoose.model('User');
  if (this.skipValidation()) fn(true);

  // Check only when it is a new user or when phoneNumber field is modified
  if (this.isNew || this.isModified('phoneNumber')) {
    User.find({phoneNumber: phoneNumber}).exec(function (err, users) {
      fn(!err && users.length === 0);
    });
  } else fn(true);
}, '手机号已存在');

//UserSchema.path('username').validate(function (username) {
//  if (this.skipValidation()) return true;
//  return username.length;
//}, 'Username cannot be blank');
//
//UserSchema.path('hashed_password').validate(function (hashed_password) {
//  if (this.skipValidation()) return true;
//  return hashed_password.length && this._password.length;
//}, 'Password cannot be blank');


/**
 * Pre-save hook
 */

UserSchema.pre('save', function (next) {
  if (!this.isNew) return next();

  if (!validatePresenceOf(this.password) && !this.skipValidation()) {
    this.password = this.generateRandomPassword();
  }
  next();

});

/**
 * Methods
 */

UserSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  generateRandomPassword: function () {
    return Math.random().toString(36);
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function (password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },

  /**
   * Validation is not required if using OAuth
   */

  skipValidation: function () {
    return (oAuthTypes.indexOf(this.provider) !== -1);
  }
};

/**
 * Statics
 */

UserSchema.statics = {

  /**
   * Load
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  load: function (options, cb) {
    options.select = options.select || 'name username';
    this.findOne(options.criteria)
      .select(options.select)
      .exec(cb);
  }
};

mongoose.model('User', UserSchema);
