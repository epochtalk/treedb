var controller = module.exports = {};

// Calculation methods may not be necessary
// if re-running all updates on start
controller.calculateFirstPost = function(key) {
  // Get one element (use index)
};

controller.calculateLastPost = function(key) {
  // Get one element, reverse order (use index)
};

controller.calculatePostCount = function(key) {
  // Lock
  // Get children posts for key
  // Put the postCount to the key
  // Release
};
