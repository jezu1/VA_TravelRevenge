
/* START: (0) Main Filter */
// Sample list of countries
const countries = [
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Latvia',
  'Lithuania',
  'Netherlands',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Spain',
  'Sweden'
];
// Select the dropdown
const dropdown = d3.select("#countryDropdown");
// Populate the dropdown with countries
dropdown
    .selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .text(d => d);
// Initial selected country
var selectedCountry = countries[0];
/* END: (0) Main Filter */

/* START: (1) Timeline */
document.addEventListener('DOMContentLoaded', function() {
  createTimelineGraph();
  createForceDirectedGraph();
});
function createTimelineGraph() {
  const data = [
    { date: "2020-01", event: "First confirmed cases" },
    { date: "2020-03", event: "Lockdown" },
    { date: "2020-05", event: "Loosening of restrictions" },
    { date: "2020-09", event: "Arrival of the second wave" },
    { date: "2020-11", event: "A new lockdown" },
    { date: "2021-01", event: "Loosening of restrictions" },
    { date: "2021-03", event: "Back to normal" },
    { date: "2021-05", event: "Things came back to normal" }
  ];
  const margin = { top: 20, right: 50, bottom: 20, left: 50 };
  const width = 960 - margin.left - margin.right;
  const height = 100;
  const barHeight = 25;
  const svgHeight = 200;
  const svg = d3.select("#covid-timeline")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", svgHeight)
    .append("g")
      .attr("transform", `translate(${margin.left},${svgHeight / 2 - barHeight / 2})`);
      // .attr("transform", `translate(${margin.left},${margin.top})`);
  const timeScale = d3.scaleTime()
      .domain([new Date(data[0].date + '-01'), new Date(data[data.length - 1].date + '-01')])
      .range([0, width]);
  svg.append("rect")
    .attr("x", 0)
    .attr("y", (height - barHeight) / 2)
    .attr("width", width)
    .attr("height", barHeight)
    .attr("fill", "#007bff");
  // Define the arrow marker
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 5)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 6)
    .attr('markerHeight', 18) // Increased markerHeight to 18 for 3 times the height
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,5 L 10,5 L 5,-5') // Modified path to create an arrow pointing up
    .attr('fill', 'tomato') // Changed fill to the color of the bar for visibility
    .style('stroke', 'none');
  const markers = svg.selectAll(".timeline-marker")
    .data(data.slice(0, data.length - 1)) // Exclude the last event
    .enter()
    .append("g")
      .attr("class", "timeline-marker")
      .attr("transform", d => `translate(${timeScale(new Date(d.date + '-01'))},${height / 2})`);
  // Add the markers (as a rectangle or circle)
  markers.append("rect")
    .attr("x", -5)
    .attr("y", -barHeight / 2)
    .attr("width", 10) // Increased width for visibility
    .attr("height", barHeight)
    .attr("fill", "white"); // White or any color that contrasts with the bar
  // Add the lines for the arrow markers
  markers.append('line')
    .attr('x1', 0)
    .attr('y1', barHeight / 2) // Modified y1 to start from the bottom of the bar
    .attr('x2', 0)
    .attr('y2', (d, i) => i % 2 === 0 ? -margin.top - 10 : -margin.top - 50 ) // Adjusted y2 values for more stretching
    .attr('stroke', 'tomato')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)');
  // Add text labels for each marker
  markers.append("text")
    .attr("x", 15) // Adjust the x-coordinate to create space between the arrow and text
    .attr("y", (_d, i) => i % 2 === 0 ? -margin.top - 40 : -margin.top - 80)
    .html(d => {
      const dateParts = d.date.split("-");
      const year = dateParts[0];
      const month = dateParts[1];
      const monthText = getMonthText(month);
      return `<tspan x="0" dy="0" font-weight="bold">${monthText} ${year}</tspan>\n<tspan x="0" dy="1.2em">${d.event}</tspan>`;
    }) // Display date and event in separate lines, aligned from the start
    .attr("fill", "grey")
    .style("text-anchor", "start") // Align the text to the start of the marker
    .style("font-size", "12px");
  function getMonthText(month) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[parseInt(month) - 1];
  }
}
/* END: (1) Timeline */

