var path = require('path');
var TreeDB = require(path.join(__dirname, 'treedb'));
var keys = require(path.join(__dirname, '..', 'keys'));
var async = require('async');

TreeDB.prototype.store = function(obj, parentKey, cb) {
  if (typeof parentKey === 'function') {
    cb = parentKey;
    parentKey = false;
  }
  if (!parentKey || typeof parentKey !== 'object') parentKey = false;
  if (!cb) cb = noop;
  var self = this;
  var rows = [];
  var cRels = [];
  var pRels = [];
  var key = [obj.type, keys.hash()];
  rows.push({type: 'put', key: key, value: obj});
  var storeRequests = [];
  if (parentKey) {
    // assumes parent already has been saved in the database
    cRels.push({type: 'put', key: parentKey.concat(key), value: 0});
    pRels.push({type: 'put', key: key.concat(parentKey), value: 0});
    storeRequests.push(function(cb) { self.branches.batch(cRels, cb); });
    storeRequests.push(function(cb) { self.roots.batch(pRels, cb); });
  }
  storeRequests.push(function(cb) {
    self.db.batch(rows, cb);
  });
  commit();
  function commit() {
    async.parallel(storeRequests, function(err) {
      cb(err, {key: key, value: obj});
    });
  };
};

