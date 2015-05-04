var state = {}
var prevState = {}

$(function () {
	handlers()
	if(ready)
		init()
	else
		ready=true;
})

function handlers(){
	$( window ).on("hashchange", function(e) {

		prevState = {}
		$.each(state, function(index, item){
			prevState[index] = item	
		})
		
		state={}
		$.each(location.hash.split("#")[1].split("&"), function(index, item){
			state[item.split("=")[0]]=item.split("=")[1]	
		})

		update()
	})

	$("#title").click(function(){
		getLastArticle()
	})
}

function init(){
	getLastArticle()
}

function getLastArticle(){
	server.urls.query("updated").all().desc().limit(0,1).execute().then(function(results){
		updateHash({article: results[0].ar_id}, true)
	})
}

function updateHash (params, clear) {
	if(!clear){
		$.each(location.hash.split("#")[1].split("&"), function(index, item){
			if(!params[item.split("=")[0]])
				params[item.split("=")[0]]=item.split("=")[1]
		})
	}

	var hash=""
	$.each(params, function(index, item){
		if(hash){
			hash+="&"
		}
		hash+=index+"="+item
	})

	if (clear && location.hash.split("#")[1] == hash){
		$( window ).trigger("hashchange")
	} else {
		location.hash=hash
	}
}

function update(){
	if(state.article!=prevState.article && state.article){
		server.urls.query("ar_id").only(state.article).execute().then(function(results){
			console.log(results[0])
		})
	}
}

/* ---
DOM ELEMENTS
--- */
