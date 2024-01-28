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
  // Set the dimensions for the visualization
  const width = 960;
  const height = 600;

  d3.json('./data/dest_trips_exp.json').then(json => {
    // Once the data is loaded, you can access your nodes and links
    const nodes = json.nodes;
    const links = json.links;

    // Assuming each node has a 'year' property indicating its time of creation
    nodes.forEach(node => {
      node.radius = 0; // Start with a radius of 0
    });

    // Assuming each link has a 'year' property indicating its time of creation
    links.forEach(link => {
      link.strength = 0; // Start with a strength of 0
    });

    // Run the simulation in steps, increasing node size and link strength based on the year
    const years = d3.extent(nodes, d => d.year); // Get the range of years
    const yearScale = d3.scaleTime().domain(years).range([0, 1]); // Map years to a [0, 1] range

    function animateYear(year) {
      nodes.forEach(node => {
        if (node.year <= year) {
          node.radius = Math.sqrt(node.Trips / 1000); // Set the radius based on Trips
        }
      });

      links.forEach(link => {
        if (link.year <= year) {
          link.strength = Math.sqrt(link.value); // Set the strength based on value
        }
      });

      // Update the nodes and links in the simulation
      node.attr('r', d => d.radius)
          .attr('fill', 'blue'); // Update node attributes
      link.attr('stroke-width', d => d.strength); // Update link attributes

      simulation.nodes(nodes); // Update simulation nodes
      simulation.force("link").links(links); // Update simulation links
      simulation.alpha(1).restart(); // Restart the simulation with the new values
    }

    // Call animateYear in a loop or with a timer to gradually update the visualization
    d3.interval(() => {
      let currentYear = years[0]; // Start at the first year
      animateYear(currentYear);
      // Increment currentYear as needed to animate through time
    }, 1000); // The delay in milliseconds between steps

  // Create SVG container
  const svg = d3.select("#preferd-destionations").append('svg')
    .attr('width', width)
    .attr('height', height);

  // Define the simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id))
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2));

  // Render the links
  const link = svg.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('stroke-width', d => Math.sqrt(d.value)); // Width of line based on number of trips

  // Define a color scale
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Render the nodes
  const node = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(nodes)
    .enter().append('circle')
    .attr('r', d => Math.sqrt(d.Trips / 10000000)) // Radius of node based on number of trips
    .attr('fill', (d, i) => colorScale(i)) // Color of node based on index
    .call(d3.drag() // Add drag capabilities
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));
    
  // Add labels to the nodes
  node.append('title')
    .text(d => d.id);

  // Define drag event handlers
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Add tick function to update positions
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  });
}).catch(error => {
  console.error('Error loading the JSON data:', error);
});
}
