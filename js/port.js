//Chrome serial port
var SerialConnection = function() {
    this.connectionId = -1;
    this.lineBuffer = "";
    this.boundOnReceive = this.onReceive.bind(this);
    this.boundOnReceiveError = this.onReceiveError.bind(this);
    this.onConnect = new chrome.Event();
    this.onReadLine = new chrome.Event();
    this.onError = new chrome.Event();
};


SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
    if (!connectionInfo) {
        log("Connection failed.");
        return;
    }
    this.connectionId = connectionInfo.connectionId;
    serial.onReceive.addListener(this.boundOnReceive);
    serial.onReceiveError.addListener(this.boundOnReceiveError);
    this.onConnect.dispatch();
    serial.setControlSignals(connection.connectionId, DTRRTSOn, function(result) {});

    reset();
    test();
};


SerialConnection.prototype.onReceive = function(receiveInfo) {
    document.getElementById("connect_img").src = "media/icons/power-plug.png";
    if (receiveInfo.connectionId !== this.connectionId) {
        return;
    }

    if ($('#terminal').css('display') != 'none') {
        appendOutput(ab2str(receiveInfo.data));
    } else {
        if (!stkVersion) {
            stk500_onReceive(receiveInfo.data, this);
        } else {
            stk500_onReceive(receiveInfo.data);
        }
    }
};

SerialConnection.prototype.onReceiveError = function(errorInfo) {
    if (errorInfo.connectionId === this.connectionId) {
        this.onError.dispatch(errorInfo.error);
    }
};

SerialConnection.prototype.getDevices = function(callback) {
    serial.getDevices(callback)
};

SerialConnection.prototype.connect = function(path, br) {
    try {
        serial.connect(path, { bitrate: br }, this.onConnectComplete.bind(this))
    } catch (ex) {
        console.log(ex)
    }
};

SerialConnection.prototype.send = function(msg) {
    try {
        serial.send(this.connectionId, str2ab(msg), function() {});
    } catch (ex) {
        console.log(ex)
    }
};

SerialConnection.prototype.disconnect = function() {
    try {
        serial.disconnect(this.connectionId, function() {
            document.getElementById("connect_img").src = "media/icons/power-plug-off.png";
        })
    } catch (ex) {
        console.log(ex)
    }
};