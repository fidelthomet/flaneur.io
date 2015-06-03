function handlers() {
	hanWindow();
	hanOverlay();
	hanHeader();
	hanSearch();
	hanArticle();
	hanModal();
	hanScrollers();
}

function hanWindow() {
	$(window).on("hashchange", function(e) {

		$("#ar-" + state.article).addClass("blur")
		prevState = {}
		$.each(state, function(index, item) {
			prevState[index] = item
		})

		state = {}
		$.each(location.hash.split("#")[1].split("&"), function(index, item) {
			state[item.split("=")[0]] = item.split("=")[1]
		})

		newFocus()
	})

	$(window).scroll(function(e) {
		$.each(snapLinks, function(index, item) {

			var vals = item.attr("d").split(" ")

			if (item.attr("isLeft") == "true") {
				vals[8] = vals[6] = parseFloat(item.attr("originY")) - $(window).scrollTop()
				item.attr({
					posFocusY: vals[8]
				})
			} else {
				vals[1] = vals[4] = parseFloat(item.attr("originY")) - $(window).scrollTop()
				item.attr({
					posFocusY: vals[1]
				})
			}

			var newD = vals[0] + " " + vals[1] + " " + vals[2] + " " + vals[3] + " " + vals[4] + " " + vals[5] + " " + vals[6] + " " + vals[7] + " " + vals[8]

			item.attr("d", newD).attr({
				fill: "none"
			})
		})
		scrollY = window.scrollY
	})

	$(window).resize(function() {
		window.clearTimeout(rerenderScents)
		$("#scents").css("opacity", "0")
		rerenderScents = window.setTimeout(function() {
			createScents()
		}, 400)

		$.each(snapLinks, function(index, item) {

			focusx = (window.innerWidth - 336) / 2
			leftx = (window.innerWidth * .25) + 42
			rightx = (window.innerWidth * .75) - 42

			var vals = item.attr("d").split(" ")

			// console.log(vals)

			if (item.attr("isLeft") == "true") {
				vals[0] = "M" + leftx
				vals[3] = (leftx + window.innerWidth / 56)
				vals[5] = (focusx - window.innerWidth / 56)
				vals[7] = (focusx)
			} else {
				vals[0] = "M" + (focusx + 336)
				vals[3] = (focusx + 336 + window.innerWidth / 56)
				vals[5] = (rightx - window.innerWidth / 56)
				vals[7] = (rightx)
			}

			var newD = vals[0] + " " + vals[1] + " " + vals[2] + " " + vals[3] + " " + vals[4] + " " + vals[5] + " " + vals[6] + " " + vals[7] + " " + vals[8]

			item.attr("d", newD).attr({
				fill: "none"
			})
		})
	})

	$(document).on("contextmenu", function(e) {
		// e.preventDefault();
	})
}

function hanOverlay() {
	$("#overlay").click(function() {
		$(this).hide();
		$(".icon").removeClass("active")
		$("#overlay #contextmenu").removeAttr('style');
		$("#overlay #contextmenu").removeClass("show")
		$("#overlay #contextmenu").show();
		$("#importpopup").hide()
		$("#exportpopup").hide()
	})
}

