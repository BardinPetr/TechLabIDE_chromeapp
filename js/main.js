var app = angular.module("TechLabIDE", []);

var connection = new SerialConnection();
var stkVersion = false;
var boardid = 0;

function log(e) {
    console.log(e);
}

function showSettings() {
    hideAll();
    $('#settings').fadeIn(2000);
}

function hideSettings() {
    showAll();
    $('#settings').fadeOut(2000);
}

function toogleSettings() {
    if ($('#settings').css('display') == 'none') {
        showSettings();
    } else {
        hideSettings();
    }
}


function showTerminal() {
    hideAll();
    $('#terminal').fadeIn(2000);
}

function hideTerminal() {
    showAll();
    $('#terminal').fadeOut(2000);
}

function toogleTerminal() {
    if ($('#terminal').css('display') == 'none') {
        showTerminal();
    } else {
        hideTerminal();
    }
}

function appendOutput(text) {
    $("#output").append(text)
}

function appendOutputSend(text) {
    $("#output").append("> " + text + "\n")
}

function clearOutput() {
    $("#output").text("Сюда придут данные\n");
}

var accepts_s1 = [{
    mimeTypes: [
        "application/tlab"
    ],
    extensions: ["tlab"]
}];
var accepts_s2 = [{
    mimeTypes: [
        "application/ino"
    ],
    extensions: ["ino"]
}];
var accepts_o = [{
    mimeTypes: [
        "application/tlab"
    ],
    extensions: ["tlab"]
}];

connection.onReceive = function() {

}

