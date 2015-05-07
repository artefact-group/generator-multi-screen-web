var MSC = {
  isController: config.isController,
  isDevice: !config.isController
}

function stateChanged() {
  if (MSC.isDevice) {
    var iframe = $('iframe')[0];
    var url = config.script.urls[MSC.state.step];
    if (url.indexOf('http://') < 0 && url.indexOf('https://') < 0) {
      url = "http://"+url;
    }
    if (iframe.src != url) {
      iframe.src = url;
    }
  }
}

$(function() {
  console.log('Loaded');
  var socket = io('http://'+config.host+':3001');
  socket.on('state', function(data) {
    MSC.state = data;
    stateChanged();
  });
  socket.emit('connected', {
    device: config.device
  });
  MSC.socket = socket;
})
