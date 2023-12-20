// Load data from the CSV file
d3.csv("data/tourism_exp_dest.csv").then(data => {
    data = data.filter(d => (d.Year === "2019" || d.Year === "2022"));

    // Other setup and filtering logic remain the same

    // ... (Previous code for dropdowns and filters)

    // Update the charts when a change takes place to the DOM
    d3.selectAll("#Origin_Country_Name, #Destination_Country_Name, #Purpose, #Total_Expenditure_EUR, #Year")
        .on("change", updateCharts);

    // Calculate expenses for 2020 and 2022 within this function
    const expenses2020 = data.filter(d => d.Year === "2019" || d.Year === "2020");
    const expenses2022 = data.filter(d => d.Year === "2021" || d.Year === "2022");

    const mergedExpenses = expenses2020.map(expense => ({
        Purpose: expense.Purpose,
        x1: +expenses2020.find(e => e.Purpose === expense.Purpose)?.Total_Expenditure_EUR || 0,
        x2: +expenses2022.find(e => e.Purpose === expense.Purpose)?.Total_Expenditure_EUR || 0
    }));

    console.log(mergedExpenses);

    // Create a line chart
    function createLineChart(data) {
        // Rest of your chart creation logic remains the same
    }

    // Function to handle updates based on dropdown changes
    function updateCharts() {
        // Filter data based on selections
        const selectedOriginCountry = d3.select("#Origin_Country_Name").node().value;
        const selectedDestinationCountry = d3.select("#Destination_Country_Name").node().value;
        const selectedPurpose = d3.select("#Purpose").node().value;
        const selectedYear = d3.select("#Year").node().value;

        let filteredData = data;
        if (selectedOriginCountry !== "All") {
            filteredData = filteredData.filter(d => d.Origin_Country_Name === selectedOriginCountry);
        }
        if (selectedDestinationCountry !== "All") {
            filteredData = filteredData.filter(d => d.Destination_Country_Name === selectedDestinationCountry);
        }
        if (selectedPurpose !== "All") {
            filteredData = filteredData.filter(d => d.Purpose === selectedPurpose);
        }
        if (selectedYear !== "All") {
            filteredData = filteredData.filter(d => d.Year === selectedYear);
        }
        // Call function to create visualizations
        createLineChart(filteredData);
    }

    // Initially render the chart
    updateCharts();
});
