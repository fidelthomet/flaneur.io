

function drawForceGraph(graph){
	$("#relations").empty()
	var width = 2000,
	height = 2000;
var svg = d3.select("#relations")
	.attr("width", width)
	.attr("height", height);

	var color = d3.scale.category20();

	var force = d3.layout.force()
	.charge(-4000)
	.linkDistance(252)
	.size([width, height]);

	

	force
	.nodes(graph.nodes)
	.links(graph.links)
	.start();

	var link = svg.selectAll(".link")
	.data(graph.links)
	.enter().append("line")
	.attr("class", "link")
	.attr("stroke", "black")
	.style("stroke-width", function(d) { return 1 });

	var node = svg.selectAll(".node")
	.data(graph.nodes)
	.enter().append("circle")
	.attr("class", "node")
	.attr("r", 5)
	.attr("id", function(d) { return d.name })
	.style("fill", "black")
	

	force.on("tick", function() {
		link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) {return d.x;})
		.attr("cy", function(d) { 
			if(d.type=="hl"){
				$("#hl-"+d.name).css({"transform":createMatrix([1,0,0,1,d.x-itemWidth/2,d.y+44-highlights[d.name].height/2])});
			} else if (d.type=="an"){
				$("#an-"+d.name).css({"transform":createMatrix([1,0,0,1,d.x-annotations[d.name].width/2,d.y+44-annotations[d.name].height/2])});
			}
			return d.y; 
		});



	});
}