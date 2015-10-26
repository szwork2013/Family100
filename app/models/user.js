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
  username: {type: String, default: ''},
  phoneNumber: {type: String, unique: true},
  city: {type: String},
  county: {type: String},
  apartment: {},
  provider: {type: String, default: 'local'},
  hashedPassword: {type: String, default: ''},
  _password: {type: String, default: ''},
  salt: {type: String, default: ''},
  facebook: {},
  twitter: {},
  github: {},
  google: {},
  linkedin: {},
  createdAt: {type: Date},
  updatedAt: {type: Date}
});

/**
 * Virtuals
 */

UserSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
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
  return phoneNumber.length === 11;
}, '手机号码长度错误');

UserSchema.path('city').validate(function (city) {
  if (this.skipValidation()) return true;
  return city.length;
}, '城市信息不能为空');

UserSchema.path('county').validate(function (county) {
  if (this.skipValidation()) return true;
  return county.length;
}, '地区信息不能为空');

UserSchema.path('apartment').validate(function (apartment) {
  if (this.skipValidation()) return true;
  return apartment;
}, '户型信息不能为空');

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

UserSchema.pre('save', function (next) {
  var now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

  /**
 * Methods
 */

UserSchema.methods = {

  toClient: function () {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj.hashedPassword;
    delete obj.password;
    delete obj._password;
    delete obj.salt;
    delete obj._id;
    delete obj.__v;

    return obj;
  },

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
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
