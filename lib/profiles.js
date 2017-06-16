'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tv = require('tv4');

var _tv2 = _interopRequireDefault(_tv);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Internal

var DEFAULT_REMOTE_PATH = 'https://schemas.frictionlessdata.io/registry.json';
var DEFAULT_LOCAL_PATH = 'registry';
if (!_utils2.default.isBrowser) {
  DEFAULT_LOCAL_PATH = _path2.default.join(__dirname, 'schemas', 'registry.json');
}

// Module API

var Profiles = function () {

  // Public

  /**
   * Create a Profiles instance for working with datapackage profiles.
   *
   * @param {Boolean} [remote=false]
   * @returns {Promise}
   */
  function Profiles() {
    var _this = this;

    var remote = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    _classCallCheck(this, Profiles);

    var self = this;
    self._remote = remote;
    var PATH = remote ? DEFAULT_REMOTE_PATH : DEFAULT_LOCAL_PATH;

    return new Promise(function (resolve, reject) {
      _this._loadRegistry(PATH).then(function (registry) {
        self._registry = registry;
        self._basePath = _utils2.default.getDirname(PATH);
        _this._getProfiles().then(function (profiles) {
          self._allProfiles = profiles;
          resolve(self);
        }).catch(function (err) {
          reject(err);
        });
      }).catch(function (err) {
        reject(err);
      });
    });
  }

  /**
   * Retrieve a profile by id.
   *
   * @param {String} [profile='base']
   * @return {Object}
   */


  _createClass(Profiles, [{
    key: 'retrieve',
    value: function retrieve() {
      var profile = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'base';

      return this._allProfiles[profile] || null;
    }

    /**
     * Validate a descriptor against a profile. You can provide custom schema
     * or specify the profile id.
     *
     * @param {Object} descriptor The descriptor that needs to be validated
     * @param {Object|String} profile Schema to validate against, could be ID of a
     * profile or profile Object
     * @return {Array} Empty array or array of errors found
     *
     */

  }, {
    key: 'validate',
    value: function validate(descriptor) {
      var profile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'base';

      function _tv4validation(data, schema) {
        if (schema === null) {
          return ['Error loading requested profile.'];
        }

        var validation = _tv2.default.validateMultiple(data, schema);
        if (validation.valid) {
          return true;
        }

        return _utils2.default.errorsToStringArray(validation.errors);
      }

      if (_lodash2.default.isObject(profile) && !_lodash2.default.isArray(profile) && !_lodash2.default.isFunction(profile)) {
        return _tv4validation(descriptor, profile);
      }

      return _tv4validation(descriptor, this.retrieve(profile));
    }

    // Private

    /**
     * Returns all _profiles grouped by id.
     *
     * @param pathOrURL
     * @return {Promise}
     * @private
     */

  }, {
    key: '_loadRegistry',
    value: function _loadRegistry(pathOrURL) {
      return this._loadFile(pathOrURL).then(function (text) {
        return JSON.parse(text);
      }).then(function (registry) {
        var profiles = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.keys(registry)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            var name = null;
            if (key === 'datapackage') name = 'base';
            if (key.endsWith('-datapackage')) name = key.replace('-datapackage', '');
            if (name) {
              profiles[name] = registry[key];
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return profiles;
      });
    }

    /**
     * Loads specified profile either locally or remotely.
     *
     * @param profile
     * @return {Promise}
     * @private
     */

  }, {
    key: '_loadProfile',
    value: function _loadProfile(profile) {
      if (!profile) {
        return undefined;
      }

      var profilePath = void 0;

      if (_utils2.default.isBrowser && !this._remote) {
        profilePath = profile.schema_path.split('.')[0];
      } else if (this._basePath && profile.schema_path) {
        profilePath = _path2.default.join(this._basePath, profile.schema_path);
      } else {
        profilePath = profile.schema;
      }

      return this._loadFile(profilePath).then(function (text) {
        return JSON.parse(text);
      });
    }

    /**
     * Get all profiles.
     *
     * @return {Promise}
     * @private
     */

  }, {
    key: '_getProfiles',
    value: function _getProfiles() {
      var _this2 = this;

      var profiles = {};
      var getProfilePromises = [];

      _lodash2.default.forEach(this._registry, function (value, key) {
        getProfilePromises.push(_this2._loadProfile(value).then(function (res) {
          return _defineProperty({}, key, res);
        }));
      });

      return Promise.all(getProfilePromises).then(function (values) {
        _lodash2.default.forEach(values, function (value) {
          profiles = _lodash2.default.extend(profiles, value);
        });
        return profiles;
      }).catch(function (err) {
        throw new Error(err);
      });
    }

    /**
     * Wrapper function around Utils.readFileOrURL for handling bundled profiles if
     * remote is set to `false` and running in the browser.
     *
     * @param filePath
     * @return {Promise}
     * @private
     */

  }, {
    key: '_loadFile',
    value: function _loadFile(filePath) {
      if (_utils2.default.isRemoteURL(filePath)) {
        return _utils2.default.readFileOrURL(filePath);
      }

      if (_utils2.default.isBrowser) {
        return new Promise(function (resolve, reject) {
          try {
            // Dynamic require for webpack to bundle all json files from ./schemas
            // so they can be required in the browser
            resolve(JSON.stringify(require('./schemas/' + filePath + '.json')));
          } catch (err) {
            reject(err);
          }
        });
      }

      return _utils2.default.readFileOrURL(filePath);
    }
  }]);

  return Profiles;
}();

/* eslint import/no-dynamic-require: off, prefer-template: off */


exports.default = Profiles;