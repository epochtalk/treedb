# TreeDB [![Build Status](https://travis-ci.org/epochtalk/treedb.svg?branch=master)](https://travis-ci.org/epochtalk/treedb)

LevelDB backend for hierarchical data.

Store
-----

Storing an object:

```js
var db = require('levelup')('/tmp/treedb');
var tree = require('treedb')(db);
tree.store({
  type: 'person',
  name: 'Foo Bar',
  slogan: 'hello world'
}, function(err, val) {
  console.log(val);
});

```

Output:

```
[ 'person', 'WkvBeQ1yB' ]
```

Query
-----

Query all person types:

```js
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

```

Output:

```
[ { key: [ 'person', 'WkvBeQ1yB' ],
    value: { type: 'person', name: 'Foo Bar', slogan: 'hello world' } } ]
```

Methods
=======

var tree = require('treedb')(db)
--------------------------------

Create a new `treedb` from a leveldb handle `db` and set it to the `tree` handle.

tree.store(obj, parentKey, cb)
------------------------------

If `parentKey` is null, the `obj` that is stored will be a top level object.

-	`obj` - object to store
-	`parentKey` - key of the parent object of the `obj`
-	`cb` - callback function that is called with `function(err, obj)`

var rstream = tree.nodes(type, opts)
------------------------------------

Return a readable object stream `rstream` with the contents of the nodes of the given `type`. - `type` - the type of the node as a string - `opts` - options object - `indexedField` - field to sort by

var rstream = tree.children(key, opts)
--------------------------------------

tree.addIndex(type, field, cb)
------------------------------

tree.addSecondaryIndex(type, parentType, field, cb)
---------------------------------------------------

Install
=======

```
npm install treedb
```

License
=======

MIT
