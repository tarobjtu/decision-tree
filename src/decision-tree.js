(function(global, d3, undefined){

    global.decisionTree = {};

    var opt = {
        margin : {
            top : 20,
            right : 20,
            bottom : 20,
            left : 20
        },
        width : 800,
        height : 1800,
        node : {
            width : 90,
            height : 26
        },
        link : {
            maxWidth : 15,
            minWidth : 2
        },
        char_to_pxl : 6,
        depth : 70
    };

    var container, vis, tree, root, i = 0, showPredictionPanel;

    var classNames = {
        decisionTree : 'decision-tree',
        hover : 'hover',
        predictionPanel : "prediction-panel"
    };

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    var link_stoke_scale = d3.scale.linear();
    var color_map = d3.scale.category10();


    decisionTree.init = function(options){
        var width = opt.width + opt.margin.right + opt.margin.left,
            height = opt.height + opt.margin.top + opt.margin.bottom;

        container = d3.select(options.container);
        showPredictionPanel = options.showPredictionPanel;
        vis = container.style("position", "relative")
            .append("svg:svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", classNames.decisionTree)
            .append("svg:g")
            .attr("transform", "translate(" + opt.margin.left + "," + opt.margin.top + ")");

        if(showPredictionPanel){
            container.append("div")
                .attr("class", classNames.predictionPanel)
                .style("left", width + "px" );
        }

        tree = d3.layout.tree()
            .size([opt.width, opt.height]);

        render(options.data);
    };

    function render(data) {
        root = data;
        root.x0 = 0;
        root.y0 = 0;

        var n_samples = root.samples;
        var n_labels = root.value.length;

        link_stoke_scale = d3.scale.linear()
            .domain([0, n_samples])
            .range([opt.link.minWidth, opt.link.maxWidth]);

        function toggleAll(d) {
            if (d && d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
            }
        }

        root.children.forEach(toggleAll);

        update(root);
    }

    function update(source) {
        var duration = 500;

        var nodes = tree.nodes(root).reverse();

        nodes.forEach(function(d) {
            d.y = d.depth * opt.depth;
        });

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
                // clear
                clearMarkPath(d);
                if(showPredictionPanel) {
                    clearPredictionPanel();
                }

                // mark
                var list = getRoute(d);
                markPath(list);
                if(showPredictionPanel) {
                    predictionPanel(list);
                }
            });

        nodeEnter.append("svg:rect")
            .attr("x", function(d) {
                var label = node_label(d);
                var text_len = label.length * opt.char_to_pxl;
                var width = d3.max([opt.node.width, text_len])
                return -width / 2;
            })
            .attr("width", 1e-6)
            .attr("height", 1e-6)
            .attr("rx", function(d) { return d.type === "split" ? 2 : 0;})
            .attr("ry", function(d) { return d.type === "split" ? 2 : 0;})
            .style("fill", function(d) {
                var color = '';
                if(d.type === "split"){
                    // cached for node color of prediction path
                    color = d.color = color_map(d.feature);
                }
                return color;
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
                var text_len = label.length * opt.char_to_pxl;
                var width = d3.max([opt.node.width, text_len])
                return width;
            })
            .attr("height", opt.node.height);

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

    function markPath(list){
        vis.selectAll('[data-id]')
            .each(function(d){
                var node = d3.select(this);
                var id = parseInt(node.attr('data-id'), 10);
                list.forEach(function(item){
                    if(item.id === id){
                        node.classed(classNames.hover, true);
                    }
                });
            });
    }

    function clearMarkPath(d){
        vis.selectAll('[data-id]')
            .each(function(d){
                d3.select(this).classed(classNames.hover, false);
            });
    }


    function getRoute(d){
        var rst = [];

        function get(d){
            if(d.parent){
                get(d.parent)
            }
            rst.push(d);
        }
        get(d);
        return rst;
    }

    /**
     * @description: To render prediction path
     * @param list
     */
    var tmpl = '<div class="title">Prediction path</div>' +
               '<% _.forEach(list, function(item) { %>' +
               '<div class="feature" style="background-color: <%- item.color %>"><%- item.feature %></div>' +
               '<div class="fork"><%- item.label %></div>' +
               '<% }); %>' +
               '<div class="feature" style="background-color: <%- last.color %>"><%- last.feature || lastLabel %></div>';

    function predictionPanel(list){
        var last = list.pop();
        var html = _.template(tmpl)({list : list, last : last, lastLabel : node_label(last)});
        container.select('.' + classNames.predictionPanel)
            .html(html);
    }
    function clearPredictionPanel(){
        container.select('.' + classNames.predictionPanel)
            .html('');
    }



})(window, d3);

