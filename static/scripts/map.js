const dataByYear = {};
divorceLandPercent.forEach(item => {
    const year = item.Jahr;
    delete item.Jahr;

    if(year >= 2005){
        dataByYear[year] = item;
    }
});

const allValues = Object.values(dataByYear).flatMap(regionData => Object.values(regionData));

// Find the minimum and maximum values using Array.reduce()
const min = allValues.reduce((acc, curr) => Math.min(acc, curr), Number.MAX_VALUE);
const max = allValues.reduce((acc, curr) => Math.max(acc, curr), Number.MIN_VALUE);

// Set the dimensions and margins of the graph
const map_margin = {top: 10, right: 30, bottom: 30, left: 60},
    map_width = 800 - map_margin.left - map_margin.right,
    map_height = 400 - map_margin.top - map_margin.bottom;

// Adjust color scale domain
const colorScale = d3.scaleLinear()
    .domain([min - min * 0.05, max])
    .range(["white", "blue"]);

// Append the svg object to the body of the page
const mapDiv = d3.select("#map")
    .append("svg")
    .attr("width", map_width + map_margin.left + map_margin.right)
    .attr("height", map_height + map_margin.top + map_margin.bottom)
    .append("g")
    .attr("transform", `translate(${map_margin.left},${map_margin.top})`);

function changeMapYear(year) {
    mapDiv.selectAll(".mapfield")
        .transition()
        .duration(200)
        .attr("fill", function(d) {
            const bundesland = d.properties["name"];
            return colorScale(parseFloat(dataByYear[year][bundesland]));
        });
}

const slider = document.getElementById("yearSlider");
const selectedYear = document.getElementById("selectedYear");
slider.oninput = function() {
    changeYear(slider.value);
}

slider.style.width = "70%";

const path = d3.geoPath();
const projection = d3.geoMercator()
    .scale(4000)
    .center([15, 47.7])
    .translate([map_width / 2, map_height / 2]);

const mouseOver = function(d) {
    d3.selectAll(".mapfield")
        .transition()
        .duration(100)
        .style("opacity", .5);
    d3.select(this)
        .transition()
        .duration(100)
        .style("opacity", 1);

    mapTooltip
        .style("opacity", 1)
        .style("display", "inline");
}

const mouseLeave = function(d) {
    d3.selectAll(".mapfield")
        .transition()
        .duration(100)
        .style("opacity", .8);

    mapTooltip
        .style("opacity", 0)
        .style("display", "none");
}

const mapTooltip = d3.select("#map")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

const mousemove = function(event, d) {
    const tooltipText = d.properties.name + " " + dataByYear[slider.value][d.properties.name] + "%";
    mapTooltip
        .html(tooltipText)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + "px");
}

const onClick = function(event, d) {
    changeState(d.properties.name);

    d3.selectAll(".mapfield")
        .transition()
        .duration(100)
        .style("stroke", "white")
        .style("stroke-width", 1.5);
    d3.select(this)
        .transition()
        .duration(100)
        .style("stroke", "black")
        .style("stroke-width", 3);

    this.parentNode.appendChild(this);
}

mapDiv.append("g")
    .selectAll("path")
    .data(austriaMap.features)
    .enter()
    .append("path")
    .attr("fill", function(d) {
        const bundesland = d.properties["name"];
        return colorScale(dataByYear[slider.value][bundesland]);
    })
    .attr("d", d3.geoPath().projection(projection))
    .style("stroke", "white")
    .style("stroke-width", 1.5)
    .style("stroke-opacity", 1)
    .style("opacity", .8)
    .attr("class", "mapfield")
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave)
    .on("click", onClick)
    .on("mousemove", mousemove);

// Create a legend
const legendHeight = 200;
const legendWidth = 20;

const legend = mapDiv.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${map_width + map_margin.right - 60},${map_margin.top})`);

const legendScale = d3.scaleLinear()
    .domain([max, min - min * 0.05])
    .range([0, legendHeight]);

const legendAxis = d3.axisRight(legendScale)
    .tickSize(6)
    .ticks(6);

const legendStep = (max - min) / 10;
const rectHeight = legendHeight / 10;

legend.selectAll("rect")
    .data(d3.range(min, max, legendStep))
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", d => legendScale(d) - rectHeight) // Adjust y position to align with ticks
    .attr("width", legendWidth)
    .attr("height", rectHeight)
    .attr("fill", d => colorScale(d));

legend.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);