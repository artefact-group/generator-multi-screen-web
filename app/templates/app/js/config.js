'use strict';

var os = require('os');
var fs = require('fs');
var request = require('request');

// TODO: Include your machine name here
var serverURLs = ['<%%= hostname %%>', os.hostname(), 'localhost'];
var serverIndex = 0;

function serverHost() {
    if (serverIndex < serverURLs.length) {
        return serverURLs[serverIndex];
    }
}

function server(secure) {
    var host = serverHost();
    if (host) {
        var before = secure ? 'https://' : 'http://';
        var after = secure ? ':3443' : ':3001';
        return before + host + after;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Find/query available servers
//////////////////////////////////////////////////////////////////////////////////////////

function testServer(callback) {
    var url = server();
    if (url) {
        request({ url: url, json: true }, function(e, res, body) {
            if (e || res.statusCode != 200 || !body.server_up || body.host_name != os.hostname()) {
                // Server not available, try next
                ++serverIndex;
                testServer(callback);
            } else {
                // Success
                console.log("FOUND MYSELF, SERVER IS AT", server());
                callback && callback(true);
            }
        });
    } else {
        // No server found
        callback && callback(false);
    }
}

function pickServer(callback) {
    serverIndex = 0;
    testServer(callback);
}

var config = {
    SSL_PORT: 3443,

    SSL_OPTIONS: {
        key: fs.readFileSync('./ssl/server.key'),
        cert: fs.readFileSync('./ssl/server.crt'),
        ca: fs.readFileSync('./ssl/ca.crt'),
        requestCert: true,
        rejectUnauthorized: false
    },

    // Call this function to find the current server
    pickServer: pickServer,
    // The server host
    serverHost: serverHost,

    // The current server including protocol and port
    httpServer: function() {
        return server(false);
    },
    httpsServer: function() {
        return server(true);
    },
    wsServer: function() {
        return 'ws://'+serverHost()+':'+config.WS_PORT;
    }
}

module.exports = config;
