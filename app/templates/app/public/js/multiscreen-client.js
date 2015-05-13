
var MSC = {
  isController: config.isController,
  isDevice: !config.isController,
  stepHandlers: {}
}

MSC.stepHandlers.iframe = {
  init: function(step, elements) {
    var iframe = elements.filter('iframe')[0];
    var url = step.url;
    if (url.indexOf('http://') < 0 && url.indexOf('https://') < 0) {
      url = "http://"+url;
    }
    iframe.src = url;
  }
}

function stateChanged() {
  if (MSC.isDevice) {
    var step = config.script.steps[MSC.state.step];
    if (!_.isEqual(MSC.currentStep, step)) {
      var handler = MSC.stepHandlers[step.type];

      if (!handler) {
        console.error("No handler registered for step type", step.type);
      } else {
        var show = $('[data-step-type='+step.type+']');
        var hide = $('[data-step-type]').not('[data-step-type='+step.type+']');
        show.show();
        hide.hide();

        handler.init(step, show);
      }
      MSC.currentStep = step;
    }
  }
}

$(function() {
  console.log('Loaded');
  var socket = io('http://'+location.hostname+':'+location.port);
  socket.on('state', function(data) {
    MSC.state = data;
    stateChanged();
  });
  socket.emit('connected', {
    device: config.device
  });
  MSC.socket = socket;
})
