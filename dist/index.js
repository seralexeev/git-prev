'use strict';

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _inquirerAutocompletePrompt = require('inquirer-autocomplete-prompt');

var _inquirerAutocompletePrompt2 = _interopRequireDefault(_inquirerAutocompletePrompt);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

require('babel-polyfill');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

_inquirer2.default.registerPrompt('autocomplete', _inquirerAutocompletePrompt2.default);

_fs2.default.readFile('.git/checkout-history', 'utf8', function (e, data) {
    createPromt(data.split('\n').filter(function (x) {
        return x;
    }).reverse().slice(0, 10));
});

var createPromt = function createPromt(list) {

    var promts = [{
        type: 'autocomplete',
        name: 'branch',
        message: 'Select branch',
        source: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                return _context.abrupt('return', list);

                            case 1:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, undefined);
            }));

            return function source() {
                return _ref.apply(this, arguments);
            };
        }(),
        pageSize: 15
    }];

    _inquirer2.default.prompt(promts).then(function (_ref2) {
        var branch = _ref2.branch;

        (0, _child_process.execFile)('git', ['checkout', branch], function (error, stdout, stderr) {
            if (error) {
                console.error(stderr);
            }
        });
    });
};
