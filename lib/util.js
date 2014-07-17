var util = require("util");

util.extend = function(obj) {
  [].slice.call(arguments, 1).forEach(function(ext) {
    if (!ext) return;
    for (var key in ext) {
      obj[key] = ext[key];
    }
  });
  return obj;
};

module.exports = util;
