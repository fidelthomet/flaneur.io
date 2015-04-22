// MESSAGES
var blacklistedIds = ["none"];

chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		console.log("HEY")
		if (sender.id in blacklistedIds) {
			sendResponse({"result":"sorry, could not process your message"});
      return;  // don't allow this extension access
  } else if (request.myCustomMessage) {
  	console.log(request)
  	new Notification('Got message from '+sender.id,
  		{ body: request.myCustomMessage });
  	sendResponse({"result":"Ok, got your message"});
  } else {
  	sendResponse({"result":"Ops, I don't understand this message"});
  }
});

// chrome.runtime.onMessage.addListener(
//         function(request, sender, sendResponse) {
//             switch (request.action) {
//                 case 'kungfu': alert(request.source);
//             }
//  });

// ICON-CLICK
chrome.browserAction.onClicked.addListener(function(tab) { 
	chrome.tabs.executeScript({ file: "jquery.js" }, function() {
    	chrome.tabs.executeScript({
			file: "inject.js" 
		}, 
		function(selection) {
			console.log(selection)
			updateDB(selection)

			
		})
	});
	chrome.tabs.insertCSS({
		file: "inject.css" 
	})
});

var updateDB = function(selection){
	var request = indexedDB.open(dbName, 5);
	request.onerror = function(event) {
		console.log("Database error: " + event.target.errorCode);
	};

	request.onupgradeneeded = function(event) {
		alert("Upgrade needed");
	};
	request.onsuccess = function(event) {

		var db = event.target.result;

		var transaction = db.transaction(["highlight","host","url","author"], "readwrite");

		transaction.oncomplete = function(event) {
			console.debug("transaction completed");
		};

		transaction.onerror = function(event) {
			console.error("ERROR - transaction")
			console.debug(event)
		};

		storeHost(transaction);
		storeUrl(transaction);
		storeAuthor(transaction);
	}

	var storeHost = function(transaction){
		var hostStore = transaction.objectStore("host");
		var requestHost = hostStore.get(selection[0].hostname);

		requestHost.onerror = function(event) {
			console.error("ERROR - accessing host:")
			console.debug(event)
		}

		requestHost.onsuccess = function(event) {
			
			var data = requestHost.result;
			
			if(data){
				data.lastVisit = selection[0].timestamp;
				data.highlights += 1;

				var requestUpdate = hostStore.put(data);

				requestUpdate.onerror = function(event) {
					console.error("ERROR - updating host:")
					console.debug(event)
				};
				requestUpdate.onsuccess = function(event) {
					console.debug("successfully updated host")
				};
			} else {
				data = {hostname: selection[0].hostname, lastVisit: selection[0].timestamp, highlights: 1};
				var requestCreate = hostStore.add(data);

				requestCreate.onerror = function(event) {
					console.error("ERROR - creating host:")
					console.debug(event)
				};
				requestCreate.onsuccess = function(event) {
					console.debug("successfully created host")
				};
			}	
		}
	}

	var storeUrl = function(transaction){
		var urlStore = transaction.objectStore("url");


		var requestUrl = urlStore.get(selection[0].url);

		requestUrl.onerror = function(event) {
			console.error("ERROR - accessing url:")
			console.debug(event)
		}

		requestUrl.onsuccess = function(event) {
			
			var data = requestUrl.result;
			
			if(data){
				data.lastVisit = selection[0].timestamp;
				data.highlights += 1;

				var requestUpdate = urlStore.put(data);

				requestUpdate.onerror = function(event) {
					console.error("ERROR - updating url:")
					console.debug(event)
				};
				requestUpdate.onsuccess = function(event) {
					console.debug("successfully updated url")
				};
			} else {
				data = {urlname: selection[0].url, hostname: selection[0].hostname, lastVisit: selection[0].timestamp, highlights: 1};
				var requestCreate = urlStore.add(data);

				requestCreate.onerror = function(event) {
					console.error("ERROR - creating url:")
					console.debug(event)
				};
				requestCreate.onsuccess = function(event) {
					console.debug("successfully created url")

				};
			}	
		}
		
	}

	var storeAuthor = function(transaction){
		
		var author;
		if (selection[0].meta.author){
			author = selection[0].meta.author;
		} else if (selection[0].meta.twitterCreator) {
			author = selection[0].meta.twitterCreator
		}

		if(author){
			var authorStore = transaction.objectStore("author");
			var index = authorStore.index("authorName");
			var authorKeyRange = IDBKeyRange.only(author);

			index.openCursor(authorKeyRange).onsuccess = function(event) {
				var cursor = event.target.result;
				if (cursor) {
			    	cursor.value.highlights += 1;
			    	cursor.value.lastVisit = selection[0].timestamp;
					cursor.update(cursor.value);
					console.debug("successfully updated author")

					storeHighlight(transaction,cursor.primaryKey)

				} else {
					var data = {authorName: author, twitter: selection[0].meta.twitterCreator, highlights: 1, lastVisit: selection[0].timestamp};
					var requestCreate = authorStore.add(data);

					requestCreate.onerror = function(event) {
						console.error("ERROR - creating author:")
						console.debug(event)
					};
					requestCreate.onsuccess = function(event) {
						console.debug("successfully created author")
						storeHighlight(transaction,event.target.result)
					};
				}
			};
		} else {
			console.debug("couldn't detect author")
			storeHighlight(transaction,undefined)
		}
	}

	var storeHighlight = function(transaction, author){

		var highlightStore = transaction.objectStore("highlight");

		var highlight = selection[0];
		highlight.author = author;

		var request = highlightStore.add(highlight);

  		request.onerror = function(event) {
  			console.error("ERROR - creating highlight:")
			console.debug(event)
  		};

  		request.onsuccess = function(event) {
  			console.debug("successfully created highlight")
    	};
	}
}

