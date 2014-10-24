var path = require('path');
var db = require('levelup')(path.join('/', 'tmp', 'treedb'));
var tree = require(path.join(__dirname, '..'))(db);

tree.nodes('person') // returns a readable stream
.on('data', function(ch) {
  console.log(ch);
  tree.get(ch.key, function(err, person) {
    console.log('person');
    console.log(person);
  });
})
.on('end', function() {
  console.log('End');
});

