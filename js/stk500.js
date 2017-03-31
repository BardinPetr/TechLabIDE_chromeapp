const serial = chrome.serial;
var seq = 1;

SIGN_ON_MESSAGE = "AVR STK";

var hexfile = "";

function stk500_program() {
    serial.setControlSignals(connection.connectionId, DTRRTSOff, function(result) {
        setTimeout(function() {
            serial.setControlSignals(connection.connectionId, DTRRTSOn, function(result) {
                setTimeout(function() {
                    log("Arduino reset, now uploading.\n");
                    stk500_upload(hexfile);
                }, 140);
            });
        }, 1);
    });
}

command = {

    "Sync_CRC_EOP": 0x20,
    "GET_SYNC": 0x30,
    "GET_SIGN_ON": 0x31,
    "SET_PARAMETER": 0x40,
    "GET_PARAMETER": 0x41,
    "SET_DEVICE": 0x42,
    "SET_DEVICE_EXT": 0x45,
    "ENTER_PROGMODE": 0x50,
    "LEAVE_PROGMODE": 0x51,
    "CHIP_ERASE": 0x52,
    "CHECK_AUTOINC": 0x53,
    "LOAD_ADDRESS": 0x55,
    "UNIVERSAL": 0x56,
    "UNIVERSAL_MULTI": 0x57,
    "PROG_FLASH": 0x60,
    "PROG_DATA": 0x61,
    "PROG_FUSE": 0x62,
    "PROG_LOCK": 0x63,
    "PROG_PAGE": 0x64,
    "PROG_FUSE_EXT": 0x65,
    "READ_FLASH": 0x70,
    "READ_DATA": 0x71,
    "READ_FUSE": 0x72,
    "READ_LOCK": 0x73,
    "READ_PAGE": 0x74,
    "READ_SIGN": 0x75,
    "READ_OSCCAL": 0x76,
    "READ_FUSE_EXT": 0x77,
    "READ_OSCCAL_EXT": 0x78
}


parameters = {
    "HW_VER": 0x80,
    "SW_MAJOR": 0x81,
    "SW_MINOR": 0x82,
    "LEDS": 0x83,
    "VTARGET": 0x84,
    "VADJUST": 0x85,
    "OSC_PSCALE": 0x86,
    "OSC_CMATCH": 0x87,
    "RESET_DURATION": 0x88,
    "SCK_DURATION": 0x89,
    "BUFSIZEL": 0x90,
    "BUFSIZEH": 0x91,
    "DEVICE": 0x92,
    "PROGMODE": 0x93,
    "PARAMODE": 0x94,
    "POLLING": 0x95,
    "SELFTIMED": 0x96,
    "TOPCARD_DETECT": 0x98
}


responses = {
    0x10: "OK",
    0x11: "FAILED",
    0x12: "UNKNOWN",
    0x13: "NODEVICE",
    0x14: "INSYNC",
    0x15: "NOSYNC"
}

var DTRRTSOn = { dtr: true, rts: true };
var DTRRTSOff = { dtr: false, rts: false };
var SerialOpts = { bitrate: 115200 };

function buildPacket(sequence, size, message) {
    /* Message Start */
    var buffer = String.fromCharCode(27);
    /* Sequence */
    if (sequence > 255) { console.log("buildPacket(): Sequence number exceeds 0xFF!"); }
    buffer += String.fromCharCode(sequence); /* must wrap after FF */
    /* Message Length */
    buffer += String.fromCharCode(0); /* we are going to avoid going over 255 for simplicity for now */
    buffer += String.fromCharCode(message.length); /* length */
    if (message.length > 255) { console.log("buildPacket(): Message length exceeds what buildPacket() can handle (16 bit coming soon)"); }
    /* Token (static) */
    buffer += String.fromCharCode(14);
    /* Message */
    if (message.length > 275) { console.log("buildPacket(): Message length exceeds 275 bytes (STK500 does not support this)."); }
    buffer += message; /* append message into buffer */
    var xor = 0;
    /* Checksum */
    for (var x = 0; x < buffer.length; x++) {
        xor = xor ^ buffer.charCodeAt(x);
    }
    buffer += String.fromCharCode(xor);
    return buffer;
}


function transmitPacket(buffer, delay) {
    setTimeout(function() {
        log(".");
        connection.send(buffer);
    }, delay + timer);
    timer = timer + delay;
}

var oneshot = 0;
var timer = 0;

function stk500_test() {
    oneshot = 0;
    transmitPacket(String.fromCharCode(command.GET_SYNC) + "" + String.fromCharCode(command.Sync_CRC_EOP), 0);
    transmitPacket(String.fromCharCode(command.GET_SYNC) + "" + String.fromCharCode(command.Sync_CRC_EOP), 10);
    transmitPacket(String.fromCharCode(command.GET_SYNC) + "" + String.fromCharCode(command.Sync_CRC_EOP), 10);
    stk500_getparam("HW_VER", 50);
    stk500_getparam("SW_MAJOR", 50);
    stk500_getparam("SW_MINOR", 50);
    stk500_getparam("TOPCARD_DETECT", 50);
    timer = 0;
}

