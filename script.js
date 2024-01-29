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
  const barHeight = 20;
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
    .attr('fill', '#007bff') // Changed fill to the color of the bar for visibility
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
    .attr('stroke', '#007bff')
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


function createForceDirectedGraph() {
  const jsonFile = './data/dest_trips_exp.json';
  const yearsToShow = [2018, 2020, 2022];
  const width = 800;
  const height = 1000;

  // Define scales
  const colorScale = d3.scaleOrdinal(d3.schemeSet3);
  const sizeScale = d3.scaleSqrt().range([5, 40]);

  // Define the SVG container
  const svg = d3.select("#preferd-destionations")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Define scales and other shared variables
  const radiusStep = Math.min(width, height) / (yearsToShow.length * 3);
  const yearScale = d3.scaleOrdinal()
    .domain(yearsToShow)
    .range(yearsToShow.map((d, i) => radiusStep * (i + 1)));

  // Load the data
  d3.json(jsonFile).then(data => {
    // Calculate domain for sizeScale based on loaded data
    const maxLinkValue = d3.max(data.links, link => link.value);
    sizeScale.domain([0, maxLinkValue]);

    // Populate dropdown with source countries
    const sourceCountries = [...new Set(data.links.map(link => link.source))];
    d3.select("#sourceCountry")
      .selectAll("option")
      .data(sourceCountries)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

    // Initial drawing of the graph
    updateVisualization(null, data.nodes, data.links);

    // Dropdown change event listener
    d3.select("#sourceCountry").on("change", function(event) {
      const selectedSource = event.target.value;
      updateVisualization(selectedSource, data.nodes, data.links);

    });
  });

  function updateVisualization(selectedSource, nodes, links) {
    const filteredLinks = selectedSource ? links.filter(link => link.source === selectedSource) : links;
    const filteredNodes = nodes.filter(node => filteredLinks.some(link => link.source === node.id || link.target === node.id));

    svg.selectAll(".country-node, .link").remove();

    
    // Bind nodes data to SVG circles
    const nodeSelection = svg.selectAll(".country-node")
      .data(filteredNodes, d => d.id);

    nodeSelection.join(
      enter => enter.append("circle")
        .attr("class", "country-node")
        .attr("r", d => sizeScale(d.value))
        .attr("fill", d => colorScale(d.country))
        .call(enter => enter.transition().attr("cx", d =>  width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year)).attr("cy", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year))),
      update => update.call(update => update.transition().attr("cx", d => idth / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year))/).attr("cy", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year))),
      exit => exit.remove()
    );

      const linkSelection = svg.selectAll(".link")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", d => Math.sqrt(d.value));

  // Draw nodes

      yearCircleSelection = svg.selectAll(".year-circle")
        .data(yearsToShow)
        .enter()
        .append("circle")
        .attr("class", "year-circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", d => yearScale(d))
        .style("fill", "none")
        .style("stroke", "lightgrey");

      yearLabelSelection = svg.selectAll(".year-label")
          .data(yearsToShow)
          .enter()
          .append("text")
          .attr("class", "year-label")
          .attr("x", width / 2 + yearScale(year))
          .attr("y", height /2 + 50)
          .attr("text-anchor", "start")
          .style("fill", "lightgrey")
          .style("font-size", "10px")
          .text(year);
      }
    
      // Event handlers and other auxiliary functions
      function handleMouseOver(event, d) {
        const tooltip = d3.select("body")
        tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(`Country: ${d.country}<br>Visitors: ${d3.format(",")(d3.max(Object.values(visitorMap[d.id])))}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
   
      }
    
      function handleMouseOut(event, d) {
        tooltip.transition()
        .duration(500)
        .style("opacity", 0);
      }
    
      function handleClick(event, d) {
        // Click logic for nodes
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
      }};
  svg.append("image")
      .attr("xlink:href", "plane_image.jpg")  // Path to your globe image
      .attr("width", 100)   // Set the width of the image
      .attr("height", 100)  // Set the height of the image
      .attr("x", width / 2 - 65)  // Centering the image (adjust the 25 based on your image size)
      .attr("y", height / 2 - 65);

      svg.append('defs').append('marker')
      .attr('id', 'legend-arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'red');
      
    // The coordinates for the arrow line
  const arrowStart = { x: width - 100, y: height - 200 };
  const arrowEnd = { x: width - 20, y: height - 300 };

    // Draw the arrow line
    svg.append('line')
      .attr('x1', arrowStart.x)
      .attr('y1', arrowStart.y)
      .attr('x2', arrowEnd.x)
      .attr('y2', arrowEnd.y)
      .attr('stroke', 'red') // Choose a color for the line
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#legend-arrowhead)')
      .attr('transform', 'rotate(190, ' + (arrowStart.x + arrowEnd.x) / 2 + ', ' + (arrowStart.y + arrowEnd.y) / 2 + ')');

    // Add the "+ visits" label at the start of the arrow
    svg.append('text')
      .attr('x', arrowStart.x)
      .attr('y', arrowStart.y - 10)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .style('font-size', '12px')
      .text('- visits')
      .style('fill', 'red');

    // Add the "- visits" label at the end of the arrow
    svg.append('text')
      .attr('x', arrowEnd.x)
      .attr('y', arrowEnd.y - 10)
      .attr('text-anchor', 'start')
      .attr('alignment-baseline', 'middle')
      .style('font-size', '12px')
      .text('+ visits')
      .style('fill', 'red');


    const colorScale = d3.scaleOrdinal(d3.schemeSet3); //multiple colors
    /*
    schemeAccent
    schemeDark2
    schemePaired
    schemePastel1
    schemePastel2
    schemeTableau10
    schemeSet3
    */



    // Draw year circles and labels
    yearsToShow.forEach(year => {
      // Circle for each year
      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", yearScale(year))
        .style("fill", "none")
        .style("stroke", "lightgrey");

      // Label for each year
      svg.append("text")
        .attr("x", width / 2 + yearScale(year) + 20)
        .attr("y", height /2 + 50)
        .attr("text-anchor", "start")
        .style("fill", "lightgrey")
        .style("font-size", "10px")
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
      .data(filteredNodes, d => d.id)
      .enter().append("circle")
      .attr("class", "country-node")
      .attr("r", d => sizeScale(d3.max(Object.values(visitorMap[d.id]))))
      .attr("fill", d => colorScale(d.country))
      .attr("cx", d => width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year))
      .attr("cy", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick);

    //showing top 3 labels
    top3Nodes.forEach((node, index) => {
      const position = positionRank(node, index);
      svg.append("text")
        .attr("x", position.x)
        .attr("y", position.y)
        .text(index + 1)  // Displaying the rank
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("fill", "lightgrey")
        .style("font-size", "12px")
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
      .attr("x", d => width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year))
      .attr("y", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        resetFilter();
      }
    });
  }

