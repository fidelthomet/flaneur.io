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
			

			var request = indexedDB.open(dbName, 2);
			request.onerror = function(event) {
  				alert("Database error: " + event.target.errorCode);
			};

			request.onupgradeneeded = function(event) {
  				alert("OHA: ");
			};
			request.onsuccess = function(event) {

  				var db = event.target.result;
  				
  				var transaction = db.transaction(["highlight","host","url","author"], "readwrite");
				
				
				transaction.oncomplete = function(event) {
				  console.log("All done!");
				};

				transaction.onerror = function(event) {
					console.log(event);
				};
				
				console.log(selection[0].hostname)

				var storeHost = transaction.objectStore("host");
				var request = storeHost.add(selection[0]);
				
				request.onsuccess = function(event) {
				  	saveURL(selection[0])
				};

				request.onerror = function(event) {
				  	if(event.target.error.name=="ConstraintError")
				  		saveURL(selection[0])
				}

				var saveURL = function(host){

				}

			}
		})
	});
	chrome.tabs.insertCSS({
		file: "inject.css" 
	})
});

// SETUP
// Database
const dbName = "flaneurIO";
var db;

$(function() {
	var request = indexedDB.open(dbName, 2);

	request.onerror = function(event) {
  		alert("Database error: " + event.target.errorCode);
	};

	request.onupgradeneeded = function (event) {

	    db = event.target.result;

	    // STORES   
	    var storeHighlight = db.createObjectStore("highlight", { autoIncrement : true });
	    storeHighlight.createIndex("hostname", "hostname", { unique: false });
	    storeHighlight.createIndex("url", "url", { unique: false });
	    storeHighlight.createIndex("author", "author", { unique: false });
	    storeHighlight.createIndex("topic", "topic", { unique: false });
	    storeHighlight.createIndex("timestamp", "timestamp", { unique: false });
	    storeHighlight.createIndex("parent", "parent", { unique: false });

	    var storeAnnotation = db.createObjectStore("annotation", { autoIncrement : true });
	    storeAnnotation.createIndex("topic", "topic", { unique: false });
	    storeAnnotation.createIndex("timestamp", "timestamp", { unique: false });

	    var storeRelation = db.createObjectStore("relation", { autoIncrement : true });
	    storeRelation.createIndex("highlight", "highlight", { unique: false });
	    storeRelation.createIndex("annotation", "annotation", { unique: false });

	    var storeHost = db.createObjectStore("host", { keyPath: "hostname" })

	    var storeURL = db.createObjectStore("url", { keyPath: "urlname" });
	    storeURL.createIndex("hostname", "hostname", { unique: false });

	    var storeAuthor = db.createObjectStore("author", { autoIncrement : true });
	    storeAuthor.createIndex("twitter", "twitter", { unique: true });
	    storeAuthor.createIndex("website", "website", { unique: false });

	    var storeTopic = db.createObjectStore("topic", { keyPath: "topicName" });
	    storeTopic.add({ topicName: "Unassigned" });
	}

});

