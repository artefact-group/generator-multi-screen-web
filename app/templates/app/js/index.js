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
    // Process all devices
    _.each(App.devices, function(config, name) {
        logger.info("Configuring device "+name);

        App.deviceNames.push(name);

        // Ensure config.steps (array of names) exists
        App.stepNames = App.stepNames || [];

        // Create reverse lookup, step name to array index
        App.stepNameToIndex = [];
        _.each(App.stepNames, function(name, index) {
          App.stepNameToIndex[name] = index;
        });

        var urls = [];
        config.clientConfig = { urls: urls };
        _.each(config.stepUrls, function(url, key) {
            // Convert step ids to indices
            var id = App.stepNameToIndex[key];
            if (_.isUndefined(id)) {
              // key isn't a step name, check to see if it's a number
              id = parseInt(key);
              if (_.isNumber(id)) {
                if (!App.stepNames[id]) {
                  // This is an unknown step so add it. Key and value are the same in this case.
                  App.stepNames[id] = id;
                  App.stepNameToIndex[id] = id;
                }
              } else {
                logger.error("["+name+"] Invalid step id "+key+". Step id must be a number or one of the step names declared in App.stepNames.");
                return;
              }
            }
            //step = parseInt(App.stepNames[step]);
            urls[id] = url;
            if (_.isUndefined(App.FIRST_STEP) || id < App.FIRST_STEP) {
                App.FIRST_STEP = id;
            }
            if (_.isUndefined(App.LAST_STEP) || id > App.LAST_STEP) {
                App.LAST_STEP = id;
            }
        });
    });

    for (var i = App.FIRST_STEP; i <= App.LAST_STEP; ++i) {
      if (_.isUndefined(App.stepNames[i])) {
        App.stepNames[i] = i;
        App.stepNameToIndex[i] = i;
      }
    }

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

    console.log("APP: ",JSON.stringify(App));
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
        stepNames: App.stepNames,
        firstStep: App.FIRST_STEP,
        lastStep: App.LAST_STEP
    });
});

app.get('/device/:id', function(req, res) {
    var device = req.params.id;
    var deviceConfig = App.devices[device] || {};
    var devicePosition = deviceConfig.position || {};

    var width = devicePosition.width || 375;
    var height = devicePosition.height || 667;
    var top = devicePosition.top || 0;
    var left = devicePosition.left || 0;

    var position = {
        position: 'absolute',
        top: top + 'px',
        left: left + 'px',
        width: (width - left) + 'px',
        height: (height - top) + 'px',
    }

    var layout = {
        viewport: deviceConfig.viewport || 'width=device-width, initial-scale=1',
        appleStatusBarStyle: deviceConfig.appleStatusBarStyle || 'black-translucent'
    }

    res.render('device', {
        host: config.serverHost(),
        device: device,
        firstStep: App.FIRST_STEP,
        lastStep: App.LAST_STEP,
        stepNames: App.stepNames,
        position: position,
        layout: layout,
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

