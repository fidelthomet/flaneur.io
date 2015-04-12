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

		selection.anchorNode.parentElement.innerHTML=inner.split(selectedText)[0]+"<span class='flaneurio_highlight'>"+selectedText+"</span>"+inner.split(selectedText)[1]
	} else {
		// TO BE HANDLED SOMEHOW
		// to many exceptions
	}



	data.highlight=selectedText
	data.url = location.href
	data.host = location.hostname
	data.timeStamp = $.now()
	data.meta = {}

	// Title
	if ($('meta[property="og:title"]').attr('content')) {
		data.meta.title = $('meta[property="og:title"]').attr('content');
	} else if ($('meta[property="twitter:title"]').attr('content')) {
		data.meta.title = $('meta[property="twitter:title"]').attr('content');
	} else if(data.meta.title = $('title').text()){
		data.meta.title = $('title').text()
	}

	// Description
	if ($('meta[property="og:description"]').attr('content')) {
		data.meta.description = $('meta[property="og:description"]').attr('content');
	} else if ($('meta[property="twitter:description"]').attr('content')) {
		data.meta.description = $('meta[property="twitter:description"]').attr('content');
	} else if($('meta[name="description"]').attr('content')){
		data.meta.description = $('meta[property="description"]').attr('content')
	}

	// Image
	if ($('meta[property="og:image"]').attr('content')) {
		data.meta.image = $('meta[property="og:image"]').attr('content');
	} else if ($('meta[property="twitter:image:src"]').attr('content')) {
		data.meta.image = $('meta[property="twitter:image:src"]').attr('content');
	}

	// SiteName
	if ($('meta[property="og:site_name"]').attr('content')) {
		data.meta.siteName = $('meta[property="og:site_name"]').attr('content');
	} else {
		data.meta.siteName = location.hostname
	}

	// Twitter Site
	if ($('meta[property="twitter:site"]').attr('content')) {
		data.meta.twitterSite = $('meta[property="twitter:site"]').attr('content');
	}

	// Twitter Creator
	if ($('meta[property="twitter:creator"]').attr('content')) {
		data.meta.twitterCreator = $('meta[property="twitter:creator"]').attr('content');
	}

	// Author
	if ($('meta[name="author"]')){
		data.meta.author = $('meta[property="author"]').attr('content');
	}
}

data