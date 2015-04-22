$(function() {
	// DRAGGING
	var dragObject;
	var zoomLevel = 1000;
	var mousePressed = 0;
	var matrix;

	$(".highlight").on( "dragstart", function(e){
		$(".highlight").addClass("passive")
		$(this).removeClass("passive")
		$(this).css({"opacity":0});
		$("#drag_options").addClass("enable")

		dragObject=this;
		mousePressed = undefined;
		// $(this).css({"cursor":"-webkit-grabbing"})
	})

	$(".highlight").on( "dragend", function(e){
		$(".highlight").removeClass("passive")
		$(this).css({"opacity":1});
		$("#drag_options").removeClass("enable")
		// $(this).css({"cursor":"-webkit-grab"})
	})

	$(".highlight").on( "drag", function(e){
		// $(this).css({"cursor":"-webkit-grab"})
	})	
	
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
  		zoomLevel+=e.originalEvent.wheelDelta;
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
  		  	"transform":"matrix("+((zoomLevel*.01)/10)+", "+matrix[2]+", "+matrix[3]+", "+((zoomLevel*.01)/10)+", "+matrix[5]+", "+matrix[6]+")"	
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


