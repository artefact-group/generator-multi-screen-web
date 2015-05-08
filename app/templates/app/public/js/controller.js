var TOUCH_EVENTS = 'click touchstart';

function stateChanged() {
    $('#current-step')
        .removeClass('waiting')
        .text(config.stepNames[MSC.state.step]);
}

$(function() {
    $('#previous').on(TOUCH_EVENTS, function(e) {
        if (MSC.state && MSC.state.step > config.firstStep) {
            MSC.socket.emit('set-step', { step: --MSC.state.step })
            stateChanged();
        }
        return false;
    });
    $('#next').on(TOUCH_EVENTS, function(e) {
        if (MSC.state && MSC.state.step < config.lastStep) {
            MSC.socket.emit('set-step', { step: ++MSC.state.step })
            stateChanged();
        }
        return false;
    });
    $('[data-step]').on(TOUCH_EVENTS, function(e) {
        var $el = $(this);
        var step = $el.data('step')
        if (MSC.state && step >= config.firstStep && step <= config.lastStep && step != MSC.state.step) {
            MSC.state.step = step;
            MSC.socket.emit('set-step', { step: MSC.state.step })
            stateChanged();
        }
    });
    setTimeout(function() {
        MSC.socket.on('state', function(data) {
            MSC.state = data;
            stateChanged();
        });
    });
})
