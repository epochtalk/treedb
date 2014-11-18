var path = require('path');
module.exports = {
  operations: require(path.join(__dirname, 'operations')),
  controllers: require(path.join(__dirname, 'controllers'))
};
