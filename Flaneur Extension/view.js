function drawArticle(article) {
	if (!$("#ar-" + article.ar_id).length) {

		elem.articles[article.ar_id] = {}
		var elArticle = elem.articles[article.ar_id]
		elArticle.dom = dom.article.clone(true)
			.attr("id", "ar-" + article.ar_id)
			.attr("ar_id", article.ar_id)

		elArticle.dom.find(".itemHeader .img").css("background-image", "url(" + article.img + ")")
		elArticle.dom.find(".itemHeader .img").css("background-color", "hsl(" + article.color + ",90%,80%)")

		elArticle.dom.find(".itemHeader .text .title").text(article.title)
		// elArticle.dom.find(".itemHeader .text a").attr("href", article.url)

		if (article.author != "Unknown") {
			elArticle.dom.find(".itemHeader .text .author").text(article.author)
		} else {
			elArticle.dom.find(".itemHeader .text .author").hide()
		}
		elArticle.dom.find(".itemHeader .text .host").text(article.host.split("www.")[article.host.split("www.").length - 1])
		elArticle.dom.find(".itemHeader .text .date").text(moment(article.created).fromNow())

		if (article.description) {
			var elDescription = dom.description.clone(true)
				.text(article.description)
			elArticle.dom.find(".itemHeader .text").append(elDescription)
		}

		$.each(article.highlights, function(index, highlight) {
			var elHighlight = dom.highlight.clone(true)
				.attr("id", "hl-" + highlight.hl_id)

			elHighlight.find(".hl_content span.text")
				.text(highlight.highlight)

			$.each(highlight.annotations, function(index, annotation) {
				var elAnnotation = dom.annotation.clone(true)
					.addClass("an-" + annotation.an_id)
					.attr("an_id", annotation.an_id)

				elAnnotation.find(".an").text(annotation.annotation)
				elHighlight.find(".hl_tags").append(elAnnotation)

			})

			elArticle.dom.find(".highlights").append(elHighlight)
		})
	}
	return elem.articles[article.ar_id]
}

function appendArticle(elArticle) {
	if (!$("#" + elArticle.dom.attr("id")).length) {
		$("#content").append(elArticle.dom)
		var article = data.articles[elArticle.dom.attr("ar_id")]
		$.each(article.highlights, function(index, highlight) {
			$.each(highlight.annotations, function(index, annotation) {
				elArticle.dom.find(".an-" + annotation.an_id).attr("yPos", elArticle.dom.find(".an-" + annotation.an_id).position().top)
			})
		})

		elArticle.headerHeight = (elArticle.dom.find(".itemHeader").height() - elArticle.dom.find(".description").height() - 7)
		elArticle.fullHeight = elArticle.dom.find(".itemHeader").height() + elArticle.dom.find(".highlights").height()
		elArticle.focusHeight = elArticle.dom.find(".itemHeader").height() + elArticle.dom.find(".highlights").height() + 72
	}
	elArticle.dom.removeClass("kill")
	elArticle.dom.show()
	return elArticle
}

function positionArticleFocus(elArticle) {
	$(".article.focus").removeClass("focus")
	elArticle.dom.css("transform", "")
	elArticle.dom.removeClass("isLeft").removeClass("isRight").removeClass("blur")
	elArticle.dom.css("height", elArticle.focusHeight + "px")
	elArticle.dom.addClass("focus")
}

function positionArticle(elArticle, article, offset) {
	if (article.isLeft) {
		elArticle.offsetY = offset.left * .75
		offset.left += elArticle.headerHeight + 24
	} else {
		elArticle.offsetY = offset.right * .75
		offset.right += elArticle.headerHeight + 24
	}
	transform(elArticle.dom, {
		y: elArticle.offsetY,
		scale: .75
	})
	elArticle.dom.css("height", elArticle.headerHeight)
}

