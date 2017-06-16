'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validate;

var _profiles = require('./profiles');

var _profiles2 = _interopRequireDefault(_profiles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Internal

var PROFILES_CACHED = {};

// Module API

/**
 * Standalone function for validating datapackage descriptor against a profile.
 * It encapsulates the Profiles class and exposes only validation. Profile
 * promises are cached and the class will not be initialized on every call.
 *
 * @param {Object} descriptor
 * @param {Object|String} profile
 * @param {Boolean} remoteProfiles
 * @return {Promise} Resolves `true` or Array of errors.
 */
function validate(descriptor) {
  var profile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'base';
  var remoteProfiles = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var remoteString = remoteProfiles.toString();

  if (PROFILES_CACHED[remoteString]) {
    return new Promise(function (resolve, reject) {
      PROFILES_CACHED[remoteString].then(function (profiles) {
        resolve(profiles.validate(descriptor, profile));
      }).catch(function (err) {
        reject(err);
      });
    });
  }

  PROFILES_CACHED[remoteString] = new _profiles2.default(remoteProfiles);

  return new Promise(function (resolve, reject) {
    PROFILES_CACHED[remoteString].then(function (profiles) {
      resolve(profiles.validate(descriptor, profile));
    }).catch(function (err) {
      reject(err);
    });
  });
}