// HELPERS

// from Peter Cook: http://prcweb.co.uk/lab/what-makes-us-happy/

function parseData(d) {
  var keys = _.keys(d[0]);
  return _.map(d, function(d) {
    var o = {};
    _.each(keys, function(k) {
      if( k == 'game' )
        o[k] = d[k];
      else
        o[k] = parseFloat(d[k]);
    });
    return o;
  });
}

function getBounds(d, paddingFactor) {
  // Find min and maxes (for the scales)
  paddingFactor = typeof paddingFactor !== 'undefined' ? paddingFactor : 1;

  var keys = _.keys(d[0]), b = {};
  _.each(keys, function(k) {
    b[k] = {};
    _.each(d, function(d) {
      if(isNaN(d[k]))
        return;
      if(b[k].min === undefined || d[k] < b[k].min)
        b[k].min = d[k];
      if(b[k].max === undefined || d[k] > b[k].max)
        b[k].max = d[k];
    });
    b[k].max > 0 ? b[k].max *= paddingFactor : b[k].max /= paddingFactor;
    b[k].min > 0 ? b[k].min /= paddingFactor : b[k].min *= paddingFactor;
  });
  return b;
}

  // load data;

var dataset;

d3.csv("usofinals.csv", function(error, data) {
  dataset = data;
  console.log(data);

  var xAxis = "ace1", yAxis = "ace2";
  var xAxisOptions = ["error1"]
  var yAxisOptions = ["error2"];
  var descriptions = {
    "ace1" : "Number of Aces (Champion)",
    "ace2" : "Number of Aces (Opponent)",
    "error1" : "Number of Errors (Champion)",
    "error2" : "Number of Errors (Opponent)",
  };

  var keys = _.keys(data[0]);
  var data = parseData(data);
  var bounds = getBounds(data, 1);

  // SVG AND D3 STUFF
  var svg = d3.select("#chart")
    .append("svg")
    .attr("width", 900)
    .attr("height", 640);
  var xScale, yScale;

  svg.append('g')
    .classed('chart', true)
    .attr('transform', 'translate(80, -60)');

  // Build menus
  d3.select('#x-axis-menu')
    .selectAll('li')
    .data(xAxisOptions)
    .enter()
    .append('li')
    .text(function(d) {return d;})
    .classed('selected', function(d) {
      return d === xAxis;
    })
    .on('click', function(d) {
      xAxis = d;
      updateChart();
      updateMenus();
    });

  // d3.select('#y-axis-menu')
  //   .selectAll('li')
  //   .data(yAxisOptions)
  //   .enter()
  //   .append('li')
  //   .text(function(d) {return d;})
  //   .classed('selected', function(d) {
  //     return d === yAxis;
  //   })
  //   .on('click', function(d) {
  //     yAxis = d;
  //     updateChart();
  //     updateMenus();
  //   });

  // Game
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'game', 'x': 0, 'y': 170})
    .style({'font-size': '80px', 'font-weight': 'bold', 'fill': '#ddd'});

  // Axis labels
  d3.select('svg g.chart')
    .append('text')
    .attr({'id': 'xLabel', 'x': 400, 'y': 670, 'text-anchor': 'middle'})
    .text(descriptions[xAxis]);

  d3.select('svg g.chart')
    .append('text')
    .attr('transform', 'translate(-60, 330)rotate(-90)')
    .attr({'id': 'yLabel', 'text-anchor': 'middle'})
    .text(descriptions[yAxis]);

  // Render points
  updateScales();
  var pointColour = d3.scale.category20b();
  d3.select('svg g.chart')
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) {
      return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
    })
    .attr('cy', function(d) {
      return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
    })
    .attr('fill', function(d, i) {return pointColour(i);})
    .style('cursor', 'pointer')
    .on('mouseover', function(d) {
      d3.select('svg g.chart #game')
        .text(d["game"])
        .transition()
        .style('opacity', 1);
    })
    .on('mouseout', function(d) {
      d3.select('svg g.chart #game')
        .transition()
        .duration(1500)
        .style('opacity', 0);
    });

  updateChart(true);
  updateMenus();

  // Render axes
  d3.select('svg g.chart')
    .append("g")
    .attr('transform', 'translate(0, 630)')
    .attr('id', 'xAxis')
    .call(makeXAxis);

  d3.select('svg g.chart')
    .append("g")
    .attr('id', 'yAxis')
    .attr('transform', 'translate(-10, 0)')
    .call(makeYAxis);



  //// RENDERING FUNCTIONS
  function updateChart(init) {
    updateScales();

    d3.select('svg g.chart')
      .selectAll('circle')
      .transition()
      .duration(500)
      .ease('quad-out')
      .attr('cx', function(d) {
        return isNaN(d[xAxis]) ? d3.select(this).attr('cx') : xScale(d[xAxis]);
      })
      .attr('cy', function(d) {
        return isNaN(d[yAxis]) ? d3.select(this).attr('cy') : yScale(d[yAxis]);
      })
      .attr('r', function(d) {
        return isNaN(d[xAxis]) || isNaN(d[yAxis]) ? 0 : 12;
      });

    // Also update the axes
    d3.select('#xAxis')
      .transition()
      .call(makeXAxis);

    d3.select('#yAxis')
      .transition()
      .call(makeYAxis);

    // Update axis labels
    d3.select('#xLabel')
      .text(descriptions[xAxis]);

  function updateScales() {
    xScale = d3.scale.linear()
                    .domain([bounds[xAxis].min, bounds[xAxis].max])
                    .range([0, 100]);

    yScale = d3.scale.linear()
                    .domain([bounds[yAxis].min, bounds[yAxis].max])
                    .range([0, 100]);    
  }

  function makeXAxis(s) {
    s.call(d3.svg.axis()
      .scale(xScale)
      .orient("bottom"));
  }

  function makeYAxis(s) {
    s.call(d3.svg.axis()
      .scale(yScale)
      .orient("left"));
  }

  function updateMenus() {
    d3.select('#x-axis-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === xAxis;
      });
    d3.select('#y-axis-menu')
      .selectAll('li')
      .classed('selected', function(d) {
        return d === yAxis;
    });
  }

})