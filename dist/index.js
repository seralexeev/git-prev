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

var _meow = require('meow');

var _meow2 = _interopRequireDefault(_meow);

var _fuzzy = require('fuzzy');

var _fuzzy2 = _interopRequireDefault(_fuzzy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

_inquirer2.default.registerPrompt('autocomplete', _inquirerAutocompletePrompt2.default);

var allBranches = void 0,
    history = void 0,
    remoutes = void 0;

var loadHostory = function loadHostory() {
  return new Promise(function (resolve, reject) {
    _fs2.default.readFile('.git/checkout-history', 'utf8', function (err, data) {
      if (err) {
        history = [];
        reject(err);
      } else {
        resolve(history = [].concat(_toConsumableArray(new Set(data.split('\n').filter(function (x) {
          return !!x.trim();
        }).reverse()))));
      }
    });
  });
};

var loadAllBranches = function loadAllBranches() {
  return new Promise(function (resolve, reject) {
    (0, _child_process.exec)('git for-each-ref refs --format=%(refname:short)', function (error, stdout, stderr) {
      if (error) {
        allBranches = [];
        reject(stderr);
      } else {
        resolve(allBranches = stdout.split('\n').map(function (x) {
          return normolize(x);
        }).filter(function (x) {
          return !x.startsWith('*');
        }));
      }
    });
  });
};

var normolize = function normolize(branch) {
  return branch.trim().replace(/^remote\//, "").replace(remoutes, "");
};

var setup = function setup() {};

var searchBranch = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(answers, input) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(!history || !allBranches)) {
              _context.next = 17;
              break;
            }

            _context.prev = 1;
            _context.next = 4;
            return loadAllBranches();

          case 4:
            _context.next = 9;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context['catch'](1);

            console.error(_context.t0);

          case 9:
            _context.prev = 9;
            _context.next = 12;
            return loadHostory();

          case 12:
            _context.next = 17;
            break;

          case 14:
            _context.prev = 14;
            _context.t1 = _context['catch'](9);

            console.error('Can\'t find checkout history. Please use git prev setup');

          case 17:
            if (input) {
              _context.next = 23;
              break;
            }

            if (!history.length) {
              _context.next = 22;
              break;
            }

            return _context.abrupt('return', history);

          case 22:
            return _context.abrupt('return', allBranches);

          case 23:
            return _context.abrupt('return', _fuzzy2.default.filter(input, allBranches).map(function (x) {
              return x.original;
            }));

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[1, 6], [9, 14]]);
  }));

  return function searchBranch(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var createPromt = function createPromt(list) {
  var promts = [{
    type: 'autocomplete',
    name: 'branch',
    message: 'Select branch',
    source: searchBranch,
    pageSize: 10
  }];

  _inquirer2.default.prompt(promts).then(function (_ref2) {
    var branch = _ref2.branch;

    (0, _child_process.exec)('git checkout ' + branch, function (error, stdout, stderr) {
      if (error) {
        console.error(stderr);
      }
    });
  });
};

var commands = { setup: setup, createPromt: createPromt };

(0, _child_process.exec)('git remote', function (err, stdout, stderr) {
  if (err) {
    console.error(err);
  } else {
    remoutes = new RegExp('^' + stdout.split('\n').map(function (x) {
      return x.trim() + '/';
    }).join('|'));
    showCli();
  }
});

var showCli = function showCli() {
  var cli = (0, _meow2.default)('\n\tUsage\n\t  $ git prev\n\n  Examples\n\t  $ git prev setup\n');

  var _cli$input = _slicedToArray(cli.input, 1),
      _cli$input$ = _cli$input[0],
      command = _cli$input$ === undefined ? 'createPromt' : _cli$input$;

  if (command in commands) {
    commands[command](cli.flags);
  } else {
    cli.showHelp();
  }
};
