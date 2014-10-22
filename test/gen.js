var exp = {};
module.exports = exp;

var path = require('path');
var faker = require('faker');
var rimraf = require('rimraf');

// generation of example models

exp.board = function() {
  var board = {
    type: 'board',
    title: 'All About '
      + faker.hacker.adjective()
      + ' ' + faker.hacker.noun()
      + 's',
    desc: faker.lorem.paragraph(),
    created_at: faker.date.past().getTime()
  };
  return board;
};

exp.thread = function() {
  var thread = {
    type: 'thread',
    subject: faker.hacker.adjective()
      + ' '
      + faker.hacker.adjective()
      + ' ' + faker.hacker.noun(),
    created_at: faker.date.recent().getTime(),
    updated_at: faker.date.future().getTime()
  };
  return thread;
};

exp.post = function() {
  var post = {
    type: 'post',
    title: faker.hacker.adjective() + ' ' + faker.hacker.noun(),
    body: faker.lorem.paragraph(),
    created_at: faker.date.future().getTime()
  };
  return post;
};

