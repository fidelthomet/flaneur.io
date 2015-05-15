var state = {}
var prevState = {}
var dom = {}
var el = { articles:{}, annotations:{}, authors:{}, hosts:{} }
var links = {}
var linkedElements = []
var snap
var isLeftHeight;
var isRightHeight;
var drawLinksTimeout;
var rerenderScents;
var activeHighlight;
var activeAnnotation;
var snapLinks = [];
var scrollY = 0;


$(function () {
	snap = Snap("#svg")

	handlers()
	if(ready)
		init()
	else
		ready=true;
})

function handlers(){
	$( window ).on("hashchange", function(e) {

		$("#ar-"+state.article).addClass("blur")
		// $("#ar-"+state.article).removeClass("focus")
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


	$("#overlay").click(function(){
		$(this).hide();
		$(".icon").removeClass("active")
		$("#overlay #contextmenu").removeAttr('style');
		$("#overlay #contextmenu").removeClass("show")
	})

	$("#search").click(function(){
		$("#searchfield").focus()
	})


	$("#title").click(function(){
		getLastArticle(true)
	})

	$( window ).scroll(function() {
		$.each(snapLinks, function(index, item){
			
			var vals = item.attr("d").split(" ")
			
			if(item.attr("isLeft")=="true"){
				vals[8] = vals[6] = parseFloat(item.attr("originY"))-$(window).scrollTop()
			} else {
				vals[1] = vals[4] = parseFloat(item.attr("originY"))-$(window).scrollTop()
			}	

			var newD = vals[0]+" "+vals[1]+" "+vals[2]+" "+vals[3]+" "+vals[4]+" "+vals[5]+" "+vals[6]+" "+vals[7]+" "+vals[8]
			
			item.attr("d",newD).attr({
				fill: "none"
			})
		})
		scrollY = window.scrollY
	})
	$("#searchfield").on("keydown",function(e){
		if (e.keyCode==13) {
			e.preventDefault()
			window.getSelection().removeAllRanges()
			this.blur()
		}
	})

	$("#searchfield").on("keyup",function(e){
		if($(this).text()){
			search($(this).html().replace(/&nbsp;/gi,' ').toLowerCase())
			$("#content").addClass("opaque")
			$("#scents").css("opacity","0")
			$(this).addClass("active")
			$("#search").addClass("active")
			// $(".item").addClass("opaque")
		} else {
			$("#content").removeClass("opaque")
			$("#scents").css("opacity","1")
			$("#metahits").empty()
			$("#articlehits").empty()
			$(this).removeClass("active")
			$("#search").removeClass("active")
			// $(".hitem").removeClass("opaque")
		}
	})

	$("#metahits").on('DOMMouseScroll mousewheel', function(ev) {
		var $this = $(this),
		scrollTop = this.scrollTop,
		scrollHeight = this.scrollHeight,
		height = $this.height(),
		delta = ev.originalEvent.wheelDelta,
		up = delta > 0;

		var prevent = function() {
			ev.stopPropagation();
			ev.preventDefault();
			ev.returnValue = false;
			return false;
		}

		if (!up && -delta > scrollHeight - height - scrollTop) {

			$this.scrollTop(scrollHeight);
			return prevent();
		} else if (up && delta > scrollTop) {

			$this.scrollTop(0);
			return prevent();
		}
	});

	dom.metahit.on("click", function(){
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.annotation.on("click", function(){
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.article.find(".author").on("click", function(){
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.article.find(".host").on("click", function(){
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.sarticle.on("click", function(){
		$("#searchfield").text("")
		$("#metahits").empty()
		$("#articlehits").empty()
		$("#content").removeClass("opaque")
		$("#searchfield").trigger("keyup")
		if(state.article!=this.id.split("sar-")[1]){
			
			$(".article").remove()
			el.articles = {}
			$.each(snapLinks, function(index, item){
				item.remove()
			})
			updateHash({article: this.id.split("sar-")[1]}, true)
		}
	})

	$(window).resize(function(){
		window.clearTimeout(rerenderScents)
		$("#scents").css("opacity","0")
		rerenderScents = window.setTimeout(function(){
			createScents()
		},400)

		$.each(snapLinks, function(index, item){
			
			focusx = (window.innerWidth-336)/2
			leftx = (window.innerWidth*.25)+42
			rightx = (window.innerWidth*.75)-42
			
			var vals = item.attr("d").split(" ")
			
			// console.log(vals)

			if(item.attr("isLeft")=="true"){
				vals[0]="M"+leftx
				vals[3]=(leftx+window.innerWidth/56)
				vals[5]=(focusx-window.innerWidth/56)
				vals[7]=(focusx)
			} else {
				vals[0]="M"+(focusx+336)
				vals[3]=(focusx+336+window.innerWidth/56)
				vals[5]=(rightx-window.innerWidth/56)
				vals[7]=(rightx)
			}	

			var newD = vals[0]+" "+vals[1]+" "+vals[2]+" "+vals[3]+" "+vals[4]+" "+vals[5]+" "+vals[6]+" "+vals[7]+" "+vals[8]
			
			item.attr("d",newD).attr({
				fill: "none"
			})
		})
	})

	$(document).on("contextmenu", function(e){
		// e.preventDefault();
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
			copytext("["+$("#hl-"+activeHighlight+" .hl_content").text()+"]("+el.articles[state.article].url+")")
		})
		// var copyAsRef = $("<div id='copyAsRef'>Copy as Reference</div>")
		var del = $("<div id='delete'>Delete</div>")
		del.click(function(){
			removeHighlight(activeHighlight, el.articles[state.article].highlights[activeHighlight],true)
			$("#content").addClass("opaque")
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
		if(y > window.innerHeight-61){
			y-=61
		}


		$("#overlay #contextmenu").css({left: x, top: y})


		$("#overlay").show()
	})

dom.annotation.on("contextmenu",function(e){
	window.getSelection().removeAllRanges()
	e.preventDefault()
	activeHighlight = $(this).closest(".highlight").attr('id').split("hl-")[1]
	activeAnnotation = $(this)

	var del = $("<div id='delete'>Delete</div>")
	del.click(function(){
		removeAnnotation({hl_id: activeHighlight, an_id: activeAnnotation.attr("an_id")}, true)
		$("#content").addClass("opaque")
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

$("#options").click(function(){
	var feedback = $("<a id='feedbacklink' href='mailto:flaneurio@fidelthomet.com'><div id='feedback'>Send Feedback</div></a>")
	var rate = $("<div id='rate'>Rate Extension</div>")
	var help = $("<div id='help'>Show Intro</div>")

	help.click(function(){
		$("#intro").show()
	})

	$("#overlay #contextmenu").empty()
	$("#overlay #contextmenu").append([help, feedback])		

	$(this).addClass("active")
	var x = $(this).offset().left
	var y = 46

	$("#overlay #contextmenu").css({left: x, top: y, width: "152px"})

	$("#overlay").show()
})

$("#view").click(function(){
	var scents = $("<div id='scent' class='view'>Scents (experimental)</div>").click(function(){
		localStorage.setItem("showScents",(localStorage.getItem("showScents")=="0")*1)
		$("#scents").css("opacity",(localStorage.getItem("showScents")=="1")*1)
	})
	var lAuthor = $("<div id='lAuthor' class='view'>Link via Author</div>").click(function(){
		localStorage.setItem("linkAuthor",(localStorage.getItem("linkAuthor")=="0")*1)
		location.reload()
	})
	var lSource = $("<div id='lSource' class='view'>Link via Source</div>").click(function(){
		localStorage.setItem("linkSource",(localStorage.getItem("linkSource")=="0")*1)
		location.reload()
	})
	var lAnnotation = $("<div id='lAnnotation' class='view'>Link via Annotation</div>").click(function(){
		localStorage.setItem("linkAnnotation",(localStorage.getItem("linkAnnotation")=="0")*1)
		location.reload()
	})
	var lTime = $("<div id='lTime' class='view'>Link via Time</div>").click(function(){
		localStorage.setItem("linkTime",(localStorage.getItem("linkTime")=="0")*1)
		location.reload()
	})

	$("#overlay #contextmenu").empty()
	$("#overlay #contextmenu").append([lAuthor, lSource, lTime, lAnnotation, scents])

	if (localStorage.getItem("linkTime")=="1") {
		lTime.addClass("active")
	};
	if (localStorage.getItem("linkAnnotation")=="1") {
		lAnnotation.addClass("active")
	};
	if (localStorage.getItem("linkSource")=="1") {
		lSource.addClass("active")
	};
	if (localStorage.getItem("linkAuthor")=="1") {
		lAuthor.addClass("active")
	};
	if (localStorage.getItem("showScents")=="1") {
		scents.addClass("active")
	};

	$(this).addClass("active")
	var x = $(this).offset().left
	var y = 46

	$("#overlay #contextmenu").css({left: x, top: y, width: "152px"})

	$("#overlay").show()
})

	$("#iClose").click(function(){
		$("#intro").hide()
		localStorage.setItem("intro", 1)
	})
}

function init(){
	getLastArticle()

	if (localStorage.getItem("linkTime")==null) {
		localStorage.setItem("linkTime", 1)
	};
	if (localStorage.getItem("linkAnnotation")==null) {
		localStorage.setItem("linkAnnotation", 1)
	};
	if (localStorage.getItem("linkSource")==null) {
		localStorage.setItem("linkSource", 1)
	};
	if (localStorage.getItem("linkAuthor")==null) {
		localStorage.setItem("linkAuthor", 1)
	};
	if (localStorage.getItem("showScents")==null) {
		localStorage.setItem("showScents", 1)
	};

	if (localStorage.getItem("intro")==null) {
		$("#intro").show()
	};

}

function getLastArticle(reload){
	
	if(location.hash.split("#")[1]&&!reload){
		server.urls.query("ar_id").only(location.hash.split("#article=")[1]).desc().execute().then(function(results){
			if(results.length){
				updateHash({article: location.hash.split("=")[1]}, true)
			} else {
				server.urls.query("created").all().desc().limit(0,1).execute().then(function(results){
					updateHash({article: results[0].ar_id}, true)
				})
			}
		})
	} else {
		server.urls.query("created").all().desc().limit(0,1).execute().then(function(results){
			updateHash({article: results[0].ar_id}, true)
		})
	}
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
		window.clearTimeout(drawLinksTimeout);
		$.each(snapLinks, function(index,item){
			item.animate({
				stroke: "#FAFAFA"
			},200,mina.easein)
		})
		$("#scents").css("opacity","0")

		server.urls.query("ar_id").only(state.article).execute().then(function(results){
			if(!$("#ar-"+state.article)[0]){
				el.articles[state.article] = results[0]
				el.articles[state.article].dom = dom.article.clone(true)
				.attr("id","ar-"+state.article)
				el.articles[state.article].hue=Math.random()*360;
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
				el.articles[state.article].dom.find(".itemHeader .img").css("background-image","url("+el.articles[state.article].img+")")
			} else if(el.articles[state.article].color){
				el.articles[state.article].dom.find(".itemHeader .img").css("background-color","hsl("+el.articles[state.article].color+",90%,80%)")
			} else {
				el.articles[state.article].dom.find(".itemHeader .img").css("background-color","hsl("+el.articles[state.article].hue+",90%,80%)")
			}

			el.articles[state.article].dom.find(".itemHeader .text .title").text(el.articles[state.article].title)
			el.articles[state.article].dom.find(".itemHeader .text a").attr("href",el.articles[state.article].url)
			if(el.articles[state.article].author!="Unknown"){
				el.articles[state.article].dom.find(".itemHeader .text .author").text(el.articles[state.article].author)
			} else {
				el.articles[state.article].dom.find(".itemHeader .text .author").hide()
			}
			el.articles[state.article].dom.find(".itemHeader .text .host").text(el.articles[state.article].host.split("www.")[el.articles[state.article].host.split("www.").length-1])
			el.articles[state.article].dom.find(".itemHeader .text .date").text(moment(el.articles[state.article].created).fromNow())


			el.articles[state.article].dom.find(".highlights").empty()
			if(el.articles[state.article].description){
				var description = dom.description.clone(true)
				.text(el.articles[state.article].description)
				el.articles[state.article].dom.find(".itemHeader .text .description").empty()
				el.articles[state.article].dom.find(".itemHeader .text").append(description)
			}

			server.highlights.query("url").only(el.articles[state.article].url).execute().then(function(results){
				el.articles[state.article].highlights = {}
				var highlightPromises = []
				$.each(results,function(index, item){
					el.articles[state.article].highlights[item.hl_id] = item;
					var highlight = dom.highlight.clone(true)
					.attr("id", "hl-"+item.hl_id)
					highlight.find(".hl_content span.text").text(item.highlight)
					el.articles[state.article].dom.find(".highlights").append(highlight)
					highlightPromises.push(getAnnotationsByHl(state.article, item.hl_id))
				})
				Promise.all(highlightPromises).then(function(){

					//Set height
					var itemHeight = el.articles[state.article].dom.find(".itemHeader").height()+el.articles[state.article].dom.find(".highlights").height()
					el.articles[state.article].dom.css("height", itemHeight+"px")

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
							if(((links.before && article.created == links.before)||(links.after && article.created == links.after)) && localStorage.getItem("linkTime")=="1")
								return true
							if(article.host == el.articles[state.article].host && localStorage.getItem("linkSource")=="1")
								return true
							if(el.articles[state.article].author!="Unknown" && article.author == el.articles[state.article].author && localStorage.getItem("linkAuthor")=="1")
								return true
							if(localStorage.getItem("linkAnnotation")=="1")
								return ($.inArray(article.url,highlightUrls)>-1)
							else
								return false
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

							$(".remove").removeAttr("id")

							isLeftHeight = isRightHeight = 0
							
							linkedElements.sort(compare)

							var allItemPromise = []

							$.each(linkedElements,function(index,item){
								allItemPromise.push(new Promise(function(resolve, reject) {
									if(!$("#ar-"+item.ar_id)[0]){
										el.articles[item.ar_id] = item
										el.articles[item.ar_id].dom = dom.article.clone(true)
										.attr("id","ar-"+item.ar_id)
										.addClass("blur")
										item.hue = Math.random()*360;
										if(item.isLeft){
											item.dom.addClass("isLeft")	
										}
										$("#content").append(el.articles[item.ar_id].dom)
									} else {
										$.each(item,function(index,subItem){
											el.articles[item.ar_id][index]=subItem
										})
										item = el.articles[item.ar_id]
										item.dom = el.articles[item.ar_id].dom

										item.isHidden=false;
										
										item.dom.removeClass("isLeft").removeClass("isRight").removeClass("focus").addClass("blur")
									}

									el.articles[item.ar_id].dom.addClass("created")
									.click(function(){
										//$("#content").empty()
										updateHash({article: this.id.split("ar-")[1]}, true)
									})
									



									if(item.img){
										item.dom.find(".itemHeader .img").css("background-image","url("+item.img+")")
									} else {
										item.dom.find(".itemHeader .img").css("background-color","hsl("+item.hue+",90%,80%)")
									}

									item.dom.find(".itemHeader .text .title").text(item.title)
									item.dom.find(".itemHeader .text a").removeAttr("href")
									if(item.author!="Unknown"){
										item.dom.find(".itemHeader .text .author").text(item.author)
									} else {
										item.dom.find(".itemHeader .text .author").hide()
									}
									item.dom.find(".itemHeader .text .host").text(item.host.split("www.")[item.host.split("www.").length-1])
									item.dom.find(".itemHeader .text .date").text(moment(item.created).fromNow())

									if(item.description){
										var description = dom.description.clone(true)
										.text(item.description)
										item.dom.find(".itemHeader .text .description").empty()
										item.dom.find(".itemHeader .text").append(description)
									}
									var itemHeight = item.dom.find(".itemHeader").height()
									item.height=itemHeight
									if(item.isLeft){
										
										item.dom.addClass("isLeft")
										item.dom.css("height", itemHeight+"px")
										if((itemHeight+isLeftHeight)*.75+54<window.innerHeight){
											item.dom.css("transform", transformHeadline(item.dom, isLeftHeight*.75))
											item.isHidden=false;
										}else{
											item.dom.css("transform", transformHeadline(item.dom, 0-itemHeight))
											item.isHidden=true;
										}
										isLeftHeight+=itemHeight+24
									} else {
										
										item.dom.addClass("isRight")
										item.dom.css("height", itemHeight+"px")
										if((itemHeight+isRightHeight)*.75+54<window.innerHeight){
											item.dom.css("transform", transformHeadline(item.dom, isRightHeight*.75))
											item.isHidden=false;
										}else{
											item.dom.css("transform", transformHeadline(item.dom, 0-itemHeight))
											item.isHidden=true;
										}
										isRightHeight+=itemHeight+24
									}








									item.dom.find(".highlights").empty()
									getHighlightsByUrl(item.ar_id).then(function(){
										resolve()

									})
								}))
})
							//
							Promise.all(allItemPromise).then(function(){

								

								drawLinksTimeout = window.setTimeout(function(){

									
									createScents()
									

									$.each(snapLinks, function(index, item){
										item.remove()
									})
									$(".remove").remove()
									snapLinks=[];

									el.articles[state.article].dock = {}
									el.articles[state.article].dock.x = el.articles[state.article].dom.offset().left
									el.articles[state.article].dock.y = el.articles[state.article].dom.find(".host").offset().top

									$.each(el.articles,function(index,item){
										if(!item.isHidden && item.ar_id!=state.article){
											
											var focusDock = {}
											focusDock.x = el.articles[state.article].dock.x+(!item.isLeft)*336

											focusDock.y = el.articles[state.article].dock.y+6

											item.dock = {}
											item.dock.x = item.dom.offset().left+item.isLeft*252
											item.dock.y = item.dom.offset().top+32
											
											if ((item.created == links.before || item.created == links.after) && (localStorage.getItem("linkTime")=="1")){
												snapLinks.push(snap.path(createCurve(item.dock,focusDock)).attr({
													fill: "none",
													stroke: "#FAFAFA",
													originY : focusDock.y,
													strokeWidth: 2,
													isLeft : item.isLeft
												}).animate({
													stroke: "#FF3369"
												},400,mina.easeout))
												item.dock.y += 4
											}

											focusDock.y -= 4;
											if(item.author == el.articles[state.article].author && item.author!="Unknown" && (localStorage.getItem("linkAuthor")=="1")){
												item.dock.y -= 8
												snapLinks.push(snap.path(createCurve(item.dock,focusDock)).attr({
													fill: "none",
													stroke: "#FAFAFA",
													originY : focusDock.y,
													strokeWidth: 2,
													isLeft : item.isLeft
												}).animate({
													stroke: "#33FF99"
												},400,mina.easeout))
												item.dock.y += 8
											}

											focusDock.y += 8;
											if(item.host == el.articles[state.article].host && (localStorage.getItem("linkSource")=="1")){
												snapLinks.push(snap.path(createCurve(item.dock,focusDock)).attr({
													fill: "none",
													stroke: "#FAFAFA",
													originY : focusDock.y,
													strokeWidth: 2,
													isLeft : item.isLeft
												}).animate({
													stroke: "#33CCFF"
												},400,mina.easeout))
												item.dock.y += 4
											}

											if(item.highlights && (localStorage.getItem("linkAnnotation")=="1")){
												var linkedAnnotations = []
												$.each(item.highlights, function(index, itemB){
													if(itemB.annotations)
														$.each(itemB.annotations, function(index, itemC){
															if(($.inArray(itemC.an_id,annotations)>-1) && ($.inArray(itemC.an_id,linkedAnnotations)==-1)){
																linkedAnnotations.push(itemC.an_id)
																var an_offset = {}
																an_offset.x = focusDock.x
																an_offset.y = $(".focus .an-"+itemC.an_id).offset().top+$(".focus .an-"+itemC.an_id).height()/2+4


																snapLinks.push(snap.path(createCurve(item.dock,an_offset)).attr({
																	fill: "none",
																	stroke: "#FAFAFA",
																	originY : an_offset.y,
																	strokeWidth: 2,
																	isLeft : item.isLeft
																}).animate({
																	stroke: "#737373"
																},400,mina.easeout))
																item.dock.y += 4
															}
														})
												})
											}	
										}
									})
},850)

})
})
})
})
})
})
}
}

function getHighlightsByUrl(ar_id){
	return new Promise(function(resolve, reject) {
		server.highlights.query("url").only(el.articles[ar_id].url).execute().then(function(results){
			el.articles[ar_id].highlights = {}
			var highlightPromises = []
			$.each(results,function(index, item){
				el.articles[ar_id].highlights[item.hl_id] = item;
				var highlight = dom.highlight.clone(true)
				.attr("id", "hl-"+item.hl_id)
				highlight.find(".hl_content span.text").text(item.highlight)
				el.articles[ar_id].dom.find(".highlights").append(highlight)
				highlightPromises.push(getAnnotationsByHl(ar_id, item.hl_id))
			})
			Promise.all(highlightPromises).then(function(){
				resolve()
			})
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
						if(result){
							el.articles[ar_id].highlights[hl_id].annotations[result.an_id]=result
							var annotation = dom.annotation.clone(true)
							.addClass("an-"+result.an_id)
							.attr("an_id",result.an_id)
							annotation.find("span").text(result.annotation)
							$("#hl-"+hl_id +" .hl_tags").append(annotation)
						}
					})
					)
			})
			Promise.all(annotationPromises).then(function(){
				resolve()
			})
		})
	})
}

function search(value){
	var sAuthors = []
	var sHosts = []
	var sAnnotations = []
	var sArticles = []
	var sHighlights = []
	var sRelations = []
	var sAn_ids = []

	var searchPromises = []

	searchPromises.push(server.authors.query("updated").filter(function(author){
		var hits = 0
		$.each(value.split(" "), function(index, searchItem){
			$.each(author.author.split(" "), function(index, keyItem){
				if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
					hits++
					return false;
				}
			})
		})
		return (hits == value.split(" ").length)
	}).desc().execute().then(function(results){
		sAuthors = results;
	}))


	searchPromises.push(server.annotations.query("updated").filter(function(annotation){
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
	}).desc().execute().then(function(results){
		sAnnotations = results;
		$.each(results, function(index, item){
			sAn_ids.push(item.an_id)
		})
	}))

	if(value.length>=3){
		searchPromises.push(server.hosts.query("updated").filter(function(host){
			
			return (host.host.toLowerCase().indexOf(value.toLowerCase())>-1)

		}).desc().execute().then(function(results){
			sHosts = results;
		}))

	} else {
		searchPromises.push(server.hosts.query("updated").filter(function(host){
			var hits = 0
			$.each(value.split("."), function(index, searchItem){
				$.each(host.host.split("."), function(index, keyItem){
					if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
						hits++
						return false;
					}
				})
			})
			return (hits == value.split(".").length)
		}).desc().execute().then(function(results){
			sHosts = results;
		}))
	}

	Promise.all(searchPromises).then(function(){
		var searchPromises1 = []
		$.each(sAnnotations, function(index, item){
			searchPromises1.push(
				server.an_relations.query().filter(function(relation){
					return ($.inArray(relation.an_id,sAn_ids)>-1)
				}).execute().then(function(results){
					
					$.each(results, function(index, item){
						sRelations.push(item.hl_id)
					})
				})
				)
		})
		Promise.all(searchPromises1).then(function(){
			var searchPromises2 = []
			searchPromises2.push(server.highlights.query().filter(function(highlight){
				var hits = 0
				if ($.inArray(highlight.hl_id,sRelations)>-1){
					return true;
				} else {
					$.each(value.split(" "), function(index, searchItem){
						$.each(highlight.highlight.split(" "), function(index, keyItem){
							if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
								hits++
								return false;
							}
						})
					})
				}
				return (hits == value.split(" ").length)
			}).execute().then(function(results){
				// sHighlights = results;
				$.each(results, function(index, item){
					sHighlights.push(item.url)
				})
			}))

			Promise.all(searchPromises2).then(function(){
				var searchPromises3 = []
				if(value.length>=3){
					searchPromises3.push(server.urls.query("updated").filter(function(url){
						var hits = 0
						var lasthits = 0
						if ($.inArray(url.url,sHighlights)>-1){
							return true;
						} else {
							$.each(value.split(" "), function(sindex, searchItem){

								if(url.description){
									$.each(url.description.split(" "), function(index, keyItem){
										if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
											hits++
											return false;
										}
									})
								}
								if(lasthits == hits){
									$.each(url.title.split(" "), function(index, keyItem){
										if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
											hits++
											return false;
										}
									})
								}
								if(lasthits == hits){
									$.each(url.author.split(" "), function(index, keyItem){
										if(keyItem.toLowerCase().indexOf(searchItem.toLowerCase())==0){
											hits++
											return false;
										}
									})
								}
								if(lasthits == hits){
									if(url.host.toLowerCase().indexOf(searchItem.toLowerCase())>-1)
										hits++
								}


								lasthits = hits
							})
						}

						return (hits == value.split(" ").length)
					}).desc().limit(10).execute().then(function(results){
						sArticles = results;
					}))
}
				//
				Promise.all(searchPromises3).then(function(){
					$("#metahits").empty()

					$.each(sAuthors, function(index, item){
						if(item.author.toLowerCase()!=value){
							item.dom = dom.metahit.clone(true)
							.attr("id","sau-"+item.au_id)
							.addClass("mauthor")

							item.dom.find("span").text(item.author)
							$("#metahits").append(item.dom)
						}
					})

					$.each(sHosts, function(index, item){
						if(item.host.toLowerCase()!=value && item.host.split("www.")[item.host.split("www.").length-1] != value){
							item.dom = dom.metahit.clone(true)
							.attr("id","sho-"+item.ho_id)
							.addClass("mhost")

							item.dom.find("span").text(item.host.split("www.")[item.host.split("www.").length-1])
							$("#metahits").append(item.dom)
						}
					})

					$.each(sAnnotations, function(index, item){
						if(item.annotation.toLowerCase()!=value){
							item.dom = dom.metahit.clone(true)
							.attr("id","san-"+item.an_id)
							.addClass("mannotation")

							item.dom.find("span").text(item.annotation)
							$("#metahits").append(item.dom)
						}
					})

					$("#articlehits").css("top", $("#metahits").height()+"px")
					$("#articlehits").empty()

					$.each(sArticles, function(index, item){
						item.dom = dom.sarticle.clone(true)
						.attr("id","sar-"+item.ar_id)

						item.dom.find(".itemHeader .img").css("background-image", "url("+item.img+")")
						item.dom.find(".itemHeader .text .title").text(item.title)
						if(item.author!="Unknown"){
							item.dom.find(".itemHeader .text .author").text(item.author)
						} else {
							item.dom.find(".itemHeader .text .author").hide()
						}
						item.dom.find(".itemHeader .text .host").text(item.host.split("www.")[item.host.split("www.").length-1])
						item.dom.find(".itemHeader .text .date").text(moment(item.created).fromNow())
						$("#articlehits").append(item.dom)
					})
				})
})
})
})
}

