'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _resource = require('./resource');

var _resource2 = _interopRequireDefault(_resource);

var _profiles = require('./profiles');

var _profiles2 = _interopRequireDefault(_profiles);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Module API

var DataPackage = function () {

  // Public

  /**
   * Returns a Promise that will resolve in Datapackage instance.
   *
   * @param {Object|String} descriptor - A datapackage descriptor Object or an
   *   URI string
   * @param {Object|String} [profile='base'] - Profile to validate against
   * @param {Boolean} [raiseInvalid=true] - Throw errors if validation fails
   * @param {Boolean} [remoteProfiles=false] - Use remote profiles
   * @param {String} [basePath=''] - Base path for the resources. If the
   *   provided descriptor is a local path to a file, the default value is the
   *   dirname of the path.
   * @return {Promise} - Resolves in class instance or rejects with errors
   * @throws Array of errors if raiseInvalid is true and basePath contains illegal characters
   */
  function DataPackage(descriptor) {
    var profile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'base';
    var raiseInvalid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var _this = this;

    var remoteProfiles = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var basePath = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : '';

    _classCallCheck(this, DataPackage);

    var self = this;

    return new Promise(function (resolve, reject) {
      self._profile = profile;
      self._raiseInvalid = raiseInvalid;
      self._remoteProfiles = remoteProfiles;

      // Check if basePath is valid and throw error if needed
      var basePathErrors = _utils2.default.checkPath(basePath);
      var basePathValid = basePathErrors.length === 0;
      if (!basePathValid) throw basePathErrors;
      self._basePath = DataPackage._getBasePath(descriptor, basePath);

      new _profiles2.default(self._remoteProfiles).then(function (profilesInstance) {
        self._Profiles = profilesInstance;
        return self._loadDescriptor(descriptor);
      }).then(function (theDescriptor) {
        self._descriptor = theDescriptor;
        var valid = self._validateDescriptor(self.descriptor, self._profile);
        if (self._shouldRaise(valid)) reject(_this._errors);
        self._resources = self._loadResources(self.descriptor);

        resolve(self);
      }).catch(function (err) {
        reject(err);
      });
    });
  }

  /**
   * Get datapackage validity
   *
   * @return {Boolean}
   */


  _createClass(DataPackage, [{
    key: 'update',


    /**
     * Updates the current descriptor with the properties of the provided Object.
     * New properties are added and existing properties are replaced.
     * Note: it doesn't do deep merging, it just adds/replaces top level
     * properties
     *
     * @param {Object} newDescriptor
     * @return {Boolean} - Returns validation status of the package
     * @throws {Array} - Will throw Array of Errors if validation fails when
     * raiseInvalid is `false`, or when trying to alter the `resources` property
     */
    value: function update(newDescriptor) {
      if (this._resourcesAreSame(newDescriptor) || !this._raiseInvalid) {
        var mergedDescriptors = _lodash2.default.assignIn({}, this.descriptor, newDescriptor);
        var valid = this._validateDescriptor(mergedDescriptors, this._profile);

        if (this._shouldRaise(valid)) throw new Array(this._errors);
        this._descriptor = mergedDescriptors;

        return this._valid;
      }

      throw new Array(['Please use the "addResource" method for altering the resources']);
    }

    /**
     * Adds new resource to the datapackage and triggers validation of the
     * datapackage. When adding a resource that is already present in the
     * datapackage, the provided resource will be omitted and the return value
     * will be `true`.
     *
     * @param descriptor {Object}
     * @returns {Boolean} - Returns validation status of the package
     * @throws {Array} - Will throw Array of errors if validations fails and
     * raiseInvalid is `true` or descriptor argument is not an Object
     */

  }, {
    key: 'addResource',
    value: function addResource(descriptor) {
      if (_lodash2.default.isObject(descriptor) && !_lodash2.default.isFunction(descriptor) && !_lodash2.default.isArray(descriptor)) {
        var newResource = new _resource2.default(descriptor, this._basePath);
        var resourceFound = _lodash2.default.find(this.resources, function (resource) {
          return _lodash2.default.isEqual(resource, newResource);
        });

        if (!resourceFound) {
          var newDescriptor = this.descriptor;
          newDescriptor.resources.push(descriptor);
          var valid = this._validateDescriptor(newDescriptor, this._profile);
          if (this._shouldRaise(valid)) throw new Array(this._errors);
          this._descriptor = newDescriptor;
          this._resources.push(new _resource2.default(descriptor, this._basePath));

          return this.valid;
        }

        return true;
      }

      throw new Array(['Resource provided is not an Object']);
    }

    // Private

    /**
     * Validate the datapackage descriptor
     *
     * @param {Object} descriptor
     * @param {Object|String} profile
     * @returns {Boolean}
     * @private
     */

  }, {
    key: '_validateDescriptor',
    value: function _validateDescriptor(descriptor, profile) {
      var _this2 = this;

      var descriptorErrors = this._Profiles.validate(descriptor, profile);
      if (descriptorErrors instanceof Array) {
        this._errors = descriptorErrors;
        this._valid = false;
      } else {
        this._valid = true;
      }

      _lodash2.default.forEach(descriptor.resources, function (resource) {
        _this2._valid = _this2.valid && _this2._validateResource(resource);
      });

      return this.valid;
    }

    /**
     * Validate a resource descriptor. It returns the validity of the resource
     * and store any errors in this._errors.
     *
     * @param {Object} resource
     * @return {boolean}
     * @private
     */

  }, {
    key: '_validateResource',
    value: function _validateResource(resource) {
      var resourceObject = new _resource2.default(resource, this._basePath);

      var pathErrors = [];
      if (resourceObject.type !== 'inline') {
        try {
          var valid = resourceObject._validPaths;
        } catch (err) {
          pathErrors = err;
        }
      }

      var pathValid = pathErrors.length === 0;
      this._errors = this.errors.concat(pathErrors);

      return pathValid;
    }

    /**
     * Load the provided descriptor
     *
     * @param descriptor
     * @return {Promise}
     * @private
     */

  }, {
    key: '_loadDescriptor',
    value: function _loadDescriptor(descriptor) {
      var theDescriptor = descriptor;
      if (typeof theDescriptor === 'string') {
        return new Promise(function (resolve, reject) {
          _utils2.default.readFileOrURL(theDescriptor).then(function (res) {
            resolve(JSON.parse(res));
          }).catch(function (err) {
            reject(err);
          });
        });
      }

      return Promise.resolve(theDescriptor);
    }

    /**
     * Check if the provided descriptor has da same resources property as the
     * current descriptor
     *
     * @param newDescriptor
     * @return {Boolean}
     * @private
     */

  }, {
    key: '_resourcesAreSame',
    value: function _resourcesAreSame(newDescriptor) {
      if (newDescriptor.resources) {
        return _lodash2.default.isEqual(newDescriptor.resources, this.descriptor.resources);
      }

      return true;
    }

    /**
     * Load resources from descriptor returning Array of Resource objects
     *
     * @param descriptor
     * @return {[Resource]}
     * @private
     */

  }, {
    key: '_loadResources',
    value: function _loadResources(descriptor) {
      var _this3 = this;

      var resources = [];

      _lodash2.default.forEach(descriptor.resources, function (resource) {
        resources.push(new _resource2.default(resource, _this3._basePath));
      });

      return resources;
    }

    /**
     * Returns true if errors should be raised depending on the validation result
     * and the state of this._raiseInvalid
     *
     * @param valid
     * @return {Boolean}
     * @private
     */

  }, {
    key: '_shouldRaise',
    value: function _shouldRaise(valid) {
      return !valid && this._raiseInvalid;
    }

    /**
     * Returns the basepath from the path of the current descriptor if it is a
     * local path, or the URL if the datapackage was loaded via URL.
     *
     * @param {String} descriptor
     * @param {String} basePath
     * @return {String|null}
     * @private
     */

  }, {
    key: 'valid',
    get: function get() {
      return this._valid;
    }

    /**
     * Get the errors
     *
     * @return {Array}
     */

  }, {
    key: 'errors',
    get: function get() {
      return this._errors || [];
    }

    /**
     * Get the datapackage descriptor
     *
     * @return {Object}
     */

  }, {
    key: 'descriptor',
    get: function get() {
      return this._descriptor;
    }

    /**
     * Get the datapacka Resources
     *
     * @return {[Resource]}
     */

  }, {
    key: 'resources',
    get: function get() {
      return this._resources;
    }
  }], [{
    key: '_getBasePath',
    value: function _getBasePath(descriptor) {
      var basePath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      if (typeof descriptor === 'string') {
        if (_utils2.default.isRemoteURL(descriptor)) {
          return _url2.default.resolve(descriptor, basePath);
        }

        return _path2.default.join(_path2.default.dirname(descriptor), basePath);
      }

      return basePath;
    }
  }]);

  return DataPackage;
}();

exports.default = DataPackage;