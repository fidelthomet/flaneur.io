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

chrome.browserAction.onClicked.addListener(function(tab) { 
	chrome.tabs.executeScript({
		file: "inject.js" 
	}, 
	function(selection) {
		alert(selection);
	})

	chrome.tabs.insertCSS({
		file: "inject.css" 
	})
});
