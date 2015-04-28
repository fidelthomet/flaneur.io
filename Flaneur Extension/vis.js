var highlights = {}
var articles = {}
var annotations = {}
var lastRefresh = 0
var emptyHighlight;
var emptyHlTag;
var emptyTag;
var emptyArticle;
var getDataPromise = []
var getRelationsPromise = []

var itemWidth=336
var marginLR = 32

$(function() {
	// DRAGGING
	var dragObject;
	var zoomLevel = 1000;
	var mousePressed = 0;
	var matrix;

	$("#relations").click(function(){
		$(".focus").removeClass("focus")
		$(".passive").removeClass("passive")
	})

	$(".chosen").chosen({disable_search_threshold: 5})
	// $(".chosen").chosen()

	$("#sentence_search").on("focus", function(){
		if ($(this).text()=="anything") {
			$(this).text("")
		}

		$("#search_in_chosen").css("display","inline-block")
	})

	$("#sentence_search").on("blur", function(){
		if ($(this).text()=="") {
			$(this).text("anything")
			$("#search_in_chosen").hide()
		}
	})

	$("#sentence_search").on("keyup", function(){
		var searchTerm = $(this).html().replace(/&nbsp;/gi,' ').toLowerCase()
		switch($("#search_in").val()){
			case "everywhere" :
				$(".highlights").show()
				$.each(highlights, function(index, value) {
					var found = 2;
					found += value.highlight.toLowerCase().indexOf(searchTerm);
					found += value.title.toLowerCase().indexOf(searchTerm);
					for (var i = 0; i < value.annotations.length; i++) {
						found ++;
						found += value.annotations[i].annotation.toLowerCase().indexOf(searchTerm);
					};

					if (!found) {
						value.el.hide()
					} else {
						value.el.show()
					}
				})
			break;
			case "in highlights" :
	
			break;
			case "in annotations" :
			break;
			case "in titles" :
			break;
		}
	})

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
	
		$(".highlight").addClass("passive")
		$(this).removeClass("passive")
		$(".focus").removeClass("focus")
		$(this).addClass("focus")
	
		$("#container_inner").css("transition","transform .4s")
		$("#container_inner").on("transitionend", function(){
			$("#container_inner").css("transition","none")
			$("#container_inner").off("transitionend")
		})

		$("#relations g").css("transition","transform .4s")
		$("#relations g").on("transitionend", function(){
			$("#relations g").css("transition","none")
			$("#relations g").off("transitionend")
		})
		// var sx=$("#container_inner").css("transform").split(/, |\(|\)/)[1]
		// var sy=$("#container_inner").css("transform").split(/, |\(|\)/)[4]

		matrix = $(this).css("transform").split(/, |\(|\)/)

  		if (matrix.length<7) {
  			matrix=["matrix", 1, 0, 0, 1, 0, 0, ""]
  		};
  		console.log(matrix[5]+"  //   "+matrix[6])
	

		var x = window.innerWidth/2-(parseInt(matrix[5])+itemWidth/2);
		var y = window.innerHeight/2-(parseInt(matrix[6])+itemWidth/2);
		$("#container_inner").css("transform",createMatrix([1,0,0,1,x,y]))
		$("#relations g").css("transform",createMatrix([1,0,0,1,x,y]))
		zoomLevel=1000;

	})

	emptyHlTag = $('<span></span>')

	emptyTag = $('<div class="tag"><span></span></div>');

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
	
		$(dragObject).hide();
		$(this).removeClass("dragover")
	})

	//setupThree()

	$("#container").on("mousedown",function(e){

})

	$('body').bind('mousewheel', function(e){
		e.preventDefault()
  		
  		zoomLevel+=(e.originalEvent.wheelDelta/2);
  		if(zoomLevel>1000){
  			zoomLevel=1000;
  		}
  		if (zoomLevel<200) {
  			zoomLevel=200
  		}
  		$("#container_inner").removeClass("transition")
  		matrix = $("#container_inner").css("transform").split(/, |\(|\)/)

  		if (matrix.length<7) {
  			matrix=["matrix", 1, 0, 0, 1, 0, 0, ""]
  		};
  		


  		var xRel = (parseInt(matrix[5])-e.clientX)/matrix[1]
  		var yRel = (parseInt(matrix[6])-(e.clientY-44))/matrix[1]

  		var xRelN = (parseInt(matrix[5])-e.clientX)/(zoomLevel*.001)
  		var yRelN = (parseInt(matrix[6])-(e.clientY-44))/(zoomLevel*.001)

  		

  		var xRelD = (xRel-xRelN)*((zoomLevel*.001))
  		var yRelD = (yRel-yRelN)*((zoomLevel*.001))

  		matrix[5] = parseInt(matrix[5])+xRelD;
  		matrix[6] = parseInt(matrix[6])+yRelD;

  		
  		

  		var offsetX=(xRel+e.clientX/matrix[1])
  		var offsetY=(yRel+(e.clientY-44)/matrix[1])	
		
		



  		$("#container_inner").css({
  			"transform-origin":"0px 0px",
  			"transform":createMatrix([(zoomLevel*.001),matrix[2],matrix[3],(zoomLevel*.001),matrix[5],matrix[6]])
  		})
  		$("#relations g").css({
  			"transform-origin":"0px 0px",
  			"transform":createMatrix([(zoomLevel*.001),matrix[2],matrix[3],(zoomLevel*.001),matrix[5],matrix[6]])
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
		// e.preventDefault();
	})

	$("#container").on("mousemove", function(e){
		if(mousePressed){
			

			var newX = parseInt(matrix[5])+e.clientX-mousePressed.x;
			var newY = parseInt(matrix[6])+e.clientY-mousePressed.y;

			$("#container_inner").removeClass("transition")

			$("#container_inner").css("transform","matrix("+matrix[1]+", "+matrix[2]+", "+matrix[3]+", "+matrix[4]+", "+newX+", "+newY+")")
			$("#relations g").css("transform","matrix("+matrix[1]+", "+matrix[2]+", "+matrix[3]+", "+matrix[4]+", "+newX+", "+newY+")")

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
		retrieveData(timestamp)
	})
}

function retrieveData(timestamp){

	lastRefresh=$.now()

	

	getDataPromise.push(retrieveAllHighlights(timestamp))

	



	Promise.all(getDataPromise).then(function(values) {
		


		$.each(highlights, function(index, value) {
			buildHighlightDom(value.hl_id);
		})
		

		getAllAnnotations()
		
	});
}

function retrieveAllHighlights(timestamp){
	return new Promise(function(resolve, reject) {
		server.highlights.query("created").lowerBound(timestamp).execute().then(function(results) {
			var getAnnotationsBy_hl_id_Promises = []
			for (var i = 0; i < results.length; i++) {
				highlights[results[i].hl_id]=results[i]
				getAnnotationsBy_hl_id_Promises.push(getAnnotationsBy_hl_id(results[i].hl_id))
			};
			Promise.all(getAnnotationsBy_hl_id_Promises).then(function(){
				resolve()
			})

		})
	})
}

function getAllAnnotations(){
	server.annotations.query().all().execute().then( function(results){
		for (var i = 0; i < results.length; i++) {
			annotations[results[i].an_id]=results[i]
			buildAnnotationDom(results[i].an_id)
		}


		
		drawWeb()
	})
}

function getAnnotationsBy_hl_id(hl_id){
	return new Promise(function(resolve, reject) {
		highlights[hl_id].annotations=[]

		server.relations.query("hl_id").only(hl_id).execute().then(function(results){
			var getAnnotationsPromises = []

			for (var i = 0; i < results.length; i++) {
				getAnnotationsPromises.push(server.annotations.get(results[i].an_id).then(function(result){
					highlights[hl_id].annotations.push(result)
				}))
			};

			Promise.all(getAnnotationsPromises).then(function(){
				resolve()
			})
		})
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
		highlights[hl_id].el.children(".hl_tags").append(emptyHlTag.clone(true).text(highlights[hl_id].annotations[i].annotation))
	};

	
	// highlights[hl_id].el.css({"transform":createMatrix([1,0,0,1,articles[highlights[hl_id].url].index*(marginLR+itemWidth)+marginLR/2,articles[highlights[hl_id].url].offsetY])})
	

	$("#container_inner").append(highlights[hl_id].el)

	// $(".article[article_url='"+highlights[hl_id].url+"']").append(highlights[hl_id].el)
	highlights[hl_id].height=highlights[hl_id].el.height()

	articles[highlights[hl_id].url].offsetY+=highlights[hl_id].height+8+marginLR/2
}

function buildAnnotationDom(an_id){

	annotations[an_id].el = emptyTag.clone(true)
	.attr("id","an-"+an_id)

	annotations[an_id].el.children("span").text(annotations[an_id].annotation)
	

	$("#container_inner").append(annotations[an_id].el)

	annotations[an_id].height=annotations[an_id].el.height()
	annotations[an_id].width=annotations[an_id].el.width()
}


//---
// HELPER
//---
function createMatrix(values){
	return "matrix("+values[0]+", "+values[1]+", "+values[2]+", "+values[3]+", "+values[4]+", "+values[5]+")"
}

//VISUALISATIONS

function drawWeb(){
	$("#container_inner").addClass("g_network")
	graph = new myGraph("#relations");
	var graph_id = 0

	$.each(annotations, function(index, value) {
		graph.addNode(value.an_id,"an")
	});

	$.each(highlights, function(index, value) {
		graph.addNode(value.hl_id,"hl")

		for (var i = 0; i < value.annotations.length; i++) {
			graph.addLink(value.hl_id,value.annotations[i].an_id,1)
    	};
    	
    });
}