function stk500_getparam(param, delay) {
    transmitPacket("A" + String.fromCharCode(parameters[param]) + String.fromCharCode(command.Sync_CRC_EOP), delay);
}

function d2b(number) {
    return String.fromCharCode(number);
}

function stk500_prgpage(address, data, delay, flag) {
    address = hexpad16(address.toString(16)); /* convert and pad number to hex */
    address = address[2] + address[3] + address[0] + address[1]; /* make LSB first */
    address = String.fromCharCode(parseInt(address[0] + address[1], 16)) + String.fromCharCode(parseInt(address[2] + address[3], 16)); /* h2b */
    transmitPacket(d2b(command.LOAD_ADDRESS) + address + d2b(command.Sync_CRC_EOP), delay);
    var debug = "";
    var datalen = data.length;
    buffer = "";
    transmitPacket(d2b(command.PROG_PAGE) + d2b(0x00) + d2b(datalen) + d2b(0x46) + data + d2b(command.Sync_CRC_EOP), delay);
}

function stk500_upload(heximage) {
    flashblock = 0;
    transmitPacket(d2b(command.ENTER_PROGMODE) + d2b(command.Sync_CRC_EOP), 50);
    var blocksize = 128;
    blk = Math.ceil(heximage.length / blocksize);
    for (b = 0; b < Math.ceil(heximage.length / blocksize); b++) {
        var currentbyte = blocksize * b;
        var block = heximage.substr(currentbyte, blocksize);
        flag = 0;
        stk500_prgpage(flashblock, block, 250);
        flashblock = flashblock + 64;
    }
    $("#popup_ok_u").show();
    $("#popup_ok_u").fadeOut(7000);
    timer = 0;
}

/* pads an 8 bit number */

function hexpad(num, size) {
    var size = 2;
    var s = "00" + num;
    return s.substr(s.length - size);
}

/* pads an 16 bit number */

function hexpad16(num, size) {
    var size = 4;
    var s = "0000" + num;
    return s.substr(s.length - size);
}


/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function(buf) {
    var bufView = new Uint8Array(buf);
    var encodedString = String.fromCharCode.apply(null, bufView);
    return decodeURIComponent(escape(encodedString));
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function(str) {
    // var encodedString = unescape(encodeURIComponent(str));
    var encodedString = str;
    var bytes = new Uint8Array(encodedString.length);
    for (var i = 0; i < encodedString.length; ++i) {
        bytes[i] = encodedString.charCodeAt(i);
    }
    return bytes.buffer;
};

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
    serial.setControlSignals(connection.connectionId, DTRModeOn, function(result) {});

};


SerialConnection.prototype.onReceive = function(receiveInfo) {
    document.getElementById("connect_img").src = "media/icons/power-plug.png";
    if (receiveInfo.connectionId !== this.connectionId) {
        return;
    }

    this.lineBuffer += ab2str(receiveInfo.data);
    var d = new Date();
    var n = d.getMilliseconds();
    var buffer = this.lineBuffer;
    var decoded = "";
    for (x = 0; x < buffer.length; x++) { decoded += "[" + buffer.charCodeAt(x).toString(16) + "]"; }
    this.lineBuffer = "";
    var index;
    while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
        var line = this.lineBuffer.substr(0, index + 1);
        this.onReadLine.dispatch(line);
        this.lineBuffer = this.lineBuffer.substr(index + 1);
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

SerialConnection.prototype.connect = function(path) {
    serial.connect(path, SerialOpts, this.onConnectComplete.bind(this))
};

SerialConnection.prototype.send = function(msg) {
    if (this.connectionId < 0) {
        throw 'Invalid connection';
    }
    serial.send(this.connectionId, str2ab(msg), function() {});
};

SerialConnection.prototype.disconnect = function() {
    serial.disconnect(this.connectionId, function() { document.getElementById("connect_img").src = "media/icons/power-plug-off.png"; })
};


function fixHex(hexfileascii) {
    hexfile = "";

    buffer = hexfileascii.split("\n");
    for (x = 0; x < buffer.length; x++) {
        size = parseInt(buffer[x].substr(1, 2), 16);
        if (size == 0) {
            log("complete!\n");
            stk500_program();
            return;
        }
        for (y = 0; y < (size * 2); y = y + 2) {
            hexfile += String.fromCharCode(parseInt(buffer[x].substr(y + 9, 2), 16));
        }

    }

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
                    stk500_test();
                }, 750);
            });
        }, 100);
    });
}

function upload(hexfile) {
    fixHex(hexfile)
}