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

    const width = 800;
    const height = 1000;
    const svg = d3.select("#preferd-destionations")
      .append("svg")
      .attr("width", width).attr("height", height);

    // Setup the tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #000")
      .style("padding", "5px");

    const radiusStep = Math.min(width, height) / (yearsToShow.length * 3);

    const yearScale = d3.scaleOrdinal()
      .domain(yearsToShow)
      .range([radiusStep, radiusStep * 2, radiusStep * 3]);

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(nodes, d => d3.max(Object.values(visitorMap[d.id])))])
      .range([5, 40]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const nodesByYear = {};
    yearsToShow.forEach(year => {
      nodesByYear[year] = filteredNodes.filter(d => d.year === year);
    });

    yearsToShow.forEach((year, i) => {
      svg.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", yearScale(year))
        .style("fill", "none")
        .style("stroke", "lightgrey");

      svg.append("text")
        .attr("x", width / 2 + yearScale(year))
        .attr("y", height / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("fill", "black")
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

    // Render the country nodes
  const nodeCircles = svg.selectAll("circle.country-node")
  .data(filteredNodes)
  .enter().append("circle")
  .attr("class", "country-node")
  .attr("r", d => sizeScale(d3.max(Object.values(visitorMap[d.id]))))
  .attr("fill", d => colorScale(d.country))
  .attr("cx", d => width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year))
  .attr("cy", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year))
  .on("mouseover", handleMouseOver)
  .on("mouseout", handleMouseOut);

    const labels = svg.selectAll("text.country-label")
      .data(filteredNodes)
      .enter().append("text")
      .attr("class", "country-label")
      .text(d => d.country)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("x", d => width / 2 + Math.cos(getAngle(d, nodesByYear)) * yearScale(d.year))
      .attr("y", d => height / 2 + Math.sin(getAngle(d, nodesByYear)) * yearScale(d.year))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);
   });
}



