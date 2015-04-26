var highlights = {}
var articles = {}
var lastRefresh = 0
var emptyHighlight;
var emptyTag;
var emptyArticle;

var itemWidth=336
var marginLR = 32

$(function() {
	// DRAGGING
	var dragObject;
	var zoomLevel = 1000;
	var mousePressed = 0;
	var matrix;

	emptyHighlight = $('<div class="highlight" draggable="true"><div class="hl_title"></div><div class="hl_description"></div><div class="hl_content"><span></span></div><div class="project"><span class="project_name"></span><div class="project_select"></div></div><div class="hl_tags"></div></div>');
	emptyHighlight.on( "dragstart", function(e){
		$(".highlight").addClass("passive")
		$(this).removeClass("passive")
		$(this).css({"opacity":0});
		$("#drag_options").addClass("enable")

		dragObject=this;
		mousePressed = undefined;
		// $(this).css({"cursor":"-webkit-grabbing"})
	})

	emptyHighlight.on( "dragend", function(e){
		$(".highlight").removeClass("passive")
		$(this).css({"opacity":1});
		$("#drag_options").removeClass("enable")
		// $(this).css({"cursor":"-webkit-grab"})
	})

	emptyHighlight.on( "drag", function(e){
		// $(this).css({"cursor":"-webkit-grab"})
	})

	emptyHighlight.on( "click", function(e){
		console.log($(this).attr("id").split("hl-"))
		$(this).children(".hl_tags").toggle()
	})

	emptyTag = $('<span></span>')

	emptyArticle = $('<div class="article"><div class="article_title"><div class="caption">title</div><div class="content" contentEditable="plaintext-only"></div></div><div class="article_author"><div class="caption">author</div><div class="content" contentEditable="plaintext-only"></div></div></div>')

	retrieveAllArticles()

	
	
	$("#drag_options").children().on("dragenter", function(e){
		e.preventDefault()
		$(this).addClass("dragover")
	})

	$("#drag_options").children().on("dragover", function(e){
		e.preventDefault()
	})

	$("#drag_options").children().on("dragleave", function(e){
		$(this).removeClass("dragover")
	})

	$("#drag_options").children().on("drop", function(e){
		console.log(e)
		$(dragObject).hide();
		$(this).removeClass("dragover")
	})

	//setupThree()

	$("#container").on("mousedown",function(e){
	// 	console.log(e)
})

	$('body').bind('mousewheel', function(e){
		e.preventDefault()
  		// console.log(e.clientX)
  		zoomLevel+=(e.originalEvent.wheelDelta/2);
  		if(zoomLevel>1000){
  			zoomLevel=1000;
  		}
  		if (zoomLevel<200) {
  			zoomLevel=200
  		}

  		matrix = $("#container_inner").css("transform").split(/, |\(|\)/)

  		if (matrix.length<7) {
  			matrix=["matrix", "1", "0", "0", "1", "0", "0", ""]
  		};

  		$("#container_inner").css({
  			// "transform-origin": e.clientX+"px "+ e.clientY+"px",
  			"transform":"matrix("+(zoomLevel*.001)+", "+matrix[2]+", "+matrix[3]+", "+(zoomLevel*.001)+", "+matrix[5]+", "+matrix[6]+")"	
  		})


  	})

	$("#container").on("mousedown", function(e){
		mousePressed = {x: e.clientX, y: e.clientY};

		matrix = $("#container_inner").css("transform").split(/, |\(|\)/)

		if (matrix.length<7) {
			matrix=["matrix", "1", "0", "0", "1", "0", "0", ""]
		};
	})

	$(window).on("contextmenu", function(e){
		e.preventDefault();
	})

	$("#container").on("mousemove", function(e){
		if(mousePressed){
			

			// console.log(e.clientX-mousePressed.x)
			var newX = parseInt(matrix[5])+e.clientX-mousePressed.x;
			var newY = parseInt(matrix[6])+e.clientY-mousePressed.y;


			$("#container_inner").css("transform","matrix("+matrix[1]+", "+matrix[2]+", "+matrix[3]+", "+matrix[4]+", "+newX+", "+newY+")")

			// mousePressed = {x: e.clientX, y: e.clientY};
		}
		
	})

	$(document).on("mouseup", function(){
		mousePressed = undefined;
	})

})

