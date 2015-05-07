// Logger class has the following public methods:
//
//   logger.configureType(type, [options]): configure a given log type (for example 'error', 'info', 'custom-type'). options can be a DOM element or an object with an object.el
//                                          property with a DOM element and other config vars. configureType must be called before you start using a log type but the DOM element
//                                          can be initialized later and all existing logs will be rendered to it.
//   logger.log(type, ...): records a log with the specified type and outputs all other params as text. non-string parameters are converted to JSON.
//   logger.<type>(...): same as logger.log but the type is used as the function name instead of being passed as a param. For example logger.error(...) logs an error if you have
//                       previously configured 'error' as a log type.
//
'use strict'

var gui = global.window.nwDispatcher.requireNwGui();
var _ = require('lodash');

var Logger = function() {
    this.logsByType = {};
    this.configByType = {};
    this.createTime = Date.now();
}

function padLeft(str, size, char) {
    str = str + "";
    char = char || '&nbsp;';
    var spaces = Math.max(0, size - str.length);
    for (var i = 0; i < spaces; ++i) {
        str = char + str;
    }
    return str;
}

Logger.prototype.format = function(type, text) {
    var time = padLeft(Date.now() - this.createTime, 8);
    type = padLeft(type, 5);
    return "<span class='log-item-header'>[" + time + "] " + type + ":</span> <span class='log-item-body'>" + text + "</span>";
}

function renderLog(config, log) {
    if (!config) {
        throw "Logger: Trying to log to a type that hasn't been configured";
    }

    if (config.el && log && !log.rendered) {
        var document = global.window.document;
        var l = document.createElement('div');
        l.className = "log-item-" + config.type + ' ' + (config.className || '');
        l.innerHTML = log.text;
        if (config.el.firstChild) {
            config.el.insertBefore(l, config.el.firstChild);
        } else {
            config.el.appendChild(l);
        }
        log.rendered = true;
    }
}

Logger.prototype.log = function(type) {
    var text = "";

    var entry = {
        type: type,
        text: null,
        rendered: false
    };

    this.logsByType[type] = this.logsByType[type] || [];

    this.logsByType[type].push(entry);

    var i;

    for (i = 1; i < arguments.length; ++i) {
        var a = arguments[i];
        if (text.length > 0 && text[text.length - 1] != ' ') {
            text += " ";
        }
        if (_.isString(a)) {
            text += a;
        } else {
            text += JSON.stringify(a);
        }
    }
    entry.text = this.format(type, text);

    renderLog(this.configByType[type], entry);
}

Logger.prototype.configureType = function(type, config) {
    var i;

    // Make sure config exists
    config = config || {};

    // If config is a DOM element (shortcut), create a proper config
    if (_.isElement(config)) {
        config = { el: config };
    }

    config.type = type;

    var that = this;
    this[type] = this[type] || function() {
        that.log.apply(that, [type].concat(Array.prototype.slice.call(arguments)));
    }

    this.configByType[type] = _.merge(config, this.configByType[type]);
    var logs = this.logsByType[type];
    if (logs) {
        for (i = 0; i < logs.length; ++i) {
            var log = logs[i];
            renderLog(config, log);
        }
    }
}

module.exports = Logger;
