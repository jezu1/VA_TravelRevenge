// Load data from the CSV file
d3.csv("./data/tourism_exp_dest.csv").then(data => {
  // Parse data
  data.forEach(d => {
      d.Year = +d.year;
      d.Origin_Country_Code = d.Origin_Country_Code;
      d.Origin_Country_Name = d.Origin_Country;
      d.Destination_Country_Code = d.Destination_Country_Code;
      d.Destination_Country_Name = d.Destination_Country;
      d.Purpose = d.Purpose;
      d.Total_Expenditure_EUR = +d.Total_Expenditure_EUR;
  });

  // Filter data based on selections
  const uniqueCountries = Array.from(new Set(data.map(d => d.Destination_Country_Name)));

  // Function to calculate expenses for 2020 and 2022
  function calculateExpenses(selectedOriginCountry, selectedDestinationCountry) {
      const filteredData = data.filter(d =>
          d.Origin_Country_Name === selectedOriginCountry &&
          d.Destination_Country_Name === selectedDestinationCountry &&
          (d.Year === 2019 || d.Year === 2022)
      );

      const expenses2020 = filteredData.filter(d => d.Year === 2019).reduce((acc, cur) => {
          acc[cur.Purpose] = acc[cur.Purpose] ? acc[cur.Purpose] + cur.Total_Expenditure_EUR : cur.Total_Expenditure_EUR;
          return acc;
      }, {});

      const expenses2022 = filteredData.filter(d => d.Year === 2022).reduce((acc, cur) => {
          acc[cur.Purpose] = acc[cur.Purpose] ? acc[cur.Purpose] + cur.Total_Expenditure_EUR : cur.Total_Expenditure_EUR;
          return acc;
      }, {});

      return Object.keys(expenses2020).map(purpose => ({
          Purpose: purpose,
          x1: expenses2020[purpose] || 0,
          x2: expenses2022[purpose] || 0
      }));
  }

  // Create initial chart
  createChart(uniqueCountries[0], uniqueCountries[1]); // Default country selection

  // Function to handle updates based on dropdown changes
  function updateChart() {
      const selectedOriginCountry = d3.select("#Origin_Country").node().value;
      const selectedDestinationCountry = d3.select("#Destination_Country").node().value;
      createChart(selectedOriginCountry, selectedDestinationCountry);
  }

  // Function to create the Cleveland dot plot
  function createChart(selectedOriginCountry, selectedDestinationCountry) {
      const expensesData = calculateExpenses(selectedOriginCountry, selectedDestinationCountry);
      console.log(expensesData);

      // Dimensions and margins for the chart
      const margin = { top: 30, right: 250, bottom: 30, left: 120 };
      const width = 1000 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // Create SVG container
      const svg = d3.select("#chart")
          .selectAll("*")
          .remove()
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      // Chart creation logic here using expensesData
      // Draw lines
      svg.selectAll(".line")
          .data(expensesData)
          .enter()
          .append("line")
          .attr("class", "line")
          .attr("x1", d => xScale(d.x1))
          .attr("y1", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
          .attr("y2", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
          .attr("x1", d => xScale(d.x2))
          .attr("stroke", "GREY")
          .attr("stroke-width", 1);

      // Draw dots for 2020
      svg.selectAll(".dot2020")
          .data(expensesData)
          .enter()
          .append("circle")
          .attr("class", "dot2020")
          .attr("cx", d => xScale(d.x1))
          .attr("cy", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
          .attr("r", 5)
          .style("fill", "#69b3a2");

      // Draw dots for 2022
      svg.selectAll(".dot2022")
          .data(expensesData)
          .enter()
          .append("circle")
          .attr("class", "dot2022")
          .attr("cx", d => xScale(d.x1))
          .attr("cy", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
          .attr("r", 5)
          .style("fill", "#4C4082");

      // X axis scale
      const xScale = d3.scaleLinear()
          .domain([0, d3.max(expensesData, d => Math.max(d.x1, d.x2))])
          .range([0, width]);

      // Draw x-axis
      svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(xScale));

      // Y axis scale
      const yScale = d3.scaleBand()
          .domain(expensesData.map(d => d.Purpose))
          .range([0, height])
          .padding(0.1);
          
      // Draw y-axis
      svg.append("g")
          .call(d3.axisLeft(yScale));

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

  // Update the chart when a change takes place to the dropdown
  d3.select("#Origin_Country").on("change", updateChart);
  d3.select("#Destination_Country").on("change", updateChart);

  // Initial population of dropdowns
  const originDropdown = d3.select("#Origin_Country");
  const destinationDropdown = d3.select("#Destination_Country");

  originDropdown.selectAll("option")
      .data(uniqueCountries)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

  destinationDropdown.selectAll("option")
      .data(uniqueCountries)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);
});
