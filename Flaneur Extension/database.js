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

