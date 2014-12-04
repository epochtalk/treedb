var path = require('path');
var vault = require(path.join(__dirname, 'vault'));
var Operations = module.exports = {};
var tree;
var noop = function(){};

Operations.init = function(inputTree) {
  tree = inputTree;
};

// options: key, callback(parentKey)
Operations.getParentKey = function(options, cb) {
  var callback = cb || noop;
  var q = {gt: options.key.concat(null), lt: options.key.concat(undefined), limit: 1};
  var parentKey = null;
  tree.roots.createReadStream(q).on('data', function(ch) {
    parentKey = [ch.key[2], ch.key[3]];
  }).on('end', function() {
    cb(parentKey);
  });
};

// options: key, callback(err, value)
Operations.getValue = function(options, cb) {
  // TODO: createReadStream here
  tree.meta.get(options.key, function(err, value) {
    cb(err, value);
  });
};

// options: key, recursive, worker({value, callback})
Operations.updateValue = function(options) {
  var key = options.key;
  var lock = vault.getLock(key);
  lock.runwithlock(function() {
    Operations.getValue({key: options.key}, function(err, value) {
      options.worker({value: value, callback: function() {
        // Put the new value to the key
        var rows = [];
        rows.push({type: 'put', key: key, value: value});
        tree.meta.batch(rows, function() {
          // Recurse
          if (options.recursive) {
            var recursiveOptions = options;
            // Add lock to array
            if (!Array.isArray(recursiveOptions.locks)) {
              recursiveOptions.locks = [];
            }
            recursiveOptions.locks.push(lock);
            Operations.getParentKey({key: key}, function(parentKey) {
              if (parentKey) {
                recursiveOptions.key = parentKey;
                Operations.updateValue(recursiveOptions);
              }
              else {
                // Release all locks
                recursiveOptions.locks.forEach(function(lock) {
                  lock.release();
                });
              }
            });
          }
          else {
            // if not recursive, release the lock
            // there is no parent or child
            lock.release();
          }
        });
      }});
    });
  });
};

// options: key, field, recursive, callback
Operations.increment = function(options) {
  options.increment = 1;
  Operations.add(options);
};

// options: key, field, recursive, callback
Operations.decrement = function(options) {
  options.increment = -1;
  Operations.add(options);
};

// options: key, field, increment, recursive, callback
Operations.add = function(options) {
  options.worker = function(updateOptions) {
    // Add to the value
    updateOptions.value[options.field] += options.increment;
    updateOptions.callback(updateOptions.value);
  };
  Operations.updateValue(options);
};
