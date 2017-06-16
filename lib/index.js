'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validate = exports.Resource = exports.Datapackage = undefined;

var _datapackage = require('./datapackage');

var _datapackage2 = _interopRequireDefault(_datapackage);

var _resource = require('./resource');

var _resource2 = _interopRequireDefault(_resource);

var _validate = require('./validate');

var _validate2 = _interopRequireDefault(_validate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Datapackage = _datapackage2.default;
exports.Resource = _resource2.default;
exports.validate = _validate2.default;