'use strict';

var spawn = require('child_process').spawn;

module.exports = {
    // Open a browser window to a given URL
    open: function(url) {
        spawn('open', ['-a', 'Google Chrome', url, '-g']);
    }
}
