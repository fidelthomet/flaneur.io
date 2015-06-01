var test;

function getArticle(ar_id) {
	return new Promise(function(resolve, reject) {
		server.urls.query("ar_id")
			.only(ar_id)
			.execute()
			.then(function(resArticle) {
				if (!resArticle.length) {
					debug("requested Article not available")
					reject()
				} else {
					data.articles[ar_id] = resArticle[0]
					var article = data.articles[ar_id]
					getHighlightsByUrl(article.url)
						.then(function(resHighlights) {
							article.highlights = resHighlights
							resolve(article)
						})
				}
			})
	})
}

function getHighlightsByUrl(url) {
	return new Promise(function(resolve, reject) {
		server.highlights.query("url")
			.only(url)
			.execute()
			.then(function(resHighlights) {
				var proAnRelations = []
				var highlights = {}

				$.each(resHighlights, function(index, highlight) {
					highlights[highlight.hl_id] = highlight
					proAnRelations.push(
						getAnRelationsByHlId(highlight.hl_id).then(function(annotations) {
							highlight.annotations = annotations
						})
					)
				})

				Promise.all(proAnRelations).then(function() {
					resolve(highlights)
				})

			})
	})
}

function getAnRelationsByHlId(hl_id) {
	return new Promise(function(resolve, reject) {
		server.an_relations.query("hl_id")
			.only(hl_id)
			.execute()
			.then(function(resAnRelations) {
				var proAnnotations = []
				var annotations = {}

				$.each(resAnRelations, function(index, anRelation) {
					proAnnotations.push(
						getAnnotation(anRelation.an_id).then(function(annotation) {
							if (annotation) // This should always be defined, but sometimes it isn't
								annotations[annotation.an_id] = annotation
						})
					)
				})

				Promise.all(proAnnotations).then(function() {
					resolve(annotations)
				})
			})
	})
}

function getAnnotation(an_id) {
	return new Promise(function(resolve, reject) {
		server.annotations.get(an_id)
			.then(function(annotation) {
				resolve(annotation)
			})
	})
}

function getRelations(article) {
	return new Promise(function(resolve, reject) {
		proRelPreparations = []
		var lTime = {
			before: 0,
			after: 0
		}
		var highlightUrls = []
		var annotations = []

		if (getLocalStorage("linkTime")) {
			proRelPreparations.push(server.urls.query("created")
				.all()
				.keys()
				.execute()
				.then(function(results) {
					var index = $.inArray(article.created, results)
					lTime.before = results[index - 1]
					lTime.after = results[index + 1]
				})
			)
		}
		if (getLocalStorage("linkAnnotation")) {
			$.each(article.highlights, function(index, highlight) {
				$.each(highlight.annotations, function(index, annotation) {
					annotations.push(annotation.an_id)
				})
			})
			proRelPreparations.push(new Promise(function(resolve2, reject) {
				server.an_relations.query()
					.filter(function(relation) {
						return ($.inArray(relation.an_id, annotations) > -1)
					})
					.execute()
					.then(function(an_relations) {
						var highlights = []
						$.each(an_relations, function(index, an_relation) {
							highlights.push(an_relation.hl_id)
						})

						server.highlights.query().filter(function(highlight) {
							return ($.inArray(highlight.hl_id, highlights) > -1)
						}).execute().then(function(highlights) {
							$.each(highlights, function(index, highlight) {
								highlightUrls.push(highlight.url)
							})
							resolve2()
						})
					})
			}))
		}

		Promise.all(proRelPreparations).then(function() {
			server.urls.query("created").filter(function(filArticle) {
				if (filArticle.ar_id == article.ar_id)
					return false
				if (((lTime.before && filArticle.created == lTime.before) || (lTime.after && filArticle.created == lTime.after)) && getLocalStorage("linkTime"))
					return true
				if (filArticle.host == article.host && getLocalStorage("linkSource"))
					return true
				if (article.author != "Unknown" && filArticle.author == article.author && getLocalStorage("linkAuthor"))
					return true
				if (getLocalStorage("linkAnnotation"))
					return ($.inArray(filArticle.url, highlightUrls) > -1)
				else
					return false
			}).execute().then(function(resArticles) {
				var proRelArticles = []
				var relArticles = []

				$.each(resArticles, function(index, resArticle) {
					data.articles[resArticle.ar_id] = resArticle
					var relArticle = data.articles[resArticle.ar_id]
					relArticles.push(relArticle)

					proRelArticles.push(getHighlightsByUrl(relArticle.url)
						.then(function(resHighlights) {
							relArticle.highlights = resHighlights
						}))
				})

				Promise.all(proRelArticles).then(function() {
					var results = {
						highlightUrls: highlightUrls,
						lTime: lTime,
						relArticles: relArticles
					}
					resolve(results)
				})
			})
		})
	})
}


function prepRelArticles(relArticles, article, lTime, highlightUrls) {
	$.each(relArticles, function(index, relArticle) {
		relArticle.links = []
		relArticle.linkStrength = 0

		// HL
		if ($.inArray(relArticle.url, highlightUrls) > -1) {
			$.each(article.highlights, function(index, highlight) {
				$.each(highlight.annotations, function(index, annotation) {
					$.each(relArticle.highlights, function(index, relHighlight) {
						$.each(relHighlight.annotations, function(index, relAnnotation) {
							if (annotation.an_id == relAnnotation.an_id) {
								relArticle.links.push({
									type: "an",
									an_id: annotation.an_id
								})
								relArticle.linkStrength++
							}
						})
					})
				})

			})
		};
		// AU
		if (relArticle.author == article.author && article.author != "Unknown") {
			relArticle.links.push({
				type: "au"
			})
			relArticle.linkStrength += 3
		}
		// AR
		if (relArticle.host == article.host) {
			relArticle.links.push({
				type: "ho"
			})
			relArticle.linkStrength += .8
		}
		// TIME
		if (relArticle.created == lTime.before) {
			relArticle.links.push({
				type: "be"
			})
			relArticle.linkStrength++
		}
		if (relArticle.created == lTime.after) {
			relArticle.links.push({
				type: "af"
			})
			relArticle.linkStrength++
		}
		relArticle.isLeft = (relArticle.created < article.created)

		relArticle.linkStrength += relArticle.created * .00000000000001
	})
	relArticles.sort(compare)
	return relArticles
}