app.controller("Ctrl", function($scope, $http) {
    $scope.r = 0;

    $scope.refreshPorts = function(callback) {
        chrome.serial.getDevices(function(_ports) {
            $scope.ports = [];
            $scope.portsMeta = [];

            for (var i = 0; i < _ports.length; i++) {
                $scope.ports = $scope.ports.concat(_ports[i].path);
                $scope.portsMeta = $scope.portsMeta.concat(_ports[i]);
            }
            callback();
        });
    }

    //Handlers for "file" dropdown menu
    $scope.new_onClick = function() {
        resetWorkspace();
        var xml2 = Blockly.Xml.textToDom("<xml xmlns='http://www.w3.org/1999/xhtml'><block type='controls_setupLoop' deletable='false'></block></xml>");
        Blockly.Xml.domToWorkspace(Blockly.getMainWorkspace(), xml2);
        $scope.wEntryBlocks = null;
        $scope.wEntryCode = null;
    };
    $scope.open_onClick = function() {
        chrome.fileSystem.chooseEntry({ type: 'openFile', accepts: accepts_o }, function(readOnlyEntry) {

            readOnlyEntry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function(e) {
                    $("#popup_file_o").show();
                    $("#popup_file_o").fadeOut(3000);
                    set_xml(e.target.result);
                    $scope.wEntryBlocks = readOnlyEntry;
                    $scope.wEntryCode = null;
                };

                reader.readAsText(file);
            });
        });
    };
    $scope.save_onClick = function() {
        if ($scope.wEntryBlocks != null) {
            $scope.wEntryBlocks.createWriter(function(writer) {
                writer.onerror = function(data) {
                    log(data);
                };
                writer.onwriteend = function(e) {
                    console.log('write complete');
                    $("#popup_file_s").show();
                    $("#popup_file_s").fadeOut(3000);
                    $scope.wEntryBlocks = writableFileEntry;
                };
                var blob = new Blob([get_xml()], { type: 'text/plain' });
                writer.write(blob);
            }, function(data) {
                log(data);
            });
        } else {
            $scope.saveblocks_onClick();
        }
    };

    $scope.savecode_onClick = function() {
        chrome.fileSystem.chooseEntry({ type: 'saveFile', accepts: accepts_s2 }, function(writableFileEntry) {
            writableFileEntry.createWriter(function(writer) {
                writer.onerror = function(data) {
                    log(data);
                };
                writer.onwriteend = function(e) {
                    console.log('write complete');
                    $("#popup_file_s").show();
                    $("#popup_file_s").fadeOut(3000);
                };
                var blob = new Blob([_get_code()], { type: 'text/plain' });
                writer.write(blob);
            }, function(data) {
                log(data);
            });
        });
    };
    $scope.saveblocks_onClick = function() {
        chrome.fileSystem.chooseEntry({ type: 'saveFile', accepts: accepts_s1 }, function(writableFileEntry) {
            writableFileEntry.createWriter(function(writer) {
                writer.onerror = function(data) {
                    log(data);
                };
                writer.onwriteend = function(e) {
                    console.log('write complete');
                    $("#popup_file_s").show();
                    $("#popup_file_s").fadeOut(3000);
                    $scope.wEntryBlocks = writableFileEntry;
                };
                var blob = new Blob([get_xml()], { type: 'text/plain' });
                writer.write(blob);
            }, function(data) {
                log(data);
            });
        });
    };
    $scope.set_onClick = function() {
        toogleSettings();
    };

    //Port
    $scope.setPort = function(name) {
        $scope.port = name;
        document.getElementById("connect_img").src = "media/icons/power-plug-off.png";

        connection.disconnect();
        connection.connect($scope.port, $scope.uploadBr);
    };
    $scope.setBoard = function(name) {
        $scope.board = name;
        $scope._board = $scope._boards[$scope.boards.findIndex(function(d) { return d == name })];
        $scope.uploadBr = $scope.uploadBrs[$scope.boards.findIndex(function(d) { return d == name })];
        $scope.setPort($scope.port);
        boardid = $scope.boards.findIndex(function(d) { return d == name });
    };

    $scope.close = function() {
        connection.disconnect();
    }

    //Sketch
    $scope.compile = function() {
        $("#popup_started").show();
        $("#popup_started").fadeOut(3000);

        var code = _get_code();

        var e = $scope.srv_url + ":" + $scope.srv_port + "/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code });
        e = encodeURI(e);

        $http.get(e)
            .then(function(response) {
                    var c = response.data.code;
                    if (c == 0) {
                        $("#popup_ok_c").show();
                        $("#popup_ok_c").fadeOut(7000);
                    } else {
                        $("#popup_fail_c").show();
                        $("#popup_fail_c").fadeOut(7000);
                    }
                },
                function(response) {
                    log(response.statusText);
                });
    };

    $scope.upload = function() {
        $("#popup_started").show();
        $("#popup_loading").show();
        $("#pb").width("0%");
        setTimeout(function() {
            $("#pb").width("10%");
        }, 1000);
        setTimeout(function() {
            $("#pb").width("20%");
        }, 2000);
        setTimeout(function() {
            $("#pb").width("30%");
        }, 3000);
        setTimeout(function() {
            $("#pb").width("40%");
        }, 4000);
        setTimeout(function() {
            $("#pb").width("50%");
        }, 5000);

        var code = _get_code();

        var e = $scope.srv_url + ":" + $scope.srv_port + "/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code });
        e = encodeURI(e);

        $http.get(e)
            .then(function(response) {
                if (response.data.code == 0) {
                    var hex = response.data.hex;
                    if (!stkVersion) {
                        stk500_upload(hex);
                    } else {
                        stk500_upload(hex);
                    }
                    $("#popup_started").fadeOut(3000);
                } else {
                    $("#popup_fail_c").show();
                    $("#popup_fail_c").fadeOut(7000);
                }
            }, function(response) {
                log(response.statusText);
            });
    };

    $scope.set_srvParams = function() {
        $scope.srv_url = $("#url").val();
        $scope.srv_port = $("#port").val();
    }

    $scope.closeSettings = function() { hideSettings(); }

    //Terminal
    $scope.terminal = function() {
        connection.disconnect();
        connection = new SerialConnection();
        connection.connect($scope.port, $scope.br);
        clearOutput();
        toogleTerminal();

        var h = $("#panelB").height();
        var w = $("#panelB").width();

        $("#div_o").height(h - 200);
        $("#div_o").width(w - 30);
        $("#output").height(h - 200);
        $("#output").width(w - 60);
    };
    $scope.closeTerminal = function() {
        hideTerminal();
        connection.disconnect();
        connection = new SerialConnection();
        connection.connect($scope.port, $scope.uploadBr);
    }
    $scope.setBr = function(i) {
        clearOutput();
        connection.disconnect();
        connection = new SerialConnection();
        connection.connect($scope.port, i);
        $scope.br = i;
    }
    $scope.serialSend = function() {
        var sendText = $("#sendText").val();
        appendOutputSend(sendText);
        try {
            connection.send(sendText);
        } catch (ex) {
            log(ex)
        }
    }

    //init
    $scope.init = function() {
        $("#popup_started").hide();
        $("#popup_ok_c").hide();
        $("#popup_ok_u").hide();
        $("#popup_fail_c").hide();
        $("#popup_fail_u").hide();
        $("#popup_file_o").hide();
        $("#popup_file_s").hide();

        hideSettings();
        hideTerminal();

        $scope.boards = ['arduino uno', 'arduino nano'];
        $scope._boards = ['arduino:avr:uno', 'arduino:avr:nano:cpu=atmega328'];
        $scope.board = $scope.boards[0];
        $scope._board = $scope._boards[0];
        $scope.uploadBrs = [115200, 57600];
        $scope.uploadBr = 115200;

        $scope.brs = [4800, 9600, 38400, 115200];
        $scope.br = 9600;

        $scope.portsMeta = [];

        $scope.wEntryBlocks = null;
        $scope.wEntryCode = null;

        $scope.srv_url = "http://bardin.petr.fvds.ru";
        $scope.srv_port = "2000";
        $("#url").val($scope.srv_url);
        $("#port").val($scope.srv_port);

        $scope.refreshPorts(function() {
            if ($scope.ports.length > 0) {
                $scope.port = $scope.ports[0];
                $scope.$apply();
            } else if ($scope.r < 4) {
                $scope.refreshPorts(function() {
                    if ($scope.ports.length > 0) {
                        $scope.port = $scope.ports[0];
                    }
                    $scope.r += 1;
                    $scope.$apply();
                });
            }
            log($scope.portsMeta);
            $scope.setPort($scope.port);
        });

        chrome.runtime.getBackgroundPage(function(bg) {});

        setInterval(function() {
            $scope.refreshPorts(function() { $scope.$apply(); });
        }, 4000);

        chrome.commands.onCommand.addListener(function(command) {
            switch (command) {
                case "upload":
                    $scope.upload();
                    break;
                case "save":
                    $scope.save_onClick();
                    break;
            }
        });

        setTimeout(function() {
            roboblocks_init();
            $scope.new_onClick();
        }, 300);
    };
});