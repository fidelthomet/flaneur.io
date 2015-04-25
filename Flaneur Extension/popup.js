var url
var removeHighlightTimeout = {}

$(function(){
	$("#open").click(function(){
		chrome.tabs.create({ url: "vis.html" });
	})

	chrome.tabs.executeScript({ file: "jquery.js" }, function() {
		chrome.tabs.executeScript({
			file: "inject.js" 
		}, 
		function(data) {
			url=data[0].url
			handleData(data[0])
		})
	})

	$("#title .content").on("blur", function(){
		if(!$(this).text()){
			$(this).text("Untitled")
		}
		updateTitle({url:url, title:$(this).text()})
	})
	$("#author .content").on("blur", function(){
		if(!$(this).text()){
			$(this).text("Unknown")
		}
		updateAuthor({url:url, author:$(this).text()})
	})
})

function handleData(data){
	url = data.url
	data.updated = data.created
	server.urls.get( data.url ).then( function(result) {
		if(data.highlight){
			if(result){
				data.title = result.title
				data.author = result.author
			}

			server.projects.query("updated").all().execute().then( function(results){
				data.project=results[0].project
				storeHighlight()
			})
		} else {
			if(result){
				getPopupData(result)
			}
		}
	})

	function storeHighlight(){

		server.highlights.add(data).then( function(){
			getPopupData(data)
		})

		server.hosts.get( data.host ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.hosts.update(result)
			}else{
				server.hosts.add({"host":data.host, "created":data.created, "updated":data.updated})
			}
		})

		server.urls.get( data.url ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.urls.update(result)
			}else{
				server.urls.add({"url":data.url, "title":data.title, "host":data.host, "author": data.author, "created":data.created, "updated":data.updated})
			}
		})

		server.authors.get( data.author ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.authors.update(result)
			}else{
				server.authors.add({"author":data.author, "created":data.created, "updated":data.updated})
			}
		})

		server.projects.get( data.project ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.projects.update(result)
			}else{
				console.log("this shouldn't have happened")
				server.projects.add({"project":data.project, "created":data.created, "updated":data.updated})
			}
		})
	}

	function getPopupData(urlData){
		$("#nothing_selected").hide()
		$("#highlights").show()
		$("#title .content").html(urlData.title)
		$("#author .content").html(urlData.author)

		server.highlights.query( 'url' ).only( urlData.url ).execute().then( function ( results ) {
			for (var i = 0; i < results.length; i++) {
				$("#highlights").append(hlDOM[0]+results[i].hl_id+hlDOM[1]+results[i].highlight+hlDOM[2]+newTagDOM+hlDOM[3])
				$("#hl-"+results[i].hl_id+" .delete_highlight").click(function(event){
					event.stopPropagation() 
					$(this).closest(".highlight").children(".deleting").addClass("now")
					removeHighlightTimeout[$(this).closest(".highlight").attr('id')]=(window.setTimeout(finishRemovingHighlight, 3000, $(this).closest(".highlight").attr('id').split("hl-")[1]));
					$(this).closest(".highlight").click(function(){
						console.log("huhu")
						window.clearTimeout(removeHighlightTimeout[$(this).attr("id")])
						$(this).children(".deleting").removeClass("now")
					})
					
				})
				$("#hl-"+results[i].hl_id+" .addtag").on("focus",function(){
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
					$("#an-"+an_id).on("blur", function(){
						if ($(this).text()==" "||!$(this).text()) {
							$(this).remove()
						} else {
							addAnnotation({hl_id: $(this).closest(".highlight").attr('id').split("hl-")[1], an_id: $(this).attr('id').split("an-")[1], annotation: $(this).text()})
							$(this).attr("contentEditable","false")
							$(this).click(function(){
								removeAnnotation({hl_id: $(this).closest(".highlight").attr('id').split("hl-")[1], an_id: $(this).attr('id').split("an-")[1]})
								$(this).remove()
							})
						}
					});

				})
				server.relations.query( "hl_id" ).only(results[i].hl_id).execute().then(function( results ){
					for (var i = 0; i < results.length; i++) {
						console.log(results)
						getAnnotationsForHighlight(results[i])
					};

				})

			};
		});
	}
}

function finishRemovingHighlight(data){
	console.log("wulf")
	console.log(data)
	removeHighlight(data)
	$("#hl-"+data).remove()
	if(!$(".highlight").length){
		$("#nothing_selected").show()
		$("#highlights").hide()
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
var hlDOM = ['<div id="hl-','" class="highlight"><div class="delete_highlight"></div><div class="hl_content"><span>','</span></div><div class="project"><span class="project_name">Unassigned</span><div class="project_select"></div></div><div class="hl_tags">','</div><div class="deleting"></div></div>']
var tagDOM = ['<span id="an-','" contentEditable="plaintext-only">','</span>']
var tagNoEditDOM = ['<span id="an-','">','</span>']
var newTagDOM = '<span class="addtag" contentEditable="plaintext-only">Add Tags & Annotaions</span>'