function drawRelArticles(relArticles) {
	var offset = {
		left: 0,
		right: 0
	}

	arOnScreen = {
		left: {
			before: 0,
			now: 0,
			next: 0
		},
		right: {
			before: 0,
			now: 0,
			next: 0
		}
	}

	var screenHeight = window.innerHeight - 72
	activeElArticles = []
	activeRelArticles = []

	$.each(relArticles, function(index, relArticle) {

		var elArticle = drawArticle(relArticle)
		elArticle.isLeft = relArticle.isLeft
		activeRelArticles.push(relArticle)
		activeElArticles.push(elArticle)
		var side = "left"

		if (relArticle.isLeft) {
			elArticle.dom.addClass("isLeft")
			elArticle.dom.removeClass("isRight")
		} else {
			elArticle.dom.addClass("isRight")
			elArticle.dom.removeClass("isLeft")
			side = "right"
		}

		positionArticle(appendArticle(elArticle), relArticle, offset)
		if (elArticle.offsetY < 0) {
			elArticle.dom.addClass("outOfFrame")
			arOnScreen[side].before++
		} else if (elArticle.headerHeight * .75 + elArticle.offsetY > screenHeight) {
			arOnScreen[side].next++
				elArticle.dom.addClass("outOfFrame")
		} else {
			arOnScreen[side].now++
				elArticle.dom.removeClass("outOfFrame")
		}

	})
	drawRelations(relArticles)
	createScents()
	drawScrollers()
}

