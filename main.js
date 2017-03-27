var currentEntry = null;

function init(entry) {
  chrome.runtime.getBackgroundPage(function(bg) {
    if (bg.entryToLoad)
      loadEntry(bg.entryToLoad);
  });
}

$(document).ready(init);