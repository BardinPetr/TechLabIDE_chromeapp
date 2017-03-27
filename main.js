var currentEntry = null;

function init(entry) {
  chrome.runtime.getBackgroundPage(function(bg) {
    if (bg.entryToLoad)
      loadEntry(bg.entryToLoad);
  });
}

$(document).ready(init);

var app = angular.module("TechLabIDE", []); 

app.controller("Ctrl", function($scope) {
  
});