function hanHeader() {
	$("#title").click(function() {
		getLastArticle(true)
	})

	$("#options").click(function() {
		var feedback = $("<a id='feedbacklink' href='mailto:flaneurio@fidelthomet.com'><div id='feedback'>Send Feedback</div></a>")
		var rate = $("<div id='rate'>Rate Extension</div>")
		var exportData = $("<div id='export'>Export Data</div>")
		var importData = $("<div id='import'>Import Data</div>")
		var help = $("<div id='help'>Show Intro</div>")

		help.click(function() {
			$("#intro").show()
		})

		exportData.click(function(e) {
			e.stopPropagation();
			$("#exportpopup").show()
			$("#expDownload").addClass("disabled")
			$("#expDownload").text("Preparing Data")
			$("#overlay").show()
			exportDB();
			$("#overlay #contextmenu").hide();
			$(".icon").removeClass("active")
		})

		importData.click(function(e) {
			e.stopPropagation();
			$("#uploadJSON").attr("data-content", "Select File")
			$("#overlay").show()
			$("#uploadJSON").removeClass("disabled")
			$("#importpopup").show()
			$("#overlay #contextmenu").hide();
			$(".icon").removeClass("active")
		})

		$("#overlay #contextmenu").empty()
		$("#overlay #contextmenu").append([help, feedback, exportData, importData])

		$(this).addClass("active")
		var x = $(this).offset().left
		var y = 46

		$("#overlay #contextmenu").css({
			left: x,
			top: y,
			width: "152px"
		})

		$("#overlay").show()
	})

	$("#view").click(function() {
		var scents = $("<div id='scent' class='view'>Scents (experimental)</div>").click(function() {
			localStorage.setItem("showScents", (localStorage.getItem("showScents") == "0") * 1)
			$("#scents").css("opacity", (localStorage.getItem("showScents") == "1") * 1)
		})
		var lAuthor = $("<div id='lAuthor' class='view'>Link via Author</div>").click(function() {
			localStorage.setItem("linkAuthor", (localStorage.getItem("linkAuthor") == "0") * 1)
			location.reload()
		})
		var lSource = $("<div id='lSource' class='view'>Link via Source</div>").click(function() {
			localStorage.setItem("linkSource", (localStorage.getItem("linkSource") == "0") * 1)
			location.reload()
		})
		var lAnnotation = $("<div id='lAnnotation' class='view'>Link via Annotation</div>").click(function() {
			localStorage.setItem("linkAnnotation", (localStorage.getItem("linkAnnotation") == "0") * 1)
			location.reload()
		})
		var lTime = $("<div id='lTime' class='view'>Link via Time</div>").click(function() {
			localStorage.setItem("linkTime", (localStorage.getItem("linkTime") == "0") * 1)
			location.reload()
		})

		$("#overlay #contextmenu").empty()
		$("#overlay #contextmenu").append([lAuthor, lSource, lTime, lAnnotation, scents])

		if (localStorage.getItem("linkTime") == "1") {
			lTime.addClass("active")
		};
		if (localStorage.getItem("linkAnnotation") == "1") {
			lAnnotation.addClass("active")
		};
		if (localStorage.getItem("linkSource") == "1") {
			lSource.addClass("active")
		};
		if (localStorage.getItem("linkAuthor") == "1") {
			lAuthor.addClass("active")
		};
		if (localStorage.getItem("showScents") == "1") {
			scents.addClass("active")
		};

		$(this).addClass("active")
		var x = $(this).offset().left
		var y = 46

		$("#overlay #contextmenu").css({
			left: x,
			top: y,
			width: "152px"
		})

		$("#overlay").show()
	})
}

