var state = {}
var prevState = {}
var dom = {}
var el = {
	articles: {},
	annotations: {},
	authors: {},
	hosts: {}
}
var data = {
	articles: {}
}

var elem = {
	articles: {}
}

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


$(function() {
	snap = Snap("#svg")

	handlers()
	if (ready)
		init()
	else
		ready = true;
})



function init() {
	getLastArticle()

	if (localStorage.getItem("linkTime") == null) {
		localStorage.setItem("linkTime", 1)
	};
	if (localStorage.getItem("linkAnnotation") == null) {
		localStorage.setItem("linkAnnotation", 1)
	};
	if (localStorage.getItem("linkSource") == null) {
		localStorage.setItem("linkSource", 1)
	};
	if (localStorage.getItem("linkAuthor") == null) {
		localStorage.setItem("linkAuthor", 1)
	};
	if (localStorage.getItem("showScents") == null) {
		localStorage.setItem("showScents", 1)
	};

	if (localStorage.getItem("intro") == null) {
		$("#intro").show()
	};
}

function getLastArticle(reload) {

	if (location.hash.split("#")[1] && !reload) {
		server.urls.query("ar_id").only(location.hash.split("#article=")[1]).desc().execute().then(function(results) {
			if (results.length) {
				updateHash({
					article: location.hash.split("=")[1]
				}, true)
			} else {
				server.urls.query("created").all().desc().limit(0, 1).execute().then(function(results) {
					updateHash({
						article: results[0].ar_id
					}, true)
				})
			}
		})
	} else {
		server.urls.query("created").all().desc().limit(0, 1).execute().then(function(results) {
			updateHash({
				article: results[0].ar_id
			}, true)
		})
	}
}

function updateHash(params, clear) {
	if (!clear) {
		$.each(location.hash.split("#")[1].split("&"), function(index, item) {
			if (!params[item.split("=")[0]])
				params[item.split("=")[0]] = item.split("=")[1]
		})
	}

	var hash = ""
	$.each(params, function(index, item) {
		if (hash) {
			hash += "&"
		}
		hash += index + "=" + item
	})

	if (clear && location.hash.split("#")[1] == hash) {
		$(window).trigger("hashchange")
	} else {
		location.hash = hash
	}
}

function newFocus() {
	if (state.article != prevState.article && state.article) {
		window.clearTimeout(drawLinksTimeout);
		$.each(snapLinks, function(index, item) {
			item.animate({
				stroke: "#FAFAFA"
			}, 200, mina.easein)
		})
		$("#scents").css("opacity", "0")

		getArticle(state.article).then(function(article) {

			prepCanvas()

			focusArticle = appendArticle(drawArticle(article))

			getRelations(article).then(function(results) {
				drawRelArticles(prepRelArticles(results.relArticles, article, results.lTime, results.highlightUrls))
				positionArticleFocus(focusArticle)
				cleanUpCanvas()
			})
		})
	}
}

function getHighlightsByUrlDepr(ar_id) {
	return new Promise(function(resolve, reject) {
		server.highlights.query("url").only(el.articles[ar_id].url).execute().then(function(results) {
			el.articles[ar_id].highlights = {}
			var highlightPromises = []
			$.each(results, function(index, item) {
				el.articles[ar_id].highlights[item.hl_id] = item;
				var highlight = dom.highlight.clone(true)
					.attr("id", "hl-" + item.hl_id)
				highlight.find(".hl_content span.text").text(item.highlight)
				el.articles[ar_id].dom.find(".highlights").append(highlight)
				highlightPromises.push(getAnnotationsByHlDepr(ar_id, item.hl_id))
			})
			Promise.all(highlightPromises).then(function() {
				resolve()
			})
		})
	})
}

function getAnnotationsByHlDepr(ar_id, hl_id) {
	return new Promise(function(resolve, reject) {

		el.articles[ar_id].highlights[hl_id].annotations = {}

		server.an_relations.query("hl_id").only(hl_id).execute().then(function(results) {
			var annotationPromises = []
			$.each(results, function(index, item) {
				annotationPromises.push(
					server.annotations.get(item.an_id).then(function(result) {
						if (result) {
							el.articles[ar_id].highlights[hl_id].annotations[result.an_id] = result
							var annotation = dom.annotation.clone(true)
								.addClass("an-" + result.an_id)
								.attr("an_id", result.an_id)
							annotation.find("span.an").text(result.annotation)
							$("#hl-" + hl_id + " .hl_tags").append(annotation)
						}
					})
				)
			})
			Promise.all(annotationPromises).then(function() {
				resolve()
			})
		})
	})
}

