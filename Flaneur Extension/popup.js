const dbName = "flaneur"
var url

$(function(){
	$("#open").click(function(){
		chrome.tabs.create({ url: "vis.html" });
	})

	chrome.tabs.executeScript({ file: "jquery.js" }, function() {
		chrome.tabs.executeScript({
			file: "inject.js" 
		}, 
		function(data) {
			data[0].popupOpened=true;
			url=data[0].url
			handleData(data[0])
		})
	})

	$("#title .content").on("blur", function(){
		updateTitle({"url":url, "title": $(this).text()})
	})
})

function handleData(data){
	var request = indexedDB.open(dbName, 1);

	request.onerror = function(event) {
		console.error("Database error: ")
		console.log(event.target);
	}

	request.onupgradeneeded = function (event) {
		var db = event.target.result;
		var now = $.now()

		var store = db.createObjectStore("highlights", { keyPath : "hl_id" });
		store.createIndex("highlight","highlight",{ unique: false })
		store.createIndex("host","host",{ unique: false })
		store.createIndex("url","url",{ unique: false })
		store.createIndex("created","created",{ unique: false })
		store.createIndex("author","author",{ unique: false })
		store.createIndex("project","project",{ unique: false })

		store = db.createObjectStore("annotations", { keyPath : "an_id" });
		store.createIndex("annotation","annotation",{ unique: true })
		store.createIndex("created","created",{ unique: false })
		store.createIndex("used","used",{ unique: false })

		store = db.createObjectStore("relations", { autoIncrement : true });
		store.createIndex("hl_id", "hl_id", { unique: false });
		store.createIndex("an_id", "an_id", { unique: false });

		store = db.createObjectStore("hosts", { keyPath : "host" });
		store.createIndex("created","created",{ unique: false })
		store.createIndex("used","used",{ unique: false })

		store = db.createObjectStore("urls", { keyPath : "url" });
		store.createIndex("title","title",{ unique: false })
		store.createIndex("host","host",{ unique: false })
		store.createIndex("author","author",{ unique: false })
		store.createIndex("created","created",{ unique: false })
		store.createIndex("used","used",{ unique: false })

		store = db.createObjectStore("authors", { keyPath : "author" });
		store.createIndex("created","created",{ unique: false })
		store.createIndex("used","used",{ unique: false })
		store.add({ author: "Unknown", created: now, used: now});

		store = db.createObjectStore("projects", { keyPath : "project" });
		store.createIndex("created","created",{ unique: false })
		store.createIndex("used","used",{ unique: false })
		store.add({ project: "Unassigned", created: now, used: now});
	}

	request.onsuccess = function(event) {

		var db = event.target.result;

		//===
		// prepare data if popup just openend
		//===
		if(data.popupOpened){

			var transaction = db.transaction(["urls","projects"], "readonly")
			var store = transaction.objectStore("urls");

			var requestUrl = store.get(data.url)

			requestUrl.onerror = function(event) {
				console.error("error requesting urls")
				console.log(event)
			};
			requestUrl.onsuccess = function(event) {
				if(data.highlight){
					store = transaction.objectStore("projects");

					var index = store.index("used");

					index.openCursor().onsuccess = function(event) {
						var cursor = event.target.result;
						data.project = "Unassigned"
						if (cursor) {
							data.project = cursor.value.project
						}

						if(requestUrl.result){
							data.author=requestUrl.result.author
							data.title=requestUrl.result.title
						}
						data.used=data.created
						storeHighlight(db)

					}
				} else if (requestUrl.result){
					retrieveHighlights(db)
				}
			}
		} else if (data.write){
			storeHighlight(db)
		} else if (data.read){

		}
	}

	function storeHighlight(db){
		var transaction = db.transaction(["highlights","hosts","urls","authors","projects","annotations","relations"], "readwrite")
		transaction.oncomplete = function(event) {
			console.debug("transaction completed");
		};

		transaction.onerror = function(event) {
			console.error("ERROR - transaction")
			console.debug(event)
		};

		//---
		// HIGHLIGHT
		//---

		function getHighlight(data) {
			if(data.hl_id)
		}
		function createHighlight() {

		}
		function updateHighlight() {

		}


		var highlightStore = transaction.objectStore("highlights")
		var requestGetHighlight = highlightStore.get(data.hl_id)
		requestGetHighlight.onerror = function(event) {
			console.error("ERROR - requesting highlight:")
			console.debug(event)
		};
		requestGetHighlight.onsuccess = function(event) {
			if(requestGetHighlight.result){
				requestGetHighlight.result.used = data.used;
				var requestStoreHighlight = highlightStore.put(requestGetHighlight.result)
				requestStoreHighlight.onerror = function(event) {
					console.error("ERROR - updating highlight:")
					console.debug(event)
				};
				requestStoreHighlight.onsuccess = function(event) {
					console.debug("successfully updated highlight")
				};
			} else {
				var requestStoreHighlight = highlightStore.add(data)
				requestStoreHighlight.onerror = function(event) {
					console.error("ERROR - storing highlight:")
					console.debug(event)
				};
				requestStoreHighlight.onsuccess = function(event) {
					console.debug("successfully stored highlight")
					if(data.popupOpened){
						retrieveHighlights(db)
					}
				};
			}
		};

		//---
		// HOST
		//---
		var hostStore = transaction.objectStore("hosts")
		var requestGetHost = hostStore.get(data.host)
		requestGetHost.onerror = function(event) {
			console.error("ERROR - requesting host:")
			console.debug(event)
		};
		requestGetHost.onsuccess = function(event) {
			if(requestGetHost.result){
				requestGetHost.result.used = data.used;
				var requestStoreHost = hostStore.put(requestGetHost.result)
				requestStoreHost.onerror = function(event) {
					console.error("ERROR - updating host:")
					console.debug(event)
				};
				requestStoreHost.onsuccess = function(event) {
					console.debug("successfully updated host")
				};
			} else {
				var requestStoreHost = hostStore.add({"host":data.host, "created":data.created, "used":data.created})
				requestStoreHost.onerror = function(event) {
					console.error("ERROR - storing host:")
					console.debug(event)
				};
				requestStoreHost.onsuccess = function(event) {
					console.debug("successfully stored host")
				};
			}
		};

		//---
		// URL
		//---
		var urlStore = transaction.objectStore("urls")
		var requestGetUrl = urlStore.get(data.url)
		requestGetUrl.onerror = function(event) {
			console.error("ERROR - requesting url:")
			console.debug(event)
		};
		requestGetUrl.onsuccess = function(event) {
			if(requestGetUrl.result){
				requestGetUrl.result.used = data.used;
				var requestStoreUrl = urlStore.put(requestGetUrl.result)
				requestStoreUrl.onerror = function(event) {
					console.error("ERROR - updating url:")
					console.debug(event)
				};
				requestStoreUrl.onsuccess = function(event) {
					console.debug("successfully updated url")
				};
			} else {
				var requestStoreUrl = urlStore.add({"url":data.url, "title":data.title, "host":data.host, "author": data.author, "created":data.created, "used":data.created})				
				requestStoreUrl.onerror = function(event) {
					console.error("ERROR - storing url:")
					console.debug(event)
				};
				requestStoreUrl.onsuccess = function(event) {
					console.debug("successfully stored url")
				};
			}
		};
		//---
		// AUTHOR
		//---
		var authorStore = transaction.objectStore("authors")
		var requestGetAuthor = authorStore.get(data.author)
		requestGetAuthor.onerror = function(event) {
			console.error("ERROR - requesting author:")
			console.debug(event)
		};
		requestGetAuthor.onsuccess = function(event) {
			if(requestGetAuthor.result){
				requestGetAuthor.result.used = data.used;
				var requestStoreAuthor = authorStore.put(requestGetAuthor.result)
				requestStoreAuthor.onerror = function(event) {
					console.error("ERROR - updating author:")
					console.debug(event)
				};
				requestStoreAuthor.onsuccess = function(event) {
					console.debug("successfully updated author")
				};
			} else {
				var requestStoreAuthor = authorStore.add({"author":data.author, "created":data.created, "used":data.created})
				requestStoreAuthor.onerror = function(event) {
					console.error("ERROR - storing author:")
					console.debug(event)
				};
				requestStoreAuthor.onsuccess = function(event) {
					console.debug("successfully stored author")
				};
			}
		};
		//---
		// PROJECT
		//---
		var projectStore = transaction.objectStore("projects")
		var requestGetProject = projectStore.get(data.project)
		requestGetProject.onerror = function(event) {
			console.error("ERROR - requesting project:")
			console.debug(event)
		};
		requestGetProject.onsuccess = function(event) {
			if(requestGetProject.result){
				requestGetProject.result.used = data.used;
				var requestStoreProject = projectStore.put(requestGetProject.result)
				requestStoreProject.onerror = function(event) {
					console.error("ERROR - updating project:")
					console.debug(event)
				};
				requestStoreProject.onsuccess = function(event) {
					console.debug("successfully updated project")
				};
			} else {
				var requestStoreProject = projectStore.add({"project":data.author, "created":data.created, "used":data.created})
				requestStoreProject.onerror = function(event) {
					console.error("ERROR - storing author:")
					console.debug(event)
				};
				requestStoreProject.onsuccess = function(event) {
					console.debug("successfully stored author")
				};
			}
		};

	}

	function retrieveHighlights(db){
		var transaction = db.transaction(["urls","highlights"], "readonly")
		var urlStore = transaction.objectStore("urls");

		var requestUrl = urlStore.get(data.url)

		requestUrl.onerror = function(event) {
			console.error("error requesting urls")
			console.log(event)
		};
		requestUrl.onsuccess = function(event) {
			if(requestUrl.result){
				$("#nothing_selected").hide()
				$("#highlights").show()
				$("#title .content").html(requestUrl.result.title)
				$("#author .content").html(requestUrl.result.author)
			}
		}

		var highlightStore = transaction.objectStore("highlights");
		var index = highlightStore.index("url");
		var singleKeyRange = IDBKeyRange.only(data.url);
		index.openCursor(singleKeyRange).onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor) {
				$("#highlights").append(hlDOM[0]+cursor.value.hl_id+hlDOM[1]+cursor.value.highlight+hlDOM[2]+newTagDOM+hlDOM[3])
				$("#hl-"+cursor.value.hl_id+" .addtag").on("focus",function(){
					var hl_id = $(this).parent().parent()[0].id.split("-")[1];
					var an_id = $.now()+"-"+Math.floor((Math.random()*.9+.1)*1000000)
					$(this).before(tagDOM[0]+an_id+tagDOM[1]+" "+tagDOM[2])
					$("#an-"+an_id).focus();
					$("#an-"+an_id).on("keydown", function(e){
						if ($(this).text()==" ") {
							$(this).text('')
						};

						if (e.keyCode==13) {
							event.preventDefault();
							if(!$(this).text()){
								this.blur()
							} else {
								$(this).parent().children(".addtag").focus()
							}
						}
					});
					$("#an-"+an_id).on("keyup", function(){
						if (!$(this).text()) {
							$(this).text(' ')
						};
					});
					$("#an-"+an_id).on("focus", function(){
						selectElementContents(this)
					});
					$("#an-"+an_id).on("blur", function(){

						if ($(this).text()==" "||!$(this).text()) {
							$(this).remove()
						};
					});

				})


				cursor.continue();
			}
		}

	}
}

// HELPER FUNCTIONS
function selectElementContents(el) {
	var range = document.createRange();
	range.selectNodeContents(el);
	var sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
}

// DOM
var hlDOM = ['<div id="hl-','" class="highlight"><div class="hl_content"><span>','</span></div><div class="hl_tags">','</div></div>']
var tagDOM = ['<span id="an-','" contentEditable="plaintext-only">','</span>']
var newTagDOM = '<span class="addtag" contentEditable="plaintext-only">Add Tags & Annotaions</span>'