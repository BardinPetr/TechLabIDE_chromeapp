chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        'state': 'maximized',
        'resizable': true
            /*,frame: 'none'*/
    }, function(win) {
        win.onClosed.addListener(function() {
            chrome.serial.getConnections(function(connections) {
                connections.forEach(function(c) {
                    chrome.serial.disconnect(c.connectionId, function() {});
                });
            });
        });
    });
});