function search(value) {
	var sAuthors = []
	var sHosts = []
	var sAnnotations = []
	var sArticles = []
	var sHighlights = []
	var sRelations = []
	var sAn_ids = []

	var searchPromises = []

	searchPromises.push(server.authors.query("updated").filter(function(author) {
		var hits = 0
		$.each(value.split(" "), function(index, searchItem) {
			$.each(author.author.split(" "), function(index, keyItem) {
				if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
					hits++
					return false;
				}
			})
		})
		return (hits == value.split(" ").length)
	}).desc().execute().then(function(results) {
		sAuthors = results;
	}))


	searchPromises.push(server.annotations.query("updated").filter(function(annotation) {
		var hits = 0
		$.each(value.split(" "), function(index, searchItem) {
			$.each(annotation.annotation.split(" "), function(index, keyItem) {
				if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
					hits++
					return false;
				}
			})
		})
		return (hits == value.split(" ").length)
	}).desc().execute().then(function(results) {
		sAnnotations = results;
		$.each(results, function(index, item) {
			sAn_ids.push(item.an_id)
		})
	}))

	if (value.length >= 3) {
		searchPromises.push(server.hosts.query("updated").filter(function(host) {

			return (host.host.toLowerCase().indexOf(value.toLowerCase()) > -1)

		}).desc().execute().then(function(results) {
			sHosts = results;
		}))

	} else {
		searchPromises.push(server.hosts.query("updated").filter(function(host) {
			var hits = 0
			$.each(value.split("."), function(index, searchItem) {
				$.each(host.host.split("."), function(index, keyItem) {
					if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
						hits++
						return false;
					}
				})
			})
			return (hits == value.split(".").length)
		}).desc().execute().then(function(results) {
			sHosts = results;
		}))
	}

	Promise.all(searchPromises).then(function() {
		var searchPromises1 = []
		$.each(sAnnotations, function(index, item) {
			searchPromises1.push(
				server.an_relations.query().filter(function(relation) {
					return ($.inArray(relation.an_id, sAn_ids) > -1)
				}).execute().then(function(results) {

					$.each(results, function(index, item) {
						sRelations.push(item.hl_id)
					})
				})
			)
		})
		Promise.all(searchPromises1).then(function() {
			var searchPromises2 = []
			searchPromises2.push(server.highlights.query().filter(function(highlight) {
				var hits = 0
				if ($.inArray(highlight.hl_id, sRelations) > -1) {
					return true;
				} else {
					$.each(value.split(" "), function(index, searchItem) {
						$.each(highlight.highlight.split(" "), function(index, keyItem) {
							if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
								hits++
								return false;
							}
						})
					})
				}
				return (hits == value.split(" ").length)
			}).execute().then(function(results) {
				// sHighlights = results;
				$.each(results, function(index, item) {
					sHighlights.push(item.url)
				})
			}))

			Promise.all(searchPromises2).then(function() {
				var searchPromises3 = []
				if (value.length >= 3) {
					searchPromises3.push(server.urls.query("updated").filter(function(url) {
						var hits = 0
						var lasthits = 0
						if ($.inArray(url.url, sHighlights) > -1) {
							return true;
						} else {
							$.each(value.split(" "), function(sindex, searchItem) {

								if (url.description) {
									$.each(url.description.split(" "), function(index, keyItem) {
										if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
											hits++
											return false;
										}
									})
								}
								if (lasthits == hits) {
									$.each(url.title.split(" "), function(index, keyItem) {
										if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
											hits++
											return false;
										}
									})
								}
								if (lasthits == hits) {
									$.each(url.author.split(" "), function(index, keyItem) {
										if (keyItem.toLowerCase().indexOf(searchItem.toLowerCase()) == 0) {
											hits++
											return false;
										}
									})
								}
								if (lasthits == hits) {
									if (url.host.toLowerCase().indexOf(searchItem.toLowerCase()) > -1)
										hits++
								}


								lasthits = hits
							})
						}

						return (hits == value.split(" ").length)
					}).desc().limit(10).execute().then(function(results) {
						sArticles = results;
					}))
				}
				//
				Promise.all(searchPromises3).then(function() {
					$("#metahits").empty()

					$.each(sAuthors, function(index, item) {
						if (item.author.toLowerCase() != value) {
							item.dom = dom.metahit.clone(true)
								.attr("id", "sau-" + item.au_id)
								.addClass("mauthor")

							item.dom.find("span").text(item.author)
							$("#metahits").append(item.dom)
						}
					})

					$.each(sHosts, function(index, item) {
						if (item.host.toLowerCase() != value && item.host.split("www.")[item.host.split("www.").length - 1] != value) {
							item.dom = dom.metahit.clone(true)
								.attr("id", "sho-" + item.ho_id)
								.addClass("mhost")

							item.dom.find("span").text(item.host.split("www.")[item.host.split("www.").length - 1])
							$("#metahits").append(item.dom)
						}
					})

					$.each(sAnnotations, function(index, item) {
						if (item.annotation.toLowerCase() != value) {
							item.dom = dom.metahit.clone(true)
								.attr("id", "san-" + item.an_id)
								.addClass("mannotation")

							item.dom.find("span").text(item.annotation)
							$("#metahits").append(item.dom)
						}
					})

					$("#articlehits").css("top", $("#metahits").height() + "px")
					$("#articlehits").empty()

					$.each(sArticles, function(index, item) {
						item.dom = dom.sarticle.clone(true)
							.attr("id", "sar-" + item.ar_id)

						item.dom.find(".itemHeader .img").css("background-image", "url(" + item.img + ")")
						item.dom.find(".itemHeader .img").css("background-color", "hsl(" + item.color + ",90%,80%)")
						item.dom.find(".itemHeader .text .title").text(item.title)
						if (item.author != "Unknown") {
							item.dom.find(".itemHeader .text .author").text(item.author)
						} else {
							item.dom.find(".itemHeader .text .author").hide()
						}
						item.dom.find(".itemHeader .text .host").text(item.host.split("www.")[item.host.split("www.").length - 1])
						item.dom.find(".itemHeader .text .date").text(moment(item.created).fromNow())
						$("#articlehits").append(item.dom)
					})
				})
			})
		})
	})
}