function retrieveAllArticles(timestamp){
	if(!timestamp)
		timestamp=0

	server.urls.query("created").lowerBound(timestamp).execute().then(function(results){
		for (var i = 0; i < results.length; i++) {
			results[i].index = i
			articles[results[i].url]=results[i]
			buildArticleDom(results[i].url)
		};
		retrieveAllHighlights(timestamp)
	})
}

function retrieveAllHighlights(timestamp){

	lastRefresh=$.now()

	

	server.highlights.query("created").lowerBound(timestamp).execute().then(function(results) {
		for (var i = 0; i < results.length; i++) {
			highlights[results[i].hl_id]=results[i]
			getAnnotationsBy_hl_id(results[i].hl_id)
		};  
	})
}

function getAnnotationsBy_hl_id(hl_id){
	highlights[hl_id].annotations=[]
	server.relations.query("hl_id").only(hl_id).execute().then(function(results){
		var annotationPromises = []
		for (var i = 0; i < results.length; i++) {
			annotationPromises.push(server.annotations.get(results[i].an_id).then(function(result){
				highlights[hl_id].annotations.push(result)
			}))			
		};
		Promise.all(annotationPromises).then(function(values) {
			buildHighlightDom(hl_id);
			drawWeb()
		});
	})
}

function buildArticleDom(url){
	articles[url].el = emptyArticle.clone(true)
	.attr("article_url",url)

	articles[url].el.children(".article_title").children(".content").text(articles[url].title)
	articles[url].el.children(".article_author").children(".content").text(articles[url].author)

	articles[url].el.css({"transform":createMatrix([1,0,0,1,articles[url].index*(marginLR+itemWidth)+marginLR/2,0])})
	

	$("#container_inner").append(articles[url].el)
	articles[url].offsetY=articles[url].el.height()+marginLR
}

function buildHighlightDom(hl_id){
	highlights[hl_id].el = emptyHighlight.clone(true)
	.attr("id","hl-"+hl_id)

	highlights[hl_id].el.children(".hl_title").text(highlights[hl_id].title)
	highlights[hl_id].el.children(".hl_description").text(highlights[hl_id].description)
	highlights[hl_id].el.children(".hl_content").children("span").text(highlights[hl_id].highlight)
	highlights[hl_id].el.children(".project").children(".project_name").text(highlights[hl_id].project)

	for (var i = 0; i < highlights[hl_id].annotations.length; i++) {
		highlights[hl_id].el.children(".hl_tags").append(emptyTag.clone(true).text(highlights[hl_id].annotations[i].annotation))
	};

	
	// highlights[hl_id].el.css({"transform":createMatrix([1,0,0,1,articles[highlights[hl_id].url].index*(marginLR+itemWidth)+marginLR/2,articles[highlights[hl_id].url].offsetY])})
	

	$("#container_inner").append(highlights[hl_id].el)

	// $(".article[article_url='"+highlights[hl_id].url+"']").append(highlights[hl_id].el)
	highlights[hl_id].height=highlights[hl_id].el.height()

	articles[highlights[hl_id].url].offsetY+=highlights[hl_id].height+8+marginLR/2
}


//---
// HELPER
//---
function createMatrix(values){
	return "matrix("+values[0]+", "+values[1]+", "+values[2]+", "+values[3]+", "+values[4]+", "+values[5]+")"
}

//VISUALISATIONS

function drawWeb(){
	var graph = {nodes:[],links:[]}
	$.each(highlights, function(index, value) {
		value.index=index
    	graph.nodes.push({name:value.hl_id})
	}); 
	
	drawForceGraph(graph)
}

