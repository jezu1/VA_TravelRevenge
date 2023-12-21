// Load data from the CSV file
d3.csv("./data/tourism_exp_dest_1.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.Year = +d.Year; 
        d.Origin_Country_Code = d.Origin_Country_Code;
        d.Origin_Country_Name = d.Origin_Country; 
        d.Destination_Country_Code = d.Destination_Country_Code;
        d.Destination_Country_Name = d.Destination_Country; 
        d.Purpose = d.Purpose;
        // d.Expenditure_Type = d.Expenditure_Type;
        d.Total_Expenditure_EUR = +d.Total_Expenditure_EUR;
        d.Avg_Exp_per_Trip_EUR = +d.Avg_Exp_per_Trip_EUR;
    });

    // Filter data by Purpose = "Total"
    const filteredData = data.filter(d => d.Purpose === "Total");

    // Group data by Country
    const groupedData = d3.group(filteredData, d => d.Destination_Country, d => d.Origin_Country);

    //Log the grouped data
    console.log("Grouped data:", groupedData);

    const combinedData = Array.from(groupedData, ([Origin_Country, destinationValues]) => ({
        Origin_Country: Origin_Country,
        Destination_Countries: Array.from(destinationValues, ([Destination_Country, values]) => {
            return {
                Destination_Country: Destination_Country,
                Expenditure2019: d3.sum(values.filter(d => d.Year === 2019), d => d.Avg_Exp_per_Trip_EUR),
                Expenditure2022: d3.sum(values.filter(d => d.Year === 2022), d => d.Avg_Exp_per_Trip_EUR)
            };
        })
    }));
    // Log the combined data
    console.log("Combined data to check:", combinedData);

    // Function to create the Cleveland dot plot
    function createChart(selectedCountry) {
        let selectedData = combinedData.find(d => d.Origin_Country === selectedCountry).Destination_Countries;
        selectedData = selectedData.sort((a, b) => a.Expenditure2019 - b.Expenditure2019);
        // Chart dimensions and margins
        const margin = { top: 50, right: 100, bottom: 80, left: 120 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
    
        // Remove any existing SVG to avoid duplication
        d3.select("#chart").selectAll("svg").remove();
    
        // Create SVG container
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Y axis scale
        const yScale = d3.scaleBand()
            .domain(selectedData.map(d => d.Destination_Country))
            .range([height, 0])
            .padding(0.1);
    
        // X axis scale
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(selectedData, d => Math.max(d.Expenditure2019, d.Expenditure2022))]) 
            .range([0, width]);
    
        // Draw lines
        svg.selectAll(".line")
            .data(selectedData)
            .enter()
            .append("line")
            .attr("class", "line")
            .attr("x1", d => xScale(d.Expenditure2019))
            .attr("y1", d => yScale(d.Destination_Country) + yScale.bandwidth() / 2)
            .attr("x2", d => xScale(d.Expenditure2022))
            .attr("y2", d => yScale(d.Destination_Country) + yScale.bandwidth() / 2)
            .attr("stroke", "grey")
            .attr("stroke-width", 1);

        // Draw dots for 2019
        svg.selectAll(".dot2019")
            .data(selectedData.filter(d => d.Expenditure2019 > 0))
            .enter()
            .append("circle")
            .attr("class", "dot2019")
            .attr("cx", d => xScale(d.Expenditure2019))
            .attr("cy", d => yScale(d.Destination_Country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .style("fill", "#69b3a2");

        // Draw dots for 2022
        svg.selectAll(".dot2022")
            .data(selectedData.filter(d => d.Expenditure2022 > 0))
            .enter()
            .append("circle")
            .attr("class", "dot2022")
            .attr("cx", d => xScale(d.Expenditure2022))
            .attr("cy", d => yScale(d.Destination_Country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .style("fill", "#4C4082");

    
        // Draw x-axis with ticks in billions
        const xAxis = d3.axisBottom(xScale)//.tickFormat(d => `${d / 1e9}B`);

        // Draw x axis with label
        svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        // .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", width - 400)
        .attr("y", margin.bottom + 20)
        .attr("dy", "-2.41em")
        .attr("fill", "#000")
        .text("Average Expense per Trip")
        .style("font-size", "18px")
        .style("font-family", "'Trebuchet MS', sans-serif");

        svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
            
        // Draw y-axis
        const yAxis = d3.axisLeft(yScale);
        svg.append("g")
            .call(yAxis);
    
        // Draw legend  
        const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 20}, 0)`);

        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 5)
            .style("fill", "#69b3a2");


        legend.append("text")
            .attr("x", 10)
            .attr("y", 5)
            .text("2019");

        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", 20)
            .attr("r", 5)
            .style("fill", "#4C4082");
            

        legend.append("text")
            .attr("x", 10)
            .attr("y", 25)
            .text("2022");
    }
    

    // Function to handle updates based on dropdown changes
    function updateChart() {
        const selectedOriginCountry = d3.select("#Origin_Country").node().value;
        createChart(selectedOriginCountry);
    }

    // Update the chart when a change takes place to the dropdown
    d3.select("#Origin_Country").on("change", updateChart);

    // Initial population of dropdown
    const originDropdown = d3.select("#Origin_Country");

    originDropdown.selectAll("option")
        .data(combinedData)
        .enter()
        .append("option")
        .attr("value", d => d.Origin_Country)
        .text(d => d.Origin_Country);

    // Create the initial chart
    createChart(combinedData[7].Origin_Country);
});




// sankey

function createSankey(svg, data, valueColumn) {
    var width = 700
    var height = 700
    var allCountries = Array.from(new Set(
        data.map(function (d) { return d.Origin_Country; })
            .concat(data.map(function (d) { return d.Destination_Country; }))
    ));

    var countryIndex = {};
    allCountries.forEach(function (country, index) {
        countryIndex[country] = index;
    });

    var nodes = allCountries.map(function (country) {
        return { name: country };
    });

    var links = data.map(function (d) {
        return {
            source: countryIndex[d.Origin_Country],
            target: countryIndex[d.Destination_Country],
            value: +d[valueColumn]
        };
    });

    var sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .size([width, height]);

    var graph = sankey({ nodes: nodes, links: links });

    // Draw links
    var linkSelection = svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .style("stroke", "lightblue")
        .style("stroke-width", function (d) { return Math.max(1, d.width); });

    // Draw nodes
    var nodeSelection = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter().append("rect")
        .attr("class", "node")
        .attr("x", function (d) { return d.x0; })
        .attr("y", function (d) { return d.y0; })
        .attr("height", function (d) { return d.y1 - d.y0; })
        .attr("width", sankey.nodeWidth())
        .attr("fill", "#69b3a2")
        .on("mouseover", function (d) {
            highlightConnectedLinks(d, true);
        })
        .on("mouseout", function () {
            linkSelection
                .style("stroke", "lightblue");

            nodeSelection
                .style("fill", "#69b3a2");
        });

    // Add node labels
    svg.append("g")
        .selectAll(".node-label")
        .data(graph.nodes)
        .enter().append("text")
        .attr("class", "node-label")
        .attr("x", function (d) { return d.x0 - 6; })
        .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function (d) { return d.name; })
        .style("font-size", "10px")
        // .style("font-weight", "bold")
        .style("font-family", "'Trebuchet MS', sans-serif");

    // Add source node labels
    svg.append("g")
        .selectAll(".source-label")
        .data(graph.nodes.filter(function (d) { return d.targetLinks.length === 0; }))
        .enter().append("text")
        .attr("class", "source-label")
        .attr("x", function (d) { return d.x0 + 6; })
        .attr("y", function (d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(function (d) { return d.name; })
        .style("font-size", "10px")
        // .style("font-weight", "bold")
        .style("font-family", "'Trebuchet MS', sans-serif");

    function highlightConnectedLinks(node, isMouseOver) {
        // Highlight links connected to the node
        var connectedLinks = isMouseOver ? graph.links.filter(link => link.source === node || link.target === node) : graph.links;
        linkSelection
            .style("stroke", function (link) {
                return connectedLinks.includes(link) ? "red" : "lightblue";
            });
        nodeSelection
            .style("fill", function (d) {
                return d === node ? "red" : "#69b3a2";
            });
    }
}

// Load CSV data
d3.csv("data/tourism_trips_dest_agg.csv")
    .then(function (data_sankey) {
        // Create the first Sankey diagram
        var width = 700
        var height = 700
        const margin = { top: 30, right: 100, bottom: 100, left: 100 };

        var svg1 = d3.select("#sankey").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "sk_chart")
            // .attr("transform", `translate(${margin.left},${margin.top},${margin.right},${margin.bottom})`);
            .attr("transform", `translate(${margin.left},${margin.top})`);

        createSankey(svg1, data_sankey, "Trips_2019");

        // Create the second Sankey diagram
        var svg2 = d3.select("#sankey").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "sk_chart")
            // .attr("transform", `translate(${margin.left},${margin.top},${margin.right},${margin.bottom})`);
            .attr("transform", `translate(${margin.left + 50},${margin.top})`);

        createSankey(svg2, data_sankey, "Trips_2022");
});


// first chart

// Load data from CSV file
d3.csv("./data/tourism_data_agg.csv").then(function (data) {
    // Parse year as a date
    var parseDate = d3.timeParse("%Y");
    data.forEach(function (d) {
      d.Year = parseDate(d.Year);
    });
  
    // Set up margin and dimensions
    var margin = { top: 35, right: 120, bottom: 100, left: 120 };
    var width = 950 - margin.left - margin.right;
    var height = 565 - margin.top - margin.bottom;
  
    // Create SVG container
    var svg = d3.select("#overall_chart")
      .append("svg")
      .attr("class", "first_chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    // Set up color scale
    var color = d3.scaleOrdinal()
      .domain(["Holiday_Leisure", "Personal", "Business", "Visit_friend_family"])
      .range(["#d6eadf", "#d1cfe2", "#9cadce", "#7ec4cf"]);
  
    // Set up stack generator
    var stack = d3.stack()
      .keys(["Holiday_Leisure", "Personal", "Business", "Visit_friend_family"])
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);
  
    // Create stacked data
    var series = stack(data);
  
    // Set up x and y scales
    var x = d3.scaleTime().domain(d3.extent(data, function (d) { return d.Year; })).range([0, width]);
    var y = d3.scaleLinear().domain([0, d3.max(series, function (d) { return d3.max(d, function (d) { return d[1]; }); })]).range([height, 0]);
  
    // Create area generator
    var area = d3.area()
      .x(function (d) { return x(d.data.Year); })
      .y0(function (d) { return y(d[0]); })
      .y1(function (d) { return y(d[1]); })
      .curve(d3.curveMonotoneX);
  
    // Draw areas
    svg.selectAll(".area")
      .data(series)
      .enter().append("path")
      .attr("class", "area")
      .attr("d", area)
      .style("fill", function (d) { return color(d.key); });
  
    // Draw x axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
  
    // Draw y axis
    svg.append("g")
      .call(d3.axisLeft(y));
  
    // Create legend
    var legend = d3.select("#legend")
        .selectAll(".legend-item")
        .data(color.domain())
        .enter().append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center");

    legend.append("div")
        .attr("class", "legend-color")
        .style("background-color", color);

    legend.append("div")
        .text(function (d) { return d.replace(/_/g, " ") + " " })
        .append("span")
        .text(" ");
  
  var y2 = d3.scaleLinear().domain([0, d3.max(data, function (d) { return +d.Avg_Exp_per_Trip_EUR; })]).range([height, 0]);
  
  // Draw line plot
  var line = d3.line()
    .x(function (d) { return x(d.Year); })
    .y(function (d) { return y2(+d.Avg_Exp_per_Trip_EUR); })
    .curve(d3.curveMonotoneX);
  
  svg.append("path")
    .data([data])
    .attr("class", "dashed_line")
    .attr("d", line)
    .style("stroke", "black");
  
  // Draw secondary y-axis
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + width + ", 0)")
    .call(d3.axisRight(y2));
  
  // Update legend for the line plot
  var lineLegend = d3.select("#legend")
    .append("div")
    .attr("class", "legend-item");
  
  lineLegend.append("div")
    .attr("class", "legend-color")
    .style("background-color", "black");
  
  lineLegend.append("div")
    .text("Avg Exp per Trip (EUR)");
  
  // Draw x axis with label
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", 5 + width / 2)
    .attr("y", margin.bottom - 10)
    .attr("dy", "-2.41em")
    .attr("fill", "#000")
    .text("Year")
    .style("font-size", "20px")
    .style("font-family", "'Trebuchet MS', sans-serif");
  
  // Draw primary y axis with label
  svg.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 20 - margin.left)
    .attr("x", 60 - height / 2)
    .attr("dy", "0.5em")
    .attr("fill", "#000")
    .text("Number of Trips")
    .style("font-size", "20px")
    .style("font-family", "'Trebuchet MS', sans-serif");
  
  // Draw secondary y axis with label
  svg.append("g")
    .attr("transform", "translate(" + (width + margin.right) + ", 0)")
    .call(d3.axisRight(y2))
    .append("text")
    .attr("x", -100)
    .attr("y", -75)
    .attr("dy", "0.71em")
    .attr("fill", "#000")
    .style("font-size", "12px")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .text("Avg Exp per Trip (EUR)")
    .style("font-size", "20px")
    .style("font-family", "'Trebuchet MS', sans-serif");
  
  // Draw vertical line at the year 2019
  svg.append("line")
    .attr("x1", x(parseDate("2019")))
    .attr("y1", 0)
    .attr("x2", x(parseDate("2019")))
    .attr("y2", height)
    .attr("stroke", "maroon")
    .attr("stroke-width", 2)
    // .attr("stroke-dasharray", "5,5");
  
  // Draw vertical line at the year 2021
  svg.append("line")
    .attr("x1", x(parseDate("2021")))
    .attr("y1", 0)
    .attr("x2", x(parseDate("2021")))
    .attr("y2", height)
    .attr("stroke", "maroon")
    .attr("stroke-width", 2)
    // .attr("stroke-dasharray", "5,5");
  
  // Add legend for the Covid Period
  var covidLegend = d3.select("#legend")
    .append("div")
    .attr("class", "legend-item");
  
  covidLegend.append("div")
    .attr("class", "legend-color")
    .style("background-color", "maroon");
  
  covidLegend.append("div")
    .text("Covid Period");


  });
