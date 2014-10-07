var trigger = require('level-trigger');

module.exports = function(db) {
  var indexes = db.sublevel('indexes');
  var trig = trigger(db, 'index-trigger', function (ch) {
    console.log('ch');
    console.log(ch);
    return ch.key
  },
  function (value, done) {
    console.log('value');
    console.log(value);
    //call done when job is done.
    done();
  });
  return trig;
}

