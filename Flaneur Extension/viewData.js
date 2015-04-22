$(function() {
	


	var getData = function(selection){
		var request = indexedDB.open(dbName, 5);
		request.onerror = function(event) {
			console.log("Database error: " + event.target.errorCode);
		};

		request.onupgradeneeded = function(event) {
			alert("Upgrade needed");
		};
		request.onsuccess = function(event) {

			var db = event.target.result;

			var transaction = db.transaction(["highlight","host"], "readonly");

			transaction.oncomplete = function(event) {
				console.debug("transaction completed");
			};

			transaction.onerror = function(event) {
				console.error("ERROR - transaction")
				console.debug(event)
			};
			getHosts(transaction);
			
		}

		var getHosts = function(transaction){
			
			var objectStore = transaction.objectStore("host");

			var el = ["<div id='","'class='host'>","</div>"]


			objectStore.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				
				if (cursor) {
					// console.log(cursor.value)
					var id = cursor.value.hostname.replace(/\./g, '-')
					$("#container").append(el[0]+id+el[1]+cursor.value.hostname+el[2])
					$("#"+id).mouseover(function(e){
						drawConnections(this)
					})
					$("#"+id).mouseout(function(e){
						removeConnections()
					})
					
					cursor.continue();
				}
				else {
					getHighlights(transaction);
				}
			};

		}

		var getHighlights = function(transaction){
			var objectStore = transaction.objectStore("highlight");

			var el = ["<div id='","' class='item "," '><div class='header'>","</div><span class='highlight'>","</span></div>"]
			var i = 0;
			objectStore.openCursor().onsuccess = function(event) {
				var cursor = event.target.result;
				
				if (cursor) {

					
					for (var j = 0; j < 20; j++) {
						i++;
					
						// console.log(cursor.primaryKey)
						var host = "host_"+cursor.value.hostname.replace(/\./g, '-');
						var itemID = "i_"+i

						$("#container").append(el[0]+itemID+el[1]+host+el[2]+cursor.value.meta.title+el[3]+cursor.value.highlightText+el[4])
						$("#"+itemID).css({
							transform: "translate3d("+(20+(200*(i%5)))+"px,"+(20+(60*(Math.floor(i/5))))+"px,"+0+")"
						})

						// for (var i=0; i<$(".item").length;i++){$($(".item")[i]).css({transform: "translate3d("+(20+(200*(i%7)))+"px,"+(20+(60*(Math.floor(i/7))))+"px,"+0+")"})}
					};

					cursor.continue();
				}
				else {
			//		drawConnections();
				}
			};
		}

		var drawConnections = function(that){

			
			$(".host_"+$(that)[0].id).each(function() {
				// console.log($(that).position)
  				drawLine($(that).position().left+20,$(that).position().top+10,$(this).position().left+20,$(this).position().top+10)
			});

		}

		var removeConnections = function(that){

			$("#drawit").html('')
			// console.log($(that).id)
			// $(".host_"+$(that).id).each(function() {
  	// 			console.log($(this).position())
			// });

		}

		var drawLine = function (x1,y1,x2,y2){
			// console.log(x1)
		    if(y1 < y2){
		        var pom = y1;
		        y1 = y2;
		        y2 = pom;
		        pom = x1;
		        x1 = x2;
		        x2 = pom;
		    }

		    var a = Math.abs(x1-x2);
		    var b = Math.abs(y1-y2);
		    var c;
		    var sx = (x1+x2)/2 ;
		    var sy = (y1+y2)/2 ;
		    var width = Math.sqrt(a*a + b*b ) ;
		    var x = sx - width/2;
		    var y = sy;

		    a = width / 2;

		    c = Math.abs(sx-x);

		    b = Math.sqrt(Math.abs(x1-x)*Math.abs(x1-x)+Math.abs(y1-y)*Math.abs(y1-y) );

		    var cosb = (b*b - a*a - c*c) / (2*a*c);
		    var rad = Math.acos(cosb);
		    var deg = (rad*180)/Math.PI

		    htmlns = "http://www.w3.org/1999/xhtml";
		    div = document.createElementNS(htmlns, "div");
		    div.setAttribute('style','border:1px solid black;width:'+width+'px;height:0px;-moz-transform:rotate('+deg+'deg);-webkit-transform:rotate('+deg+'deg);position:absolute;top:'+y+'px;left:'+x+'px;');   

		    document.getElementById("drawit").appendChild(div);
		}
	}
	getData()
})