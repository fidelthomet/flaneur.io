var state = {}
var prevState = {}
var dom = {}
var el = { articles:{}, annotations:{}, authors:{}, hosts:{} }
var links = {}
var linkedElements = []

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
			if(!$("#ar-"+state.article)[0]){
				el.articles[state.article] = results[0]
				el.articles[state.article].dom = dom.article.clone(true)
				.attr("id","ar-"+state.article)

				$("#content").append(el.articles[state.article].dom)
			} else {
				$.each(results[0],function(index,item){
					el.articles[state.article][index]=item
				})
				el.articles[state.article].dom.css("transform","")
				el.articles[state.article].dom.removeClass("isLeft").removeClass("isRight").removeClass("blur")
			}
			
			el.articles[state.article].dom.addClass("focus")

			if(el.articles[state.article].img){
				el.articles[state.article].dom.find(".itemHeader").css("background-image","url("+el.articles[state.article].img+")")
			}

			el.articles[state.article].dom.find(".itemHeader .text .title").text(el.articles[state.article].title)
			el.articles[state.article].dom.find(".itemHeader .text a").attr("href",el.articles[state.article].url)
			if(el.articles[state.article].author!="Unknown"){
				el.articles[state.article].dom.find(".itemHeader .text .author").text(el.articles[state.article].author)
			} else {
				el.articles[state.article].dom.find(".itemHeader .text .author").hide()
			}
			el.articles[state.article].dom.find(".itemHeader .text .host").text(el.articles[state.article].host)

			
			el.articles[state.article].dom.find(".highlights").empty()
			if(el.articles[state.article].description){
				var description = dom.description.clone(true)
				.text(el.articles[state.article].description)
				
				el.articles[state.article].dom.find(".highlights").append(description)
			}

			server.highlights.query("url").only(el.articles[state.article].url).execute().then(function(results){
				el.articles[state.article].highlights = {}
				var highlightPromises = []
				$.each(results,function(index, item){
					el.articles[state.article].highlights[item.hl_id] = item;
					var highlight = dom.highlight.clone(true)
					.attr("id", "hl-"+item.hl_id)
					highlight.find(".hl_content span").text(item.highlight)
					el.articles[state.article].dom.find(".highlights").append(highlight)
					highlightPromises.push(getAnnotationsByHl(state.article, item.hl_id))
				})
				Promise.all(highlightPromises).then(function(){
					var relPromises = []
					// REL time
					relPromises.push(server.urls.query("created").all().keys().execute().then(function(results){
						var index = $.inArray(el.articles[state.article].created,results)
						links.before = results[index-1]
						links.after = results[index+1]
					}))

					var highlightUrls = []
					var annotations = []
					$.each(el.articles[state.article].highlights, function(index, item){
						$.each(item.annotations, function(index, item){
							annotations.push(item.an_id)
						})
					})
					relPromises.push( new Promise(function(resolve, reject) {

						server.an_relations.query().filter(function(relation){
							return ($.inArray(relation.an_id,annotations)>-1)
						}).execute().then(function(results){
							var highlights = []
							$.each(results, function(index, item){
								highlights.push(item.hl_id)
							})

							server.highlights.query().filter(function(highlight){
								return ($.inArray(highlight.hl_id,highlights)>-1)
							}).execute().then(function(results){
								$.each(results, function(index, item){
									highlightUrls.push(item.url)
								})
								resolve()
							})
						})
					}))

					Promise.all(relPromises).then(function(){

						server.urls.query("created").filter(function(article){
							if(article.ar_id==el.articles[state.article].ar_id)
								return false
							if((links.before && article.created == links.before)||(links.after && article.created == links.after))
								return true
							if(article.host == el.articles[state.article].host)
								return true
							if(el.articles[state.article].author && article.author == el.articles[state.article].author)
								return true
							return ($.inArray(article.url,highlightUrls)>-1)
						}).execute().then(function(results){

							$(".blur").addClass("remove")
							$(".created").removeClass("created")

							linkedElements = results;
							$.each(linkedElements, function(index, item){

								$("#ar-"+item.ar_id).removeClass("remove")

								item.links = []
								item.linkStrength = 0
								// HL
								if ($.inArray(item.url,highlightUrls)>-1) {
									item.links.push({type:"an"})
									item.linkStrength++
								};
								// AU
								if (item.author == el.articles[state.article].author){
									item.links.push({type:"au"})
									item.linkStrength+=3
								}
								// AR
								if (item.host == el.articles[state.article].host){
									item.links.push({type:"ho"})
									item.linkStrength+=.8
								}
								// TIME
								if (item.created == links.before){
									item.links.push({type:"be"})
									item.linkStrength++
								}
								if (item.created == links.after){
									item.links.push({type:"af"})
									item.linkStrength++
								}
								item.isLeft = (item.created < el.articles[state.article].created)

								item.linkStrength += item.created * .00000000000001
							})

							$(".remove").remove()
							
							linkedElements.sort(compare)

							$.each(linkedElements,function(index,item){

								if(!$("#ar-"+item.ar_id)[0]){
									el.articles[item.ar_id] = item
									el.articles[item.ar_id].dom = dom.article.clone(true)
									.attr("id","ar-"+item.ar_id)
									.addClass("blur")

									$("#content").append(el.articles[item.ar_id].dom)
								} else {
									$.each(item,function(index,subItem){
										el.articles[item.ar_id][index]=subItem
									})
									item.dom = el.articles[item.ar_id].dom

									
									item.dom.removeClass("isLeft").removeClass("isRight").removeClass("focus").addClass("blur")
								}

								el.articles[item.ar_id].dom.addClass("created")
								.click(function(){
									//$("#content").empty()
									updateHash({article: this.id.split("ar-")[1]}, true)
								})
								
								// console.log(el.articles[item.ar_id].dom)

								if(item.isLeft){
									console.log(item.isLeft)
									item.dom.addClass("isLeft")
									console.log(item.dom[0].id)
									// console.log(($(".created.isLeft").length))
									// console.log(item.dom.attr("class"))
									item.dom.css("transform", transformHeadline(item.dom, ($(".created.isLeft").length-1)*224))
								} else {
									console.log("--")
									console.log(item.dom[0].id)
									item.dom.addClass("isRight")
									item.dom.css("transform", transformHeadline(item.dom, ($(".created.isRight").length-1)*224))
								}



								if(item.img){
									item.dom.find(".itemHeader").css("background-image","url("+item.img+")")
								}

								item.dom.find(".itemHeader .text .title").text(item.title)
								item.dom.find(".itemHeader .text a").removeAttr("href")
								if(item.author!="Unknown"){
									item.dom.find(".itemHeader .text .author").text(item.author)
								} else {
									item.dom.find(".itemHeader .text .author").hide()
								}
								item.dom.find(".itemHeader .text .host").text(item.host)



								item.dom.find(".highlights").empty()

								if(item.description){
									var description = dom.description.clone(true)
									.text(item.description)
									item.dom.find(".highlights").append(description)
								}

								getHighlightsByUrl(item.ar_id)

							})
						})
					})
				})
			})
		})
	}
}

