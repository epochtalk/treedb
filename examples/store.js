var path = require('path');
var db = require('levelup')(path.join('/', 'tmp', 'treedb'));
var tree = require(path.join(__dirname, '..'))(db);
tree.store({type: 'person', name: 'Foo Bar', slogan: 'hello world'}, function(err, ch) {
  console.log(ch);
});

