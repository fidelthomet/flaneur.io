var server;

var ready = false;

//---
// INIT-DB
//---
db.open( {
	server: 'flaneurIO',
	version: 1,
	schema: {
		highlights: {
			key: { keyPath: 'hl_id' , autoIncrement: false },
			indexes: {
				highlight: {},
				host: {},
				url: {},
				created: {},
				author: {}
			}
		},
		annotations: {
			key: { keyPath: 'an_id', autoIncrement: false },
			indexes: {
				annotation: { unique: true },
				created: {},
				updated: {}
			}
		},
		an_relations: {
			key: { keyPath: "id", autoIncrement: true },
			indexes: {
				hl_id: {},
				an_id: {}
			}
		},
		hosts: {
			key: { keyPath: "host", autoIncrement: false },
			indexes: {
				ho_id: {unique: true},
				created: {},
				updated: {}
			}
		},
		urls: {
			key: { keyPath: "url", autoIncrement: false },
			indexes: {
				ar_id: { unique: true},
				title: {},
				host: {},
				author: {},
				created: {},
				updated: {}
			}
		},
		authors: {
			key: { keyPath: "author", autoIncrement: false },
			indexes: {
				au_id: {unique: true},
				created: {},
				updated: {}
			}
		},
		projects: {
			key: { keyPath: "project", autoIncrement: false },
			indexes: {
				pr_id: {unique: true},
				created: {},
				updated: {}
			}
		},
		pr_relations: {
			key: { keyPath: "id", autoIncrement: true },
			indexes: {
				hl_id: {},
				pr_id: {}
			}
		},
	}
} ).then( function ( s ) {
	server = s

	if(ready)
		init()
	else
		ready=true

	var now = $.now()

	server.authors.get( "Unknown" ).then( function ( result ) {
		if(!result){
			server.authors.add({au_id: genId(), author: "Unknown", created: now, updated: now})
		}
	})

	server.projects.get( "Unassigned" ).then( function ( result ) {
		if(!result){
			server.projects.add({pr_id: genId(), project: "Unassigned", created: now, updated: now})
		}
	})

	// server.close();
} );

function updateTitle(data){
	server.urls.get( data.url ).then(function(result) {
		if(result){
			result.updated=$.now()
			result.title=data.title
			server.urls.update(result)
		} else {
			console.error("Error updating title, url not found")
		}
	})
	server.highlights.query("url").only(data.url).modify({title: data.title}).execute()
}

function updateAuthor(data){
	server.urls.get( data.url ).then(function(result) {
		if(result){
			result.updated=$.now()
			var oldAuthor = result.author
			result.author=data.author
			
			server.urls.update(result).then(function(result){
				server.urls.query("author").only(oldAuthor).execute().then(function(results){
					if(!results[0]){
						server.authors.remove( oldAuthor )
					}
				})
			})
		} else {
			console.error("Error updating author, url not found")
		}
	})
	server.authors.get( data.author ).then(function(result) {
		if(result){
			result.updated=$.now()
			server.authors.update(result)
		}else{
			server.authors.add({"au_id": genId(), "author":data.author, "created":$.now(), "updated":$.now()})
		}
	})

	server.highlights.query("url").only(data.url).modify({author: data.author}).execute()
}

function addAnnotation(data){
	
	server.annotations.query("annotation").filter(function(annotation){ return (data.annotation.toLowerCase() == annotation.annotation.toLowerCase()) }).execute().then(function(results) {
		if (results[0]) {
			
			results[0].updated=$.now()
			server.annotations.update(results[0])

			
			$("#an-"+data.an_id).attr('an_id', results[0].an_id)

			data.an_id=results[0].an_id
			
			server.an_relations.add({"hl_id": data.hl_id, "an_id": data.an_id})

		} else {

			
			server.annotations.add({"an_id": data.an_id, "annotation": data.annotation, "created":$.now(), "updated":$.now()}).then(function(){
				server.an_relations.add({"hl_id": data.hl_id, "an_id": data.an_id})
			})
		}
	})
	
}

function removeAnnotation(data, reload){

	server.an_relations.query("an_id").only(data.an_id).execute().then(function(results) {
		if(results){
			var removalPromises = []
			for (var i = 0; i < results.length; i++) {
				if(results[i].hl_id==data.hl_id){
					removalPromises.push(server.an_relations.remove( results[i].id ))
				}
			};
			if(results.length==1){
				removalPromises.push(server.annotations.remove( data.an_id ))
			}
			Promise.all(removalPromises).then(function(){
				if(reload)
					location.reload()
			})
		}
	})
}

function removeHighlight(data, moreData, reload){
	
	server.highlights.get(data).then(function(result){
		server.highlights.query("url").only(result.url).execute().then(function(results){
	

			var removeStuffPromise = []

			if(results.length==1){
				removeStuffPromise.push(removeUrl(results[0].url))
			}

			Promise.all(removeStuffPromise).then(function(){
				server.an_relations.query("hl_id").only(data).execute().then(function(results) {
					
					var removeRelationsP = []
					$.each(results, function(index, item){
						if (item.hl_id == data){

							removeRelationsP.push( 
								new Promise(function(resolve, reject) {
									server.an_relations.remove( item.id ).then(function(){
										server.an_relations.query("an_id").only(item.an_id).execute().then(function(relations){
											if(!relations.length){
												server.annotations.remove( item.an_id ).then(function(){
													resolve()
												})
											} else {
												resolve()
											}
										})
									})
								})
							)
						}
					})
					
					Promise.all(removeRelationsP).then(function(){
						server.highlights.remove(data).then(function(results){
							if(reload){
								// location.reload()
							}
						})
					})
				})
			})
		})	
	})
}

function removeUrl(data){

	return new Promise(function(resolve, reject) {
		server.urls.get(data).then(function(result){
			server.urls.remove(data).then(function(){
				server.urls.query("host").only(result.host).execute().then(function(results){
					var RemoveHostP = []

					if(results.length==0){
						RemoveHostP.push(server.hosts.remove(result.host))
					}

					Promise.all(RemoveHostP).then(function(){
						server.urls.query("author").only(result.author).execute().then(function(results){
							var RemoveAuthorP = []
							if(results.length==0){
								RemoveAuthorP.push(server.authors.remove(result.author))
							}

							Promise.all(RemoveAuthorP).then(function(){
								resolve()
							})
						})
					})
				})
			})
		})
	})
}

function getAnnotationsForHighlight(data){

	server.annotations.get( data.an_id ).then(function(result) {
		if(result){
			$("#hl-"+data.hl_id+" .addtag").before(tagNoEditDOM[0]+result.an_id+tagNoEditDOM[1]+result.annotation+tagNoEditDOM[2])
			$("#an-"+result.an_id).click(function(){
				removeAnnotation({hl_id: $(this).closest(".highlight").attr('id').split("hl-")[1], an_id: $(this).attr('id').split("an-")[1]})
				$(this).remove()
			})
		}
	})
}

function genId(){
	return $.now()+"-"+Math.floor((Math.random()*.9+.1)*1000000)
}

