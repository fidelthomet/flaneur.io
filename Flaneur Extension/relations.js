// var force

// function drawForceGraph(graph){
// 	$("#relations").empty()
// 	var width = 2000,
// 	height = 2000;
// var svg = d3.select("#relations")
// 	.attr("width", width)
// 	.attr("height", height);

// 	var color = d3.scale.category20();

// 	force = d3.layout.force()
// 	.charge(-5000)
// 	.linkDistance(252)
// 	.size([width, height]);



// 	force
// 	.nodes(graph.nodes)
// 	.links(graph.links)
// 	.start();

// 	var link = svg.selectAll(".link")
// 	.data(graph.links)
// 	.enter().append("line")
// 	.attr("class", "link")
// 	.attr("stroke", "black")
// 	.style("stroke-width", function(d) { return 1 });

// 	var node = svg.selectAll(".node")
// 	.data(graph.nodes)
// 	.enter().append("circle")
// 	.attr("class", "node")
// 	.attr("r", 5)
// 	.attr("id", function(d) { return d.name })
// 	.style("fill", "black")


// 	force.on("tick", function() {
// 		link.attr("x1", function(d) { return d.source.x; })
// 		.attr("y1", function(d) { return d.source.y; })
// 		.attr("x2", function(d) { return d.target.x; })
// 		.attr("y2", function(d) { return d.target.y; });

// 		node.attr("cx", function(d) {return d.x;})
// 		.attr("cy", function(d) { 
// 			if(d.type=="hl"){
// 				$("#hl-"+d.name).css({"transform":createMatrix([1,0,0,1,d.x-itemWidth/2,d.y+44-highlights[d.name].height/2])});
// 			} else if (d.type=="an"){
// 				$("#an-"+d.name).css({"transform":createMatrix([1,0,0,1,d.x-annotations[d.name].width/2,d.y+44-annotations[d.name].height/2])});
// 			}
// 			return d.y; 
// 		});



// 	});
// }


var graph;
function myGraph(el) {


	this.addNode = function (id,type) {
		nodes.push({"id":id, "type":type});
		update();
	};

	this.removeNode = function (id) {
		var i = 0;
		var n = findNode(id);
		while (i < links.length) {
			if ((links[i]['source'] == n)||(links[i]['target'] == n))
			{
				links.splice(i,1);
			}
			else i++;
		}
		nodes.splice(findNodeIndex(id),1);
		update();
	};

	this.hasNode = function (id){
		for (var i in nodes) {
			if (nodes[i]["id"] === id) return true;
		}
		return false;
	}


	this.removeLink = function (source,target){
		for(var i=0;i<links.length;i++)
		{
			if(links[i].source.id == source && links[i].target.id == target)
			{
				links.splice(i,1);
				break;
			}
		}
		update();
	};


	this.removeallLinks = function(){
		links.splice(0,links.length);
		update();
	};

	this.removeAllNodes = function(){
		nodes.splice(0,links.length);
		update();
	};

	this.getNodes = function(){
		return nodes
	}

	this.getLinks = function(){
		return links
	}

	this.addLink = function (source, target, value) {
		links.push({"source":findNode(source),"target":findNode(target),"value":value});
		update();
	}

	this.getForce = function(){
		return force
	}

	var findNode = function(id) {
		for (var i in nodes) {
			if (nodes[i]["id"] === id) return nodes[i];
		};
	};

	var findNodeIndex = function(id) {
		for (var i=0;i<nodes.length;i++) {
			if (nodes[i].id==id){
				return i;
			}
		};
	};


	var w = window.innerWidth,
	h = window.innerHeight-44;

	var vis = d3.select("#relations")
	.attr("width", w)
	.attr("height", h)
	.attr("pointer-events", "all")
	.attr("perserveAspectRatio","xMinYMid")
	.append('svg:g');

	var force = d3.layout.force();

	var nodes = force.nodes(),
	links = force.links();

	var update = function () {
		var link = vis.selectAll("line")
		.data(links, function(d) {
			return d.source.id + "-" + d.target.id; 
		});

		link.enter().append("line")
		.attr("id",function(d){return d.source.id + "-" + d.target.id;})
		.attr("class","link")
		.attr("stroke", "black")
		.style("stroke-width", "1");
		link.append("title")
		.text(function(d){
			return d.value;
		});
		link.exit().remove();

		var node = vis.selectAll("g.node")
		.data(nodes, function(d) { 
			return d.id;});

		var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.call(force.drag);

		nodeEnter.append("svg:circle")
		.attr("r", 1)
		.attr("id",function(d) { return "Node;"+d.id;})
		.attr("class","nodeStrokeClass");

		// nodeEnter.append("svg:text")
		// .attr("class","textClass")
		// .text( function(d){return d.id;}) ;

		node.exit().remove();
		force.on("tick", function() {

			node.attr("transform", function(d) {
				if (d.type=="hl")
					$("#hl-"+d.id).css({"transform":createMatrix([1,0,0,1,d.x-itemWidth/2,d.y-highlights[d.id].height/2])});
				else if (d.type=="an")
					$("#an-"+d.id).css({"transform":createMatrix([1,0,0,1,d.x-annotations[d.id].width/2,d.y-annotations[d.id].height/2])});
				else if (d.type=="au"){
					// console.log(".")
					$(".tag[author='au-" + d.id +"']").css({"transform":createMatrix([1,0,0,1,d.x-authors[d.id].width/2,d.y-authors[d.id].height/2])});
				}
				return "translate(" + d.x + "," + d.y + ")"; });

			link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
		});


		force
		.distance(5000)
		.linkDistance( 252 )
		.charge(-5000)
		// .linkStrength(0.1)
		// .friction(0.1)
		// .gravity(0.5)
		 // .theta(0.99)
		// .alpha(0.01)
		.size([w, h])
		.start();
	};



	update();
}