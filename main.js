var currentEntry = null;

function init(entry) {
    /*
      chrome.runtime.getBackgroundPage(function(bg) {
          if (bg.entryToLoad)
              loadEntry(bg.entryToLoad);
      });
    */
}

$(document).ready(init);

var app = angular.module("TechLabIDE", []);

app.controller("Ctrl", function($scope) {
    $scope.init = function(){
        $scope.ports =['test', 'test2'];
        $scope.boards=['arduino uno', 'arduino nano', 'arduino mega', 'arduino micro'];
        $scope.board = $scope.boards[0];
    };
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
});