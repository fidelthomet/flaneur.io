var selection = window.getSelection();
var selectedText = selection.toString();

var data = {};

if (selectedText!="") {
	//---------------------------
	// Highlichting selected text
	//---------------------------
	if (selection.anchorNode.parentElement==selection.focusNode.parentElement){

		var inner = selection.anchorNode.parentElement.innerHTML

		if(selection.anchorOffset<selection.focusOffset){
			var selectionBegin = selection.anchorOffset
			var selectionEnd = selection.focusOffset
		} else {
			var selectionBegin = selection.focusOffset
			var selectionEnd = selection.anchorOffset
		}

		var idNum = Math.round(Math.random()*1000000000)
		var arrows = "<svg width='6px' height='8px' viewBox='0 0 6 8' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><g id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd' sketch:type='MSPage'><path d='M0,3 L3,0 L6,3 L0,3 Z' id='Path-1' fill='#FFF500' sketch:type='MSShapeGroup'></path><path d='M0,8 L3,5 L6,8 L0,8 Z' id='Path-2' fill='#FFF500' sketch:type='MSShapeGroup' transform='translate(3.000000, 6.500000) scale(1, -1) translate(-3.000000, -6.500000) '></path></g></svg>"
		selection.anchorNode.parentElement.innerHTML=inner.split(selectedText)[0]+"<span id='flaneurio_highlight_"+idNum+"' class='flaneurio_highlight'>"+selectedText+"<div id='flaneurio_annotation_"+idNum+"' class='flaneurio_annotation'><div class='flaneurio_select'><div class='flaneurio_topic'>Unsortiert</div><div class=flaneurio_select_icon>"+arrows+"</div></div></div></span>"+inner.split(selectedText)[1]

		$("#flaneurio_annotation_"+idNum).css({
			left: 10+$("#flaneurio_highlight_"+idNum).parent().position().left+$("#flaneurio_highlight_"+idNum).parent().width()+"px",
			top: -10+$("#flaneurio_highlight_"+idNum).position().top + "px"
		})

		var annotate = document.createElement('div');
		annotate.className="flaneurio_annotate";
		annotate.contentEditable=true;
		
		$(annotate).keydown(function(event){
			if (event.keyCode==13) {
				event.preventDefault();
				
				var test = $("#flaneurio_annotation_"+idNum).append($(this).clone(true).html(''))
				test[0].lastChild.focus()
			}
		})

		// var newAnnotate = function(el){
		// 	var test = $("#flaneurio_annotation_"+idNum).append($(el).clone(true))
		// }

		$("#flaneurio_annotation_"+idNum).append($(annotate))

		// $("#flaneurio_annotation_"+idNum).append("<div class='flaneurio_annotate' contenteditable='true'></div>")
		// $("#flaneurio_annotation_"+idNum+" .flaneurio_annotate").keydown(function(event) {
		// 	if (event.keyCode==13) {
		// 		event.preventDefault();
		// 		$("#flaneurio_annotation_"+idNum).append("<div class='flaneurio_annotate' contenteditable='true'></div>")
		// 	}
		// })



	} else {
		// TO BE HANDLED SOMEHOW
		// to many exceptions
	}



	data.highlightText=selectedText
	data.hostname = location.hostname
	data.url = location.href
	
	
	data.timestamp = $.now()
	data.topic = "Unassigned"
	data.meta = {}

	// Title
	if ($('meta[property="og:title"]').attr('content')) {
		data.meta.title = $('meta[property="og:title"]').attr('content');
	} else if ($('meta[name="twitter:title"],meta[property="twitter:title"]').attr('content')) {
		data.meta.title = $('meta[name="twitter:title"],meta[property="twitter:title"]').attr('content');
	} else if(data.meta.title = $('title').text()){
		data.meta.title = $('title').text()
	}

	// Description
	if ($('meta[property="og:description"]').attr('content')) {
		data.meta.description = $('meta[property="og:description"]').attr('content');
	} else if ($('meta[name="twitter:description"],meta[property="twitter:description"]').attr('content')) {
		data.meta.description = $('meta[name="twitter:description"],meta[property="twitter:description"]').attr('content');
	} else if($('meta[name="description"]').attr('content')){
		data.meta.description = $('meta[property="description"]').attr('content')
	}

	// Image
	if ($('meta[property="og:image"]').attr('content')) {
		data.meta.image = $('meta[property="og:image"]').attr('content');
	} else if($('meta[name="twitter:image:src"],meta[name="property:image:src"]').attr('content')) {
		data.meta.image = $('meta[name="twitter:image:src"],meta[name="property:image:src"]').attr('content');
	}

	// SiteName
	if ($('meta[property="og:site_name"]').attr('content')) {
		data.meta.siteName = $('meta[property="og:site_name"]').attr('content');
	} else {
		data.meta.siteName = location.hostname
	}

	// Twitter Site
	if ($('meta[name="twitter:site"],meta[property="twitter:site"]').attr('content')) {
		data.meta.twitterSite = $('meta[name="twitter:site"],meta[property="twitter:site"]').attr('content');
	}

	// Twitter Creator
	if ($('meta[name="twitter:creator"],meta[property="twitter:creator"]').attr('content')) {
		data.meta.twitterCreator = $('meta[name="twitter:creator"],meta[property="twitter:creator"]').attr('content');
	}

	// Author
	if ($('meta[name="author"]')){
		data.meta.author = $('meta[name="author"]').attr('content');
	}

	console.log(data)
}

data