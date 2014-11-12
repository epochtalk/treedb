var exp = {};
module.exports = exp;

var path = require('path');
var faker = require('faker');
var rimraf = require('rimraf');
var sleep = require('sleep');

// generation of example models

exp.board = function() {
  sleep.usleep(1000);
  var board = {
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
  sleep.usleep(1000);
  var thread = {
    subject: faker.hacker.adjective()
      + ' '
      + faker.hacker.adjective()
      + ' ' + faker.hacker.noun(),
    created_at: faker.date.recent().getTime(),
    updated_at: faker.date.recent().getTime()
  };
  return thread;
};

exp.post = function() {
  sleep.usleep(1000);
  var post = {
    title: faker.hacker.adjective() + ' ' + faker.hacker.noun(),
    body: faker.lorem.paragraph(),
    created_at: faker.date.future().getTime()
  };
  return post;
};