function hanSearch() {
	$("#search").click(function() {
		$("#searchfield").focus()
		if ($("#searchfield").text()) {
			$("#searchfield").text("")
			$("#searchfield").trigger("keyup")
		}
	})

	$("#searchfield").on("keydown", function(e) {
		if (e.keyCode == 13) {
			e.preventDefault()
			window.getSelection().removeAllRanges()
			this.blur()
		}
	})

	$("#searchfield").on("keyup", function(e) {
		if ($(this).text()) {
			search($(this).html().replace(/&nbsp;/gi, ' ').toLowerCase())
			$("#content").addClass("opaque")
			$("#scents").css("opacity", "0")
			$(this).addClass("active")
			$("#search").addClass("active")
		} else {
			$("#content").removeClass("opaque")
			$("#scents").css("opacity", "1")
			$("#metahits").empty()
			$("#articlehits").empty()
			$(this).removeClass("active")
			$("#search").removeClass("active")
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

	dom.metahit.on("click", function() {
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.sarticle.on("click", function() {
		$("#searchfield").text("")
		$("#metahits").empty()
		$("#articlehits").empty()
		$("#content").removeClass("opaque")
		$("#searchfield").trigger("keyup")
		if (state.article != this.id.split("sar-")[1]) {

			$(".article").remove()
			el.articles = {}
			$.each(snapLinks, function(index, item) {
				item.remove()
			})
			updateHash({
				article: this.id.split("sar-")[1]
			}, true)
		}
	})
}

function hanArticle() {
	dom.article.click(function() {
		console.log("cicked")
		updateHash({
			article: this.id.split("ar-")[1]
		}, true)
	})

	dom.article.on("mouseover", function() {
		if (!$(this).hasClass("focus")) {
			var ar_id = $(this).attr("id").split("ar-")[1];
			$("path").css("opacity", ".2")

			$("path.lar-" + ar_id).css("opacity", "1")
				// $("path.lar-"+ar_id).css("opacity","0").on("transitionend", function(){
				// 	console.log("bu")
				// })
			var y = elem.articles[ar_id].offsetY
			if (elem.articles[ar_id].offsetY + elem.articles[ar_id].fullHeight * .8 > window.innerHeight - 96) {
				y = window.innerHeight - 96 - elem.articles[ar_id].fullHeight * .8
				if (y < 0) {
					y = 0
				}
			}

			$.each(snapLinks, function(index, snapLink) {
				if (snapLink.hasClass("lar-" + ar_id)) {
					if (snapLink.attr("isLeft") == "true") {
						var offsetX = 8.4
					} else {
						var offsetX = -8.4
					}
					posY = (y + 52 + elem.articles[ar_id].headerHeight * .8)

					if (snapLink.attr("strokeColor") == "#33CCFF") {
						posY += 4
					}
					if (snapLink.attr("strokeColor") == "#33FF99") {
						posY -= 4
					}
					if (snapLink.attr("strokeColor") == "#737373") {

						posY = parseFloat(elem.articles[ar_id].dom.find(".an-" + snapLink.attr("an_id")).attr("yPos")) * (4 / 3) * .8 + 75 + y
							// posY -= 4
					}
					var newD = createCurve({
						x: parseFloat(snapLink.attr("posArticleX")) + offsetX,
						y: posY
					}, {
						x: parseFloat(snapLink.attr("posFocusX")),
						y: parseFloat(snapLink.attr("posFocusY"))
					})

					snapLink.animate({
						stroke: "#FAFAFA"
					}, 400, mina.easein, function() {
						snapLink.attr("d", newD).attr({
							fill: "none"
						})
						snapLink.animate({
							stroke: snapLink.attr("strokeColor")
						}, 400, mina.easeout)
					})
				}
			})

			$(this).css("height", elem.articles[ar_id].fullHeight)
			transform($(this), {
				scale: .8,
				y: y
			})
		}
	})

	dom.article.on("mouseout", function() {
		if (!$(this).hasClass("focus")) {
			$("path").css("opacity", "1")



			var ar_id = $(this).attr("id").split("ar-")[1];
			$.each(snapLinks, function(index, snapLink) {
				if (snapLink.hasClass("lar-" + ar_id)) {
					var newD = createCurve({
						x: parseFloat(snapLink.attr("posArticleX")),
						y: parseFloat(snapLink.attr("posArticleY"))
					}, {
						x: parseFloat(snapLink.attr("posFocusX")),
						y: parseFloat(snapLink.attr("posFocusY"))
					})

					snapLink.animate({
						stroke: "#FAFAFA"
					}, 400, mina.easein, function() {

						snapLink.attr("d", newD).attr({
							fill: "none"
						})
						snapLink.animate({
							stroke: snapLink.attr("strokeColor")
						}, 400, mina.easeout)
					})
				}
			})
			$(this).css("height", elem.articles[ar_id].headerHeight)
			transform($(this), {
				scale: .75,
				y: elem.articles[ar_id].offsetY
			})
		}
	})

	dom.article.find(".author").on("click", function() {
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.article.find(".host").on("click", function() {
		$("#searchfield").text($(this).text())
		$("#searchfield").trigger("keyup")
	})

	dom.annotation.on("click", function() {
		$("#searchfield").text($(this).find(".an").text())
		$("#searchfield").trigger("keyup")
	})

	dom.highlight.find(".hl_content").on("contextmenu", function(e) {
		window.getSelection().removeAllRanges()
		e.preventDefault()
		activeHighlight = $(this).parent().attr("id").split("hl-")[1]

		var copy = $("<div id='copy'>Copy</div>")
		copy.click(function() {
			copytext($("#hl-" + activeHighlight + " .hl_content").text())
		})
		var copyAsLink = $("<div id='copyAsLink'>Copy as Link</div>")
		copyAsLink.click(function() {
				copytext("[" + $("#hl-" + activeHighlight + " .hl_content").text() + "](" + el.articles[state.article].url + ")")
			})
			// var copyAsRef = $("<div id='copyAsRef'>Copy as Reference</div>")
		var del = $("<div id='delete'>Delete</div>")
		del.click(function() {
			removeHighlight(activeHighlight, el.articles[state.article].highlights[activeHighlight], true)
			$("#content").addClass("opaque")
		})
		del.on("mouseover", function() {
			$("#hl-" + activeHighlight + " .hl_content span").addClass("delete")
		})
		del.on("mouseout", function() {
			$("#hl-" + activeHighlight + " .hl_content span").removeClass("delete")
		})

		$("#overlay #contextmenu").empty()
		$("#overlay #contextmenu").append([copy, copyAsLink, del])

		var x = e.clientX;
		var y = e.clientY;

		if (x > window.innerWidth - 112) {
			x -= 112
		}
		if (y > window.innerHeight - 61) {
			y -= 61
		}


		$("#overlay #contextmenu").css({
			left: x,
			top: y
		})


		$("#overlay").show()
	})

	dom.annotation.on("contextmenu", function(e) {
		window.getSelection().removeAllRanges()
		e.preventDefault()
		activeHighlight = $(this).closest(".highlight").attr('id').split("hl-")[1]
		activeAnnotation = $(this)

		var del = $("<div id='delete'>Delete</div>")
		del.click(function() {
			removeAnnotation({
				hl_id: activeHighlight,
				an_id: activeAnnotation.attr("an_id")
			}, true)
			$("#content").addClass("opaque")
		})
		del.on("mouseover", function() {
			$([name = "twitter:title"])
			activeAnnotation.addClass("delete")
		})
		del.on("mouseout", function() {
			activeAnnotation.removeClass("delete")
		})

		$("#overlay #contextmenu").empty()
		$("#overlay #contextmenu").append([del])

		var x = e.clientX;
		var y = e.clientY

		if (x > window.innerWidth - 112) {
			x -= 112
		}
		if (y > window.innerHeight - 20) {
			y -= 20
		}


		$("#overlay #contextmenu").css({
			left: x,
			top: y
		})


		$("#overlay").show()
	})
}

function hanModal() {
	$("#iClose").click(function() {
		$("#intro").hide()
		localStorage.setItem("intro", 1)
	})

	$("#uploadJSON").change(function(event) {
		var fr = new FileReader();
		fr.onload = function() {
			var data = JSON.parse(this.result)
			if (data.flaneurVersion) {
				importJSON(data)
				$("#uploadJSON").attr("data-content", "Updating Database")
				$("#uploadJSON").addClass("disabled")
			} else {
				$("#uploadJSON").attr("data-content", "File Not Supported! Select New File")
			}
		}
		if (this.files[0])
			fr.readAsText(this.files[0])
	});
}

function hanScrollers() {
	$(".scroller").click(function() {
		if ($(this).hasClass("active")) {
			switch ($(this).attr("id")) {
				case "scrollerBottomLeft":
					scrollArticles(true, true)
					break;
				case "scrollerBottomRight":
					scrollArticles(true, false)
					break;
				case "scrollerTopLeft":
					scrollArticles(false, true)
					break;
				case "scrollerTopRight":
					scrollArticles(false, false)
					break;
			}
		}
	})
}