function createScents(){
	var scents = {}
	var space = (window.innerWidth-840)/4

	$.each(el.articles, function(index, article){

		if (!article.isHidden) {
			var used = []
			$.each(article.highlights, function(index, highlight){
				
				$.each(highlight.annotations, function(index, annotation){
					if (annotation.annotation.length<26) {
						if($.inArray(annotation.an_id,used)==-1){
							used.push(annotation.an_id)
							if (!scents[annotation.an_id]) {
								scents[annotation.an_id] = {focus:[],left:[],right:[]}
								scents[annotation.an_id].annotation = annotation.annotation
							}

							var offset = article.dom.offset()
							if(article.height){
								offset.top-44
							}

							var key = ""
							if (article.ar_id == state.article){
								key = "focus"
								offset.top = $("#hl-"+highlight.hl_id+" [an_id='"+annotation.an_id+"']").offset().top
								offset.top += $("#hl-"+highlight.hl_id+" [an_id='"+annotation.an_id+"']").height()/2
							} else if (article.isLeft){
								key = "left"
							} else  {
								key = "right"
							}
							scents[annotation.an_id][key].push({x:offset.left,y:offset.top,height: article.height})
						}
					}
				})
			})
		}
	})

	$("#scents").empty()

	$.each(scents, function(index, scent){
		if (scent.focus.length) {
			
			$.each(scent.left, function(index, item){
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
				.attr("h", item.height)
				.attr("y", item.y)
				scentEl.css({left: item.x+252+((Math.random()-.5)*space*.2), top: item.y})
				$("#scents").append(scentEl)
			})

			$.each(scent.right, function(index, item){
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
				.attr("h", item.height)
				.attr("y", item.y)
				scentEl.css({left: item.x-space+((Math.random()-.5)*space*.2), top: item.y})
				$("#scents").append(scentEl)
			})
		} else {
			$.each(scent.left, function(index, item){
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
				.attr("h", item.height)
				.attr("y", item.y)
				scentEl.css({left: 0+((Math.random()-.5)*space*.2), top: item.y})
				$("#scents").append(scentEl)
			})

			$.each(scent.right, function(index, item){
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
				.attr("h", item.height)
				.attr("y", item.y)
				scentEl.css({left: item.x+252+((Math.random()-.5)*space*.2), top: item.y})
				$("#scents").append(scentEl)
			})
		}
	})

	$.each($("#scents div"), function(index, item){
		var scale = (space/$(item).width())*(1+(Math.random()-.5)*.1)
		if (scale > 2.3){
			scale = 2.3
		}

		var y = ($(item).attr("h")-$(item).height()*scale-48)*Math.random()
		y += parseFloat($(item).attr("y"))

		var alpha = (1/scale)*.05+.07

		$(item).css({"transform": "scale("+scale+")", top: y, color: "rgba(0,0,0,"+alpha+")"})
	})

	if(localStorage.getItem("showScents")=="1" && !$("#content").hasClass("opaque")){
		$("#scents").css("opacity","1")
	}
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

function createCurve(v1,v2){

	var x1,y1,x2,y2;

	if(v1.x>v2.x){
		x2 = v1.x;
		y2 = v1.y;
		x1 = v2.x;
		y1 = v2.y;
	} else {
		x1 = v1.x;
		y1 = v1.y;
		x2 = v2.x;
		y2 = v2.y;
	}
	return "M"+x1+" "+y1+" C "+(x1+window.innerWidth/56)+" "+y1+", "+(x2-window.innerWidth/56)+" "+y2+", "+x2+" "+y2
}

function getTime(timestamp){
	var then = new Date(timestamp)
	var now = $.now()

	if(then.getFullYear() == now.getFullYear()){

	} else {
		return
	}
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

/* ---
DOM ELEMENTS
--- */
dom.article = $('<div class="article item"><div class="itemHeader"><div class="img"></div><div class="text"><a target="_blank"><div class="title"></div></a><span class="author"></span><span class="host"></span><span class="date"></span></div></div><div class="highlights"></div></div>')
dom.description = $('<div class="description"></div>')
dom.highlight = $('<div class="highlight"><div class="hl_content"><span class="text"></span></div><div class="hl_tags"></div></div>')
dom.annotation = $('<div><span></span></div>')
dom.metahit = $('<div class="metahit"><span></span></div>')
dom.sarticle = $('<div class="sarticle item focus"><div class="itemHeader"><div class="img"></div><div class="text"><div class="title"></div><span class="author"></span><span class="host"></span><span class="date"></span></div></div></div>')
dom.scent = $("<div></div>")
