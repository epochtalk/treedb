var path = require('path');
var trigger = require('level-trigger');

var Meta = module.exports = function(tree, stuff) {
  var self = this;
  self.tree = tree;
  self.operations = stuff.operations;
  self.operations.init(tree);
  self.controllers = stuff.controllers;
  trigger(tree.db, 'metadata-trigger', function(ch) {
    var key = ch.key;
    if (ch.type === 'put') {
      // Get the type
      var type = key[0];
      // If a controller exists for the type
      if (self.controllers[type]) {
        // Create a new metadata for it
        // using the controller's model
        if (self.controllers[type].model) {
          var value = new self.controllers[type].model();
          var rows = [];
          rows.push({type: 'put', key: key, value: value});
          self.tree.meta.batch(rows);
        }
        // Call the onPut for the metadata
        if (self.controllers[type].onPut) {
          self.controllers[type].onPut({key: key, value: value});
        }
      };
    }
    else if (ch.type === 'del') {
      // Get the type
      var type = key[0];
      // If a controller exists for the type
      if (self.controllers[type]) {
        // Delete the metadata for it
        if (self.controllers[type].model) {
          var rows = [];
          rows.push({type: 'del', key: key});
          self.tree.meta.batch(rows);
        }
        // Call the onDel for the metadata
        if (self.controllers[type].onDel) {
          self.controllers[type].onDel(key);
        }
      };
    }
    return ch.key;
  }, function(value, done) { done(); });
};

// options:  key, callback, field
Meta.prototype.get = function(options) {
  var self = this;
  var key = options.key;
  self.operations.getValue({key: options.key, callback: function(err, value) {
    options.callback(err, value[options.field]);
  }});
};
