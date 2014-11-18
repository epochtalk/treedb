var path = require('path');
var Operations = require(path.join(__dirname, '..', 'operations'));
module.exports = {
  onPut: function(options) {
    // use to query for post's user
    // options.value.user_id;
    Operations.getParentKey({key: options.key, callback: function(parentKey) {
      // Handle filling in parent thread data on first post
      // THREAD UPDATE:
      //   RECURSIVE: first_post_id, title, username, post_count,updated_at (iff post.created_at is later than the current udpdate_at)

      // Call increment on parentKey's postCount
      Operations.increment({
        key: parentKey,
        field: 'post_count',
        recursive: true
      });
    }});
  },
  onDel: function(options) {
    Operations.getParentKey({key: options.key, callback: function(parentKey) {
      // Call decrement on parentKey's postCount
      Operations.decrement({
          key: parentKey,
          field: 'post_count',
          recursive: true
      });
    }});
  }
};