function drawRelations(relArticles) {
	$.each(snapLinks, function(index, snapLink) {
		snapLink.remove()
	})
	snapLinks = [];

	var space = (window.innerWidth - 840) / 4
	var xPos = {
		la: 2 * space + 252,
		lb: space + 252,
		ra: 2 * space + 252 + 336,
		rb: 3 * space + 252 + 336,
	}

	var yPos = elem.articles[state.article].headerHeight + 118

	$.each(relArticles, function(index, relArticle) {
		var elArticle = elem.articles[relArticle.ar_id]
		var focusDock = {}
		var articleDock = {}
		focusDock.y = yPos
		articleDock.y = (elArticle.offsetY) + 120

		if (relArticle.isLeft) {
			focusDock.x = xPos.la
			articleDock.x = xPos.lb
		} else {
			focusDock.x = xPos.ra
			articleDock.x = xPos.rb
		}

		if (articleDock.y > window.innerHeight - 84 || articleDock.y < 64) {
			var elClass = "outOfFrame"
		} else {
			var elClass = "inFrame"
		}

		$.each(relArticle.links, function(index, link) {
			switch (link.type) {
				case "af":
				case "be":
					snapLinks.push(snap.path(createCurve(articleDock, focusDock)).attr({
						fill: "none",
						stroke: "#FAFAFA",
						strokeColor: "#FF3369",
						originY: focusDock.y,
						posArticleX: articleDock.x,
						posArticleY: articleDock.y,
						posFocusX: focusDock.x,
						posFocusY: focusDock.y,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).addClass("lar-" + relArticle.ar_id).addClass(elClass).animate({
						stroke: "#FF3369"
					}, 1200, mina.easeinout))
					break;

				case "ho":
					snapLinks.push(snap.path(createCurve({
						x: articleDock.x,
						y: articleDock.y + 4
					}, {
						x: focusDock.x,
						y: focusDock.y + 4
					})).attr({
						fill: "none",
						stroke: "#FAFAFA",
						strokeColor: "#33CCFF",
						originY: focusDock.y + 4,
						posArticleX: articleDock.x,
						posArticleY: articleDock.y + 4,
						posFocusX: focusDock.x,
						posFocusY: focusDock.y + 4,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).addClass("lar-" + relArticle.ar_id).addClass(elClass).addClass("lho").animate({
						stroke: "#33CCFF"
					}, 1200, mina.easeinout))
					break;
				case "au":
					snapLinks.push(snap.path(createCurve({
						x: articleDock.x,
						y: articleDock.y - 4
					}, {
						x: focusDock.x,
						y: focusDock.y - 4
					})).attr({
						fill: "none",
						stroke: "#FAFAFA",
						strokeColor: "#33FF99",
						originY: focusDock.y - 4,
						posArticleX: articleDock.x,
						posArticleY: articleDock.y - 4,
						posFocusX: focusDock.x,
						posFocusY: focusDock.y - 4,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).addClass("lar-" + relArticle.ar_id).addClass(elClass).addClass("lau").animate({
						stroke: "#33FF99"
					}, 1200, mina.easeinout))
					break;
				case "an":
					link.an_id
					console.log("lan-" + link.an_id)
					var y = parseFloat(elem.articles[state.article].dom.find(".an-" + link.an_id).attr("yPos")) * (4 / 3) + 145
					snapLinks.push(snap.path(createCurve({
						x: articleDock.x,
						y: articleDock.y - 4
					}, {
						x: focusDock.x,
						y: y
					})).attr({
						fill: "none",
						stroke: "#FAFAFA",
						strokeColor: "#737373",
						originY: y,
						posArticleX: articleDock.x,
						posArticleY: articleDock.y - 4,
						posFocusX: focusDock.x,
						posFocusY: y,
						an_id: link.an_id,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).addClass("lar-" + relArticle.ar_id).addClass(elClass).addClass("lan-" + link.an_id).animate({
						stroke: "#737373"
					}, 1200, mina.easeinout))
					break;
			}



		})
	})
}

function prepCanvas() {
	$(".article").addClass("kill")
}

function cleanUpCanvas() {
	$(".kill").remove()
}

function drawTagCounts() {
	$.each($(".focus .hl_tags div"), function(index, tag) {
		// console.log($(tag).attr("an_id"))
		$(tag).find(".ancounter").text(" " + $(".an-" + $(tag).attr("an_id")).length)
	})
}

function drawScrollers(isLeft) {
	$(window).trigger("scroll")
	if (arOnScreen.left.next) {
		$("#scrollerBottomLeft").addClass("active").text(arOnScreen.left.next)
	} else {
		$("#scrollerBottomLeft").removeClass("active")
	}
	if (arOnScreen.right.next) {
		$("#scrollerBottomRight").addClass("active").text(arOnScreen.right.next)
	} else {
		$("#scrollerBottomRight").removeClass("active")
	}
	if (arOnScreen.left.before) {
		$("#scrollerTopLeft").addClass("active").text(arOnScreen.left.before)
	} else {
		$("#scrollerTopLeft").removeClass("active")
	}
	if (arOnScreen.right.before) {
		$("#scrollerTopRight").addClass("active").text(arOnScreen.right.before)
	} else {
		$("#scrollerTopRight").removeClass("active")
	}
}

function scrollArticles(up, left) {
	var offset = 0
	var counter = 0
	var screenHeight = window.innerHeight - 72
	var isDone = false

	$.each(activeElArticles, function(index, elArticle) {
		if (left && elArticle.isLeft) {
			if (up) {
				if (counter == arOnScreen.left.before + arOnScreen.left.now) {
					offset = elArticle.offsetY
				}
			} else {
				if (elArticle.offsetY > -screenHeight && !isDone) {
					offset = elArticle.offsetY
					isDone = true
					console.log(elArticle.offsetY)
				} else {

				}
			}
			counter++
		}
		if (!left && !elArticle.isLeft) {
			if (up) {
				if (counter == arOnScreen.right.before + arOnScreen.right.now) {
					offset = elArticle.offsetY
				}
			} else {
				if (elArticle.offsetY > -screenHeight && !isDone) {
					offset = elArticle.offsetY
					isDone = true
				}
			}
			counter++
		}
	})



	arOnScreen = {
		left: {
			before: 0,
			now: 0,
			next: 0
		},
		right: {
			before: 0,
			now: 0,
			next: 0
		}
	}



	$.each(activeElArticles, function(index, elArticle) {

		var side = "left"
		if (!elArticle.isLeft) {
			side = "right"
		}


		if (left) {
			if (elArticle.isLeft) {

				elArticle.offsetY -= offset
				transform(elArticle.dom, {
					y: elArticle.offsetY
				})
			}
		} else {
			if (!elArticle.isLeft) {

				elArticle.offsetY -= offset
				transform(elArticle.dom, {
					y: elArticle.offsetY
				})
			}
		}
		if (elArticle.offsetY < 0) {
			elArticle.dom.addClass("outOfFrame")
			arOnScreen[side].before++
		} else if (elArticle.headerHeight * .75 + elArticle.offsetY > screenHeight) {
			arOnScreen[side].next++
				elArticle.dom.addClass("outOfFrame")
		} else {
			arOnScreen[side].now++
				elArticle.dom.removeClass("outOfFrame")
		}
	})

	if (left) {
		$.each($(".scentLeft"), function(index, scent) {
			
			var scentTop = parseFloat($(scent).css("top").split("px")[0])
			//$(scent).css("top", (scentTop-offset)+"px")
			transformAdd($(scent), {y: -offset})

		})

	} else {
		$.each($(".scentRight"), function(index, scent) {
			var scentTop = parseFloat($(scent).css("top").split("px")[0])
			//$(scent).css("top", (scentTop-offset)+"px")
			transformAdd($(scent), {y: -offset})
		})
	}

	drawRelations(activeRelArticles)
	drawScrollers()

}