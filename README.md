# TreeDB [![Build Status](https://travis-ci.org/epochtalk/treedb.svg?branch=master)](https://travis-ci.org/epochtalk/treedb)

LevelDB backend for hierarchical data.

Store
-----

Storing an object:

```js
var db = require('levelup')('/tmp/treedb');
var tree = require('treedb')(db);
var storeOptions = {
  type: 'person',
  object: {
    name: 'Foo Bar',
    slogan: 'hello world'
  },
  callback: function(err, val) {
    console.log(val);
  }
};
tree.store(storeOptions);

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

tree.store(options)
------------------------------

```
options: {
  object: Object,
  type: String,
  parentKeys: [parentKey, parentKey, ...],
  callback: Function
}
```

`parentKey = [<type>, <id>]`

If `parentKeys` is null, the `obj` that is stored will be a top level object.

-	`obj` - object to store
-	`type` - type of object to store as a String
-	`parentKey` - key of the parent object of the `obj`
-	`cb` - callback function that is called with `function(err, obj)`

var rstream = tree.nodes(options)
------------------------------------

````
options: {
  type: 'type',
  limit: <Number>,
  indexedField: <'field'>,
  indexedValue: <value>
}
````

Return a readable object stream `rstream` with the contents of the nodes of the
given `type`. - `type` - the type of the node as a string, `indexedField` -
field to sort by and of the indexed value - `indexValue'

var rstream = tree.children(options)
--------------------------------------

// options: parentKey, type, indexedField, limit, reverse
````
options: {
  parentKey: ['type', 'id'],
  type: <'type'>,
  indexedField: 'field',
  limit: <Number>,
  reverse: <Boolean>
}
````

Returns a readable stream of children for `parentKey` of type `type`, indexed by `indexedField`.

var rstream = tree.parents(options)
--------------------------------------

````
options: {
  key: ['type', 'id'],
  parentType: <'parentType'>,
  limit: <Number>
}
````

Returns a readable stream of parents for `key` of type `parentType`.

tree.addIndex(options)
------------------------------

```
options: {
  type: String,
  parentType: <String>,
  field: String,
  callback: Function
}
```

If parentType is provided, creates a secondary index.

tree.addIndexes(options)
------------------------------

```
options: {
  indexes: [<index>, ...],
  callback: Function
}
```

```
index:  {
  type: String,
  parentType: <String>,
  field: String
}
```

If parentType is provided, creates a secondary index.

tree.addSecondaryIndex(type, parentType, field, cb)
---------------------------------------------------

Deprecated: Instead, use tree.addIndex({..., parentType, ...})

Install
=======

```
npm install treedb
```

License
=======

MIT
