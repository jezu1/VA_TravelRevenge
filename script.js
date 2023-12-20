// Load data from the CSV file
d3.csv("./data/tourism_exp_dest.csv", d => {
    return {

    Origin_Country_Code,Origin_Country,Destination_Country_Code,Destination_Country,Purpose,Duration,Expenditure_Type,Total_Expenditure_EUR,Avg_Exp_per_Trip_EUR,Avg_Exp_per_Night_EUR
    year: +d.year,  
    Origin_Country_Code: d.Origin_Country_Code,
    Origin_Country_Name: d.Origin_Country_Name,
    Destination_Country_Code: d.Destination_Country_Code,
    Destination_Country_Name: d.Destination_Country_Name,
    Purpose: d.Purpose,
    Duration: d.Duration,
    Expenditure_Type: d.Expenditure_Type,
    Total_Expenditure_EUR: +d.Total_Expenditure_EUR,
    Avg_Exp_per_Trip_EUR: +d.Avg_Exp_per_Trip_EUR,
    Avg_Exp_per_Night_EUR: +d.Avg_Exp_per_Night_EUR
    };
    }).then(data => {
    // Filter data based on selections
    data = data.filter(d => (d.Year === "2019" || d.Year === "2022"));
    
    years = Array.from(new Set(data.map(d => d.Year)));
    countries_o = Array.from(new Set(data.map(d => d.Origin_Country)));
    countries_d = Array.from(new Set(data.map(d => d.Destination_Country)));
    purposes = Array.from(new Set(data.map(d => d.Purpose)));
    expenses = Array.from(new Set(data.map(d => d.Total_Expenditure_EUR)));
  

  createLineChart(expenses2020, expenses2022); 

  // Update the charts when a change takes place to the DOM
  d3.selectAll("#Origin_Country_Name, #Destination_Country_Name")
      .on("change", updateCharts);
    
    // Calculate expenses for 2020 and 2022 within this function
    const expenses2020 = data.filter(d => d.Year === "2019" || d.Year === "2020");
    const expenses2022 = data.filter(d => d.Year === "2021" || d.Year === "2022");
    mergedExpenses = expenses2020.map(expense => ({
        Purpose: expense.Purpose,
        x1: +expenses2020.find(e => e.Purpose === expense.Purpose)?.Total_Expenditure_EUR || 0,
        x2: +expenses2022.find(e => e.Purpose === expense.Purpose)?.Total_Expenditure_EUR || 0
    }));
    console.log(mergedExpenses);

    
    function createLineChart(expenses2020, expenses2022, mergedExpenses) {

    // Create a Cleveland dot plot in d3.js
    // https://www.d3-graph-gallery.com/graph/dotplot_cleveland.html
    
    // Remove previous chart
    d3.select("#chart").selectAll("*").remove();

      // Dimensions and margins for the chart
    const margin = { top: 30, right: 250, bottom: 30, left: 120 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

      // Create SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // X axis scale
    const x = d3.scaleLinear()
        .domain([0, d3.max(mergedExpenses, d => Math.max(d.x1, d.x2))])
        .range([0, width]);

      // Y axis scale
    const y = d3.scaleBand()
        .domain(mergedExpenses.map(d => d.Purpose))
        .range([0, height])
        .padding(0.1);

    // Draw lines
    svg.selectAll(".line")
        .data(mergedExpenses)
        .enter()
        .append("line")
        .attr("class", "line")
        .attr("x1", d => x(d.x1))
        .attr("y1", d => y(d.Purpose) + y.bandwidth() / 2)
        .attr("x2", d => x(d.x2))
        .attr("y2", d => y(d.Purpose) + y.bandwidth() / 2)
        .attr("stroke", "GREY")
        .attr("stroke-width", 1);

     // Draw dots for 2020
    svg.selectAll(".dot2020")
        .data(expenses2020)
        .enter()
        .append("circle")
        .attr("class", "dot2020")
        .attr("cx", d => x(d.x1))
        .attr("cy", d => y(d.Purpose) + y.bandwidth() / 2)
        .attr("r", 5)
        .style("fill", "#69b3a2")

      // Draw dots for 2022
      svg.selectAll(".dot2022")
        .data(expenses2022)
        .enter()
        .append("circle")
        .attr("class", "dot2022")
        .attr("cx", d => x(d.x2))
        .attr("cy", d => y(d.Purpose) + y.bandwidth() / 2)
        .attr("r", 5)
        .style("fill", "#4C4082")

      // Draw x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      // Draw y-axis
      svg.append("g")
        .call(d3.axisLeft(y));
    
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
        .text("2020");

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
function updateCharts() {
    // Filter data based on selections
    const selectedOriginCountry = d3.select("#Origin_Country_Name").node().value;
    const selectedDestinationCountry = d3.select("#Destination_Country_Name").node().value;

    let filteredData = data;
    if (selectedOriginCountry !== "All") {
        filteredData = filteredData.filter(d => d.Origin_Country_Name === selectedOriginCountry);
    }
    if (selectedDestinationCountry !== "All") {
        filteredData = filteredData.filter(d => d.Destination_Country_Name === selectedDestinationCountry);
    }
    // Call function to create visualizations
    createLineChart(filteredData);
}

// Initially render the chart
updateCharts();

});