function createScents() {
	var scents = {}
	var space = (window.innerWidth - 840) / 4

	$.each(el.articles, function(index, article) {

		if (!article.isHidden && !article.dom.hasClass("remove")) {
			var used = []
			$.each(article.highlights, function(index, highlight) {

				$.each(highlight.annotations, function(index, annotation) {
					if (annotation.annotation.length < 26) {
						if ($.inArray(annotation.an_id, used) == -1) {
							used.push(annotation.an_id)
							if (!scents[annotation.an_id]) {
								scents[annotation.an_id] = {
									focus: [],
									left: [],
									right: []
								}
								scents[annotation.an_id].annotation = annotation.annotation
							}

							var offset = article.dom.offset()
							if (article.height) {
								offset.top - 44
							}

							var key = ""
							if (article.ar_id == state.article) {
								key = "focus"
								offset.top = $("#hl-" + highlight.hl_id + " [an_id='" + annotation.an_id + "']").offset().top
								offset.top += $("#hl-" + highlight.hl_id + " [an_id='" + annotation.an_id + "']").height() / 2
							} else if (article.isLeft) {
								key = "left"
							} else {
								key = "right"
							}
							scents[annotation.an_id][key].push({
								x: offset.left,
								y: offset.top,
								height: article.height
							})
						}
					}
				})
			})
		}
	})

	$("#scents").empty()

	$.each(scents, function(index, scent) {
		if (scent.focus.length) {

			$.each(scent.left, function(index, item) {
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
					.attr("h", item.height)
					.attr("y", item.y)
				scentEl.css({
					left: item.x + 252 + ((Math.random() - .5) * space * .2),
					top: item.y
				})
				$("#scents").append(scentEl)
			})

			$.each(scent.right, function(index, item) {
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
					.attr("h", item.height)
					.attr("y", item.y)
				scentEl.css({
					left: item.x - space + ((Math.random() - .5) * space * .2),
					top: item.y
				})
				$("#scents").append(scentEl)
			})
		} else {
			$.each(scent.left, function(index, item) {
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
					.attr("h", item.height)
					.attr("y", item.y)
				scentEl.css({
					left: 0 + ((Math.random() - .5) * space * .2),
					top: item.y
				})
				$("#scents").append(scentEl)
			})

			$.each(scent.right, function(index, item) {
				var scentEl = dom.scent.clone()
				scentEl.text(scent.annotation)
					.attr("h", item.height)
					.attr("y", item.y)
				scentEl.css({
					left: item.x + 252 + ((Math.random() - .5) * space * .2),
					top: item.y
				})
				$("#scents").append(scentEl)
			})
		}
	})

	$.each($("#scents div"), function(index, item) {
		var scale = (space / $(item).width()) * (1 + (Math.random() - .5) * .1)
		if (scale > 2.3) {
			scale = 2.3
		}

		var y = ($(item).attr("h") - $(item).height() * scale - 48) * Math.random()
		y += parseFloat($(item).attr("y"))

		var alpha = (1 / scale) * .05 + .07

		$(item).css({
			"transform": "scale(" + scale + ")",
			top: y,
			color: "rgba(0,0,0," + alpha + ")"
		})
	})

	if (localStorage.getItem("showScents") == "1" && !$("#content").hasClass("opaque")) {
		$("#scents").css("opacity", "1")
	}
}

// HELPER


function transformHeadline(element, y) {
	return "matrix(.75, 0, 0, .75, 0, " + y + ")"
}

function createCurve(v1, v2) {

	var x1, y1, x2, y2;

	if (v1.x > v2.x) {
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
	return "M" + x1 + " " + y1 + " C " + (x1 + window.innerWidth / 56) + " " + y1 + ", " + (x2 - window.innerWidth / 56) + " " + y2 + ", " + x2 + " " + y2
}

function getTime(timestamp) {
	var then = new Date(timestamp)
	var now = $.now()

	if (then.getFullYear() == now.getFullYear()) {

	} else {
		return
	}
}


function copytext(text) {
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
dom.annotation = $('<div><span class="an"></span><span class="ancounter"></span></div>')
dom.metahit = $('<div class="metahit"><span></span></div>')
dom.sarticle = $('<div class="sarticle item focus"><div class="itemHeader"><div class="img"></div><div class="text"><div class="title"></div><span class="author"></span><span class="host"></span><span class="date"></span></div></div></div>')
dom.scent = $("<div></div>")