function hexpad(num, size) {
    var size = 2;
    var s = "00" + num;
    return s.substr(s.length - size);
}

function hexpad16(num, size) {
    var size = 4;
    var s = "0000" + num;
    return s.substr(s.length - size);
}

var ab2str = function(buf) {
    var bufView = new Uint8Array(buf);
    var encodedString = String.fromCharCode.apply(null, bufView);
    return decodeURIComponent(escape(encodedString));
};

var str2ab = function(str) {
    var encodedString = str;
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};

function d2b(number) {
    return String.fromCharCode(number);
}

function reset() {
    log("Resetting device....")
    serial.setControlSignals(connection.connectionId, DTRRTSOff, function(result) {
        setTimeout(function() {
            serial.setControlSignals(connection.connectionId, DTRRTSOn, function(result) {
                log("done.");
            });
        }, 100);
    });
}

function test() {
    log("Testing connection")
    serial.setControlSignals(connection.connectionId, DTRRTSOff, function(result) {
        setTimeout(function() {
            serial.setControlSignals(connection.connectionId, DTRRTSOn, function(result) {
                setTimeout(function() {
                    if (!stkVersion) {
                        stk500_test();
                    } else {
                        stk500_test();
                    }
                }, 750);
            });
        }, 100);
    });
}