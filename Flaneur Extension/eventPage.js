// MESSAGES
var blacklistedIds = ["none"];

chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		if (sender.id in blacklistedIds) {
			sendResponse({"result":"sorry, could not process your message"});
      return;  // don't allow this extension access
  } else if (request.myCustomMessage) {
  	new Notification('Got message from '+sender.id,
  		{ body: request.myCustomMessage });
  	sendResponse({"result":"Ok, got your message"});
  } else {
  	sendResponse({"result":"Ops, I don't understand this message"});
  }
});

// ICON-CLICK
chrome.browserAction.onClicked.addListener(function(tab) { 

	//console.log($)

	chrome.tabs.executeScript({ file: "jquery.js" }, function() {
    	chrome.tabs.executeScript({
			file: "inject.js" 
		}, 
		function(selection) {
			console.log(JSON.stringify(selection));
		})
	});
	chrome.tabs.insertCSS({
		file: "inject.css" 
	})
});

// SETUP
// Database
const dbName = "flaneurIO";

$(function() {
	var request = indexedDB.open(dbName, 1);

	request.onerror = function(event) {
  		alert("Database error: " + event.target.errorCode);
	};

});

