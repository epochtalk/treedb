var path = require('path');
var db = require('levelup')('/tmp/treedb');
var tree = require(path.join(__dirname, '..'))(db);
tree.store({type: 'person', name: 'Foo Bar', slogan: 'hello world'}, function(err, val) {
  console.log(val);
});

