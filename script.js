// Load data from the CSV file
d3.csv("./data/tourism_exp_dest.csv").then(data => {
    // Parse data
    data.forEach(d => {
        d.Year = +d.Year; // Convert Year to number
        d.Origin_Country_Code = d.Origin_Country_Code;
        d.Origin_Country_Name = d.Origin_Country; // 'Origin_Country' instead of 'Origin_Country_Name'
        d.Destination_Country_Code = d.Destination_Country_Code;
        d.Destination_Country_Name = d.Destination_Country; // 'Destination_Country' instead of 'Destination_Country_Name'
        d.Purpose = d.Purpose;
        d.Total_Expenditure_EUR = +d.Total_Expenditure_EUR;
    });

    // Filter data by Purpose = "Total"
    const filteredData = data.filter(d => d.Purpose === "Total");

    // Group data by Country
    const groupedData = d3.group(filteredData, d => d.Origin_Country_Name);

    // Sum total expenditure for each country for 2019 and 2022 separately
    const countriesExpenditure2019 = Array.from(groupedData, ([Origin_Country, values]) => ({
        Origin_Country: Origin_Country,
        Expenditure2019: d3.sum(values.filter(d => d.Year === 2019), d => d.Total_Expenditure_EUR) || 0
    }));

    const countriesExpenditure2022 = Array.from(groupedData, ([Origin_Country, values]) => ({
        Origin_Country: Origin_Country,
        Expenditure2022: d3.sum(values.filter(d => d.Year === 2022), d => d.Total_Expenditure_EUR) || 0
    }));

    // Combine both sets of data into a single array
    const combinedData = countriesExpenditure2019.map(d => ({
        Origin_Country: d.Origin_Country,
        Expenditure2019: d.Expenditure2019,
        Expenditure2022: (countriesExpenditure2022.find(c => c.Origin_Country === d.Origin_Country) || { Expenditure2022: 0 }).Expenditure2022
    }));

    // Sort the combined data based on expenditure for 2019
    combinedData.sort((a, b) => b.Expenditure2019 - a.Expenditure2019);

    // Function to create the Cleveland dot plot
    function createChart(selectedCountry) {
        const selectedData = combinedData.find(d => d.Origin_Country === selectedCountry);

        // Chart dimensions and margins
        const margin = { top: 30, right: 50, bottom: 80, left: 100 };
        const width = 1000 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Remove any existing SVG to avoid duplication
        d3.select("#chart").selectAll("svg").remove();

        // Create SVG container
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // X axis scale
        const xScale = d3.scaleLinear()
            .domain([0, Math.max(selectedData.Expenditure2019, selectedData.Expenditure2022)])
            .range([0, width]);

        // Y axis scale
        const yScale = d3.scaleBand()
            .domain([selectedData.Origin_Country])
            .range([height, 0])
            .padding(0.1);

        // Draw lines
        svg.selectAll(".line")
            .data([selectedData]) // Use an array with a single element
            .enter()
            .append("line")
            .attr("class", "line")
            .attr("x1", d => xScale(d.Expenditure2019)) // Use Expenditure values
            .attr("y1", d => yScale(d.Origin_Country) + yScale.bandwidth() / 2)
            .attr("x2", d => xScale(d.Expenditure2022)) // Use Expenditure values
            .attr("y2", d => yScale(d.Origin_Country) + yScale.bandwidth() / 2)
            .attr("stroke", "grey")
            .attr("stroke-width", 1);

        // Draw dots for 2019
        svg.selectAll(".dot2019")
            .data([selectedData]) // Use an array with a single element
            .enter()
            .append("circle")
            .attr("class", "dot2019")
            .attr("cx", d => xScale(d.Expenditure2019)) // Use Expenditure values
            .attr("cy", d => yScale(d.Origin_Country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .style("fill", "#69b3a2");

        // Draw dots for 2022
        svg.selectAll(".dot2022")
            .data([selectedData]) // Use an array with a single element
            .enter()
            .append("circle")
            .attr("class", "dot2022")
            .attr("cx", d => xScale(d.Expenditure2022)) // Use Expenditure values
            .attr("cy", d => yScale(d.Origin_Country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .style("fill", "#4C4082");

        // Draw x-axis
        const xAxis = d3.axisBottom(xScale);
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        // Draw y-axis
        const yAxis = d3.axisLeft(yScale);
        svg.append("g")
            .call(yAxis);
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
    createChart(combinedData[0].Origin_Country);
});
