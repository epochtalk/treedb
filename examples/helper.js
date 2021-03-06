var exp = {};
module.exports = exp;
var path = require('path');

var faker = require('faker');
var rimraf = require('rimraf');

// generation of example models

exp.genBoard = function() {
  var board = {
    title: 'All About ' + faker.hacker.adjective() + ' ' + faker.hacker.noun() + 's',
    desc: faker.lorem.paragraph(),
    created_at: faker.date.past().getTime()
  };
  return board;
};

exp.genThread = function() {
  var thread = {
    subject: faker.hacker.adjective() + ' ' + faker.hacker.adjective() + ' ' + faker.hacker.noun(),
    created_at: faker.date.recent().getTime()
  };
  return thread;
};

exp.genPost = function() {
  var post = {
    title: faker.hacker.adjective() + ' ' + faker.hacker.noun(),
    body: faker.lorem.paragraph(),
    created_at: faker.date.future().getTime()
  };
  return post;
};

exp.teardown  = function() {
  rimraf(path.join(__dirname, '.tdb'), function(error){
    console.log('teardown: removed ./.tdb.');
  });
};
