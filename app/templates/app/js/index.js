'use strict';

// Required libraries
var jade = require('jade');
var _ = require('lodash');
var nwGui = require('nw.gui');

// Express and various standard libs
var express = require('express');
var bodyParser = require('body-parser');
var WebSocketServer = require('ws').Server;
var https = require('https');
var http = require('http');
var request = require('request');
var open = require('open');
var os = require('os');

var browser = require('./js/browser.js');
var config = require('./js/config.js');
var Logger = require('./js/logger.js');
var logger = new Logger();

logger.configureType('info');
logger.configureType('error');

// Create web server and socket server
var app = express();
var server = http.createServer(app);
var serverSecure = https.createServer(config.SSL_OPTIONS, app);
var io = require('socket.io')(server);

////////////////////////////////////////////////////////////////////////
// App state
////////////////////////////////////////////////////////////////////////

var App = require('./data/app.js');

function processApp() {
    App.deviceNames = [];
    _.each(App.devices, function(config, name) {
        App.deviceNames.push(name);
        logger.info("Configuring device "+name);
        var urls = [];
        config.clientConfig = { urls: urls };
        _.each(config.stepUrls, function(url, step) {
            step = parseInt(step);
            urls[step] = url;
            if (_.isUndefined(App.FIRST_STEP) || step < App.FIRST_STEP) {
                App.FIRST_STEP = step;
            }
            if (_.isUndefined(App.LAST_STEP) || step > App.LAST_STEP) {
                App.LAST_STEP = step;
            }
        });
    });
    _.each(App.devices, function(config, name) {
        var lastUrl = undefined;
        var urls = config.clientConfig.urls;
        for (var i = App.FIRST_STEP; i <= App.LAST_STEP; ++i) {
            var url = urls[i];
            if (lastUrl && !url) {
                urls[i] = lastUrl;
            }
            lastUrl = url || lastUrl;
        }
    });
}

processApp();

var appState = {
    clientState: {
        step: App.FIRST_STEP
    }
}

logger.info("Initialize step: " + appState.clientState.step);

////////////////////////////////////////////////////////////////////////
// Configure express
////////////////////////////////////////////////////////////////////////

app.set('view engine', 'jade');
app.engine('jade', jade.__express);

app.use(express.static('public'));

app.use(bodyParser()); // for parsing application/json

////////////////////////////////////////////////////////////////////////
// Express routes
////////////////////////////////////////////////////////////////////////

app.get('/', function(req, res) {
    res.send({ server_up: true, host_name: os.hostname() });
});

app.get('/controls', function(req, res) {
    res.render('controls', {
        host: config.serverHost(),
        device: 'controller',
        firstStep: App.FIRST_STEP,
        lastStep: App.LAST_STEP
    });
});

app.get('/device/:id', function(req, res) {
    var device = req.params.id;
    var devicePosition = App.devices[device].position;
    var position;
    if (devicePosition) {
        var width = devicePosition.width || 375;
        var height = devicePosition.height || 667;
        var top = devicePosition.top || 0;
        var left = devicePosition.left || 0;
        position = {
            position: 'absolute',
            top: top + 'px',
            left: left + 'px',
            width: (width - left) + 'px',
            height: (height - top) + 'px'
        }
    }
    res.render('device', {
        host: config.serverHost(),
        device: device,
        firstStep: App.FIRST_STEP,
        lastStep: App.LAST_STEP,
        position: position,
        script: JSON.stringify(App.devices[device].clientConfig)
    });
});

// app.post('/api/pagestate', function(req, res) {
//     var page = req.body.id;
//     console.log("Page state is",page);
//     appState.page = page;
//     switch (page) {
//     case '0':
//         // Send to all
//         websocketSend(null, "page", page);
//         break;
//     }
//     res.send({ success: true });
// });


function $( selector ) {
  return document.querySelector( selector )
}

////////////////////////////////////////////////////////////////////////
// Start web socket server
////////////////////////////////////////////////////////////////////////

var socketsByDevice = {};

io.on('connection', function(socket) {
    socket.emit('state', appState.clientState);
    socket.on('connected', function(data) {
        logger.info("Connected: " + data.device);
    });
    socket.on('set-step', function(data) {
        // Step has changed
        logger.info("Set step: " + data.step);
        appState.clientState.step = data.step;
        // Notify all clients
        io.emit('state', appState.clientState);
    })
});

// var wss = new WebSocketServer({ port: config.WS_PORT, host: config.serverHost() });
// var wssUrl = config.wsServer();
// var wsByName = {};

// function websocketSend(target, command, opts) {
//     if (!target) {
//         _.each(wsByName, function(val, key) {
//             websocketSend(key, command, opts);
//         });
//         return;
//     }
//     var ws = wsByName[target];
//     if (ws) {
//         var optionString = "";
//         if (_.isArray(opts)) {
//             optionString = opts.join(':');
//         } else if (_.isString(opts)) {
//             optionString = opts;
//         }
//         var message = command;
//         if (opts) {
//             message += ":"+opts;
//         }
//         ws.send(message, function(error) {
//             if (error) {
//                 logger.error("WS: Failed to send",message,"to",target);
//             }
//         });
//     } else {
//         logger.error("No connection to WS client", target);
//     }
// }

// var clientMessageHandlers = {
//     connected: function(node) {
//         logger.info("Client named '"+node+"' has connected");
//     }
// }

// wss.on('connection', function(ws) {
//     var name = null;
//     ws.on('message', function(data, flags) {
//         var tokens = data.split(':');
//         if (tokens.length > 1) {
//             // Received message from client
//             if (name) {
//                 delete wsByName[name];
//             }
//             wsByName[tokens[0]] = ws;

//             if (clientMessageHandlers[tokens[1]]) {
//                 // Call handler and pass the node name and up to two parameters
//                 clientMessageHandlers[tokens[1]](tokens[0], tokens[2], tokens[3]);
//             } else {
//                 logger.info("Websocket message of type \""+tokens[1]+"\" from "+tokens[0]);
//             }
//         }
//     });
// });

////////////////////////////////////////////////////////////////////////
// Start http/https servers
////////////////////////////////////////////////////////////////////////

var startupState = {};

function initialize() {
    if (startupState.serverFound && startupState.domLoaded) {
        // browser.open(config.httpServer()+'/page');
        var context = {
          controllerUrl: config.httpServer() + '/controls',
          deviceUrls: []
        }
        _.each(App.deviceNames, function(name) {
          context.deviceUrls.push(config.httpServer() + '/device/' + name);
        })

        document.body.innerHTML = jade.renderFile('index.jade', context);
        logger.configureType('info', $('.info-log'));
        logger.configureType('error', $('.error-log'));

        _.each(document.getElementsByTagName('a'), function(el) {
          el.addEventListener('click', function(e) {
            open(e.target.href);
            e.preventDefault();
          });
        })
    }
}

server.listen(3001, function() {
});

serverSecure.listen(config.SSL_PORT, function(){
    config.pickServer(function() {
        startupState.serverFound = true;

        initialize();
    });

    window.addEventListener('close', function() {
        // TODO: Cleanup? Close browser window?
        this.close(true);
    });
});

window.addEventListener( 'DOMContentLoaded', function() {
    startupState.domLoaded = true;
    initialize();
    // nwGui.Window.get().showDevTools();
});

