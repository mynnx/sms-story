require.config({
  paths: {
    'd3': '../extern/d3/d3'
  },
  shim: {
    'd3': {
      'exports': 'd3'
    }
  }
});

require(['d3'], function(d3) {
  'use strict';
  var width = 2880 + 1440 + 1440 + 1440,
    height = 700;

  var svg = d3.select('#content')
          .append('svg')
          .attr('width', width)
          .attr('height', height);

  d3.json('/api/sms', function(error, data) {
  var stack = d3.layout.stack()
    .offset("silhouette")
    .values(function(d) { return d.values; })
    .x(function(d) {
      var dateParts = d.x.split(' ');
      return new Date(dateParts[0], dateParts[1]);
    });
  stack(data);

  var x = d3.time.scale()
    .domain([new Date(2009, 0, 1), new Date(2013, 10, 31)])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([0, d3.max(data, function(layer) { return d3.max(layer.values, function(d) { return d.y0 + d.y; }); })])
    .range([height - 20, 0]);

  var area = d3.svg.area()
    .interpolate("cardinal")
    .x(function(d) {
      var dateParts = d.x.split(' ');
      return x(new Date(dateParts[0], dateParts[1]));
    })
    .y0(function(d) {
      return y(d.y0);
    })
    .y1(function(d) { return y(d.y0 + d.y); });

  var color = d3.scale.category20()
    .domain(d3.shuffle(data.map(function (person) { return person.number; })));

  svg.selectAll("path")
     .data(data)
     .enter().append("path")
     .attr("d", function(d) { return area(d.values); })
     .style("fill", function(d) {
       return color(d.number);
     })
     .attr("transform", "translate(0, 20)")
     .append("title")
     .text(function(d) { return (d.name) ? d.name : d.number; });

  function xAxis() {
    return d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(16, 0);
  }

  var xAxis_old = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(d3.time.months)
    .tickSize(16, 0);

  svg.append("g")
    .attr("class", "axis months")
    .call(xAxis().ticks(d3.time.month).tickFormat(d3.time.format("%B")))
    .selectAll(".tick text")
    .style("text-anchor", "start")
    .attr("x", 6)
    .attr("y", 6);

  svg.append("g")
    .attr("class", "axis years")
    .attr("transform", "translate(0, 600)")
    .call(xAxis().ticks(d3.time.year).tickFormat(d3.time.format("%Y")))
    .selectAll(".tick text")
    .style("text-anchor", "start")
    .attr("x", 6)
    .attr("y", 6);
  });
});
