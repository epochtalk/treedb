var a = require('padlock').Padlock;
var b = {};
module.exports={getLock:function(c){b[c]=b[c]||new a();return b[c];}}
