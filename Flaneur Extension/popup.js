var url
var removeHighlightTimeout = {}
var imgID = 0
var data;
var ar_id = "";
var activeHighlight;

$(function(){
	$("#open").click(function(){

		chrome.tabs.create({ url: "flaneur.html#article="+ar_id });
	})

	chrome.tabs.executeScript({ file: "jquery.js" }, function() {
		chrome.tabs.executeScript({
			file: "inject.js" 
		}, 
		function(results) {
			data = results[0]
			url=results[0].url
			handleData()
		})
	})

	$(".text .title").on("blur", function(){
		if(!$(this).text()){
			$(this).text("Untitled")
			updateTitle({url:url, title:$(this).text()})
		}
	})
	$(".text .title").on("keyup", function(){
		if(!$(this).text()){
			updateTitle({url:url, title: "Untitled"})
		}
		updateTitle({url:url, title:$(this).text()})
	})
	$(".text .author").on("blur", function(){
		if(!$(this).text()){
			$(this).text("Unknown")
			updateAuthor({url:url, author:$(this).text()})
		}
	})
	$(".text .author").on("keyup", function(){
		if(!$(this).text()){
			updateAuthor({url:url, author: "Unknown"})
		}
		updateAuthor({url:url, author:$(this).text()})
	})

	$("#overlay").click(function(){
		$(this).hide();
		$("#overlay #contextmenu").removeClass("show")
	})

	dom.highlight.find(".hl_content .text").click(function(){
		// removeHighlight($(this).closest(".highlight").attr('id').split("hl-")[1])
		// $(this).closest(".highlight").remove()
		// if(!$(".highlight").length){
		// 	$("#nothing_selected").show()
		// 	$("#highlights").hide()
		// }
	})

	$(document).on("contextmenu", function(e){
		if($(e.target).attr("contenteditable")!="plaintext-only")
			e.preventDefault();
	})

	dom.highlight.find(".hl_content").on("contextmenu",function(e){
		window.getSelection().removeAllRanges()
		e.preventDefault()
		activeHighlight = $(this).parent().attr("id").split("hl-")[1]
		
		var copy = $("<div id='copy'>Copy</div>")
		copy.click(function(){
			copytext($("#hl-"+activeHighlight+" .hl_content").text())
		})
		var copyAsLink = $("<div id='copyAsLink'>Copy as Link</div>")
		copyAsLink.click(function(){
			copytext("["+$("#hl-"+activeHighlight+" .hl_content").text()+"]("+data.url+")")
		})
		// var copyAsRef = $("<div id='copyAsRef'>Copy as Reference</div>")
		var del = $("<div id='delete'>Delete</div>")
		del.click(function(){
			removeHighlight(activeHighlight, data)
			$("#hl-"+activeHighlight).remove()

			if(!$(".highlight").length){
				$("#nothing_selected").show()
				$("#highlights").hide()
			}
		})
		del.on("mouseover", function(){
			$("#hl-"+activeHighlight+" .hl_content span").addClass("delete")
		})
		del.on("mouseout", function(){
			$("#hl-"+activeHighlight+" .hl_content span").removeClass("delete")
		})

		$("#overlay #contextmenu").empty()
		$("#overlay #contextmenu").append([copy, copyAsLink, del])		

		var x = e.clientX;
		var y = e.clientY;

		if(x > window.innerWidth-112){
			x-=112
		}
		
		if(y > window.innerHeight-96){
			y-=61
		}


		$("#overlay #contextmenu").css({left: x, top: y})


		$("#overlay").show()

		// $("#overlay #contextmenu").addClass("show")
	})

	dom.annotation.on("contextmenu",function(e){
		window.getSelection().removeAllRanges()
		e.preventDefault()
		activeHighlight = $(this).closest(".highlight").attr('id').split("hl-")[1]
		activeAnnotation = $(this)

		var del = $("<div id='delete'>Delete</div>")
		del.click(function(){
			removeAnnotation({hl_id: activeHighlight, an_id: activeAnnotation.attr("an_id")})
			activeAnnotation.remove()
		})
		del.on("mouseover", function(){
			$([name="twitter:title"])
			activeAnnotation.addClass("delete")
		})
		del.on("mouseout", function(){
			activeAnnotation.removeClass("delete")
		})

		$("#overlay #contextmenu").empty()
		$("#overlay #contextmenu").append([del])		

		var x = e.clientX;
		var y = e.clientY

		if(x > window.innerWidth-112){
			x-=112
		}
		if(y > window.innerHeight-20){
			y-=20
		}


		$("#overlay #contextmenu").css({left: x, top: y})


		$("#overlay").show()
	})

	dom.highlight.find(".create").click(function(){
		var newTag = dom.annotation.clone()
		.addClass("focus")

		
		

		newTag.find("span")
		.attr("contenteditable","plaintext-only")
		.addClass("tagspan")
		.text("")
		var an_id = $.now()+"-"+Math.floor((Math.random()*.9+.1)*1000000)
		newTag.find("span").attr("an_id", an_id)
		newTag.find("span").attr("id", "an-"+an_id)
		newTag.insertBefore(this)
		$(window).scrollTop($(window).scrollTop()+24);
		newTag.find("span").focus();

		newTag.find(".tagspan").on("keydown", function(e){
			if (e.keyCode==13) {
				e.preventDefault()
				window.getSelection().removeAllRanges()
				this.blur()
				event.preventDefault();
				$(this).parent().removeClass("focus")

				if($(this).text()){

					$(this).parent().parent().find(".create").trigger("click")
				}
			}
		})

		newTag.find(".tagspan").on("keyup", function(){
			var parent = $(this).parent()
			var value = $(this).text()
			if(value && value != " "){
				server.annotations.query("updated").filter(function(annotation){
					var hits = 0
					$.each(value.split(" "), function(index, searchItem){
						$.each(annotation.annotation.split(" "), function(index, keyItem){
							if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
								hits++
								return false;
							}
						})
					})
					return (hits == value.split(" ").length)
				}).desc().limit(0,5).execute().then(function(results){
					$(".suggestion").remove()
					$.each(results, function(index, item){
						var suggestion = dom.annotation.clone()
						.addClass("suggestion")
						.mousedown(function(){
						
							$(this).parent().find(".tagspan").text($(this).text())
							$(this).parent().find(".tagspan").attr("an_id",$(this).attr("an_id"))
							// $(this).parent().find(".tagspan").trigger("b")
						})
						.click(function(e){
							e.stopPropagation()
							$(".suggestion").remove()
						})
						suggestion.find("span").text(item.annotation)
						suggestion.find("span").attr("an_id", item.an_id)
						parent.append(suggestion)
					})
				})
			} else {
				$(".suggestion").remove()
			}
		})

newTag.find(".tagspan").on("blur", function(){
	$(".focus").removeClass("focus")
	if ($(this).text()==" "||!$(this).text()) {
		$(this).parent().remove()
	} else {
		addAnnotation({hl_id: $(this).closest(".highlight").attr('id').split("hl-")[1], an_id: $(this).attr('an_id'), annotation: $(this).text()})
		$(this).attr("contentEditable","false")
		$(this).parent().click(function(){
			removeAnnotation({hl_id: $(this).closest(".highlight").attr('id').split("hl-")[1], an_id: $(this).find("span").attr('an_id')})
			$(this).remove()
		})
	}
})
})


dom.annotation.click(function(){
	removeAnnotation({hl_id: $(this).closest(".highlight").attr('id').split("hl-")[1], an_id: $(this).attr('an_id')})
	$(this).remove()
})
})

