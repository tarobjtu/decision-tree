(function(global, d3, undefined){

    global.decisionTree = {};

    var m = [20, 120, 20, 120],
        w = 1280 - m[1] - m[3],
        h = 800 - m[0] - m[2],
        i = 0,
        rect_width = 90,
        rect_height = 26,
        max_link_width = 20,
        min_link_width = 1.5,
        char_to_pxl = 6,
        root;

    var vis, tree;

    var classNames = {
        hover : 'hover'
    };

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    var link_stoke_scale = d3.scale.linear();
    var color_map = d3.scale.category10();


    decisionTree.init = function(json){
        vis = d3.select("#body").append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2] + 1000)
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
            .attr("data-role", "decision-tree");

        tree = d3.layout.tree()
            .size([h, w]);

        load_dataset(json);
    };

    function load_dataset(json) {
        root = json;
        root.x0 = 0;
        root.y0 = 0;

        var n_samples = root.samples;
        var n_labels = root.value.length;

        link_stoke_scale = d3.scale.linear()
            .domain([0, n_samples])
            .range([min_link_width, max_link_width]);

        function toggleAll(d) {
            if (d && d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
            }
        }

        // Initialize the display to show a few nodes.
        root.children.forEach(toggleAll);

        update(root);
    }

    function update(source) {
        var duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 100; });

        // Update the nodes…
        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("svg:g")
            .attr("class", "node")
            .classed('leaf', function(d){
                return d.type !== "split";
            })
            .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
            .attr("data-id", function(d) { return d.id; })
            .on("click", function(d) {
                toggle(d);
                update(d);
            })
            .on("mouseover", function(d){
                markRoute(d);
            })
            .on("mouseout", function(d){
                clearMarkRout(d);
            });

        nodeEnter.append("svg:rect")
            .attr("x", function(d) {
                var label = node_label(d);
                var text_len = label.length * char_to_pxl;
                var width = d3.max([rect_width, text_len])
                return -width / 2;
            })
            .attr("width", 1e-6)
            .attr("height", 1e-6)
            .attr("rx", function(d) { return d.type === "split" ? 2 : 0;})
            .attr("ry", function(d) { return d.type === "split" ? 2 : 0;})
            .style("fill", function(d) {
                return d.type === "split" ? color_map(d.feature) : '';
            });

        nodeEnter.append("svg:text")
            .attr("dy", "18px")
            .attr("text-anchor", "middle")
            .text(node_label)
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        nodeUpdate.select("rect")
            .attr("width", function(d) {
                var label = node_label(d);
                var text_len = label.length * char_to_pxl;
                var width = d3.max([rect_width, text_len])
                return width;
            })
            .attr("height", rect_height);

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
            .remove();

        nodeExit.select("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links
        var link = vis.selectAll("path.link")
            .data(tree.links(nodes), function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .attr("data-id", function(d) {
                return d.target.id;
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width", function(d) {
                return link_stoke_scale(d.target.samples);
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width", function(d) {
                return link_stoke_scale(d.target.samples);
            });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

// Toggle children.
    function toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }

// Node labels
    function node_label(d) {
        if (d.type === "leaf") {
            // leaf
            var formatter = d3.format(".2f");
            var vals = [];
            d.value.forEach(function(v) {
                vals.push(formatter(v));
            });
            return "[" + vals.join(", ") + "]";
        } else {
            // split node
            return d.label;
        }
    }

    function markRoute(d){
        var list = ids(d);
        vis.selectAll('[data-id]')
            .each(function(d){
                var node = d3.select(this);
                var id = parseInt(node.attr('data-id'), 10);
                if(list.indexOf(id) >= 0){
                    node.classed(classNames.hover, true);
                }
            });
    }

    function clearMarkRout(d){
        vis.selectAll('[data-id]')
            .each(function(d){
                d3.select(this).classed(classNames.hover, false);
            });
    }


    function ids(d){
        var rst = [];

        function get(d){
            if(d.parent){
                get(d.parent)
            }
            rst.push(d.id);
        }
        get(d);
        return rst;
    }



})(window, d3);

