'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsontableschema = require('jsontableschema');

var _jsontableschema2 = _interopRequireDefault(_jsontableschema);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Module API

var Resource = function () {

  // Public

  /**
   * Create a Resource instance.
   *
   * @param {Object} descriptor
   * @param {String} [basePath='']
   */
  function Resource(descriptor) {
    var customBasePath;
    arguments[1] === '.' ? customBasePath = '' : customBasePath = arguments[1];
    var basePath = arguments.length > 1 && arguments[1] !== undefined ? customBasePath : '';

    _classCallCheck(this, Resource);

    this._descriptor = descriptor;
    this._basePath = basePath;
  }

  /**
   * Returns the descriptor that was used to initialize the class.
   *
   * @returns {*}
   */


  _createClass(Resource, [{
    key: 'descriptor',
    get: function get() {
      return this._descriptor;
    }

    /**
     * Returns the name in the descriptor.
     *
     * @returns {String}
     */

  }, {
    key: 'name',
    get: function get() {
      return this.descriptor.name;
    }

    /**
     * Returns the location type of the data. Possible values are 'inline', 'remote'
     * and 'local'.
     *
     * @returns {String}
     */

  }, {
    key: 'type',
    get: function get() {
      if (this._sourceKey === 'data') {
        return 'inline';
      }

      var source = this.descriptor[this._sourceKey];
      if (typeof source === 'string') {
        if (_utils2.default.isRemoteURL(source)) {
          return 'remote';
        }
      }

      return 'local';
    }

    /**
     * Returns the path where data is located or
     * if the data is inline it returns the actual data.
     * If the source is a path, the basepath is prepended
     * if provided on Resource initialization.
     *
     * @returns {String|Array|Object}
     */

  }, {
    key: 'source',
    get: function get() {
      var source = this.descriptor[this._sourceKey];

      if (!source) {
        // Neither inline data nor path available
        return null;
      } else if (this.type === 'inline') {
        // Data is inline
        return source;
      } else if (this._sourceKey === 'path' && this._basePath === '') {
        // Local or remote path, no basePath provided
        if (this._validPaths) {
          return source;
        }
      } else if (this._sourceKey === 'path' && this._basePath !== '') {
        // basePath needs to be prepended

        // we need to check the validity of the paths here because one can use
        // only the Resource class to read file contents with `table`
        if (this._validPaths) {
          if (_utils2.default.isRemoteURL(this._basePath)) {
            // basePath is remote URL
            // in case when `source` is an absolute url, url.resolve returns only `source`

            return _url2.default.resolve(this._basePath, source);
          }
          // basePath is local
          return _path2.default.join(this._basePath, source);
        }
      }
    }

    /**
     * Initializes the jsontableschema.Table class with the provided descriptor.
     * If data is not tabular or schema is not defined or not valid the promise
     * resolves to `null`
     *
     * See https://github.com/frictionlessdata/jsontableschema-js#table
     *
     * @returns {Promise}
     * @throws Array if resource path or basePath are not valid
     */

  }, {
    key: 'table',
    get: function get() {
      var _this = this;

      if (this._validPaths) {
        if (!this._table) {
          this._table = new Promise(function (resolve) {
            new _jsontableschema2.default.Table(_this.descriptor.schema, _this.source).then(function (res) {
              resolve(res);
            }).catch(function () {
              resolve(null);
            });
          });
        }
        return this._table;
      }

      throw new Array(['Can\'t initialize table because resource path or ' + 'basePath contain invalid characters. Please see ' + 'https://specs.frictionlessdata.io/data-packages/#data-location']);
    }

    // Private

    /**
     * Private function used to identify if the descriptor contains inline data
     * or provides a path for the data.
     *
     * @returns {String}
     * @private
     */

  }, {
    key: '_sourceKey',
    get: function get() {
      var inlineData = this.descriptor.data;

      if (inlineData) {
        return 'data';
      }

      return 'path';
    }

    /**
     * Check if resource path and basePath are valid
     *
     * @return {true}
     * @throws Array of errors if the resource path or basePath is not valid
     * @private
     */

  }, {
    key: '_validPaths',
    get: function get() {
      if (typeof this._valid !== 'undefined') {
        return this._valid;
      }

      if (this._sourceKey === 'path') {
        Resource._validatePath(this._basePath);
        Resource._validatePath(this.descriptor[this._sourceKey]
        // If nothing is thrown by _.validatePath resource is marked as valid if
        // late reference is needed
        );this._valid = true;

        return this._valid;
      }

      // Data is inline
      this._valid = true;

      return this._valid;
    }

    /**
     * Throws an Error if path is invalid or returns true
     *
     * @param {String} resourcePath
     * @return {true}
     * @throws Array of errors if the resource path or basePath is not valid
     * @private
     */

  }], [{
    key: '_validatePath',
    value: function _validatePath(resourcePath) {
      var pathErrors = _utils2.default.checkPath(resourcePath);
      var pathValid = pathErrors.length === 0;
      if (!pathValid) {
        throw pathErrors;
      }

      return true;
    }
  }]);

  return Resource;
}();

/* eslint consistent-return: off */


exports.default = Resource;
