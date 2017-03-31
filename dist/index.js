'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _meow = require('meow');

var _meow2 = _interopRequireDefault(_meow);

var _fuzzy = require('fuzzy');

var _fuzzy2 = _interopRequireDefault(_fuzzy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

_inquirer2.default.registerPrompt('autocomplete', _inquirerAutocompletePrompt2.default);

(function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(data) {
    var _data, _data2, _data2$, allBranches, _data2$2, history, _data2$3, remotes;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return Promise.all([getAllBranches(), getHistory().catch(function (_) {
              return console.warn('Can\'t find checkout history. Please use git prev setup');
            }), getRemotes()].map(function (x) {
              return x.then(function (x) {
                return x;
              }).catch(function (e) {});
            }));

          case 3:
            data = _context.sent;
            _context.next = 8;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context['catch'](0);

          case 8:
            _data = data, _data2 = _slicedToArray(_data, 3), _data2$ = _data2[0], allBranches = _data2$ === undefined ? [] : _data2$, _data2$2 = _data2[1], history = _data2$2 === undefined ? [] : _data2$2, _data2$3 = _data2[2], remotes = _data2$3 === undefined ? [] : _data2$3;


            showCli({ allBranches: allBranches, history: history, remotes: remotes });

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[0, 6]]);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})()();

var searchBranch = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref3, input) {
    var history = _ref3.history,
        allBranches = _ref3.allBranches;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (input) {
              _context2.next = 6;
              break;
            }

            if (!history.length) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt('return', history);

          case 5:
            return _context2.abrupt('return', allBranches);

          case 6:
            return _context2.abrupt('return', _fuzzy2.default.filter(input, allBranches).map(function (x) {
              return x.original;
            }));

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function searchBranch(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

function showCli(data) {
  var commands = { createPromt: createPromt, setup: setup };

  var cli = (0, _meow2.default)('\n    Usage\n      $ git prev\n\n    Setup git hook for checkout history\n      $ git prev setup\n  ');

  var _cli$input = _slicedToArray(cli.input, 1),
      _cli$input$ = _cli$input[0],
      command = _cli$input$ === undefined ? 'createPromt' : _cli$input$;

  if (command in commands) {
    commands[command](data, cli.flags);
  } else {
    cli.showHelp();
  }
}

function createPromt(data, flags) {
  var promts = [{
    type: 'autocomplete',
    name: 'branch',
    message: 'Select branch',
    source: function source(_, input) {
      return searchBranch(data, input);
    },
    pageSize: 15
  }];

  var remotes = data.remotes;

  var regexp = new RegExp('(' + remotes.join('|') + ')/');

  _inquirer2.default.prompt(promts).then(function (_ref4) {
    var branch = _ref4.branch;

    execute('git checkout ' + branch.replace(regexp, ''));
  });
}

function setup() {
  execute('git rev-parse --show-toplevel').then(function (x) {
    _fs2.default.readFile(_path2.default.join(__dirname, 'post-checkout'), function (err, data) {
      if (err) throw err;

      _fs2.default.writeFile(_path2.default.join(x.trim(), '.git', 'hooks', 'post-checkout'), data, function (err) {
        if (err) throw err;

        console.log('success');
      });
    });
  });
}

function getRemotes() {
  return execute('git remote').then(function (stdout) {
    return stdout.split('\n').map(function (x) {
      return x.trim();
    }).filter(function (x) {
      return !!x;
    });
  });
}

function getAllBranches() {
  return execute('git for-each-ref refs --format=%(refname:short)').then(function (stdout) {
    return stdout.split('\n').map(function (x) {
      return x.trim();
    }).filter(function (x) {
      return !!x;
    });
  });
}

function getHistory() {
  return execute('git rev-parse --show-toplevel').then(function (x) {
    return new Promise(function (resolve, reject) {
      _fs2.default.readFile(_path2.default.join(x.trim(), '.git', 'checkout-history'), 'utf8', function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve([].concat(_toConsumableArray(new Set(data.split('\n').map(function (x) {
            return x.trim();
          }).filter(function (x) {
            return !!x;
          }).reverse()))));
        }
      });
    });
  });
}

function execute(command) {
  return new Promise(function (resolve, reject) {
    (0, _child_process.exec)(command, function (err, stdout, stderr) {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}
