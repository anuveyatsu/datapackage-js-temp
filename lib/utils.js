'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('isomorphic-fetch');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Internal

var fs = void 0;
var isBrowser = typeof window !== 'undefined';
if (!isBrowser) {
  fs = require('fs');
}

// Module API

var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: 'isRemoteURL',


    // Public

    /**
     * Checks if the provided path is a remote URL
     *
     * @param pathOrURL
     * @return {Array|null}
     */
    value: function isRemoteURL(pathOrURL) {
      if (pathOrURL.constructor === String) {
        return pathOrURL.match(/\w+:\/\/.+/);
      }

      return false;
    }

    /**
     * Check if we're running in browser.
     *
     * @return {boolean}
     */

  }, {
    key: 'readFileOrURL',


    /**
     * Given path to a file, read the contents of the file.
     *
     * @param pathOrURL {String}
     * @return {Promise}
     */
    value: function readFileOrURL(pathOrURL) {
      function _readURL(_url) {
        return fetch(_url).then(function (response) {
          if (!response.ok) {
            throw new Error('Bad response from server');
          }

          return response.text();
        });
      }

      function _readFile(localPath) {
        // WARN: This only works on NodeJS
        return new Promise(function (resolve, reject) {
          fs.readFile(localPath, 'utf8', function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      }

      var result = void 0;

      if (Utils.isRemoteURL(pathOrURL)) {
        result = _readURL(pathOrURL);
      } else {
        if (isBrowser) {
          throw new Error('Reading local files is possible only when running in node.');
        }
        result = _readFile(pathOrURL);
      }

      return result;
    }

    /**
     * Given Error or Array of Errors, convert it to Array with Strings containing
     * the Error message(s).
     *
     * @param values
     * @return {Array}
     */

  }, {
    key: 'errorsToStringArray',
    value: function errorsToStringArray(values) {
      var result = [];
      _lodash2.default.forEach(values, function (error) {
        var errorMessage = error.message;
        if (error.dataPath) {
          errorMessage += ' in "' + String(error.dataPath) + '"';
        }
        if (error.schemaPath) {
          errorMessage += ' schema path: "' + String(error.schemaPath) + '"';
        }
        result.push(errorMessage);
      });
      return result;
    }

    /**
     * Loads the base path (dirname) of the path.
     *
     * @param pathOrURL
     * @return {String|null}
     */

  }, {
    key: 'getDirname',
    value: function getDirname(pathOrURL) {
      if (!Utils.isBrowser && !Utils.isRemoteURL(pathOrURL)) {
        return _path2.default.dirname(_path2.default.resolve(pathOrURL));
      }
      return null;
    }

    /**
     * Checks if the path is valid (or starts with '.' or '/' or contains '..')
     *
     * @param {String} pathOrURL
     * @return {boolean} true for valid path and false for invalid path
     */

  }, {
    key: 'checkPath',
    value: function checkPath(pathOrURL) {
      /**
       * Helper function to search for '..' occurrences.
       *
       * @param sourcePath
       * @returns {Array} Empty array if path is legal or array of validating errors
       */
      function checkForDotDot(sourcePath) {
        if (Utils.isRemoteURL(sourcePath)) {
          // URLs can contain dot dot
          return [];
        }

        var dotdotFound = _lodash2.default.find(sourcePath.replace('\\', '').split('/'), function (dir) {
          return dir === '..';
        });

        if (dotdotFound) {
          return ['Found illegal \'..\' in \'' + String(sourcePath) + '\''];
        }

        return [];
      }

      /**
       * Helper function to check if string starts with '.' or '/'
       *
       * @param sourcePath
       */
      function checkBeginning(sourcePath) {
        var startsWithSlash = sourcePath.charAt(0) === '/';
        var startsWithDot = sourcePath.charAt(0) === '.';

        if (startsWithSlash) {
          return ['Found illegal beginning character \'/\' in \'' + String(sourcePath) + '\''];
        } else if (startsWithDot) {
          return ['Found illegal beginning character \'.\' in \'' + String(sourcePath) + '\''];
        }

        return [];
      }

      if (typeof pathOrURL === 'string') {
        var pathsErrors = [];
        var dotdotErrors = checkForDotDot(pathOrURL);
        var beginningErrors = checkBeginning(pathOrURL);

        return pathsErrors.concat(dotdotErrors).concat(beginningErrors);
      }

      return ['Resource path ' + String(pathOrURL) + ' is not a string.'];
    }
  }, {
    key: 'isBrowser',
    get: function get() {
      return isBrowser;
    }
  }]);

  return Utils;
}();

exports.default = Utils;