// SETUP
// Database
const dbName = "flaneurIO";
var db;

$(function() {
	var request = indexedDB.open(dbName, 5);

	request.onerror = function(event) {
  		console.log("Database error: " + event.target.errorCode);
	};

	request.onupgradeneeded = function (event) {

	    db = event.target.result;

	    // STORES   
	    var highlightStore = db.createObjectStore("highlight", { autoIncrement : true });
	    highlightStore.createIndex("highlightText", "highlightText", { unique: false });
	    highlightStore.createIndex("hostname", "hostname", { unique: false });
	    highlightStore.createIndex("url", "url", { unique: false });
	    highlightStore.createIndex("author", "author", { unique: false });
	    highlightStore.createIndex("topic", "topic", { unique: false });
	    highlightStore.createIndex("timestamp", "timestamp", { unique: false });
	    highlightStore.createIndex("parent", "parent", { unique: false });

	    var annotationStore = db.createObjectStore("annotation", { autoIncrement : true });
	    annotationStore.createIndex("annotationText", "annotationText", { unique: true });
	    annotationStore.createIndex("topic", "topic", { unique: false });
	    annotationStore.createIndex("timestamp", "timestamp", { unique: false });
	    annotationStore.createIndex("highlights", "highlights", { unique: false });


	    var relationStore = db.createObjectStore("relation", { autoIncrement : true });
	    relationStore.createIndex("highlight", "highlight", { unique: false });
	    relationStore.createIndex("annotation", "annotation", { unique: false });

	    var hostStore = db.createObjectStore("host", { keyPath: "hostname" })
	    hostStore.createIndex("lastVisit", "lastVisit", { unique: false });
	    hostStore.createIndex("highlights", "highlights", { unique: false });

	    var urlStore = db.createObjectStore("url", { keyPath: "urlname" });
	    urlStore.createIndex("hostname", "hostname", { unique: false });
	    urlStore.createIndex("lastVisit", "lastVisit", { unique: false });
	    urlStore.createIndex("highlights", "highlights", { unique: false });

	    var authorStore = db.createObjectStore("author", { autoIncrement : true });
	    authorStore.createIndex("authorName", "authorName", { unique: false });
	    authorStore.createIndex("twitter", "twitter", { unique: true });
	    authorStore.createIndex("website", "website", { unique: false });
	    authorStore.createIndex("highlights", "highlights", { unique: false });
	    authorStore.createIndex("lastVisit", "lastVisit", { unique: false });

	    var topicStore = db.createObjectStore("topic", { keyPath: "topicName" });
	    topicStore.createIndex("lastUsed", "lastUsed", { unique: false });
	    topicStore.createIndex("highlights", "highlights", { unique: false });
	    topicStore.add({ topicName: "Unassigned", lastUsed: 0, highlights: 0 });
	}

});

//TYPEKIT
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    var requestHeaders = details.requestHeaders;
    for (var i=0; i<requestHeaders.length; ++i) {
        if (requestHeaders[i].name.toLowerCase() === 'referer') {
            // The request was certainly not initiated by a Chrome extension...
            return;
        }
    }
    // Set Referer
    requestHeaders.push({
        name: 'referer',
        // Host must match the domain in your Typekit kit settings
        value: 'https://flaneur.io/'
    });
    return {
        requestHeaders: requestHeaders
    };
}, {
    urls: ['*://use.typekit.net/*'],
    types: ['stylesheet']
}, ['requestHeaders','blocking']);

