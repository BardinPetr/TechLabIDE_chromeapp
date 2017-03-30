var app = angular.module("TechLabIDE", []);

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
    };
    $scope.setBoard = function(name) {
        $scope.board = name;
        $scope._board = $scope._boards[$scope.boards.findIndex(function(d) { return d == name })];
    };

    //Sketch
    $scope.compile = function() {
        var code = getcode();
        code = code.replace(/ /g, '%20');
        code = code.replace(/\"/g, '%22');
        code = code.replace(/\n/g, '%0A');

        $http.get("http://localhost:2000/?data=" + JSON.stringify({ "board": $scope._board, "sketch": code }))
            .then(function(response) {
                log(response.data)
            }, function(response) {
                log(response.statusText);
            });
    };

    $scope.upload = function() {

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