function handleData(){
	url = data.url
	data.updated = data.created
	data.color = Math.random()*360
	data.ar_id = ""

	server.urls.get( data.url ).then( function(result) {
		if(data.highlight){
			if(result){
				data.title = result.title
				data.author = result.author
				data.color = result.color
				ar_id = data.ar_id = result.ar_id
			}

			server.projects.query("updated").all().execute().then( function(results){
				data.project=results[0].project
				storeHighlight()
			})
		} else {
			if(result){
				data.title = result.title
				data.author = result.author
				data.color = result.color
				ar_id = data.ar_id = result.ar_id
				getPopupData()
			}
		}
	})

	function storeHighlight(){

		server.highlights.query("created").all().desc().limit(0,1).execute().then(function(results){
			if(!results.length){
				server.highlights.add(data).then( function(){
					getPopupData()
				})
			} else {

				if(results[0].url == data.url && results[0].highlight == data.highlight){
					getPopupData()
				} else {
					server.highlights.add(data).then( function(){
						getPopupData()
					})
				}
			}
		})
		

		server.hosts.get( data.host ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.hosts.update(result)
			}else{
				server.hosts.add({"ho_id": genId(), "host":data.host, "created":data.created, "updated":data.updated})
			}
		})

		server.urls.get( data.url ).then(function(result) {
			if(result){
				result.updated=data.updated
				result.img = data.img
				result.color = data.color
				result.description = data.description
				server.urls.update(result)
			}else{
				server.urls.add({"ar_id": genId(), "description": data.description, "img": data.img, "color": data.color, "url":data.url, "title":data.title, "host":data.host, "author": data.author, "created":data.created, "updated":data.updated})
			}
		})

		server.authors.get( data.author ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.authors.update(result)
			}else{
				server.authors.add({"au_id": genId(), "author":data.author, "created":data.created, "updated":data.updated})
			}
		})

		server.projects.get( data.project ).then(function(result) {
			if(result){
				result.updated=data.updated
				server.projects.update(result)
			}else{
				console.log("this shouldn't have happened")
				server.projects.add({"pr_id": genId(), "project":data.project, "created":data.created, "updated":data.updated})
			}
		})
	}

	function getPopupData(){

		$("#nothing_selected").hide()
		$("#highlights").show()
		$(".title").html(data.title)
		$(".author").html(data.author)

		if(data.img){
			$(".img").css("background-color", "#fff")
			$(".img").css("background-image", "url("+data.img+")")
		} else if(data.color){
			$(".img").css("background-color","hsl("+data.color+",90%,80%)")
		} else {
			$(".img").css("background-color","hsl("+Math.random()*360+",90%,80%)")
		}
		
		server.highlights.query( 'url' ).only( data.url ).execute().then( function ( highlights ) {
			$.each(highlights, function(index, hl){
				var highlight = dom.highlight.clone(true).attr("id","hl-"+hl.hl_id)
				highlight.find(".hl_content span.text").text(hl.highlight)
				
				$(".highlights").append(highlight)

				server.an_relations.query( "hl_id" ).only(hl.hl_id).execute().then(function( an_relations ){
					$.each(an_relations, function(index, rel){
						server.annotations.get( rel.an_id ).then(function(an) {
							if(an){
								var annotation = dom.annotation.clone(true)
								.attr("an_id", an.an_id)
								annotation.find("span")
								.text(an.annotation)

								annotation.insertBefore("#hl-"+hl.hl_id+" .hl_tags .create")
								$("html, body").scrollTop($(document).height())
							}
						})
					})
				})
			})
		})
	}
}

function finishRemovingHighlight(data){

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

function copytext(text){
	var input = $("<input></input>");
	input.val(text)
	$("body").append(input)
	input.focus()
	document.execCommand('selectAll');
	document.execCommand('copy');
	input.remove();
}

// DOM
var hlDOM = ['<div id="hl-','" class="highlight"><div class="delete_highlight"></div><div class="hl_content"><span>','</span></div><div class="project"><span class="project_name">Unassigned</span><div class="project_select"></div></div><div class="hl_tags">','</div><div class="deleting"></div></div>']
var tagDOM = ['<span id="an-','" contentEditable="plaintext-only">','</span>']
var tagNoEditDOM = ['<span id="an-','">','</span>']
var newTagDOM = '<span class="addtag" contentEditable="plaintext-only">Add Tags & Annotaions</span>'

dom = {}
dom.highlight = $('<div class="highlight"><div class="hl_content"><span class="text"></span></div><div class="hl_tags"><div class="create"><span>Add Annotation</span></div></div></div>')
dom.annotation = $('<div><span></span></div>')