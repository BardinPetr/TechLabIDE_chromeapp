var app = angular.module("TechLabIDE", []);

var connection = new SerialConnection();

function log(e) {
    console.log(e);
}

function getcode() {
    return document.getElementById('info').value;
}

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

    };
    $scope.open_onClick = function() {

    };
    $scope.savecode_onClick = function() {

    };
    $scope.saveblocks_onClick = function() {

    };
    $scope.set_onClick = function() {

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
        var code = getcode();

        var e = "http://localhost:2000/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code });
        e = encodeURI(e);

        $http.get(e)
            .then(function(response) {
                if (response.data.code == 0) {
                    var hex = response.data.hex;
                }
            }, function(response) {
                log(response.statusText);
            });
    };

    $scope.upload = function() {
        var code = getcode();

        var e = "http://localhost:2000/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code });
        e = encodeURI(e);

        $http.get(e)
            .then(function(response) {
                if (response.data.code == 0) {
                    var hex = response.data.hex;
                    upload(hex);
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
        $scope.boards = ['arduino uno', 'arduino nano', 'arduino mega', 'arduino micro'];
        $scope._boards = ['arduino:avr:uno', 'arduino:avr:nano', 'arduino:avr:mega'];
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