function getHighlightsByUrl(ar_id){

	server.highlights.query("url").only(el.articles[ar_id].url).execute().then(function(results){
		el.articles[ar_id].highlights = {}
		var highlightPromises = []
		$.each(results,function(index, item){
			el.articles[ar_id].highlights[item.hl_id] = item;
			var highlight = dom.highlight.clone(true)
			.attr("id", "hl-"+item.hl_id)
			highlight.find(".hl_content span").text(item.highlight)
			el.articles[ar_id].dom.find(".highlights").append(highlight)
			highlightPromises.push(getAnnotationsByHl(ar_id, item.hl_id))
		})
	})
}

function getAnnotationsByHl(ar_id, hl_id){
	return new Promise(function(resolve, reject) {

		el.articles[ar_id].highlights[hl_id].annotations = {}

		server.an_relations.query("hl_id").only(hl_id).execute().then(function(results){
			var annotationPromises = []
			$.each(results, function(index, item){
				annotationPromises.push(
					server.annotations.get(item.an_id).then(function(result){
						el.articles[ar_id].highlights[hl_id].annotations[result.an_id]=result
						var annotation = dom.annotation.clone(true)
						.addClass("an-"+result.an_id)
						.text(result.annotation)
						$("#hl-"+hl_id +" .hl_tags").append(annotation)
					})
					)
			})
			Promise.all(annotationPromises).then(function(){
				resolve()
			})
		})
	})
}

// HELPER
function compare(a,b) {
	if (a.linkStrength > b.linkStrength)
		return -1;
	if (a.linkStrength < b.linkStrength)
		return 1;
	return 0;
}

function transformHeadline(element, y){
	return "matrix(.75, 0, 0, .75, 0, "+y+")"
}



/* ---
DOM ELEMENTS
--- */
dom.article = $('<div class="article item"><div class="itemHeader"><div class="gradient"></div><div class="text"><a target="_blank"><div class="title"></div></a><span class="author"></span><span class="host"></span></div></div><div class="highlights"></div><div class="blur_gradient"></div></div>')
dom.description = $('<div class="description"></div>')
dom.highlight = $('<div class="highlight"><div class="hl_content"><span></span></div><div class="hl_tags"></div></div>')
dom.annotation = $('<span></span>')


