var data = {};
data.highlight = window.getSelection().toString();
data.host = location.hostname
data.url = location.href
data.created = new Date().getTime()
data.hl_id = data.created+"-"+Math.floor((Math.random()*.9+.1)*1000000)

	// Title
if ($('meta[property="og:title"]').attr('content')) {
	data.title = $('meta[property="og:title"]').attr('content');
} else if ($('meta[name="twitter:title"],meta[property="twitter:title"]').attr('content')) {
	data.title = $('meta[name="twitter:title"],meta[property="twitter:title"]').attr('content');
} else if($('title').text()){
	data.title = $('title').text()
} else {
	data.title = "Untitled"
}

// Description
if ($('meta[property="og:description"]').attr('content')) {
	data.description = $('meta[property="og:description"]').attr('content');
} else if ($('meta[name="twitter:description"],meta[property="twitter:description"]').attr('content')) {
	data.description = $('meta[name="twitter:description"],meta[property="twitter:description"]').attr('content');
} else if($('meta[name="description"]').attr('content')){
	data.description = $('meta[property="description"]').attr('content')
}

// Image
data.imgs = []
if ($('meta[property="og:image"]').attr('content')) {
	data.imgs.push($('meta[property="og:image"]').attr('content'))
	data.img = $('meta[property="og:image"]').attr('content');
} else if($('meta[name="twitter:image:src"],meta[name="property:image:src"]').attr('content')) {
	data.imgs.push($('meta[name="twitter:image:src"],meta[name="property:image:src"]').attr('content'))
	data.img = $('meta[name="twitter:image:src"],meta[name="property:image:src"]').attr('content');
}

$.each($('img'),function(index, item) {
	data.imgs.push($(item).attr("src"))
})

// Author
if ($('meta[name="author"]').attr('content')){
	data.author = $('meta[name="author"]').attr('content');
} else if($('meta[name="twitter:creator"],meta[property="twitter:creator"]').attr('content')){
	data.author = $('meta[name="twitter:creator"],meta[property="twitter:creator"]').attr('content');
} else {
	data.author = "Unknown"
}

data