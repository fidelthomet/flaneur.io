var server;

//---
// INIT-DB
//---
db.open( {
	server: 'flaneur',
	version: 1,
	schema: {
		highlights: {
			key: { keyPath: 'hl_id' , autoIncrement: false },
			indexes: {
				highlight: {},
				host: {},
				url: {},
				created: {},
				author: {},
				project: {}
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
		relations: {
			key: { keyPath: "id", autoIncrement: true },
			indexes: {
				hl_id: {},
				an_id: {}
			}
		},
		hosts: {
			key: { keyPath: "host", autoIncrement: false },
			indexes: {
				created: {},
				updated: {}
			}
		},
		urls: {
			key: { keyPath: "url", autoIncrement: false },
			indexes: {
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
				created: {},
				updated: {}
			}
		},
		projects: {
			key: { keyPath: "project", autoIncrement: false },
			indexes: {
				created: {},
				updated: {}
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
			server.authors.add({author: "Unknown", created: now, updated: now})
		}
	})

	server.projects.get( "Unassigned" ).then( function ( result ) {
		if(!result){
			server.projects.add({project: "Unassigned", created: now, updated: now})
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
			server.authors.add({"author":data.author, "created":$.now(), "updated":$.now()})
		}
	})

	server.highlights.query("url").only(data.url).modify({author: data.author}).execute()
}

function addAnnotation(data){
	server.annotations.query("annotation").only( data.annotation ).execute().then(function(results) {
		if (results[0]) {
			results[0].updated=$.now()
			server.annotations.update(results[0])

			data.an_id=results[0].an_id
			console.log(results[0].an_id)
			$("#an-"+data.an_id).attr('id',"an-"+results[0].an_id)
			server.relations.add({"hl_id": data.hl_id, "an_id": data.an_id})

		} else {
			server.annotations.add({"an_id": data.an_id, "annotation": data.annotation, "created":$.now(), "updated":$.now()}).then(function(){
				server.relations.add({"hl_id": data.hl_id, "an_id": data.an_id})
			})
		}
	})
	
}

function removeAnnotation(data){

	server.relations.query("an_id").only(data.an_id).execute().then(function(results) {
		if(results){
			for (var i = 0; i < results.length; i++) {
				if(results[i].hl_id==data.hl_id){
					server.relations.remove( results[i].id )
				}
			};
			if(results.length==1){
				server.annotations.remove( data.an_id )
			}
		}
	})
}

function removeHighlight(data){
	server.highlights.get(data).then(function(result){
		server.highlights.query("url").only(result.url).execute().then(function(results){
			if(results.length==1){
				removeUrl(results[0].url)
			}
			server.highlights.remove(data)
		})	
	})

	server.relations.query("an_id").only(data).execute().then(function(results) {
		
		for (var i = 0; i < results.length; i++) {
			if(results[i].hl_id==data){
				server.relations.remove( results[i].id )
			}
		};
	})
}

function removeUrl(data){
	server.urls.get(data).then(function(result){
		server.urls.remove(data).then(function(){
			server.hosts.query("host").only(result.host).execute().then(function(results){
				if(results.length==1){
					server.hosts.remove(result.host)
				}
			})
			server.authors.query("author").only(result.author).execute().then(function(results){
				if(results.length==1){
					server.authors.remove(result.author)
				}
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



