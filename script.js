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
        d.Expenditure_Type = d.Expenditure_Type;
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
                Expenditure2019: d3.sum(values.filter(d => d.Year === 2019), d => d.Total_Expenditure_EUR),
                Expenditure2022: d3.sum(values.filter(d => d.Year === 2022), d => d.Total_Expenditure_EUR)
            };
        })
    }));
    // Log the combined data
    console.log("Combined data:", combinedData);

    // Function to create the Cleveland dot plot
    function createChart(selectedCountry) {
        let selectedData = combinedData.find(d => d.Origin_Country === selectedCountry).Destination_Countries;
        selectedData = selectedData.sort((a, b) => a.Expenditure2019 - b.Expenditure2019);
        // Chart dimensions and margins
        const margin = { top: 30, right: 100, bottom: 80, left: 100 };
        const width = 600 - margin.left - margin.right;
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
    
        // Y axis scale
        const yScale = d3.scaleBand()
            .domain(selectedData.map(d => d.Destination_Country))
            .range([height, 0])
            .padding(0.1);
    
        // X axis scale
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(selectedData, d => Math.max(d.Expenditure2019, d.Expenditure2022))]) // Divide by 1e9 to convert to billions
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
            .data(selectedData)
            .enter()
            .append("circle")
            .attr("class", "dot2019")
            .attr("cx", d => xScale(d.Expenditure2019))
            .attr("cy", d => yScale(d.Destination_Country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .style("fill", "#69b3a2");
    
        // Draw dots for 2022
        svg.selectAll(".dot2022")
            .data(selectedData)
            .enter()
            .append("circle")
            .attr("class", "dot2022")
            .attr("cx", d => xScale(d.Expenditure2022))
            .attr("cy", d => yScale(d.Destination_Country) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .style("fill", "#4C4082");
    
    
        // Draw x-axis with ticks in billions
        const xAxis = d3.axisBottom(xScale).tickFormat(d => `${d / 1e9}B`);

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
