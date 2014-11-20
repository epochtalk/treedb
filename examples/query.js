var path = require('path');
var db = require('levelup')(path.join('/', 'tmp', 'treedb'));
var tree = require(path.join(__dirname, '..'))(db);
var people = [];
tree.nodes({type: 'person'}) // returns a readable stream
.on('data', function(person) {
  people.push(person);
})
.on('end', function() {
  console.log(people);
});

