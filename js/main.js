var app = angular.module("TechLabIDE", []);

var connection = new SerialConnection();

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

app.controller("Ctrl", function($scope, $http) {
    $scope.r = 0;

    $scope.refreshPorts = function(callback) {
        chrome.serial.getDevices(function(_ports) {
            $scope.ports = [];

            for (var i = 0; i < _ports.length; i++) {
                $scope.ports = $scope.ports.concat(_ports[i].path);
            }
            callback();
        });
    }

    //Handlers for "file" dropdown menu
    $scope.new_onClick = function() {
        resetWorkspace();
    };
    $scope.open_onClick = function() {
        chrome.fileSystem.chooseEntry({ type: 'openFile', accepts: accepts_o }, function(readOnlyEntry) {

            readOnlyEntry.file(function(file) {
                var reader = new FileReader();

                reader.onloadend = function(e) {
                    $("#popup_file_o").show();
                    $("#popup_file_o").fadeOut(3000);
                    resetWorkspace();
                    set_xml(e.target.result);
                };

                reader.readAsText(file);
            });
        });
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
        connection.connect($scope.port);
        reset();
        test();
    };
    $scope.setBoard = function(name) {
        $scope.board = name;
        $scope._board = $scope._boards[$scope.boards.findIndex(function(d) { return d == name })];
    };

    //Sketch
    $scope.compile = function() {
        $("#popup_started").show();
        $("#popup_started").fadeOut(3000);

        var code = _get_code();

        var e = "http://bardin.petr.fvds.ru:2000/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code });
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
        $("#popup_started").fadeOut(3000);

        var code = _get_code();

        var e = "http://bardin.petr.fvds.ru:2000/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code });
        e = encodeURI(e);

        $http.get(e)
            .then(function(response) {
                if (response.data.code == 0) {
                    var hex = response.data.hex;
                    upload(hex);
                } else {
                    $("#popup_fail_c").show();
                    $("#popup_fail_c").fadeOut(7000);
                }
            }, function(response) {
                log(response.statusText);
            });
    };

    //Terminal
    $scope.terminal = function() {

    };

    //init
    $scope.init = function() {
        /*
        $.ajax({
            type: "POST",
            url: 'http://localhost:2000',
            dataType: 'json',
            async: true,
            data: JSON.stringify(obj),
            success: function(result, status, xhr) {

            }
        })
*/
        $("#popup_started").hide();
        $("#popup_ok_c").hide();
        $("#popup_ok_u").hide();
        $("#popup_fail_c").hide();
        $("#popup_fail_u").hide();
        $("#popup_file_o").hide();
        $("#popup_file_s").hide();
        hideSettings();

        $scope.boards = ['arduino uno', 'arduino nano', 'arduino mega'];
        $scope._boards = ['arduino:avr:uno', 'arduino:avr:nano:cpu=atmega328', 'arduino:avr:mega:cpu=atmega2560'];
        $scope.board = $scope.boards[0];
        $scope._board = $scope._boards[0];

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
        });

        chrome.runtime.getBackgroundPage(function(bg) {});
    };
});