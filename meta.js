var path = require('path');
var trigger = require('level-trigger');
var noop = function(){};

var Meta = module.exports = function(tree, opts) {
  var self = this;
  self.tree = tree;
  self.operations = opts.operations;
  self.operations.init(tree);
  self.controllers = opts.controllers;

  // trigger(tree.db, 'metadata-trigger', function(ch) {
  //   var key = ch.key;
  //   if (ch.type === 'put') {
  //     // Get the type
  //     var type = key[0];
  //     // If a controller exists for the type
  //     if (self.controllers[type]) {
  //       // Create a new metadata for it
  //       // using the controller's model
  //       if (self.controllers[type].model) {
  //         var value = new self.controllers[type].model();
  //         var rows = [];
  //         rows.push({type: 'put', key: key, value: value});
  //         self.tree.meta.batch(rows);
  //       }
  //       // Call the onPut for the metadata
  //       if (self.controllers[type].onPut) {
  //         self.controllers[type].onPut({key: key, value: value});
  //       }
  //     };
  //   }
  //   else if (ch.type === 'del') {
  //     // Get the type
  //     var type = key[0];
  //     // If a controller exists for the type
  //     if (self.controllers[type]) {
  //       // Delete the metadata for it
  //       if (self.controllers[type].model) {
  //         var rows = [];
  //         rows.push({type: 'del', key: key});
  //         self.tree.meta.batch(rows);
  //       }
  //       // Call the onDel for the metadata
  //       if (self.controllers[type].onDel) {
  //         self.controllers[type].onDel(key);
  //       }
  //     };
  //   }
  //   return ch.key;
  // }, function(value, done) { done(); });
};

// options:  key, callback, field
Meta.prototype.get = function(options, cb) {
  var self = this;
  var key = options.key;
  var callback = cb || noop;
  self.operations.getValue({key: options.key}, function(err, value) {
    if (options.field) {
      cb(err, value[options.field]);
    }
    else {
      cb(err, value);
    }
  });
};
