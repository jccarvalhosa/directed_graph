function selectableForceDirectedGraph() {
    var width = 960,

    height = 500,
    shiftKey, ctrlKey;

    var nodeGraph = null;
    var xScale = d3.scale.linear()
    .domain([0,width]).range([0,width]);
    var yScale = d3.scale.linear()
    .domain([0,height]).range([0, height]);

    var svg = d3.select("#d3_selectable_force_directed_graph")
    .attr("tabindex", 1)
    .on("keydown.brush", keydown)
    .on("keyup.brush", keyup)
    .each(function() { this.focus(); })
    .append("svg")
    .attr("width", width)
    .attr("height", height);

    var zoomer = d3.behavior.zoom().
        scaleExtent([0.1,10]).
        x(xScale).
        y(yScale).
        on("zoomstart", zoomstart).
        on("zoom", redraw);

    function zoomstart() {
        node.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    }

    function redraw() {
        vis.attr("transform",
                 "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }

    var brusher = d3.svg.brush()
    .x(xScale)
    .y(yScale)
    .on("brushstart", function(d) {
        node.each(function(d) { 
            d.previouslySelected = shiftKey && d.selected; });
    })
    .on("brush", function() {
        var extent = d3.event.target.extent();

        node.classed("selected", function(d) {
            return d.selected = d.previouslySelected ^
            (extent[0][0] <= d.x && d.x < extent[1][0]
             && extent[0][1] <= d.y && d.y < extent[1][1]);
        });
    })
    .on("brushend", function() {
        d3.event.target.clear();
        d3.select(this).call(d3.event.target);
    });

    var svg_graph = svg.append('svg:g')
    .call(zoomer)

	var defs = svg.append("svg:defs");

    var brush = svg_graph.append("g")
    .datum(function() { return {selected: false, previouslySelected: false}; })
    .attr("class", "brush");

    var vis = svg_graph.append("svg:g");

    vis.attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('opacity', 0.5)
    .attr('id', 'vis')


    brush.call(brusher)
    .on("mousedown.brush", null)
    .on("touchstart.brush", null) 
    .on("touchmove.brush", null)
    .on("touchend.brush", null); 

    brush.select('.background').style('cursor', 'auto');

    var link = vis.append("g")
    .attr("class", "link")
    .selectAll("line");

    var node = vis.append("g")
    .attr("class", "node")
    .selectAll("g")

    center_view = function() {
        // Center the view on the molecule(s) and scale it so that everything
        // fits in the window

        if (nodeGraph === null)
            return;

        var nodes = nodeGraph.nodes;

        //no molecules, nothing to do
        if (nodes.length === 0)
            return;

        // Get the bounding box
        min_x = d3.min(nodes.map(function(d) {return d.x;}));
        min_y = d3.min(nodes.map(function(d) {return d.y;}));

        max_x = d3.max(nodes.map(function(d) {return d.x;}));
        max_y = d3.max(nodes.map(function(d) {return d.y;}));


        // The width and the height of the graph
        mol_width = max_x - min_x;
        mol_height = max_y - min_y;

        // how much larger the drawing area is than the width and the height
        width_ratio = width / mol_width;
        height_ratio = height / mol_height;

        // we need to fit it in both directions, so we scale according to
        // the direction in which we need to shrink the most
        min_ratio = Math.min(width_ratio, height_ratio) * 0.8;

        // the new dimensions of the molecule
        new_mol_width = mol_width * min_ratio;
        new_mol_height = mol_height * min_ratio;

        // translate so that it's in the center of the window
        x_trans = -(min_x) * min_ratio + (width - new_mol_width) / 2;
        y_trans = -(min_y) * min_ratio + (height - new_mol_height) / 2;


        // do the actual moving
        vis.attr("transform",
                 "translate(" + [x_trans, y_trans] + ")" + " scale(" + min_ratio + ")");

		 // tell the zoomer what we did so that next we zoom, it uses the
		 // transformation we entered here
		 zoomer.translate([x_trans, y_trans ]);
		 zoomer.scale(min_ratio);

    };

	function unselectEverything() {
		node.classed("selected", function(p) { return p.selected = p.previouslySelected = false; })
	}

    d3.json("graph.json", function(error, graph) {
        nodeGraph = graph;

        graph.links.forEach(function(d) {
            d.source = graph.nodes[d.source];
            d.target = graph.nodes[d.target];
        });

        link = link.data(graph.links).enter().append("line")
			.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

        var force = d3.layout.force()
        .charge(-240)
        .linkDistance(100)
        .nodes(graph.nodes)
        .links(graph.links)
        .size([width, height])
		.gravity(0.05)
		.start();

		function fixNode(d) { d.fixed |= 2; }
		function unfixNode(d) { d.fixed &= ~6; }

		function dragstarted(d) {
			d3.event.sourceEvent.stopPropagation();
			if (!d.selected && !shiftKey) {
				unselectEverything();
			}

			d3.select($(this).children()[0]).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

			node.filter(function(d) { return d.selected; }).each(fixNode);
			node.filter(function(d) { return !d.selected; }).each(unfixNode);
		}

		function dragged(d) {
			node.filter(function(d) { return d.selected; })
			.each(function(d) { 
				d.x += d3.event.dx;
				d.y += d3.event.dy;

				d.px += d3.event.dx;
				d.py += d3.event.dy;
			})

			force.resume();
		}

		function dragended(d) {
			node.each(unfixNode);
		}

		var drag = d3.behavior.drag()
			.on("dragstart", dragstarted)
			.on("drag", dragged)
			.on("dragend", dragended)
		
		var colors = ["green", "blue", "red", "yellow"];
		var nextColor = 0;

		node = node.data(graph.nodes).enter().append("g");

        node.append("circle")
		.attr("id", function(d, index) { return "circle_"+index})
        .attr("r", function(d) { return d.r; })
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
		.attr("fill", function(d, index) {
			if(d.bg) {
				var id = "bg_circle_"+index;
				defs.append("pattern")
				.attr("id", id)
				.attr("height", 2*d.r)
				.attr("width", 2*d.r)
				.attr("x", 0)
				.attr("y", 0)
				.append("svg:image")
				.attr("x", 0)
				.attr("y", 0)
				.attr("height", 2*d.r)
				.attr("width", 2*d.r)
				.attr("xlink:href", "img/"+d.bg)
				return "url(#"+id+")"
			}
			else {
				var color = colors[nextColor];
				nextColor = (nextColor + 1) % colors.length;
				return color
			}
		})
		
		node.append("text")
			.attr("id", function(d, index) { return "info_"+index})
			.attr("x", function(d) { return d.x})
			.attr("y", function(d) { return d.y})
			.attr("stroke-width", function(d) {	return d.r/50; })
			.attr("stroke", "black")
		
		node.on("dblclick", function(d) { d3.event.stopPropagation(); })
		.on("contextmenu", function(d, index) {
            if (d3.event.defaultPrevented) return;
			d3.event.preventDefault();
		})
        .on("click", function(d) {
            if (d3.event.defaultPrevented) return;

			var modalElement = $('#myModal');
			modalElement.find('.modal-body').text(d.text || '...');
			modalElement.modal();

            if (!shiftKey) {
				unselectEverything();
            }

            // always select this node
            d3.select($(this).children[0]).classed("selected", d.selected = !d.previouslySelected);
        })
        .call(drag);


		info = node.select("text")
		node = node.select("circle")

		function tick() {
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
			  	.attr("x2", function(d) { return d.target.x; })
			  	.attr("y2", function(d) { return d.target.y; });

			node.attr('cx', function(d) { return d.x; })
			  	.attr('cy', function(d) { return d.y; });
			
			info.attr('x', function(d) { return d.x - d.r; })
			  	.attr('y', function(d) { return d.y - d.r; });

			nodeGraph.nodes.forEach(function(d, index) {
				if(d.text) {
					d3plus.textwrap()
						.container("#info_"+index)
						.text(d.text)
						.resize(true)
						.valign("middle")
						.draw()
				}
			});
		};

		var tickSpeed = 2.3;
		var remainingTicks = tickSpeed;
		force.on("tick", function() {
			tick();
			if(remainingTicks < 1) {
				remainingTicks += tickSpeed;
			} else {
				remainingTicks--;
				force.tick();
			}
		});
    });

    function keydown() {
        shiftKey = d3.event.shiftKey || d3.event.metaKey;
        ctrlKey = d3.event.ctrlKey;

        console.log('d3.event', d3.event)
		
		if(d3.event.keyCode == 27) {    //the 'ESC' key
			unselectEverything();
		}

        if (d3.event.keyCode == 67) {   //the 'c' key
            center_view();
        }

        if (shiftKey) {
            svg_graph.call(zoomer)
            .on("mousedown.zoom", null)
            .on("touchstart.zoom", null)                                                                      
            .on("touchmove.zoom", null)                                                                       
            .on("touchend.zoom", null);                                                                       

            //svg_graph.on('zoom', null);                                                                     
            vis.selectAll('g.gnode')
            .on('mousedown.drag', null);

            brush.select('.background').style('cursor', 'crosshair')
            brush.call(brusher);
        }
    }

    function keyup() {
        shiftKey = d3.event.shiftKey || d3.event.metaKey;
        ctrlKey = d3.event.ctrlKey;

        brush.call(brusher)
        .on("mousedown.brush", null)
        .on("touchstart.brush", null)                                                                      
        .on("touchmove.brush", null)                                                                       
        .on("touchend.brush", null);                                                                       

        brush.select('.background').style('cursor', 'auto')
        svg_graph.call(zoomer);
    }	
}
