
        // Load data from the CSV file
        d3.csv("./data/tourism_exp_dest.csv").then(data => {
            // Parse data
                data.forEach(d => {
                    d.Year = +d.Year; // Capital 'Y' for 'Year'
                    d.Origin_Country_Code = d.Origin_Country_Code;
                    d.Origin_Country_Name = d.Origin_Country; // 'Origin_Country' instead of 'Origin_Country_Name'
                    d.Destination_Country_Code = d.Destination_Country_Code;
                    d.Destination_Country_Name = d.Destination_Country; // 'Destination_Country' instead of 'Destination_Country_Name'
                    d.Purpose = d.Purpose;
                    d.Total_Expenditure_EUR = +d.Total_Expenditure_EUR;
                });
            const uniqueDestinationCountries = Array.from(new Set(data.map(d => d.Destination_Country_Name)));
            const uniqueOriginCountries = Array.from(new Set(data.map(d => d.Origin_Country_Name)));
                
            const uniqueCountries = [...new Set([...uniqueDestinationCountries, ...uniqueOriginCountries])];
            console.log(uniqueCountries);

            // Create initial chart
            createChart(uniqueCountries[0], uniqueCountries[1]); // Default country selection

            // Function to calculate expenses for 2019 and 2022
            function calculateExpenses(selectedOriginCountry, selectedDestinationCountry) {
                const filteredData = data.filter(d =>
                    d.Origin_Country_Name === selectedOriginCountry &&
                    d.Destination_Country_Name === selectedDestinationCountry &&
                    (d.Year === 2019 || d.Year === 2022)
                );
          
                const expenses2019 = filteredData.filter(d => d.Year === 2019).reduce((acc, cur) => {
                    acc[cur.Purpose] = acc[cur.Purpose] ? acc[cur.Purpose] + cur.Total_Expenditure_EUR : cur.Total_Expenditure_EUR;
                    return acc;
                }, {});
          
                const expenses2022 = filteredData.filter(d => d.Year === 2022).reduce((acc, cur) => {
                    acc[cur.Purpose] = acc[cur.Purpose] ? acc[cur.Purpose] + cur.Total_Expenditure_EUR : cur.Total_Expenditure_EUR;
                    return acc;
                }, {});
                //debug
                console.log(selectedOriginCountry);
                console.log(selectedDestinationCountry);
                console.log(expenses2019);
                console.log(expenses2022);

                return Object.keys(expenses2019).map(Purpose => ({
                    Purpose: Purpose,
                    x1: expenses2019[Purpose] || 0,
                    x2: expenses2022[Purpose] || 0
                
                }))
               
            }
            

            // Function to create the Cleveland dot plot
            function createChart(selectedOriginCountry, selectedDestinationCountry) {
                const expensesData = calculateExpenses(selectedOriginCountry, selectedDestinationCountry);
            
                // Select the chart container
                      // Dimensions and margins for the chart
                const margin = { top: 30, right: 250, bottom: 30, left: 120 };
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
                    .domain([0, d3.max(expensesData, d => Math.max(d.x1, d.x2))])
                    .range([0, width]);

                // Y axis scale
                const yScale = d3.scaleBand()
                    .domain(expensesData.map(d => d.Purpose))
                    .range([0, height])
                    .padding(0.1);

                // Draw lines
                svg.selectAll(".line")
                    .data(expensesData)
                    .enter()
                    .append("line")
                    .attr("class", "line")
                    .attr("x1", d => xScale(d.x1)) // This should be "x1" for 2019
                    .attr("y1", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
                    .attr("x2", d => xScale(d.x2)) // This should be "x2" for 2022
                    .attr("y2", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
                    .attr("stroke", "GREY")
                    .attr("stroke-width", 1);

                // Draw dots for 2019
                svg.selectAll(".dot2019")
                    .data(expensesData)
                    .enter()
                    .append("circle")
                    .attr("class", "dot2019")
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
                    .attr("cx", d => xScale(d.x2)) // Use x2 for 2022
                    .attr("cy", d => yScale(d.Purpose) + yScale.bandwidth() / 2)
                    .attr("r", 5)
                    .style("fill", "#4C4082");


                // Draw x-axis
                const xAxis = d3.axisBottom(xScale);

                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(xAxis)
                  .append("text")
                    .attr("fill", "#000")
                    .attr("x", width)
                    .attr("dy", "-0.71em")
                    .attr("text-anchor", "end")



                const yAxis = d3.axisLeft(yScale);

                    svg.append("g")
                        .call(yAxis)
                      .append("text")
                        .attr("fill", "#000")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", "0.71em")
                        .attr("text-anchor", "end")

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
                const selectedDestinationCountry = d3.select("#Destination_Country").node().value;
                createChart(selectedOriginCountry, selectedDestinationCountry);
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