/* START: FILTER UPDATE */
// Initial selected country for both charts
var selectedCountry = countries[0];

updateCharts();

// Dropdown change event listener
dropdown.on("change", function() {
   selectedCountry = this.value;
   updateCharts(); // Call a function to update both charts
});
/* END: FILTER UPDATE */

/* START: (2) Age Group Expenses */
function updateCharts() {
d3.csv("data/age_group_exp.csv").then(function(data2) {
  // Define a color scale based on age groups
  var colorScale = d3.scaleOrdinal()
    .domain(["15-24", "25-34", "35-44", "45+"])
    .range(["#d3d3d3", "#BEE5B0", "#238b45", "#00441b"]); // Higher-contrast shades
  updateScatterPlot(data2, colorScale);
  });

  d3.csv("data/dest_sankey_data.csv").then(function (data4) {
    sankey_chart(data4);
  });

  d3.csv("data/exp_type_dest.csv").then(function (data5) {
    smallMultiplesChart(data5);
  });
}

  // Function to update scatter plot based on selected country
  function updateScatterPlot(data, colorScale) {
    var margin = { top: 30, right: 70, bottom: 70, left: 70 };
    var width = 800 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;
    var filteredData = data.filter(function(d) {
      return d.Origin_Country === selectedCountry;
    });
    // Calculate the minimum value for x-axis
    var minExpPerNight = d3.min(filteredData, function(d) { return +d.Exp_per_Night; }) - 5;
    // Remove previous scatter plot and legend
    d3.select("#scatterPlot").selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();
    // Set up SVG container for the scatter plot with margins
    var svg = d3.select("#scatterPlot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // Set up scales for x and y axes
    var xScale = d3.scaleLinear()
      .domain([minExpPerNight, d3.max(filteredData, function(d) { return +d.Exp_per_Night; })])
      .range([0, width]);
    var yScale = d3.scaleBand()
      .domain(filteredData.map(function(d) { return d.Year; }))
      .range([height, 0])
      .padding(0.1);
    // Create dashed lines below the circles for each year
    var dashedLines = svg.selectAll(".dashed-line")
      .data(filteredData)
      .enter().append("g")
      .attr("class", "dashed-line");
    dashedLines.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", function(d) { return yScale(d.Year) + yScale.bandwidth() / 2; })
      .attr("y2", function(d) { return yScale(d.Year) + yScale.bandwidth() / 2; })
      .style("stroke", "#ccc") // Color of the dashed line
      .style("stroke-dasharray", "3,3"); // Dashed line pattern
    // Create circles for each data point with tooltips
    svg.selectAll(".dot")
      .data(filteredData)
      .enter().append("circle")
      .attr("class", "sc-dot")
      .attr("cx", function(d) { return xScale(+d.Exp_per_Night); })
      .attr("cy", function(d) { return yScale(d.Year) + yScale.bandwidth() / 2; })
      .attr("r", 15) // Adjust the radius as needed
      .style("fill", function(d) { return colorScale(d.Age_Group); }) // Use the color scale
      .style("stroke", "white") // Add a white stroke for better visibility
      .style("stroke-width", 2) // Adjust the stroke width as needed
      .on("mouseover", function(d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(d.Age_Group + "<br/>Exp per Night: €" + d.Exp_per_Night)
          .style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 18) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
    // Set up x-axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale));
    // Set up y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale));
    // Add labels
    svg.append("text")
      .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text("Exp per Night (€)");
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 5 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Year");
    // Tooltip
    var tooltip = d3.select("body").append("div")
      .attr("class", "sc-tooltip")
      .style("opacity", 0);
    // Create Legend
    var legend = d3.select("#chartContainer")
      .append("div")
      .attr("id", "legend")
      .attr("class", "sc-legend")
      .style("position", "absolute")
      .style("top", (margin.top + 20) + "px") // Adjust this value as needed
      .style("right", "-200px"); // Adjust this value as needed
    var legendSvg = legend
      .append("svg")
      .attr("width", 200)
      .attr("height", 100)
      .selectAll("g")
      .data(colorScale.domain())
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    legendSvg.append("rect")
      .attr("width", 25)
      .attr("height", 25)
      .style("fill", colorScale);
    legendSvg.append("text")
      .attr("x", 25)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(function(d) { return d; });
  }
/* END: (2) Age Group Expenses */


/* START: (3) Top Destinations */

function createForceDirectedGraph() {
  const jsonFile = './data/dest_trips_exp.json';
  const yearsToShow = [2018, 2020, 2022];

  d3.json(jsonFile).then(data => {
    const nodes = data.nodes;
    const links = data.links;

    const visitorMap = {};
    links.forEach(link => {
      if (!visitorMap[link.source]) {
        visitorMap[link.source] = {};
      }
      visitorMap[link.source][link.target] = link.value;
    });

    const topCountries2022 = nodes
      .filter(d => d.year === 2022)
      .sort((a, b) => d3.descending(visitorMap[a.id][a.id], visitorMap[b.id][b.id]))
      .slice(0, 10)
      .map(d => d.country);

    const filteredNodes = nodes
      .filter(d => topCountries2022.includes(d.country) && yearsToShow.includes(d.year))
      .sort((a, b) => d3.descending(a.year, b.year) || d3.descending(visitorMap[a.id][a.id], visitorMap[b.id][b.id]));
    
    const top3Nodes = filteredNodes.slice(0, 3);

      // Function to position the rank text relative to the node
      function positionRank(d, index) {
        // Calculate the position based on your node's position.
        // This is an example; you may need to adjust the positioning.
        return {
          x: width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year),
          y: height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year) - sizeScale(d3.max(Object.values(visitorMap[d.id]))) - 10
        };
      }

    const width = 800;
    const height = 800;
    const svg = d3.select("#preferd-destionations")
      .append("svg")
      .attr("width", width).attr("height", height);

    svg.append("image")
      .attr("xlink:href", "plane_image_transparent.png")  // Path to your globe image
      .attr("width", 100)   // Set the width of the image
      .attr("height", 120)  // Set the height of the image
      .attr("x", width / 2 - 65)  // Centering the image (adjust the 25 based on your image size)
      .attr("y", height / 2 - 65);
    // Setup the tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #000")
      .style("padding", "5px");


    // // Define the arrow marker at the start
    // const defs = svg.append('defs');
    // defs.append('marker')
    //   .attr('id', 'arrowhead')
    //   .attr('viewBox', '-0 -5 10 10')
    //   .attr('refX', 5)
    //   .attr('refY', 0)
    //   .attr('orient', 'auto')
    //   .attr('markerWidth', 6)
    //   .attr('markerHeight', 6)
    //   .attr('xoverflow', 'visible')
    //   .append('svg:path')
    //   .attr('d', 'M 0,-5 L 10,0 L 0,5')
    //   .attr('fill', '#000');


    const radiusStep = Math.min(width, height) / (yearsToShow.length * 3);

    const yearScale = d3.scaleOrdinal()
      .domain(yearsToShow)
      // .range([radiusStep, radiusStep * 2, radiusStep * 3]);
      .range(yearsToShow.map((d, i) => radiusStep * (i + 1)));


    const sizeScale = d3.scaleSqrt()
    
      .domain([0, d3.max(nodes, d => d3.max(Object.values(visitorMap[d.id])))])
      .range([5, 40]);


    const colorScale = d3.scaleOrdinal(d3.schemeTableau10); //multiple colors
    /*
    schemeAccent
    schemeDark2
    schemePaired
    schemePastel1
    schemePastel2
    schemeTableau10
    schemeSet3
    */
  
    const nodesByYear = {};
    yearsToShow.forEach(year => {
      nodesByYear[year] = filteredNodes.filter(d => d.year === year);
    });


    // Draw year circles and labels
    yearsToShow.forEach(year => {
      // Circle for each year
      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", yearScale(year) * 1.3)
        .style("fill", "none")
        .style("stroke", "lightgrey");

      // Label for each year
      svg.append("text")
        .attr("x", width / 2 + yearScale(year) + 50)
        .attr("y", height /2 + 60)
        .attr("text-anchor", "start")
        .style("fill", "grey")
        .style("font-weight", "bold")
        .style("font-size", "15px")
        .text(year);
  
    });
  
    // Function to calculate the angle for positioning nodes
    function getAngle(d, nodesByYear) {
      const index = nodesByYear[d.year].indexOf(d);
      const totalNodes = nodesByYear[d.year].length;
      return (index / totalNodes) * Math.PI * 2;
    }

    const handleMouseOver = (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(`Country: ${d.country}<br>Visitors: ${d3.format(",")(d3.max(Object.values(visitorMap[d.id])))}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    };

    const handleMouseOut = () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    };
    // Add an event handler for the click
    const handleClick = (event, d) => {
      // Determine if we're already focused on this country
      const isAlreadyFocused = d.country === focusedCountry;

      // If we're already focused on this country, reset
      if (isAlreadyFocused) {
        resetFilter();
      } else {
        focusedCountry = d.country;
        // Dim all countries
        nodeCircles.classed('dimmed', true);
        // Undim and focus all nodes of the same country
        nodeCircles.filter(node => node.country === d.country)
          .classed('dimmed', false)
          .classed('focused', true);
      }
    };

    // Function to reset the filter
    const resetFilter = () => {
      focusedCountry = null;
      nodeCircles.classed('dimmed', false).classed('focused', false);
      labels.classed('dimmed', false);
    };

    // Render the country nodes
    const nodeCircles = svg.selectAll("circle.country-node")
      .data(filteredNodes)
      .enter().append("circle")
      .attr("class", "country-node")
      .attr("r", d => sizeScale(d3.max(Object.values(visitorMap[d.id]))))
      .attr("fill", d => colorScale(d.country))
      .attr("cx", d => width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year) * 1.3)
      .attr("cy", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year) * 1.3)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick);

    let focusedCountry = null;
    //showing top 3 labels
    top3Nodes.forEach((node, index) => {
      const position = positionRank(node, index);
      svg.append("text")
        .attr("x", position.x * 1.19)
        .attr("y", position.y * 1.2)
        .text(index + 1)  // Displaying the rank
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("fill", "black")
        .style("font-size", "15px")
        .style("font-weight", "bold");
    });

    const labels = svg.selectAll("text.country-label")
      .data(filteredNodes)
      .enter().append("text")
      .attr("class", "country-label")
      .text(d => d.country)
      .attr("fill", "black")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("x", d => width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year) * 1.3)
      .attr("y", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year) * 1.3)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        resetFilter();
      }
    });
  });
}

/* END: (3) Top Destinations */

/* START: (4) Expenses of Top Destinations */
  function sankey_chart(data) {
      // Filter data based on selectedCountryFilter
      var filteredData = data.filter(d => d.Country_Filter === selectedCountry);
      // Process the data for the Sankey diagram
      var nodes = Array.from(new Set([...filteredData.map(d => d.Ori), ...filteredData.map(d => d.Dest)]));
      // Create nodes in the format expected by d3-sankey
      var sankeyData = {
          nodes: nodes.map(name => ({ name: name })),
          links: filteredData.map(d => ({
              source: nodes.indexOf(d.Ori),
              target: nodes.indexOf(d.Dest),
              value: +d.Avg_Exp_per_Night
          }))
      };
      // Set up the Sankey diagram with increased node padding
      var sankey = d3.sankey()
          .nodeWidth(15)
          .nodePadding(20) // Increase node padding
          .size([950, 700]); // Adjust width and height
      var { nodes, links } = sankey(sankeyData);
      // Create a color scale based on the link values
      var linkColorScale = d3.scaleLinear()
          .domain([d3.min(links, d => d.value), d3.max(links, d => d.value)])
          .range(["#f0f0f0", "#4d4b72"]); // Lighter to darker color gradient for links
      // Calculate the threshold value based on a percentage of the maximum value
      var thresholdPercentage = 0.7; // Set the threshold percentage (e.g., 70%)
      var thresholdValue = d3.max(links, d => d.value) * thresholdPercentage;
      // Create a threshold scale for the label values
      var labelColorScale = d3.scaleThreshold()
          .domain([thresholdValue])
          .range(["#000000", "#ffffff"]); // Black to white color gradient for labels above the threshold
      // Create the SVG container with margins
      var margin = { top: 80, right: 30, bottom: 30, left: 100 };
      var svg = d3.select("#sankeyChart")
          .html("") // Clear previous content
          .append("svg")
          .attr("width", 1100) // Adjust width
          .attr("height", 800) // Adjust height
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      // Draw links with color gradient and add interactivity
      svg.append("g")
          .selectAll("path")
          .data(links)
          .enter()
          .append("path")
          .attr("class", "sk-link") // Add a class for links
          .attr("d", d3.sankeyLinkHorizontal())
          .attr("stroke", d => linkColorScale(d.value))
          .attr("stroke-width", d => Math.max(1, d.width))
          .attr("fill", "none")
          .on("mouseover", handleMouseOver) // Attach mouseover event listener
          .on("mouseout", handleMouseOut); // Attach mouseout event listener
      // Draw nodes
      svg.append("g")
          .selectAll("rect")
          .data(nodes)
          .enter()
          .append("rect")
          .attr("x", d => d.x0)
          .attr("y", d => d.y0)
          .attr("height", d => d.y1 - d.y0)
          .attr("width", d => d.x1 - d.x0)
          .attr("fill", "#080942") // Set node color
          .append("title")
          .text(d => d.name);
      // Add labels to nodes (show only if the label ends with "_" or ".")
      svg.append("g")
          .selectAll("text")
          .data(nodes)
          .enter()
          .append("text")
          .filter(d => d.name.endsWith("_") || d.name.endsWith("."))
          .attr("x", d => d.x0 - 6)
          .attr("y", d => (d.y0 + d.y1) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .attr("font-family", "Trebuchet MS")
          .text(d => d.name);
      // Add labels after the links (Avg_Exp_per_Night values)
      svg.append("g")
          .selectAll("text")
          .data(links)
          .enter()
          .append("text")
          .attr("x", d => (d.source.x1 + d.target.x0) / 2)
          .attr("y", d => (d.y1 + d.y0) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("font-family", "Trebuchet MS")
          .attr("font-size", "10px")
          .attr("fill", d => labelColorScale(d.value))
          .text(d => "€ " + Math.round(d.value));
      // Add 2018 label
      svg.append("text")
          .attr("x", nodes[1].x0 + (nodes[1].x1 - nodes[1].x0) / 2)
          .attr("y", nodes[1].y0 - 15)
          .attr("text-anchor", "middle")
          .attr("font-family", "Trebuchet MS")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#080942")
          .text("2018");
      // Add 2020 label
      svg.append("text")
          .attr("x", (nodes[2].x0 + (nodes[2].x1 - nodes[2].x0) / 2))
          .attr("y", nodes[2].y0 - 15)
          .attr("text-anchor", "middle")
          .attr("font-family", "Trebuchet MS")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#080942")
          .text("2020");
      // Add 2022 label
      svg.append("text")
          .attr("x", (nodes[2].x0 + (nodes[2].x1 - nodes[2].x0) / 2) + ((nodes[2].x0 + (nodes[2].x1 - nodes[2].x0) / 2) - (nodes[1].x0 + (nodes[1].x1 - nodes[1].x0) / 2)))
          .attr("y", nodes[2].y0 - 15)
          .attr("text-anchor", "middle")
          .attr("font-family", "Trebuchet MS")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "#080942")
          .text("2022");
      // Add SOURCE label
      svg.append("text")
          .attr("x", nodes[0].x0 + (nodes[0].x1 - nodes[0].x0) / 2)
          .attr("y", nodes[0].y0 - 15)
          .attr("text-anchor", "middle")
          .attr("font-family", "Trebuchet MS")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "darkorange")
          .text("SOURCE");
      // Add DESTINATION label
      svg.append("text")
          .attr("x", nodes[2].x0 + (nodes[2].x1 - nodes[2].x0) / 2)
          .attr("y", nodes[2].y0 - 50)
          .attr("text-anchor", "middle")
          .attr("font-family", "Trebuchet MS")
          .attr("font-size", "18px")
          .attr("font-weight", "bold")
          .attr("fill", "darkorange")
          .text("------------------------ DESTINATION EXP. (PER NIGHT) BY YEAR ---------------------->");
      // Define the functions for mouseover and mouseout events
      function handleMouseOver(d, i) {
          // Highlight the link on mouseover
          d3.select(this)
              .attr("stroke", "#e1a798")
      }
      function handleMouseOut(d, i) {
          // Restore the original styles on mouseout
          d3.select(this)
              .attr("stroke", d => linkColorScale(d.value))
      }
  }
// /* END: (4) Expenses of Top Destinations */

// /* START: (5) Expense Type Drill Down */
    function smallMultiplesChart(data) {
        // Set up chart dimensions
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };
        const width = 325; // Adjust as needed
        const height = 250; // Adjust as needed
        const selectedOrigin = dropdown.property("value");
        // Filter data based on selected Origin_Country
        const filteredData = data.filter(d => d.Origin_Country === selectedOrigin);
        // Clear existing charts
        d3.select("#smallMultiples").selectAll("*").remove();
        // Extract unique Destination_Countries for the selected Origin_Country
        const destinationCountries = Array.from(new Set(filteredData.map(d => d.Destination_Country)));
        // Extract unique years
        const uniqueYears = Array.from(new Set(filteredData.map(d => +d.Year)));
        // Set y-axis scale domain based on the maximum value across all groups and destination countries
        const maxGroupValues = destinationCountries.map(destination => {
            const maxGroupValue = d3.max(["Transport", "Accomodation", "Restaurants"], group => {
                return d3.max(filteredData.filter(d => d.Destination_Country === destination), d => +d[group]);
            });
            return maxGroupValue;
        });
        const globalMaxValue = d3.max(maxGroupValues);
        // Generate darker pastel colors for each destination using d3.schemeDark2
        const colorScale = d3.scaleOrdinal(d3.schemeDark2);
        // Create a group representing the first three destinations
        const firstThreeDestinations = destinationCountries.slice(0, 3);
        // Draw three small multiples side by side
        const chartContainer = d3.select("#smallMultiples").selectAll(".chart")
            .data(["Transport", "Accomodation", "Restaurants"])
            .enter().append("div")
            .attr("class", "chart")
            .style("display", "inline-block")
            .style("margin-right", "20px");
        chartContainer.each(function (group, i) {
            const svg = d3.select(this)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            // Set x and y scales
            const xScale = d3.scaleLinear().domain(d3.extent(uniqueYears)).range([0, width]);
            const yScale = d3.scaleLinear().domain([0, globalMaxValue]).range([height, 0]);
            // Draw x-axis with alternating ticks
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale)
                    .tickValues(uniqueYears.filter((year, i) => i % 2 === 0))
                    .tickFormat(d3.format("d"))
                )
                .selectAll("path, line")
                .style("stroke", "#7d7d7d")
                .style("stroke-width", 2); // Adjust the thickness as needed
            // Draw y-axis
            svg.append("g")
                .call(d3.axisLeft(yScale))
                .selectAll("path, line")
                .style("stroke", "#7d7d7d")
                .style("stroke-width", 2); // Adjust the thickness as needed
            // Draw lines for each Destination_Country
            destinationCountries.forEach(destination => {
                const destinationData = filteredData.filter(d => d.Destination_Country === destination);
                const line = d3.line()
                    .x(d => xScale(+d.Year))
                    .y(d => yScale(+d[group]))
                    .curve(d3.curveCardinal);
                // Assign a unique pastel color to each destination
                const lineColor = colorScale(destination);
                // Add a class to the line element based on the destination group
                svg.append("path")
                    .datum(destinationData)
                    .attr("class", firstThreeDestinations.includes(destination) ? "line" : "line reduced-opacity")  // Adjust opacity based on group
                    .attr("data-destination", destination)  // Add data attribute for selection
                    .attr("fill", "none")
                    .attr("stroke", lineColor)
                    .attr("stroke-width", 2)
                    .attr("d", line)
                    .on("click", function () {
                        // Trigger toggleOpacity when clicking on a line
                        const clickedDestination = d3.select(this).attr("data-destination");
                        toggleOpacity(clickedDestination);
                    });
            });
            // Chart title
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", 0 - margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(`${group} (€ per night)`);
        });
        // Add legend to the right of the last chart
        const legend = d3.select("#smallMultiples")
            .append("div")
            .attr("class", "legend")
            .style("display", "inline-block")
            .style("vertical-align", "top")
            .style("margin-left", "20px") // Adjust the margin as needed
            .style("margin-top", "10px") // Adjust the top margin as needed
            .style("margin-bottom", "10px") // Adjust the bottom margin as needed
            .style("line-height", "1.5"); // Adjust line height for better spacing
        const legendItems = legend.selectAll(".legend-item")
            .data(destinationCountries)
            .enter().append("div")
            .attr("class", "legend-item")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-top", "5px") // Adjust the margin between legend items as needed
            .style("margin-bottom", "5px"); // Adjust the margin between legend items as needed;
        legendItems.append("div")
            .attr("class", d => firstThreeDestinations.includes(d) ? "legend-color" : "legend-color reduced-opacity2")  // Apply reduced opacity to color box
            .style("width", "12px")
            .style("height", "12px")
            .style("background-color", d => colorScale(d))
            .attr("data-destination", d => d)  // Add data attribute for selection
            // .on("click", toggleOpacity);
            .on("click", function () {
              // Trigger toggleOpacity when clicking on a line
              const clickedDestination = d3.select(this).attr("data-destination");
              toggleOpacity(clickedDestination);
            });
        legendItems.append("div")
            .attr("class", d => firstThreeDestinations.includes(d) ? "legend-label" : "legend-label reduced-opacity2")  // Apply reduced opacity to legend label
            .style("margin-left", "5px")
            .text(d => d)
            .attr("data-destination", d => d)  // Add data attribute for selection
            // .on("click", toggleOpacity);
            .on("click", function () {
                // Trigger toggleOpacity when clicking on a line
                const clickedDestination = d3.select(this).attr("data-destination");
                toggleOpacity(clickedDestination);
            });

        function toggleOpacity(clickedDestination) {
            // Toggle the opacity of the corresponding lines on legend item click
            const lineSelector = `.line[data-destination="${clickedDestination}"]`;
            const linesToToggle = d3.selectAll(lineSelector);
            linesToToggle.classed("reduced-opacity", function () {
                const isReducedOpacity = d3.select(this).classed("reduced-opacity");
                // Change the opacity of the legend label and color box along with the lines
                d3.select(`.legend-color[data-destination="${clickedDestination}"]`).classed("reduced-opacity2", !isReducedOpacity);
                d3.select(`.legend-label[data-destination="${clickedDestination}"]`).classed("reduced-opacity2", !isReducedOpacity);
                return !isReducedOpacity;
            });
        }
    }

/* END: (5) Expense Type Drill Down */

/* START: (5) Destination Monthly Arrivals */

d3.csv("data/monthly_tourist_arrivals.csv").then(data => {
  // Parse the data and filter by destination country
  // Note: You may need to adapt the filtering based on your requirements
  const destinationCountries = Array.from(new Set(data.map(d => d.Destination_Country)));

  // Create dropdown for selecting destination country
  const dropdown = d3.select("#destinationDropdown")
    .on("change", updateChart);

  dropdown.selectAll("option")
    .data(destinationCountries)
    .enter()
    .append("option")
    .text(d => d);

  // Set initial selected country
  const selectedCountry = destinationCountries[0];

  // Filter data based on the selected country
  const filteredData = data.filter(d => d.Destination_Country === selectedCountry);

  // Create the D3.js chart
  const margin = { top: 30, right: 30, bottom: 60, left: 60 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("clip-path", "url(#clip)"); // Add clip path to hide area outside the chart

  // Set up scales and axes
  const xScale = d3.scaleLinear().domain([1, 12]).range([0, width]);
  const yScale = d3.scaleLinear().domain([0, d3.max(filteredData, d => +d.Arrivals)]).range([height, 0]);

  // Update xScale to use time scale for months
  const parseMonth = d3.timeParse("%m");
  const formatMonth = d3.timeFormat("%b");
  const xAxis = d3.axisBottom().scale(xScale).tickFormat(d => formatMonth(parseMonth(d.toString())));
  const yAxis = d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s"));

  svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
  svg.append("g").attr("class", "y axis").call(yAxis);

  // Create line function with curve
  const line = d3.line()
    .x(d => xScale(+d.Month))
    .y(d => yScale(+d.Arrivals))
    .curve(d3.curveBasis); // Use B-spline curve for smooth lines

  // Filter data for the years 2018, 2020, 2022
  const yearsToDisplay = ["2018", "2020", "2022"];
  const filteredYearsData = filteredData.filter(d => yearsToDisplay.includes(d.Year));

  // Nest data by year for multiple lines
  const nestedData = d3.nest().key(d => d.Year).entries(filteredYearsData);

  // Define color scale for lines
  const colorScale = d3.scaleOrdinal().domain(yearsToDisplay).range(["#8dd3c7", "#bebada", "#fb8072"]);

  // Add lines to the chart
  svg.selectAll(".line")
    .data(nestedData)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("d", d => line(d.values))
    .style("stroke", d => colorScale(d.key))
    .style("fill", "none") // Set fill to 'none' to remove area fill
    .style("stroke-width", 3); // Increase the thickness of the lines

  // Add legend
  const legend = svg.selectAll(".legend")
    .data(colorScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", colorScale);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(d => d);

    // Add x-axis title
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Month");

    // Add y-axis title
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Arrivals");

  // Function to update the chart based on selected destination country
  function updateChart() {
    const selectedCountry = dropdown.property("value");
    const filteredData = data.filter(d => d.Destination_Country === selectedCountry);

    // Update scales and axes
    yScale.domain([0, d3.max(filteredData, d => +d.Arrivals)]);
    svg.select(".y.axis").call(yAxis);

    // Filter data for the years 2018, 2020, 2022
    const filteredYearsData = filteredData.filter(d => yearsToDisplay.includes(d.Year));

    // Update lines
    const nestedData = d3.nest().key(d => d.Year).entries(filteredYearsData);
    svg.selectAll(".line")
      .data(nestedData)
      .attr("d", d => line(d.values))
      .style("stroke", d => colorScale(d.key));
  }
});

/* END: (5) Destination Monthly Arrivals */
