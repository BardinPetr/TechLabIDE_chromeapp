var app = angular.module("TechLabIDE", []);

function log(e) {
    console.log(e);
}

app.controller("Ctrl", function($scope) {
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
    };

    //Sketch
    $scope.compile = function() {

    };

    $scope.upload = function() {

    };

    $scope.terminal = function() {

    };

    //init
    $scope.init = function() {
        $scope.boards = ['arduino uno', 'arduino nano', 'arduino mega', 'arduino micro'];
        $scope.board = $scope.boards[0];
        $scope.connect_img = "media/icons/power_plug/png";

        $scope.refreshPorts(function() {
            if ($scope.ports.length > 0) {
                $scope.port = $scope.ports[0];
            } else if ($scope.r < 4) {
                $scope.refreshPorts(function() {
                    if ($scope.ports.length > 0) {
                        $scope.port = $scope.ports[0];
                    }
                    $scope.r += 1;
                    $scope.$apply();
                });
            }
            $scope.$apply();
        });

        chrome.runtime.getBackgroundPage(function(bg) {});

        setInterval(function() {
            $scope.refreshPorts(function() { $scope.$apply(); });
        }, 10000);

        $scope.$apply();
    };
});