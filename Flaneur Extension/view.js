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
		elArticle.dom.find(".itemHeader .text a").attr("href", article.url)

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
		elArticle.fullHeight = elArticle.dom.find(".itemHeader").height()
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

	$.each(relArticles, function(index, relArticle) {
		var elArticle = drawArticle(relArticle)
		if (relArticle.isLeft) {
			elArticle.dom.addClass("isLeft")
			elArticle.dom.removeClass("isRight")
		} else {
			elArticle.dom.addClass("isRight")
			elArticle.dom.removeClass("isLeft")
		}

		positionArticle(appendArticle(elArticle), relArticle, offset)
	})

	drawRelations(relArticles)
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
		articleDock.y = (elArticle.offsetY) + 108

		if (relArticle.isLeft) {
			focusDock.x = xPos.la
			articleDock.x = xPos.lb
		} else {
			focusDock.x = xPos.ra
			articleDock.x = xPos.rb
		}
		$.each(relArticle.links, function(index, link) {
			switch (link.type) {
				case "af":
				case "be":
					snapLinks.push(snap.path(createCurve(articleDock, focusDock)).attr({
						fill: "none",
						stroke: "#FAFAFA",
						originY: focusDock.y,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).animate({
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
						originY: focusDock.y + 4,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).animate({
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
						originY: focusDock.y - 4,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).animate({
						stroke: "#33FF99"
					}, 1200, mina.easeinout))
					break;
				case "an":
					link.an_id
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
						originY: y,
						strokeWidth: 2,
						isLeft: relArticle.isLeft
					}).animate({
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