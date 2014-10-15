var path = require('path');
var db = require('levelup')('/tmp/treedb');
var tree = require(path.join(__dirname, '..'))(db);
var people = [];
tree.nodes('person') // returns a readable stream
.on('data', function(person) {
  people.push(person);
})
.on('end', function() {
  console.log(people);
});

